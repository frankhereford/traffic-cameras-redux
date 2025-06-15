#!/usr/bin/env python3

import os
from beam import Image, endpoint, env
import subprocess
import boto3
import hashlib
import tempfile

# Path to cache model weights
BEAM_VOLUME_CACHE_PATH = "./weights"

if env.is_remote():
    from transformers import DetrImageProcessor, DetrForObjectDetection
    import torch


# Function to download and cache models
def download_models():
    # Initialize the object detection model and processor
    processor = DetrImageProcessor.from_pretrained(
        "facebook/detr-resnet-101",
        revision="no_timm",
        cache_dir=BEAM_VOLUME_CACHE_PATH,
    )
    model = DetrForObjectDetection.from_pretrained(
        "facebook/detr-resnet-101",
        revision="no_timm",
        cache_dir=BEAM_VOLUME_CACHE_PATH,
    )
    return model, processor


@endpoint(
    cpu=1.0,
    memory=128,
    gpu="T4",
    on_start=download_models,
    secrets=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
    image=Image(python_version="python3.12").add_python_packages(
        ["transformers", "torch", "huggingface_hub[hf-transfer]", "Pillow"]
    ),
)
def nvidia_smi_endpoint(**inputs):
    aws_access_key_id = os.environ["AWS_ACCESS_KEY_ID"]
    aws_secret_access_key = os.environ["AWS_SECRET_ACCESS_KEY"]
    smi_output = subprocess.check_output(["nvidia-smi"]).decode()
    print(smi_output)
    print("This code is running on a remote GPU!")
    print(f"AWS Access Key ID: {aws_access_key_id[:4]}")
    print(f"AWS Secret Access Key: {aws_secret_access_key[:4]}")
    return {"nvidia_smi_output": smi_output}


@endpoint(
    cpu=1.0,
    memory=128,
    gpu="T4",
    on_start=download_models,
    secrets=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
    image=Image(python_version="python3.12").add_python_packages(
        ["transformers", "torch", "huggingface_hub[hf-transfer]", "Pillow", "boto3"]
    ),
)
def object_detection_endpoint(**inputs):
    aws_access_key_id = os.environ["AWS_ACCESS_KEY_ID"]
    aws_secret_access_key = os.environ["AWS_SECRET_ACCESS_KEY"]
    key = inputs["key"]

    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
    )

    bucket_name = "atx-traffic-cameras"

    with tempfile.NamedTemporaryFile() as tmp_file:
        s3.download_file(bucket_name, key, tmp_file.name)

        sha256_hash = hashlib.sha256()
        with open(tmp_file.name, "rb") as f:
            # Read and update hash in chunks of 4K
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        hex_digest = sha256_hash.hexdigest()

    return {"sha256": hex_digest[:16]}
