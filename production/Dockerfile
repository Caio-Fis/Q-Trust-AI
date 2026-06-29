# Q-Trust AI — imagem de produção
# Python 3.11: torch/torchvision/pennylane têm wheels estáveis (3.14 ainda não).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    QTRUST_MODEL_PATH=/app/models/qtrust_vqc.pt

WORKDIR /app

# Dependências de sistema mínimas para Pillow/torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Instala deps primeiro (cache de camadas). torch CPU-only para imagem menor.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchvision==0.18.1 \
    && pip install -r requirements.txt

# Código + frontend + (opcional) modelo
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY models/ ./models/

WORKDIR /app/backend
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
