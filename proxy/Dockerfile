FROM public.ecr.aws/lambda/python:3.12

RUN dnf install -y openssl

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install --no-cache-dir -r requirements.txt

# ENV PRISMA_BINARY_CACHE_DIR=/cache

# ENV PRISMA_PY_BINARY_DIR ${LAMBDA_TASK_ROOT}/prisma-binaries
COPY schema.prisma ${LAMBDA_TASK_ROOT}
WORKDIR ${LAMBDA_TASK_ROOT}

RUN prisma generate

RUN mkdir -p /cache
RUN cp /root/.cache/prisma-python/binaries/*/*/node_modules/prisma/query-engine-rhel-openssl-3.0.x /cache/prisma-query-engine-rhel-openssl-3.2.x && chmod +x /cache/prisma-query-engine-rhel-openssl-3.2.x && chown 993:990 /cache/prisma-query-engine-rhel-openssl-3.2.x

COPY nonono.jpg ${LAMBDA_TASK_ROOT}
COPY proxy.py ${LAMBDA_TASK_ROOT}


# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "proxy.handler" ]