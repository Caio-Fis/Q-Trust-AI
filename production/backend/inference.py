"""
Q-Trust AI — Pipeline de inferência para produção.

Recebe os bytes de uma imagem enviada pelo usuário e devolve o diagnóstico
(REAL vs. SINTÉTICA) com a probabilidade P(fake).

O pré-processamento replica EXATAMENTE o do notebook de treino:
  • Ramo espectral : imagem → 32×32 BILINEAR → FFT radial (16 bins) → StandardScaler
  • Ramo visual    : imagem → 224×224 → ToTensor → Normalize(ImageNet)

Imports pesados (torch/torchvision/pennylane) são preguiçosos: o servidor sobe
mesmo sem a stack de ML instalada, reportando o motivo via /api/health.
"""
from __future__ import annotations

import io
import os
import threading
from typing import Optional

import numpy as np
from PIL import Image

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Caminho padrão do checkpoint exportado do Colab (override via env QTRUST_MODEL_PATH).
_DEFAULT_MODEL_PATH = os.environ.get(
    "QTRUST_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "..", "models", "qtrust_vqc.pt"),
)


def extract_fft_radial_single(img_uint8: np.ndarray, n_bins: int) -> np.ndarray:
    """Espectro de potência radial de UMA imagem (cópia fiel do notebook).

    img_uint8: array (H, W, 3) uint8 — deve ser 32×32 para casar com o treino.
    """
    H, W = img_uint8.shape[:2]
    cy, cx = H // 2, W // 2
    yy, xx = np.mgrid[-cy:H - cy, -cx:W - cx]
    r_map = np.sqrt(xx ** 2 + yy ** 2).astype(int)
    r_max = min(cy, cx)

    out = np.zeros(n_bins, dtype=np.float32)
    gray = img_uint8.mean(axis=-1).astype(np.float32) / 255.0
    mag = np.log(np.abs(np.fft.fftshift(np.fft.fft2(gray))) + 1e-8)
    for b in range(n_bins):
        r_lo = int(b * r_max / n_bins)
        r_hi = int((b + 1) * r_max / n_bins)
        mask = (r_map >= r_lo) & (r_map < r_hi)
        if mask.sum() > 0:
            out[b] = mag[mask].mean()
    return out


class Predictor:
    """Carrega o modelo uma vez e serve predições thread-safe."""

    def __init__(self, model_path: str = _DEFAULT_MODEL_PATH):
        self.model_path = os.path.abspath(model_path)
        self.available = False
        self.error: Optional[str] = None
        self._model = None
        self._fft_mean = None
        self._fft_scale = None
        self._cfg = None
        self._torch = None
        self._tf = None
        self._lock = threading.Lock()

    # ------------------------------------------------------------------ load
    def load(self) -> None:
        """Tenta importar a stack de ML e carregar o checkpoint. Não levanta."""
        try:
            import torch  # noqa: WPS433 (import preguiçoso proposital)
            from torchvision import transforms
            from model import HybridQNNReuploading, ModelConfig
        except Exception as exc:  # stack de ML ausente
            self.available = False
            self.error = f"Dependências de ML indisponíveis: {exc}"
            return

        if not os.path.exists(self.model_path):
            self.available = False
            self.error = (
                f"Checkpoint não encontrado em {self.model_path}. "
                "Exporte o modelo no Colab (export_model_colab.py) e copie o "
                "arquivo qtrust_vqc.pt para production/models/."
            )
            return

        try:
            ckpt = torch.load(self.model_path, map_location="cpu", weights_only=False)
            cfg_d = ckpt.get("config", {})
            cfg = ModelConfig(
                n_qubits=cfg_d.get("n_qubits", 6),
                n_layers=cfg_d.get("n_layers", 4),
                n_fft_bins=cfg_d.get("n_fft_bins", 16),
            )
            model = HybridQNNReuploading(cfg, pretrained=False)
            model.load_state_dict(ckpt["state_dict"])
            model.eval()

            self._torch = torch
            self._model = model
            self._cfg = cfg
            self._fft_mean = np.asarray(ckpt["fft_scaler_mean"], dtype=np.float32)
            self._fft_scale = np.asarray(ckpt["fft_scaler_scale"], dtype=np.float32)
            self._tf = transforms.Compose([
                transforms.Resize((224, 224), antialias=True),
                transforms.ToTensor(),
                transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ])
            self.available = True
            self.error = None
        except Exception as exc:
            self.available = False
            self.error = f"Falha ao carregar o checkpoint: {exc}"

    # --------------------------------------------------------------- predict
    def predict(self, image_bytes: bytes) -> dict:
        if not self.available:
            raise RuntimeError(self.error or "Modelo indisponível.")

        torch = self._torch
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Ramo espectral — 32×32 BILINEAR, FFT radial, scaler do treino
        img32 = np.array(img.resize((32, 32), Image.BILINEAR), dtype=np.uint8)
        fft_raw = extract_fft_radial_single(img32, self._cfg.n_fft_bins)
        fft_sc = (fft_raw - self._fft_mean) / self._fft_scale
        fft_t = torch.tensor(fft_sc, dtype=torch.float32).unsqueeze(0)

        # Ramo visual — 224×224 + normalização ImageNet
        img_t = self._tf(img).unsqueeze(0)

        with self._lock, torch.no_grad():
            logits = self._model(img_t, fft_t)
            probs = torch.softmax(logits, dim=1)[0]

        p_fake = float(probs[1].item())
        p_real = float(probs[0].item())
        is_fake = p_fake >= 0.5
        confidence = p_fake if is_fake else p_real

        return {
            "label": "SINTÉTICA" if is_fake else "REAL",
            "label_en": "fake" if is_fake else "real",
            "is_fake": is_fake,
            "p_fake": p_fake,
            "p_real": p_real,
            "confidence": confidence,
        }
