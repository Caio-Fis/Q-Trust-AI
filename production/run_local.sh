#!/usr/bin/env bash
# Q-Trust AI — sobe o servidor localmente em uma venv Python compatível.
# Requer Python 3.11/3.12 (torch/pennylane não têm wheels para 3.13+/3.14).
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-python3.11}"
if ! command -v "$PY" >/dev/null 2>&1; then
  echo "Python 3.11 não encontrado. Instale-o ou exporte PYTHON=python3.12"
  echo "  Fedora:  sudo dnf install python3.11"
  exit 1
fi

if [ ! -d .venv ]; then
  echo "==> Criando venv ($PY)"
  "$PY" -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

echo "==> Instalando dependências (pode demorar na 1ª vez)"
pip install --upgrade pip >/dev/null
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchvision==0.18.1
pip install -r backend/requirements.txt

echo "==> Iniciando em http://localhost:8000"
cd backend
exec uvicorn app:app --host 0.0.0.0 --port 8000 --reload
