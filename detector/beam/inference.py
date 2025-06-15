#!/usr/bin/env python3

import os
from beam import Image, endpoint, env, Volume
import subprocess
import boto3
import hashlib
import tempfile
import logging
from PIL import Image as PILImage

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

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    logging.info(f"Using device: {device}")

    return model, processor, device


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
    volumes=[Volume(name="weights", mount_path=BEAM_VOLUME_CACHE_PATH)],
    secrets=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
    image=Image(python_version="python3.12").add_python_packages(
        ["transformers", "torch", "huggingface_hub[hf-transfer]", "Pillow", "boto3"]
    ),
)
def object_detection_endpoint(context, **inputs):
    model, processor, device = context.on_start_value

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
        image_path = tmp_file.name

        sha256_hash = hashlib.sha256()
        with open(image_path, "rb") as f:
            # Read and update hash in chunks of 4K
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        hex_digest = sha256_hash.hexdigest()

        image = PILImage.open(image_path)

        # Process the image for object detection
        processed_inputs = processor(images=image, return_tensors="pt")
        processed_inputs = processed_inputs.to(device)
        outputs = model(**processed_inputs)

        # Convert outputs to COCO API format and filter with threshold
        target_sizes = torch.tensor([image.size[::-1]]).to(device)
        results = processor.post_process_object_detection(
            outputs, target_sizes=target_sizes, threshold=0.9
        )[0]

        # Prepare detection results
        detections = []
        for score, label, box in zip(
            results["scores"], results["labels"], results["boxes"]
        ):
            box = [round(i, 2) for i in box.tolist()]
            label_name = model.config.id2label[label.item()]
            confidence = round(score.item(), 3)

            logging.info(
                f"Detected {label_name} with confidence {confidence} at location {box}"
            )

            detections.append(
                {
                    "label": label_name,
                    "confidence": confidence,
                    "box": {
                        "xMin": box[0],
                        "yMin": box[1],
                        "xMax": box[2],
                        "yMax": box[3],
                    },
                }
            )

    return {
        "sha256": hex_digest[:16],
        "detections": detections,
        "torch_cuda_available": device == "cuda",
    }
