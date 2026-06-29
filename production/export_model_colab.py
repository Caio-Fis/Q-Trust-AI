"""
================================================================================
 Q-Trust AI — EXPORTA�R O MODELO TREINADO (rodar no Google Colab)
================================================================================

O notebook treina o modelo mas NUNCA salva os pesos em disco (o melhor estado
fica apenas em `best_state` / na variável `model`). Este script captura tudo o
que a produção precisa em um único arquivo `qtrust_vqc.pt`.

COMO USAR
---------
1. Abra o notebook no Colab e rode TODAS as células até o fim da Seção 6
   (avaliação no teste) — assim `model` e `fft_scaler` estão na memória.
2. Cole o bloco abaixo em uma NOVA célula no final e execute.
3. Baixe o arquivo `qtrust_vqc.pt` (Colab: painel de Arquivos → download).
4. Copie-o para  production/models/qtrust_vqc.pt  no seu projeto local.

O checkpoint contém:
  • state_dict completo (inclui backbone ResNet18 fine-tunado)
  • parâmetros do StandardScaler da FFT (mean_ e scale_)
  • config da arquitetura (n_qubits, n_layers, n_fft_bins)
================================================================================
"""

# ---- COLE A PARTIR DAQUI EM UMA CÉLULA DO COLAB --------------------------------
import torch

checkpoint = {
    "state_dict": model.state_dict(),          # noqa: F821 (existe no Colab)
    "config": {
        "n_qubits": N_QUBITS,                  # noqa: F821
        "n_layers": N_LAYERS,                  # noqa: F821
        "n_fft_bins": N_FFT_BINS,              # noqa: F821
    },
    "fft_scaler_mean": fft_scaler.mean_.tolist(),    # noqa: F821
    "fft_scaler_scale": fft_scaler.scale_.tolist(),  # noqa: F821
}

torch.save(checkpoint, "qtrust_vqc.pt")
print("✅ Salvo qtrust_vqc.pt")
print("   parâmetros:", sum(p.numel() for p in model.state_dict().values()))  # noqa: F821
print("   config    :", checkpoint["config"])

# Download automático no Colab:
try:
    from google.colab import files
    files.download("qtrust_vqc.pt")
except Exception:
    print("Baixe manualmente o arquivo qtrust_vqc.pt pelo painel de Arquivos.")
# ---- FIM DO BLOCO -------------------------------------------------------------
