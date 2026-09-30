/* Mi café · Prensa francesa — interacción ligera sin dependencias. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} }
  };
  const announcer = $("#announcer");
  const announce = (msg) => { announcer.textContent = ""; setTimeout(() => { announcer.textContent = msg; }, 40); };
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (s) => pad(Math.floor(s / 60)) + ":" + pad(s % 60);

  /* ------------------------------------------------------------------
     Zoom: la experiencia es tipo app. Se evitan pinch, doble toque y
     Ctrl/Cmd + rueda o teclas, sin tocar el desplazamiento normal.
     ------------------------------------------------------------------ */
  ["gesturestart", "gesturechange", "gestureend"].forEach((t) =>
    document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length > 1 || (typeof e.scale === "number" && e.scale !== 1)) e.preventDefault();
  }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 320 && !e.target.closest("input, textarea, select, video")) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  window.addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0", "_"].includes(e.key)) e.preventDefault();
  });

  /* ------------------------------------------------------------------ Tema */
  const themeCycleBtn = $("#themeCycle");
  const themeIcons = { system: "#i-auto", light: "#i-sun", dark: "#i-moon" };
  const themeNames = { system: "sistema", light: "claro", dark: "oscuro" };
  const metaTheme = $$('meta[name="theme-color"]');
  function applyTheme(mode) {
    if (mode === "light" || mode === "dark") { root.setAttribute("data-theme", mode); store.set("mc-theme", mode); }
    else { root.removeAttribute("data-theme"); store.set("mc-theme", null); mode = "system"; }
    $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.themeSet === mode)));
    themeCycleBtn.querySelector("use").setAttribute("href", themeIcons[mode]);
    themeCycleBtn.setAttribute("aria-label", "Tema: " + themeNames[mode] + ". Cambiar tema");
    const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    metaTheme.forEach((m) => { if (mode === "system") m.setAttribute("content", m.media.includes("dark") ? "#0e0d0c" : "#f5f2ed"); else m.setAttribute("content", dark ? "#0e0d0c" : "#f5f2ed"); });
  }
  const currentTheme = () => root.getAttribute("data-theme") || "system";
  $$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.themeSet)));
  themeCycleBtn.addEventListener("click", () => {
    const order = ["system", "light", "dark"];
    applyTheme(order[(order.indexOf(currentTheme()) + 1) % 3]);
  });
  applyTheme(currentTheme());

  /* ------------------------------------------------------------------ Barra y navegación activa */
  const appbar = $("#appbar");
  let barFrame = 0;
  const paintBar = () => { barFrame = 0; appbar.classList.toggle("scrolled", scrollY > 12); };
  addEventListener("scroll", () => { if (!barFrame) barFrame = requestAnimationFrame(paintBar); }, { passive: true });
  paintBar();

  const navLinks = $$("[data-nav]");
  const sections = ["metodo", "utensilios", "pasos", "completo", "alternativas"].map((id) => document.getElementById(id));
  if ("IntersectionObserver" in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => seen.set(en.target.id, en.isIntersecting ? en.intersectionRatio : 0));
      let best = null, max = 0;
      seen.forEach((v, k) => { if (v > max) { max = v; best = k; } });
      navLinks.forEach((a) => {
        const on = a.dataset.nav === best;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.01, 0.2] });
    sections.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------ Apariciones suaves */
  const reveals = $$(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const groups = new Map();
    reveals.forEach((el) => {
      const p = el.parentElement; const i = groups.get(p) || 0; groups.set(p, i + 1);
      el.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
    });
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    reveals.forEach((el) => ro.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ------------------------------------------------------------------ Los 6 utensilios */
  const tools = $$(".tool");
  const tip = $("#benchTip");
  const hotspots = $$(".hotspot");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  function setToolOpen(tool, open) {
    tool.classList.toggle("open", open);
    tool.querySelector(".tool-btn").setAttribute("aria-expanded", String(open));
  }
  tools.forEach((tool) => {
    const btn = tool.querySelector(".tool-btn");
    btn.addEventListener("click", () => {
      const open = !tool.classList.contains("open");
      if (!canHover) tools.forEach((t) => t !== tool && setToolOpen(t, false));
      setToolOpen(tool, open);
    });
    if (canHover) {
      tool.addEventListener("mouseenter", () => setToolOpen(tool, true));
      tool.addEventListener("mouseleave", () => { if (!tool.contains(document.activeElement)) setToolOpen(tool, false); });
      btn.addEventListener("blur", () => { if (!tool.matches(":hover")) setToolOpen(tool, false); });
    }
  });
  function closeTip() {
    tip.hidden = true;
    hotspots.forEach((h) => h.setAttribute("aria-expanded", "false"));
    tools.forEach((t) => t.classList.remove("hl"));
  }
  hotspots.forEach((h) => {
    h.addEventListener("click", (e) => {
      e.stopPropagation();
      const was = h.getAttribute("aria-expanded") === "true";
      closeTip();
      if (was) return;
      const tool = $(`.tool[data-tool="${h.dataset.tool}"]`);
      const name = tool.querySelector(".tool-name").textContent;
      const brief = tool.querySelector(".tool-brief").textContent;
      const detail = tool.querySelector(".tool-detail").textContent;
      tip.innerHTML = "";
      const b = document.createElement("b"); b.textContent = h.dataset.tool + " · " + name;
      const s = document.createElement("span"); s.textContent = detail;
      tip.append(b, s);
      tip.hidden = false;
      if (matchMedia("(min-width: 1024px)").matches) {
        const br = $("#bench").getBoundingClientRect(), hr = h.getBoundingClientRect();
        const half = tip.offsetWidth / 2;
        const x = Math.min(Math.max(hr.left + hr.width / 2 - br.left, half), br.width - half);
        tip.style.left = x + "px"; tip.style.top = (hr.top - br.top) + "px";
      } else { tip.style.left = ""; tip.style.top = ""; }
      h.setAttribute("aria-expanded", "true");
      tool.classList.add("hl");
    });
  });
  document.addEventListener("click", (e) => { if (!tip.hidden && !e.target.closest(".bench-tip, .hotspot")) closeTip(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !tip.hidden) closeTip(); });

  /* ------------------------------------------------------------------ Progreso de los pasos */
  const steps = $$(".step");
  const progressLabel = $("#progressLabel");
  const progressBar = $("#progressBar");
  function setProgress(n) {
    progressLabel.textContent = "Paso " + n + " de 10";
    progressBar.style.width = n * 10 + "%";
  }
  if ("IntersectionObserver" in window) {
    const vis = new Map();
    const po = new IntersectionObserver((entries) => {
      entries.forEach((en) => vis.set(en.target, en.isIntersecting ? en.intersectionRatio : 0));
      let best = null, max = 0;
      vis.forEach((v, el) => { if (v > max) { max = v; best = el; } });
      if (best) setProgress(Number(best.dataset.step));
    }, { rootMargin: "-25% 0px -45% 0px", threshold: [0, .25, .5, .75, 1] });
    steps.forEach((s) => po.observe(s));
  }

  /* ------------------------------------------------------------------ Cronómetros */
  const tpl = $("#timerTpl");
  const live = $("#live"), liveTime = $("#liveTime"), liveLabel = $("#liveLabel"), liveToggle = $("#liveToggle");
  const liveRing = $(".ring-fg", live);
  let audioCtx = null, wakeLock = null, liveTimer = null;
  const baseTitle = document.title;

  function unlockAudio() {
    try {
      if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    } catch (_) {}
  }
  function chime() {
    if (!audioCtx) return;
    try {
      const t0 = audioCtx.currentTime;
      [0, .32, .64].forEach((d, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = i === 2 ? 1046.5 : 880;
        g.gain.setValueAtTime(0.0001, t0 + d);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + d + .02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + .28);
        o.connect(g).connect(audioCtx.destination); o.start(t0 + d); o.stop(t0 + d + .3);
      });
    } catch (_) {}
  }
  async function keepAwake(on) {
    try {
      if (on && "wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (_) { wakeLock = null; }
  }

  class Timer {
    constructor(id, step, label, duration) {
      this.id = id; this.step = step; this.label = label;
      this.duration = duration; this.remaining = duration;
      this.running = false; this.done = false; this.deadline = 0; this.iv = 0;
      this.els = new Set();
    }
    get touched() { return this.running || this.done || this.remaining !== this.duration; }
    start() {
      unlockAudio();
      if (this.running) return;
      if (this.remaining <= 0 || this.done) { this.remaining = this.duration; this.done = false; }
      this.running = true;
      this.deadline = Date.now() + this.remaining * 1000;
      clearInterval(this.iv);
      this.iv = setInterval(() => this.tick(), 250);
      liveTimer = this;
      keepAwake(true);
      announce(this.label + ": cronómetro iniciado, " + fmt(this.remaining) + ".");
      this.tick();
    }
    pause() {
      if (!this.running) return;
      this.remaining = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
      this.running = false; clearInterval(this.iv);
      if (!anyRunning()) keepAwake(false);
      announce(this.label + ": en pausa, quedan " + fmt(this.remaining) + ".");
      this.render();
    }
    reset(silent) {
      this.running = false; this.done = false; clearInterval(this.iv);
      this.remaining = this.duration;
      if (!anyRunning()) keepAwake(false);
      if (!silent) announce(this.label + ": reiniciado a " + fmt(this.duration) + ".");
      this.render();
    }
    setDuration(s) {
      if (this.running) return;
      this.duration = s; this.remaining = s; this.done = false;
      this.render();
    }
    tick() {
      if (!this.running) return;
      this.remaining = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
      if (this.remaining <= 0) {
        this.running = false; this.done = true; clearInterval(this.iv);
        if (!anyRunning()) keepAwake(false);
        try { navigator.vibrate && navigator.vibrate([220, 120, 220, 120, 320]); } catch (_) {}
        chime();
        announce(this.label + ": ¡tiempo cumplido!");
      }
      this.render();
    }
    render() {
      const frac = this.duration ? this.remaining / this.duration : 0;
      this.els.forEach((el) => {
        el.classList.toggle("running", this.running);
        el.classList.toggle("done", this.done);
        $("[data-display]", el).textContent = this.done ? "¡Listo!" : fmt(this.remaining);
        $(".ring-fg", el).style.strokeDashoffset = String(100 - (this.done ? 100 : frac * 100));
        $(".t-start", el).hidden = this.running;
        $(".t-pause", el).hidden = !this.running;
        $$(".t-choice button", el).forEach((b) => {
          b.setAttribute("aria-checked", String(Number(b.dataset.set) === this.duration));
          b.disabled = this.running;
        });
      });
      renderLive();
    }
  }
  const timers = {
    t3: new Timer("t3", 3, "Paso 3", 120),
    t8: new Timer("t8", 8, "Paso 8", 240)
  };
  const anyRunning = () => Object.values(timers).some((t) => t.running);

  function bindTimer(el, timer) {
    el.innerHTML = "";
    el.appendChild(tpl.content.cloneNode(true));
    el.dataset.timer = timer.id;
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", timer.id === "t3" ? "Cronómetro de apoyo del paso 3: 2 minutos" : "Cronómetro de apoyo del paso 8: 4 o 5 minutos");
    const choice = $(".t-choice", el);
    if (timer.id === "t8") choice.hidden = false; else choice.remove();
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.set) { timer.setDuration(Number(b.dataset.set)); return; }
      if (b.dataset.act === "start") timer.start();
      else if (b.dataset.act === "pause") timer.pause();
      else if (b.dataset.act === "reset") timer.reset();
      if (b.dataset.act === "start") { const p = $(".t-pause", el); requestAnimationFrame(() => p && !p.hidden && p.focus()); }
      if (b.dataset.act === "pause") { const s = $(".t-start", el); requestAnimationFrame(() => s && s.focus()); }
    });
    timer.els.add(el);
    timer.render();
  }
  $$(".timer-compact").forEach((el) => bindTimer(el, timers[el.dataset.timer]));

  function renderLive() {
    const t = liveTimer;
    if (!t || !t.touched) { live.hidden = true; document.title = baseTitle; return; }
    live.hidden = false;
    live.classList.toggle("done", t.done);
    liveLabel.textContent = t.done ? t.label + " · ¡Listo!" : t.label;
    liveTime.textContent = t.done ? "00:00" : fmt(t.remaining);
    liveRing.style.strokeDashoffset = String(100 - (t.done ? 100 : (t.remaining / t.duration) * 100));
    liveToggle.hidden = t.done;
    liveToggle.setAttribute("aria-label", t.running ? "Pausar" : "Iniciar");
    liveToggle.querySelector("use").setAttribute("href", t.running ? "#i-pause" : "#i-play");
    document.title = t.done ? "✓ " + t.label + " · Mi café" : (t.running ? fmt(t.remaining) + " · " + t.label + " · Mi café" : baseTitle);
  }
  liveToggle.addEventListener("click", () => { const t = liveTimer; if (!t) return; t.running ? t.pause() : t.start(); });
  $("#liveClose").addEventListener("click", () => { const t = liveTimer; if (!t) return; t.reset(true); liveTimer = null; renderLive(); });
  $("#liveOpen").addEventListener("click", () => { if (liveTimer) openSheet(liveTimer.step, { focusTimer: true }); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    Object.values(timers).forEach((t) => t.running && t.tick());
    if (anyRunning()) keepAwake(true);
  });

  /* ------------------------------------------------------------------ Hoja de detalle */
  const sheet = $("#sheet");
  const sheetVideo = $("#sheetVideo");
  const sheetContent = $("#sheetContent");
  const sheetBody = $("#sheetBody");
  const sheetTimer = $("#sheetTimer");
  const sheetDots = $("#sheetDots");
  const prevBtn = $("#prevStep"), nextBtn = $("#nextStep");
  let current = 0;
  let sheetTimerEl = null;

  for (let i = 1; i <= 10; i++) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button"; b.textContent = i; b.dataset.go = i;
    b.setAttribute("aria-label", "Paso " + i);
    li.appendChild(b); sheetDots.appendChild(li);
  }
  sheetDots.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) showStep(Number(b.dataset.go), { dir: Number(b.dataset.go) > current ? 1 : -1 }); });

  const stepEl = (n) => document.getElementById("paso-" + n);
  const titleOf = (n) => $(".step-title", stepEl(n)).textContent;

  function fillStep(n) {
    const el = stepEl(n);
    const two = pad(n);
    $("#sheetKicker").textContent = "Paso " + two + " de 10";
    $("#sheetTitle").textContent = titleOf(n);
    // Recordatorio rápido
    const remind = $("#sheetRemind");
    remind.innerHTML = "";
    $$(".remind > li", el).forEach((li) => { const c = li.cloneNode(true); remind.appendChild(c); });
    // Explicación completa
    sheetBody.innerHTML = "";
    const full = $(".full-content", el).cloneNode(true);
    sheetBody.appendChild(full);
    // Utensilios y tiempo
    const meta = $("#sheetMeta"); meta.innerHTML = "";
    const uses = (el.dataset.uses || "").split("|").filter(Boolean);
    if (uses.length) {
      const b = document.createElement("b"); b.textContent = "Utensilios:"; meta.appendChild(b);
      uses.forEach((u) => { const s = document.createElement("span"); s.textContent = u; meta.appendChild(s); });
    }
    if (el.dataset.when && el.dataset.when !== "—") {
      const b = document.createElement("b"); b.textContent = " Tiempo:"; meta.appendChild(b);
      const s = document.createElement("span"); s.textContent = el.dataset.when; meta.appendChild(s);
    }
    // Cronómetro (pasos 3 y 8)
    if (sheetTimerEl) { Object.values(timers).forEach((t) => t.els.delete(sheetTimerEl)); sheetTimerEl = null; }
    sheetTimer.innerHTML = "";
    const tid = el.dataset.timerId;
    if (tid) {
      sheetTimerEl = document.createElement("div");
      sheetTimerEl.className = "timer";
      sheetTimer.appendChild(sheetTimerEl);
      bindTimer(sheetTimerEl, timers[tid]);
    }
    // Video (MP4 local, se carga solo al abrir)
    sheetVideo.pause();
    const mv = el.dataset.v ? "?v=" + el.dataset.v : "";
    sheetVideo.poster = "img/paso-" + n + ".webp" + mv;
    sheetVideo.src = "videos/coffee" + n + ".mp4" + mv;
    sheetVideo.setAttribute("aria-label", "Video del paso " + n + ": " + titleOf(n));
    $("#sheetYt").href = "https://youtube.com/shorts/" + el.dataset.yt;
    // Navegación
    prevBtn.disabled = n === 1; nextBtn.disabled = n === 10;
    $("#prevTitle").textContent = n > 1 ? titleOf(n - 1) : "—";
    $("#nextTitle").textContent = n < 10 ? titleOf(n + 1) : "—";
    $$("[data-go]", sheetDots).forEach((b) => { if (Number(b.dataset.go) === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    current = n;
    setProgress(n);
  }

  function showStep(n, opts = {}) {
    if (n < 1 || n > 10 || n === current) return;
    const wasPlaying = !sheetVideo.paused && !sheetVideo.ended;
    fillStep(n);
    sheetContent.scrollTop = 0;
    if (!reduceMotion) {
      sheetContent.style.setProperty("--dir", (opts.dir || 1) * 14 + "px");
      sheetContent.classList.remove("swap"); void sheetContent.offsetWidth; sheetContent.classList.add("swap");
    }
    if (wasPlaying || opts.autoplay) playSafe(sheetVideo);
    if (history.state && history.state.sheet) history.replaceState({ sheet: n }, "", "#paso-" + n);
  }

  function playSafe(v) { try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }

  function openSheet(n, opts = {}) {
    if (sheet.open) { showStep(n, opts); return; }
    closeTip();
    current = 0;
    fillStep(n);
    sheetContent.scrollTop = 0;
    sheet.classList.remove("closing");
    if (typeof sheet.showModal === "function") sheet.showModal(); else sheet.setAttribute("open", "");
    document.body.classList.add("locked");
    if (opts.autoplay) playSafe(sheetVideo);
    else $("#sheetClose").focus({ preventScroll: true });
    if (opts.focusTimer && sheetTimerEl) {
      const btn = $(".t-start:not([hidden]), .t-pause:not([hidden])", sheetTimerEl);
      if (btn) setTimeout(() => btn.focus({ preventScroll: true }), 60);
      setTimeout(() => sheetTimer.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }), 80);
    }
    history.pushState({ sheet: n }, "", "#paso-" + n);
  }

  function finishClose() {
    sheet.classList.remove("closing");
    if (sheet.open) { if (typeof sheet.close === "function") sheet.close(); else sheet.removeAttribute("open"); }
    document.body.classList.remove("locked");
    sheetVideo.pause();
    sheetVideo.removeAttribute("src"); sheetVideo.load();
    if (sheetTimerEl) { Object.values(timers).forEach((t) => t.els.delete(sheetTimerEl)); sheetTimerEl = null; }
    const card = stepEl(current);
    if (card) { const s = $("summary", card); s && s.focus({ preventScroll: true }); }
  }
  function closeSheet(fromHistory) {
    if (!sheet.open || sheet.classList.contains("closing")) return;
    if (!fromHistory && history.state && history.state.sheet) { history.back(); return; }
    if (reduceMotion) { finishClose(); return; }
    sheet.classList.add("closing");
    setTimeout(finishClose, 260);
  }
  addEventListener("popstate", () => { if (sheet.open && !(history.state && history.state.sheet)) closeSheet(true); });
  $("#sheetClose").addEventListener("click", () => closeSheet());
  sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  prevBtn.addEventListener("click", () => showStep(current - 1, { dir: -1 }));
  nextBtn.addEventListener("click", () => showStep(current + 1, { dir: 1 }));
  sheet.addEventListener("keydown", (e) => {
    if (e.target.closest("video, button[role='radio']")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); showStep(current + 1, { dir: 1 }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); showStep(current - 1, { dir: -1 }); }
  });

  // Deslizar horizontalmente sobre el contenido para cambiar de paso (táctil)
  let sx = 0, sy = 0, st = 0;
  sheetContent.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); } }, { passive: true });
  sheetContent.addEventListener("touchend", (e) => {
    if (!st) return;
    const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy; st = 0;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && !e.target.closest(".t-choice, .sheet-dots")) showStep(current + (dx < 0 ? 1 : -1), { dir: dx < 0 ? 1 : -1 });
  }, { passive: true });

  // Tarjetas: miniatura = reproducir; "Ver explicación completa" = hoja
  steps.forEach((el) => {
    const n = Number(el.dataset.step);
    $("[data-play]", el).addEventListener("click", (e) => { e.preventDefault(); openSheet(n, { autoplay: true }); });
    $(".full summary", el).addEventListener("click", (e) => { e.preventDefault(); openSheet(n); });
  });
  $$("[data-open]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openSheet(Number(a.dataset.open)); }));

  /* ------------------------------------------------------------------ Video completo */
  const player = $("#player"), playerVideo = $("#playerVideo");
  function openPlayer() {
    closeTip();
    playerVideo.src = "videos/coffee-completo.mp4";
    if (typeof player.showModal === "function") player.showModal(); else player.setAttribute("open", "");
    document.body.classList.add("locked");
    playSafe(playerVideo);
  }
  function closePlayer() {
    playerVideo.pause(); playerVideo.removeAttribute("src"); playerVideo.load();
    if (player.open) { if (typeof player.close === "function") player.close(); else player.removeAttribute("open"); }
    document.body.classList.remove("locked");
  }
  $$("[data-full]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openPlayer(); }));
  $("#playerClose").addEventListener("click", closePlayer);
  player.addEventListener("cancel", (e) => { e.preventDefault(); closePlayer(); });
  player.addEventListener("click", (e) => { if (e.target === player) closePlayer(); });

  /* ------------------------------------------------------------------ PWA */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
})();
