# Deploy no Hugging Face Spaces (Docker) 🚀

Sobe o backend + frontend do Q-Trust AI num **Space gratuito** (CPU basic: 2 vCPU,
16 GB RAM). A pasta `production/` inteira vira a raiz do repositório do Space.

Já está tudo preparado:
- `README.md` tem o header YAML que a HF lê (`sdk: docker`, `app_port: 8000`).
- `.gitattributes` envia `qtrust_vqc.pt` (44 MB) via **git-LFS**.
- `.gitignore` evita subir `__pycache__`/venv.
- O frontend chama a API por caminho relativo → funciona direto no domínio `*.hf.space`.

---

## Pré-requisitos (uma vez)

```bash
# git-lfs (Fedora)
sudo dnf install -y git-lfs
git lfs install

# CLI da Hugging Face + login (gere um token WRITE em huggingface.co/settings/tokens)
pip install -U huggingface_hub
hf auth login        # cole o token quando pedir
```

## Passo 1 — Criar o Space

Em **huggingface.co/new-space**:
- **Owner**: sua conta
- **Space name**: `q-trust-ai` (ou o que preferir)
- **SDK**: **Docker** → template **Blank**
- **Hardware**: **CPU basic · free**
- Visibilidade: Public (ou Private)

> Não precisa apagar seu Space atual — este é um Space novo e independente.

## Passo 2 — Enviar os arquivos

Troque `<user>` pelo seu usuário da HF e rode a partir da pasta `production/`:

```bash
cd "/home/crus/Documents/Projetos/Q-Trust AI/Classifying-AI-Images-with-Quantum-Algorithms-main/production"

git init
git lfs install
git lfs track "*.pt"            # já coberto pelo .gitattributes, mas garante
git add -A
git commit -m "Deploy Q-Trust AI no HF Spaces"
git branch -M main
git remote add space https://huggingface.co/spaces/<user>/q-trust-ai
git push space main
```

Se pedir credenciais no push: usuário = seu username da HF, senha = o **token WRITE**.

## Passo 3 — Acompanhar o build

- Abra `https://huggingface.co/spaces/<user>/q-trust-ai`.
- A aba **Logs / Building** mostra a instalação do torch (alguns minutos na 1ª vez).
- Quando ficar **Running**, teste:
  - Abra a URL → deve carregar a landing page.
  - `https://<user>-q-trust-ai.hf.space/api/health` → `{"model_loaded": true, ...}`.

```bash
# teste de inferência pela linha de comando
curl -F "file=@frontend/assets/images/HG.webp" \
  https://<user>-q-trust-ai.hf.space/api/predict
```

---

## Atualizar depois

```bash
git add -A && git commit -m "update" && git push space main
```
Cada push dispara um rebuild automático.

## Lembretes do tier gratuito
- O Space **dorme após 48 h sem acesso** e acorda na próxima visita (cold start
  de ~30–60 s, pois recarrega o modelo + warmup do PennyLane).
- Para nunca dormir: upgrade pago, ou um cron pingando `/api/health` a cada poucas horas.
