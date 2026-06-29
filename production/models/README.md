# Pasta de modelos

Coloque aqui o checkpoint exportado do Colab:

```
production/models/qtrust_vqc.pt
```

Esse arquivo é gerado pela **Seção 12** do notebook (ou por `export_model_colab.py`)
e contém: `state_dict` completo + parâmetros do `StandardScaler` da FFT + config da
arquitetura. O backend o carrega automaticamente na inicialização.

> Sem este arquivo o site ainda sobe, mas o detector responde "modelo offline".
