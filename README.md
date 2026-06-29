# Q-Trust AI 🔬⚛️

### Arquitetura Híbrida para Detecção de Imagens Sintéticas via Data Re-Uploading Quântico de Entrada Dupla

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/PennyLane-0.36+-black?style=for-the-badge&logo=data:image/svg+xml;base64,&logoColor=white"/>
  <img src="https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white"/>
  <img src="https://img.shields.io/badge/Quantum-6%20Qubits-8A2BE2?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Recall%20Sint%C3%A9tico-96%25-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Acur%C3%A1cia-90.75%25-brightgreen?style=for-the-badge"/>
</p>

<p align="center">
  <a href="https://caio-fis-q-trust-ai.hf.space"><img src="https://img.shields.io/badge/%F0%9F%8C%90%20Demo%20ao%20Vivo-caio--fis--q--trust--ai.hf.space-2496ED?style=for-the-badge"/></a>
</p>

<p align="center">
  <b>Brazil Quantum Camp - Quantum Computing Solutions</b><br/>
  <i>Equipe Q-Trust AI</i>
</p>

---

## 📌 Visão Geral

À medida que as imagens geradas por IA se tornam indistinguíveis de fotografias reais, cresce a necessidade de métodos robustos de detecção. O Q-Trust AI apresenta uma **arquitetura híbrida clássico-quântica** que funde features visuais profundas e assinaturas espectrais de frequência para classificar imagens como reais ou sintéticas.

Nossa ideia central: modelos generativos como GANs e Modelos de Difusão deixam **impressões digitais espectrais** mensuráveis — padrões invisíveis ao olho humano, mas detectáveis no domínio da frequência. Ao combinar essas features espectrais com embeddings semânticos de uma ResNet18 dentro de um **Circuito Quântico Variacional (VQC)**, exploramos o emaranhamento quântico para capturar correlações sutis entre as modalidades.

Por ser uma tarefa de **detecção**, a métrica que mais importa é o **recall da classe sintética** — quantas imagens falsas o modelo realmente captura. Um falso negativo (uma imagem falsa classificada como real) é o erro caro, então o recall é o nosso número de destaque.

> **Resultado de destaque — Recall Sintético: 96%** no benchmark CIFAKE: o modelo sinaliza quase todas as imagens geradas por IA, com apenas ~4% das falsas escapando. Obtido com **90,75% de acurácia geral** e **F1-Score de 0,9125**, operando em apenas **6 dimensões** com **72 parâmetros quânticos treináveis** — quase igualando um SVM clássico de 528 dimensões.

