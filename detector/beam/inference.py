#!/usr/bin/env python3

import os
from beam import function
import subprocess


@function(gpu="T4", secrets=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"])
def is_gpu_available():
    aws_access_key_id = os.environ["AWS_ACCESS_KEY_ID"]
    aws_secret_access_key = os.environ["AWS_SECRET_ACCESS_KEY"]
    print(subprocess.check_output(["nvidia-smi"]).decode())
    print("This code is running on a remote GPU!")
    # print(f"AWS Access Key ID: {aws_access_key_id}")
    # print(f"AWS Secret Access Key: {aws_secret_access_key}")


if __name__ == "__main__":
    is_gpu_available.remote()
