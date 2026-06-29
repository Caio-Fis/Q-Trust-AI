// Q-Trust AI — interação do frontend (upload + diagnóstico) + i18n PT/EN
(() => {
  "use strict";

  // ---- Dicionário de idiomas -------------------------------------------
  const I18N = {
    pt: {
      "doc.title": "Q-Trust AI | Detecção Quântica de Imagens Sintéticas",
      "doc.desc": "Q-Trust AI — Arquitetura híbrida clássico-quântica que detecta imagens geradas por IA. Anexe uma imagem e receba o diagnóstico: REAL ou SINTÉTICA.",
      "hero.subtitle": "DETECÇÃO QUÂNTICA DE IMAGENS",
      "hero.h1": "Esta imagem é real ou foi gerada por uma IA?",
      "hero.cta": "ANALISAR UMA IMAGEM",
      "status.checking": "verificando…",
      "detector.subtitle": "O DETECTOR",
      "detector.h2": "Anexe uma imagem e receba o diagnóstico",
      "dropzone.title": "Arraste uma imagem aqui",
      "dropzone.hint": "ou clique para selecionar · JPG, PNG ou WEBP · até 10 MB",
      "btn.analyze": "DIAGNOSTICAR",
      "btn.reset": "LIMPAR",
      "result.placeholder": "O diagnóstico aparecerá aqui após a análise.",
      "result.loading": "Executando circuito quântico…",
      "gauge.label": "Probabilidade de ser SINTÉTICA",
      "how.subtitle": "COMO FUNCIONA",
      "how.h2": "Três fontes de sinal, um veredito quântico",
      "card1.h3": "Features visuais",
      "card1.p": "Uma ResNet18 (ImageNet, com fine-tuning parcial) extrai um embedding semântico de 512 dimensões, comprimido para 6 ângulos de rotação.",
      "card2.h3": "Assinatura espectral",
      "card2.p": "A FFT 2D revela o espectro radial de potência — artefatos de frequência que GANs e modelos de difusão deixam ao gerar imagens.",
      "card3.h3": "Circuito quântico",
      "card3.p": "Um VQC de 6 qubits com data re-uploading codifica o visual em RY e o espectral em RZ (eixos ortogonais), entrelaça com um anel de CNOTs e mede ⟨Z⟩.",
      "footer.tagline": "Arquitetura híbrida clássico-quântica para detecção de imagens sintéticas. Brazil Quantum Camp.",
      "footer.copyright": "© 2026 Q-Trust AI · Uso educacional e de pesquisa",
      "footer.project": "Projeto",
      "footer.proj.layers": "4 camadas de Re-Uploading",
      "footer.proj.code": "Código no GitHub ↗",
      "footer.notice": "Aviso",
      "footer.notice.1": "Resultado probabilístico",
      "footer.notice.2": "Não é prova definitiva",
      "footer.notice.3": "Treinado em Stable Diffusion 1.4",
      // dinâmicos
      "status.online": "modelo ativo",
      "status.offline": "modelo offline",
      "status.apiOffline": "API offline",
      "status.notLoaded": "Modelo não carregado",
      "status.title": "Status do modelo",
      "verdict.fake": "SINTÉTICA",
      "verdict.real": "REAL",
      "verdict.fakeSub": "Provavelmente gerada por IA",
      "verdict.realSub": "Provavelmente uma foto real",
      "meta.confidence": "Confiança no veredito",
      "meta.pReal": "P(real)",
      "meta.pFake": "P(sintética)",
      "err.format": "Formato inválido. Use JPG, PNG ou WEBP.",
      "err.size": "Imagem acima de 10 MB.",
      "err.failed": "Falha na análise.",
    },
    en: {
      "doc.title": "Q-Trust AI | Quantum Detection of Synthetic Images",
      "doc.desc": "Q-Trust AI — A hybrid classical-quantum architecture that detects AI-generated images. Attach an image and get the diagnosis: REAL or SYNTHETIC.",
      "hero.subtitle": "QUANTUM IMAGE DETECTION",
      "hero.h1": "Is this image real or AI-generated?",
      "hero.cta": "ANALYZE AN IMAGE",
      "status.checking": "checking…",
      "detector.subtitle": "THE DETECTOR",
      "detector.h2": "Attach an image and get the diagnosis",
      "dropzone.title": "Drag an image here",
      "dropzone.hint": "or click to select · JPG, PNG or WEBP · up to 10 MB",
      "btn.analyze": "DIAGNOSE",
      "btn.reset": "CLEAR",
      "result.placeholder": "The diagnosis will appear here after the analysis.",
      "result.loading": "Running quantum circuit…",
      "gauge.label": "Probability of being SYNTHETIC",
      "how.subtitle": "HOW IT WORKS",
      "how.h2": "Three signal sources, one quantum verdict",
      "card1.h3": "Visual features",
      "card1.p": "A ResNet18 (ImageNet, with partial fine-tuning) extracts a 512-dimensional semantic embedding, compressed into 6 rotation angles.",
      "card2.h3": "Spectral signature",
      "card2.p": "The 2D FFT reveals the radial power spectrum — frequency artifacts that GANs and diffusion models leave behind when generating images.",
      "card3.h3": "Quantum circuit",
      "card3.p": "A 6-qubit VQC with data re-uploading encodes the visual features in RY and the spectral ones in RZ (orthogonal axes), entangles them with a CNOT ring and measures ⟨Z⟩.",
      "footer.tagline": "Hybrid classical-quantum architecture for synthetic image detection. Brazil Quantum Camp.",
      "footer.copyright": "© 2026 Q-Trust AI · Educational and research use",
      "footer.project": "Project",
      "footer.proj.layers": "4 Re-Uploading layers",
      "footer.proj.code": "Code on GitHub ↗",
      "footer.notice": "Disclaimer",
      "footer.notice.1": "Probabilistic result",
      "footer.notice.2": "Not definitive proof",
      "footer.notice.3": "Trained on Stable Diffusion 1.4",
      // dinâmicos
      "status.online": "model online",
      "status.offline": "model offline",
      "status.apiOffline": "API offline",
      "status.notLoaded": "Model not loaded",
      "status.title": "Model status",
      "verdict.fake": "FAKE",
      "verdict.real": "REAL",
      "verdict.fakeSub": "Likely AI-generated",
      "verdict.realSub": "Likely a real photo",
      "meta.confidence": "Verdict confidence",
      "meta.pReal": "P(real)",
      "meta.pFake": "P(synthetic)",
      "err.format": "Invalid format. Use JPG, PNG or WEBP.",
      "err.size": "Image over 10 MB.",
      "err.failed": "Analysis failed.",
    },
  };

  let lang = (() => {
    const saved = localStorage.getItem("qtrust-lang");
    // Padrão: PT (mantém a escolha do usuário se já tiver trocado de idioma).
    return saved === "pt" || saved === "en" ? saved : "pt";
  })();
  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.pt[key] || key;

  const $ = (id) => document.getElementById(id);
  const fileInput = $("file-input");
  const dropzone = $("dropzone");
  const dzEmpty = $("dropzone-empty");
  const preview = $("preview");
  const analyzeBtn = $("analyze-btn");
  const resetBtn = $("reset-btn");
  const form = $("upload-form");

  const placeholder = $("result-placeholder");
  const loading = $("result-loading");
  const content = $("result-content");
  const errorBox = $("result-error");

  const MAX_BYTES = 10 * 1024 * 1024;
  let currentFile = null;

  // Estado para re-render ao trocar de idioma
  let panelState = "placeholder"; // placeholder | loading | content | error
  let lastData = null;
  let lastErrorKey = null;
  let lastErrorRaw = null;
  let healthState = "checking";   // checking | online | offline | apiOffline
  let healthError = null;

  // ---- i18n: aplica idioma -----------------------------------------------
  function applyLang(l) {
    lang = l;
    localStorage.setItem("qtrust-lang", l);
    document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
    document.title = t("doc.title");
    const md = $("meta-description");
    if (md) md.setAttribute("content", t("doc.desc"));

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll(".lang-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.lang === l)
    );

    renderHealth();
    if (panelState === "content" && lastData) renderResult(lastData);
    else if (panelState === "error")
      setErrorText(lastErrorKey ? t(lastErrorKey) : lastErrorRaw);
  }

  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.addEventListener("click", () => applyLang(b.dataset.lang))
  );

  // ---- Health check do modelo -------------------------------------------
  function renderHealth() {
    const pill = $("status-pill");
    if (!pill) return;
    const text = pill.querySelector(".status-text");
    pill.classList.remove("ok", "off");
    if (healthState === "online") {
      pill.classList.add("ok");
      text.textContent = t("status.online");
      pill.title = t("status.title");
    } else if (healthState === "offline") {
      pill.classList.add("off");
      text.textContent = t("status.offline");
      pill.title = healthError || t("status.notLoaded");
    } else if (healthState === "apiOffline") {
      pill.classList.add("off");
      text.textContent = t("status.apiOffline");
      pill.title = t("status.title");
    } else {
      text.textContent = t("status.checking");
      pill.title = t("status.title");
    }
  }

  fetch("/api/health")
    .then((r) => r.json())
    .then((d) => {
      if (d.model_loaded) {
        healthState = "online";
      } else {
        healthState = "offline";
        healthError = d.error || null;
      }
      renderHealth();
    })
    .catch(() => {
      healthState = "apiOffline";
      renderHealth();
    });

  // ---- Seleção de arquivo -----------------------------------------------
  function setFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      return showError("err.format");
    }
    if (file.size > MAX_BYTES) {
      return showError("err.size");
    }
    currentFile = file;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.hidden = false;
    dzEmpty.hidden = true;
    analyzeBtn.disabled = false;
    resetBtn.hidden = false;
    showPlaceholder();
  }

  fileInput.addEventListener("change", (e) => setFile(e.target.files[0]));

  // Drag & drop
  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); })
  );
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });

  // ---- Reset -------------------------------------------------------------
  resetBtn.addEventListener("click", () => {
    currentFile = null;
    fileInput.value = "";
    preview.hidden = true;
    preview.removeAttribute("src");
    dzEmpty.hidden = false;
    analyzeBtn.disabled = true;
    resetBtn.hidden = true;
    showPlaceholder();
  });

  // ---- Submit / análise --------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentFile) return;

    showLoading();
    analyzeBtn.disabled = true;

    const fd = new FormData();
    fd.append("file", currentFile);

    try {
      const res = await fetch("/api/predict", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("err.failed"));
      renderResult(data);
    } catch (err) {
      // Erro vindo do servidor (texto cru, sem chave de tradução).
      showError(null, err.message);
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  // ---- Estados do painel de resultado -----------------------------------
  function hideAll() {
    [placeholder, loading, content, errorBox].forEach((el) => (el.hidden = true));
  }
  function showPlaceholder() { panelState = "placeholder"; hideAll(); placeholder.hidden = false; }
  function showLoading() { panelState = "loading"; hideAll(); loading.hidden = false; }

  function setErrorText(msg) { $("result-error-text").textContent = msg; }
  // showError(key) p/ mensagens client-side traduzíveis; showError(null, raw) p/ erro do servidor.
  function showError(key, raw) {
    panelState = "error";
    lastErrorKey = key || null;
    lastErrorRaw = key ? null : (raw || "");
    hideAll();
    setErrorText(key ? t(key) : lastErrorRaw);
    errorBox.hidden = false;
  }

  function renderResult(d) {
    panelState = "content";
    lastData = d;
    hideAll();
    const verdict = content.querySelector(".verdict");
    verdict.classList.toggle("is-fake", d.is_fake);
    verdict.classList.toggle("is-real", !d.is_fake);

    $("verdict-label").textContent = d.is_fake ? t("verdict.fake") : t("verdict.real");
    $("verdict-sub").textContent = d.is_fake ? t("verdict.fakeSub") : t("verdict.realSub");

    const pct = Math.round(d.p_fake * 100);
    $("pfake-value").textContent = pct + "%";
    requestAnimationFrame(() => { $("gauge-fill").style.width = pct + "%"; });

    const conf = Math.round(d.confidence * 100);
    $("result-meta").innerHTML =
      `${t("meta.confidence")}: <strong style="color:var(--foreground)">${conf}%</strong><br>` +
      `${t("meta.pReal")} ${Math.round(d.p_real * 100)}% &middot; ${t("meta.pFake")} ${pct}%`;

    content.hidden = false;
  }

  // Aplica o idioma inicial (DOM já pronto: script no fim do body).
  applyLang(lang);
})();

// ---- Parallax do hero (estilo MNTN) -------------------------------------
// As 3 camadas se movem em velocidades diferentes conforme o scroll (0→1 na 1ª tela);
// a pessoa/gramado sobe sobre o texto, que desvanece. Honra prefers-reduced-motion.
(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const bg = hero.querySelector(".hero-bg-img");
  const fg = hero.querySelector(".hero-fg-img");
  const content = hero.querySelector(".hero-content");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ticking = false;
  function update() {
    const vh = window.innerHeight || 1;
    const p = Math.min(Math.max(window.scrollY / vh, 0), 1); // progresso na 1ª tela
    if (!reduce) {
      // fundo sobe devagar; pessoa/gramado sobe mais (parallax de profundidade)
      bg.style.transform = `translateY(${(-45 * p).toFixed(1)}px)`;
      fg.style.transform = `translateY(${(-120 * p).toFixed(1)}px)`;
      content.style.transform = `translate(-50%, calc(-50% + ${(-70 * p).toFixed(1)}px))`;
    }
    content.style.opacity = Math.max(0, 1 - p * 1.35).toFixed(3);
    hero.style.pointerEvents = p > 0.98 ? "none" : "";
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