> 🌐 **Teste ao vivo:** [caio-fis-q-trust-ai.hf.space](https://caio-fis-q-trust-ai.hf.space)

---

## 🧠 Arquitetura

```
Imagem de Entrada (32×32×3)
    │
    ├──► ResNet18 (ImageNet, congelada + fine-tuning na layer4)
    │         └──► 512D ──► Linear(512→6) ──► tanh×(π/2) ──► semantic_enc (6D)
    │
    └──► Espectro Radial de Potência via FFT (16 bins)
              └──► Linear(16→6) ──► tanh×(π/2) ──► spectral_enc (6D)
                                                          │
                                    ┌─────────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │   Circuito Quântico Variacional  │
                    │   6 qubits · 4 camadas Re-Upload │
                    │                                  │
                    │  RY(semantic[i]) ─ RZ(spectral[i]) por qubit  │
                    │  Emaranhamento em anel de CNOTs   │
                    └──────────────┬──────────────────┘
                                   │
                          ⟨Z₀⟩ ... ⟨Z₅⟩  (6 valores esperados de Pauli-Z)
                                   │
                              Linear(6→2) ──► Softmax ──► P(falsa)
```


### Principais Escolhas de Projeto

| Componente | Escolha | Justificativa |
|-----------|--------|-----------|
| **Codificador Visual** | ResNet18 (fine-tuning parcial) | Features semânticas ricas de 512D; transfer learning a partir da ImageNet |
| **Codificador Espectral** | FFT radial (16 bins, resolução 32×32) | Captura artefatos de amostragem de GANs/difusão com granularidade plena de frequência |
| **Embedding** | Angle Embedding ortogonal (RY + RZ) | Features semânticas e espectrais ocupam eixos separados da esfera de Bloch — sem interferência destrutiva |
| **Emaranhamento** | Anel de CNOTs | Propaga as correlações entre modalidades por todos os qubits |
| **Re-Uploading** | 4 camadas de Data Re-Uploading | Transforma um VQC raso em um aproximador universal de funções |
| **Otimizador** | AdamW + Label Smoothing (ε=0,05) | Estabiliza a interface de gradiente clássico-quântica; evita excesso de confiança |

---

## 📊 Resultados

### Desempenho no Conjunto de Teste (400 imagens, nunca vistas no treino)

| Modelo | Acurácia | F1-Score | AUC-ROC | Parâmetros (quânticos) | Dim. Entrada |
|-------|----------|----------|---------|-----------------|-----------|
| **VQC Dual-Input (nosso)** | **90,75%** | **0,9125** | **0,9563** | **72** | **6** |
| MLP Equivalente (6D) | 90,75% | 0,9082 | - | ~50 | 6 |
| Regressão Logística | 90,25% | - | - | - | 528 |
| SVM RBF (limite superior) | 91,00% | 0,9167 | - | - | 528 |

> **O VQC com entrada de 6D supera a Regressão Logística treinada em 528 dimensões** e empata com o MLP clássico equivalente em acurácia, superando-o no F1-Score — sugerindo que a vantagem vem da expressividade quântica via emaranhamento, e não de poder computacional bruto.

### Desempenho de Detecção — Recall em Primeiro Lugar

Para um detector de imagens sintéticas, **o recall da classe falsa é a métrica-chave**: ele mede quantas imagens geradas por IA são de fato capturadas. Falsos negativos (falsas rotuladas como reais) são os erros caros, então otimizamos e reportamos o recall acima de tudo.

- 🎯 **Recall sintético: 96%** — o modelo captura quase todas as imagens falsas (apenas ~4% escapam)
- **Precisão em reais: 85%** — viés conservador, ideal para triagem antifraude
- AUC-ROC de **0,9563** demonstra discriminação robusta em todos os limiares

### Análise t-SNE

Os 6 observáveis de Pauli-Z produzem **separação geométrica mais nítida** entre as classes real e falsa do que o equivalente clássico de 6D, confirmando visualmente a vantagem da codificação multimodal ortogonal no espaço latente quântico.

---

## 🗂️ Estrutura do Repositório

```
q-trust-ai/
│
├── README.md                          # Este arquivo
├── LICENSE
│
├── Q_Trust_AI_notebook.ipynb          # Notebook completo do experimento (Google Colab)
│
├── docs/
│   ├── ARCHITECTURE.md                # Detalhamento da arquitetura
│   ├── EXPERIMENTS.md                 # Log completo de experimentos (todas as arquiteturas testadas)
│   └── final_report.pdf               # Relatório oficial da competição (PT-BR)
│
└── production/                        # App de produção (demo ao vivo)
    ├── frontend/                      # Site bilíngue PT/EN (HTML/CSS/JS)
    ├── backend/                       # API FastAPI + modelo de inferência
    ├── models/                        # Checkpoint exportado (qtrust_vqc.pt)
    └── Dockerfile                     # Imagem do Hugging Face Space
```

---

## ⚙️ Setup & Reprodução

### Requisitos

```bash
pip install pennylane pennylane-lightning scikit-learn matplotlib seaborn kagglehub tqdm
pip install torch torchvision
```

### Executando o Notebook

O experimento completo está contido em um único notebook do Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1qmERT8cg17a1OMGrXEX7T_PYX_Xa1MnP?usp=sharing)

Todas as constantes globais que controlam o experimento são definidas no topo da Seção 1. Principais parâmetros de reprodutibilidade:

```python
SEED        = 42       # Fixo em numpy, torch e random
N_QUBITS    = 6        # Qubits do VQC
N_LAYERS    = 4        # Camadas de Data Re-Uploading
TRAIN_SIZE  = 2000     # Balanceado: 1000 REAL + 1000 FALSA
VAL_SIZE    = 400      # 200 + 200
TEST_SIZE   = 400      # 200 + 200 (isolado)
```

