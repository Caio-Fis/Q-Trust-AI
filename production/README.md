---
title: Q-Trust AI
emoji: 🔬
colorFrom: indigo
colorTo: yellow
sdk: docker
app_port: 8000
pinned: false
license: mit
---

# Q-Trust AI — Site de Produção 🔬⚛️

Site para colocar o detector de imagens sintéticas em produção: o usuário **anexa
uma imagem** e recebe o **diagnóstico** (REAL vs. SINTÉTICA) com a probabilidade
P(fake). Design inspirado na [MNTN Landing Page](https://shailendra99web.github.io/MNTN-Landing-Page/)
(navy + dourado, tipografia serif/Roboto, hero de montanhas).

```
production/
├── backend/
│   ├── app.py              # FastAPI: serve o frontend + /api/predict + /api/health
│   ├── inference.py        # pré-processamento (FFT radial + ResNet) e predição
│   ├── model.py            # HybridQNNReuploading + VQC (PennyLane) p/ inferência
│   └── requirements.txt
├── frontend/
│   ├── index.html          # landing page estilo MNTN com upload + resultado
│   ├── css/style.css
│   ├── js/app.js
│   └── assets/             # imagens do hero e ícones
├── models/                 # ← coloque aqui o qtrust_vqc.pt (exportado do Colab)
├── export_model_colab.py   # bloco para exportar o modelo treinado no Colab
├── Dockerfile · docker-compose.yml
└── run_local.sh
```

---

## Passo 1 — Exportar o modelo treinado (Colab)

> O notebook treina o modelo mas **não salva os pesos em disco**. É preciso exportá-los.

1. Abra `Q_Trust_AI_notebook.ipynb` no Colab e rode tudo até a **Seção 6**.
2. Rode a **Seção 12 – Exportar Modelo para Produção** (já adicionada ao notebook)
   — ou cole o conteúdo de `export_model_colab.py` numa célula nova.
3. Baixe o `qtrust_vqc.pt` gerado.
4. Copie para `production/models/qtrust_vqc.pt`.

O checkpoint contém: `state_dict` completo (incl. ResNet18 fine-tunada),
`fft_scaler_mean`/`fft_scaler_scale` e a `config` da arquitetura.

---

## Passo 2 — Rodar

### Opção A · Docker (recomendado p/ deploy)

```bash
cd production
docker compose up --build
# abra http://localhost:8000
```

O modelo é montado por volume (`./models`), então você pode trocar o `.pt` sem
rebuildar a imagem. Para deploy (Render/Railway/Fly/VPS) basta a imagem do
`Dockerfile` expondo a porta 8000.

### Opção B · Local (venv)

> Use **Python 3.11/3.12** — `torch`/`pennylane` ainda não têm wheels para 3.13+/3.14
> (este host está em 3.14, por isso a venv dedicada).

```bash
cd production
./run_local.sh            # cria venv, instala deps e sobe em :8000
# ou: PYTHON=python3.12 ./run_local.sh
```

---

## API

| Método | Rota           | Descrição                                            |
|--------|----------------|------------------------------------------------------|
| GET    | `/`            | Frontend (landing page)                              |
| GET    | `/api/health`  | `{model_loaded, error, model_path}`                  |
| POST   | `/api/predict` | multipart `file=<imagem>` → diagnóstico (JSON)       |

Resposta de `/api/predict`:

```json
{
  "label": "SINTÉTICA", "label_en": "fake", "is_fake": true,
  "p_fake": 0.93, "p_real": 0.07, "confidence": 0.93
}
```

```bash
curl -F "file=@imagem.png" http://localhost:8000/api/predict
```

---

## Como o diagnóstico é calculado

Mesmo pipeline do treino (reproduzido fielmente em `inference.py`):

1. **Ramo espectral** — imagem → 32×32 (BILINEAR) → FFT 2D → espectro radial (16 bins)
   → `StandardScaler` (parâmetros do treino).
2. **Ramo visual** — imagem → 224×224 → `ToTensor` → normalização ImageNet → ResNet18.
3. Ambos comprimidos para 6 ângulos (`tanh·π/2`) e injetados num **VQC de 6 qubits**
   com data re-uploading (RY=visual, RZ=espectral, anel de CNOTs).
4. ⟨Z₀⟩…⟨Z₅⟩ → `Linear(6→2)` → softmax → **P(fake)**. Limiar 0,5.

---

## Notas

- **Limiar 0,5** sobre P(fake); o modelo tem viés conservador (recall de sintéticas ~96%).
- Treinado em **CIFAKE** (CIFAR-10 real vs. Stable Diffusion 1.4). Generalização para
  outros geradores (Midjourney, Flux) não é garantida — resultado é **probabilístico**.
- Imagens são processadas em memória; nada é gravado em disco pelo backend.
