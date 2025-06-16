#!/usr/bin/env python3

import os
from beam import Image, endpoint, env, Volume
import subprocess
import boto3
import tempfile
import logging
from PIL import Image as PILImage
import jwt

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
    memory=8,
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
    memory=8,
    gpu="T4",
    on_start=download_models,
    volumes=[Volume(name="weights", mount_path=BEAM_VOLUME_CACHE_PATH)],
    secrets=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "JWT_SHARED_SECRET"],
    image=Image(python_version="python3.12").add_python_packages(
        [
            "transformers",
            "torch",
            "huggingface_hub[hf-transfer]",
            "Pillow",
            "boto3",
            "PyJWT",
        ]
    ),
)
def object_detection_endpoint(context, **inputs):
    model, processor, device = context.on_start_value

    aws_access_key_id = os.environ["AWS_ACCESS_KEY_ID"]
    aws_secret_access_key = os.environ["AWS_SECRET_ACCESS_KEY"]
    jwt_shared_secret = os.environ["JWT_SHARED_SECRET"]

    try:
        jwt_token = inputs["jwt"]
        decoded_jwt = jwt.decode(jwt_token, jwt_shared_secret, algorithms=["HS256"])
        key = decoded_jwt["key"]
    except KeyError:
        return {"error": "JWT not provided"}
    except jwt.PyJWTError as e:
        return {"error": f"Invalid JWT: {e}"}

    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
    )

    bucket_name = "atx-traffic-cameras"

    detections = []
    with tempfile.NamedTemporaryFile() as tmp_file:
        s3.download_file(bucket_name, key, tmp_file.name)
        image_path = tmp_file.name

        image = PILImage.open(image_path)
        width, height = image.size

        # Process the image for object detection
        processed_inputs = processor(images=image, return_tensors="pt")
        processed_inputs = processed_inputs.to(device)
        outputs = model(**processed_inputs)

        # Convert outputs to COCO API format and filter with threshold
        target_sizes = torch.tensor([image.size[::-1]]).to(device)
        results = processor.post_process_object_detection(
            outputs, target_sizes=target_sizes, threshold=0.6
        )[0]

        # Prepare detection results
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
        "detections": detections,
        "torch_cuda_available": device == "cuda",
        "width": width,
        "height": height,
    }