### Dataset

Usamos o benchmark **CIFAKE** ([Bird & Lotfi, 2024](https://arxiv.org/abs/2303.14126)), baixado automaticamente via `kagglehub`:

```python
import kagglehub
path = kagglehub.dataset_download("bird-j/cifake-real-and-ai-generated-synthetic-images")
```

120.000 imagens de 32×32 pixels: fotografias reais do CIFAR-10 vs. suas contrapartes sintéticas do Stable Diffusion 1.4.

---

## 🔬 Seções do Notebook

| Seção | Descrição |
|---------|-------------|
| **1 - Setup & Imports** | Dependências, constantes globais, seed de reprodutibilidade |
| **2 - Dataset & Features FFT** | Carregamento do CIFAKE, extração do espectro radial de potência |
| **3 - Análise Exploratória** | Amostras visuais, comparação de assinatura espectral (real vs. falsa) |
| **4 - Arquitetura** | Definição do circuito VQC, codificador ResNet, Angle Embedding |
| **5 - Treinamento Híbrido** | Data augmentation, AdamW, Label Smoothing, loop de treino |
| **6 - Avaliação no Teste** | Acurácia, F1-Score, AUC-ROC, matriz de confusão |
| **7 - Modelos Baseline** | SVM RBF, Regressão Logística, MLP 6D |
| **8 - Análise Comparativa** | Curvas ROC, precisão-recall, distribuições de probabilidade |
| **9 - Internos do Circuito Quântico** | Observáveis de Pauli-Z, t-SNE do espaço latente quântico |
| **10 - Complexidade Computacional** | Enquadramento P vs NP-difícil; motivação para QML híbrido |
| **11 - Conclusões & Próximos Passos** | Tabela completa de resultados, lições aprendidas, direções futuras |

---

## 🚀 Próximos Passos

| Direção | Descrição | Impacto Esperado |
|-----------|-------------|-----------------|
| **Mais camadas de Re-Uploading** | Aumentar `N_LAYERS` de 4 para 6–8 | Maior acurácia |
| **Strongly Entangling Layers** | Substituir o anel de CNOTs por emaranhamento mais denso | Melhor captura de correlações multivariadas |
| **Hardware quântico real** | Rodar no IBM Quantum ou IonQ com otimizador SPSA | Avaliar o impacto da decoerência na acurácia |
| **Novos geradores** | Testar contra Midjourney, Flux2 (não só Stable Diffusion) | Avaliação de generalização |
| **Quantum Natural Gradient** | Substituir AdamW pelo otimizador QNG | Atualizações de parâmetros quânticos mais estáveis |
| **Datasets maiores** | CIFAKE completo (120K) + outros benchmarks | Avaliação de escalabilidade |

---

## 👥 Equipe

**Q-Trust AI** - Brazil Quantum Camp 2026

Amanda Arruda · Caio Silva · Diogo Lacerda · Eduarda Mendes · Igor Oliveira · Paulo Aquino · Rebeca Vitória Tenório · Vinícius Leal

---

## 📚 Referências

1. Bird, J. J., & Lotfi, A. (2023). **CIFAKE: Image Classification and Explainable Identification of AI-Generated Synthetic Images**. arXiv:2303.14126. [https://arxiv.org/abs/2303.14126](https://arxiv.org/abs/2303.14126)

2. Blum, A. L., & Rivest, R. L. (1992). **Training a 3-node neural network is NP-complete**. *Neural Networks*, 5(1), 117-127.

3. Citron, D. K., & Chesney, R. (2019). **Deepfakes and the New Disinformation War**. Boston University School of Law.

4. Pérez-Salinas, A., Cervera-Lierta, A., Gil-Fuster, E., et al. (2020). **Data re-uploading for a universal quantum classifier**. *Quantum*, 4, 226. [https://arxiv.org/abs/1907.02085](https://arxiv.org/abs/1907.02085)

---

## 📄 Licença

Este projeto é distribuído sob a Licença MIT. Veja [LICENSE](LICENSE) para detalhes.
