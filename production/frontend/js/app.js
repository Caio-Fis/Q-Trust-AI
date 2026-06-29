// Q-Trust AI — interação do frontend (upload + diagnóstico)
(() => {
  "use strict";

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

  // ---- Health check do modelo -------------------------------------------
  fetch("/api/health")
    .then((r) => r.json())
    .then((d) => {
      const pill = $("status-pill");
      const text = pill.querySelector(".status-text");
      if (d.model_loaded) {
        pill.classList.add("ok");
        text.textContent = "modelo ativo";
      } else {
        pill.classList.add("off");
        text.textContent = "modelo offline";
        pill.title = d.error || "Modelo não carregado";
      }
    })
    .catch(() => {
      const pill = $("status-pill");
      pill.classList.add("off");
      pill.querySelector(".status-text").textContent = "API offline";
    });

  // ---- Seleção de arquivo -----------------------------------------------
  function setFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      return showError("Formato inválido. Use JPG, PNG ou WEBP.");
    }
    if (file.size > MAX_BYTES) {
      return showError("Imagem acima de 10 MB.");
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
      if (!res.ok) throw new Error(data.detail || "Falha na análise.");
      renderResult(data);
    } catch (err) {
      showError(err.message);
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  // ---- Estados do painel de resultado -----------------------------------
  function hideAll() {
    [placeholder, loading, content, errorBox].forEach((el) => (el.hidden = true));
  }
  function showPlaceholder() { hideAll(); placeholder.hidden = false; }
  function showLoading() { hideAll(); loading.hidden = false; }
  function showError(msg) { hideAll(); $("result-error-text").textContent = msg; errorBox.hidden = false; }

  function renderResult(d) {
    hideAll();
    const verdict = content.querySelector(".verdict");
    verdict.classList.toggle("is-fake", d.is_fake);
    verdict.classList.toggle("is-real", !d.is_fake);

    $("verdict-label").textContent = d.label;
    $("verdict-sub").textContent = d.is_fake
      ? "Provavelmente gerada por IA"
      : "Provavelmente uma foto real";

    const pct = Math.round(d.p_fake * 100);
    $("pfake-value").textContent = pct + "%";
    // pequena espera para animar a barra
    requestAnimationFrame(() => { $("gauge-fill").style.width = pct + "%"; });

    const conf = Math.round(d.confidence * 100);
    $("result-meta").innerHTML =
      `Confiança no veredito: <strong style="color:var(--foreground)">${conf}%</strong><br>` +
      `P(real) ${Math.round(d.p_real * 100)}% &middot; P(sintética) ${pct}%`;

    content.hidden = false;
  }
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
