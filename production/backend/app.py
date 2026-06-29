"""
Q-Trust AI — Servidor FastAPI.

Serve o frontend (landing page estilo MNTN) e expõe a API de diagnóstico:
  GET  /                 → frontend
  GET  /api/health       → status do modelo (carregado? motivo de erro?)
  POST /api/predict      → recebe imagem (multipart) e retorna o diagnóstico
"""
from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from inference import Predictor

FRONTEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend")
)
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CT = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

app = FastAPI(title="Q-Trust AI", description="Detecção de imagens sintéticas via VQC")
predictor = Predictor()


@app.on_event("startup")
def _startup() -> None:
    predictor.load()
    if predictor.available:
        print("[Q-Trust AI] Modelo carregado:", predictor.model_path)
    else:
        print("[Q-Trust AI] Modelo NÃO carregado:", predictor.error)


@app.get("/api/health")
def health() -> JSONResponse:
    return JSONResponse({
        "model_loaded": predictor.available,
        "error": predictor.error,
        "model_path": predictor.model_path,
    })


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)) -> JSONResponse:
    if not predictor.available:
        raise HTTPException(status_code=503, detail=predictor.error or "Modelo indisponível.")
    if file.content_type not in ALLOWED_CT:
        raise HTTPException(status_code=415, detail="Envie uma imagem JPG, PNG ou WEBP.")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Imagem acima de 10 MB.")
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    try:
        result = predictor.predict(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro na inferência: {exc}")
    return JSONResponse(result)


# Frontend: estáticos em /assets, /css, /js e o index na raiz.
app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
