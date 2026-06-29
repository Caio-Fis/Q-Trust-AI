"""
Q-Trust AI — Definição do modelo híbrido clássico-quântico para produção.

Reproduz fielmente a arquitetura `HybridQNNReuploading` do notebook de pesquisa:
    img ──► ResNet18 (frozen + fine-tune layer4) ──► Linear(512→6) ──► tanh·(π/2)  ─┐
    fft ─────────────────────────────────────────── Linear(16→6)  ──► tanh·(π/2)  ─┤
                                                                                   ▼
                          VQC com Data Re-Uploading (RY=semântico, RZ=espectral, anel CNOT)
                                                ⟨Z₀⟩ … ⟨Z₅⟩ ──► Linear(6→2) ──► logits

Diferença vs. notebook: o backbone ResNet pode ser instanciado SEM baixar os pesos
ImageNet (`pretrained=False`), pois em produção carregamos o `state_dict` completo
do checkpoint exportado — evitando qualquer download de rede em runtime.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import torch
import torch.nn as nn
from torchvision import models

import pennylane as qml


@dataclass(frozen=True)
class ModelConfig:
    n_qubits: int = 6      # qubits do VQC
    n_layers: int = 4      # camadas de data re-uploading
    n_fft_bins: int = 16   # bins radiais do espectro FFT


def make_vqc(cfg: ModelConfig):
    """Constrói o QNode do circuito variacional para a configuração dada.

    Usa `default.qubit` (mesmo device do notebook) com interface PyTorch para
    diferenciação automática transparente no acoplamento clássico-quântico.
    """
    n_qubits = cfg.n_qubits
    n_layers = cfg.n_layers
    dev = qml.device("default.qubit", wires=n_qubits)

    @qml.qnode(dev, interface="torch")
    def vqc_reuploading(deep_inputs, fft_inputs, weights):
        for layer in range(n_layers):
            qml.AngleEmbedding(deep_inputs, wires=range(n_qubits), rotation="Y")
            qml.AngleEmbedding(fft_inputs, wires=range(n_qubits), rotation="Z")
            for i in range(n_qubits):
                qml.Rot(weights[layer, i, 0],
                        weights[layer, i, 1],
                        weights[layer, i, 2], wires=i)
            for i in range(n_qubits):
                qml.CNOT(wires=[i, (i + 1) % n_qubits])
        return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

    return vqc_reuploading


class HybridQNNReuploading(nn.Module):
    """Rede híbrida quântica (transfer learning + FFT + data re-uploading)."""

    def __init__(self, cfg: ModelConfig = ModelConfig(), pretrained: bool = False):
        super().__init__()
        self.cfg = cfg
        self._vqc = make_vqc(cfg)

        weights = models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        resnet = models.resnet18(weights=weights)
        resnet.fc = nn.Identity()
        self.backbone = resnet
        for p in self.backbone.parameters():
            p.requires_grad = False
        for p in self.backbone.layer4.parameters():
            p.requires_grad = True

        self.pre_deep = nn.Linear(512, cfg.n_qubits)
        self.pre_fft = nn.Linear(cfg.n_fft_bins, cfg.n_qubits)
        self.dropout = nn.Dropout(p=0.15)
        self.quantum_weights = nn.Parameter(
            torch.empty(cfg.n_layers, cfg.n_qubits, 3).uniform_(-0.01, 0.01)
        )
        self.post_quantum = nn.Linear(cfg.n_qubits, 2)

    def encode(self, img, fft_feat):
        resnet_feat = self.backbone(img)
        resnet_feat = self.dropout(resnet_feat)
        deep_enc = torch.tanh(self.pre_deep(resnet_feat)) * (math.pi / 2)
        fft_enc = torch.tanh(self.pre_fft(fft_feat)) * (math.pi / 2)
        return deep_enc, fft_enc

    def forward(self, img, fft_feat):
        deep_enc, fft_enc = self.encode(img, fft_feat)
        q_out = torch.stack([
            torch.stack(self._vqc(deep_enc[i], fft_enc[i], self.quantum_weights))
            for i in range(deep_enc.size(0))
        ]).to(torch.float32)
        q_out = self.dropout(q_out)
        return self.post_quantum(q_out)
