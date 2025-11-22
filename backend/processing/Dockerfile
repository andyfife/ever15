# GPU-enabled Docker image for video processing
# Uses CUDA for GPU acceleration of NudeNet, WhisperX, and Llama
# Models are PRE-DOWNLOADED during build to avoid runtime downloads
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python3 -m pip install --upgrade pip

# Install WhisperX first (it will install compatible torch/torchaudio versions)
RUN pip3 install --no-cache-dir \
    git+https://github.com/m-bain/whisperx.git

# Install additional Python packages for Llama and other features
# Note: transformers version must be compatible with WhisperX
RUN pip3 install --no-cache-dir \
    accelerate \
    bitsandbytes \
    sentencepiece \
    protobuf

# Install NudeNet for content moderation
# Note: NudeNet 2.0.9 requires numpy<2.0, so we downgrade from WhisperX's numpy 2.0.2
RUN pip3 install --no-cache-dir \
    "numpy<2.0" \
    nudenet==2.0.9 \
    opencv-python-headless==4.8.1.78 \
    pillow==10.1.0

# Install AWS SDK (includes DynamoDB support)
RUN pip3 install --no-cache-dir \
    boto3==1.34.10

# Set Hugging Face cache directory (persistent location in image)
ENV HF_HOME=/models/huggingface
ENV TRANSFORMERS_CACHE=/models/huggingface

# Create cache directories
RUN mkdir -p /models/huggingface

# Hugging Face token argument (REQUIRED at build time for Llama)
ARG HF_TOKEN
ENV HUGGING_FACE_HUB_TOKEN=$HF_TOKEN

# Pre-download NudeNet model (~200MB)
# NOTE: Skipped due to protobuf version conflicts - will download on first run (~10 seconds)
# RUN echo "Downloading NudeNet model..." && \
#     python3 -c "from nudenet import NudeDetector; NudeDetector()" && \
#     echo "✓ NudeNet downloaded"

# Pre-download Llama 3.2 3B Instruct (~3GB)
# This takes 5-10 minutes during build but saves time on every job run
RUN if [ -n "$HF_TOKEN" ]; then \
    echo "Downloading Llama 3.2 3B Instruct (this takes ~10 minutes)..."; \
    python3 -c "from transformers import AutoTokenizer, AutoModelForCausalLM; \
    AutoTokenizer.from_pretrained('meta-llama/Llama-3.2-3B-Instruct', token='$HF_TOKEN'); \
    AutoModelForCausalLM.from_pretrained('meta-llama/Llama-3.2-3B-Instruct', token='$HF_TOKEN', torch_dtype='float16')"; \
    echo "✓ Llama model downloaded successfully"; \
    else \
    echo "ERROR: HF_TOKEN not provided. Build with: docker build --build-arg HF_TOKEN=your_token ."; \
    exit 1; \
    fi

# Pre-download WhisperX large-v2 model (~3GB)
RUN echo "Downloading WhisperX large-v2 model..." && \
    python3 -c "import whisperx; \
    whisperx.load_model('large-v2', 'cpu', compute_type='int8')" && \
    echo "✓ WhisperX model downloaded"

# Pre-download WhisperX alignment model for English (most common)
RUN echo "Downloading WhisperX alignment models..." && \
    python3 -c "import whisperx; \
    whisperx.load_align_model('en', 'cpu')" && \
    echo "✓ Alignment models downloaded"

# Create app directory
WORKDIR /app

# Copy processing script
COPY process_video.py /app/process_video.py
RUN chmod +x /app/process_video.py

# Set Python to run in unbuffered mode (better for logging)
ENV PYTHONUNBUFFERED=1

# Entry point
ENTRYPOINT ["python3", "/app/process_video.py"]
