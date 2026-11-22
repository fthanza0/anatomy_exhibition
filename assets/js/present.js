/* Presentation mode controller.
   Keys: → / Space / PageDown next · ← / PageUp back · Home / End · F full screen · K auto-play (kiosk) · Esc exit full screen.
   Presentation clickers send PageUp/PageDown, so they work out of the box.
   Open present.html?kiosk to start looping on its own (for when nobody is at the table). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const T = window.TwoCells || {};
  const slides = $$(".slide");
  const bar = $(".progress i"), counter = $(".counter");
  const kioskBtn = $("#kiosk"), fsBtn = $("#fs");
  let cur = 0, kiosk = false, kTimer = null, organTimer = null;

  /* ---------- Per-slide behaviour ---------- */
  const organs = $$(".p-organs li");
  const tract = $("#tract");
  function showOrgan(i) {
    organs.forEach((li, k) => li.classList.toggle("on", k === i));
    const part = organs[i] && organs[i].dataset.part;
    tract.classList.toggle("has-active", !!part);
    $$(".part", tract).forEach((g) => g.classList.toggle("on", g.dataset.part === part));
  }
  let organIdx = 0;

  const hooks = {
    organs: {
      enter() {
        organIdx = 0; showOrgan(0);
        organTimer = setInterval(() => showOrgan((organIdx = (organIdx + 1) % organs.length)), 3500);
      },
      leave() { clearInterval(organTimer); },
      duration: 21000,
    },
    cycle: {
      enter() { if (T.cycle) { T.cycle.setDay(1); T.cycle.start(T.reduceMotion ? 1200 : 650); } },
      leave() { if (T.cycle) T.cycle.stop(); },
      duration: 20000,
    },
  };

  /* ---------- Step reveal ---------- */
  const steps = (s) => $$("[data-step]", s);
  const hidden = (s) => steps(s).filter((e) => !e.classList.contains("shown"));
  function resetSteps(s, all) {
    steps(s).forEach((e) => e.classList.toggle("shown", !!all));
  }

  /* ---------- Navigation ---------- */
  function go(i, { fromEnd = false } = {}) {
    i = (i + slides.length) % slides.length;
    const prev = slides[cur], next = slides[i];
    if (prev !== next) {
      const h = hooks[prev.dataset.hook]; if (h) h.leave();
    }
    slides.forEach((s, k) => {
      s.classList.toggle("on", k === i);
      s.classList.toggle("past", k < i);
      s.setAttribute("aria-hidden", k !== i);
      s.inert = k !== i;
    });
    // Coming back shows everything; going forward reveals step by step.
    resetSteps(next, fromEnd);
    if (prev !== next || !next.dataset.entered) {
      const h = hooks[next.dataset.hook]; if (h) h.enter();
      next.dataset.entered = "1";
      if (prev !== next) delete prev.dataset.entered;
    }
    cur = i;
    bar.style.width = ((i + 1) / slides.length) * 100 + "%";
    counter.textContent = `${i + 1} / ${slides.length}`;
    history.replaceState(null, "", `#${i + 1}`);
    if (kiosk) scheduleKiosk();
  }
  function next() {
    const h = hidden(slides[cur]);
    if (h.length) { h[0].classList.add("shown"); if (kiosk) scheduleKiosk(); return; }
    go(cur + 1);
  }
  function back() {
    const s = slides[cur], shown = steps(s).filter((e) => e.classList.contains("shown"));
    if (shown.length && shown.length < steps(s).length) { shown[shown.length - 1].classList.remove("shown"); return; }
    go(cur - 1, { fromEnd: true });
  }

  /* ---------- Kiosk (auto-play) ---------- */
  function scheduleKiosk() {
    clearTimeout(kTimer);
    const s = slides[cur], h = hooks[s.dataset.hook];
    const pending = hidden(s).length;
    const wait = pending ? 2800 : h && h.duration ? h.duration : +(s.dataset.duration || 9000);
    kTimer = setTimeout(next, wait);
  }
  function setKiosk(on) {
    kiosk = on;
    document.body.classList.toggle("kiosk", on);
    kioskBtn.setAttribute("aria-pressed", on);
    if (on) scheduleKiosk(); else clearTimeout(kTimer);
  }

  /* ---------- Full screen ---------- */
  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  document.addEventListener("fullscreenchange", () => fsBtn.setAttribute("aria-pressed", !!document.fullscreenElement));

  /* ---------- Input ---------- */
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest(".controls") && (e.key === " " || e.key === "Enter")) return;
    const k = e.key;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); back(); }
    else if (k === "Home") go(0);
    else if (k === "End") go(slides.length - 1, { fromEnd: true });
    else if (k === "f" || k === "F") toggleFs();
    else if (k === "k" || k === "K" || k === "p" || k === "P") setKiosk(!kiosk);
    else return;
    wake();
  });
  $(".stage").addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const r = e.currentTarget.getBoundingClientRect();
    (e.clientX - r.left < r.width * 0.3 ? back : next)();
  });
  let tx = null, ty = null;
  addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : back)();
    tx = null;
  });
  $("#prev").addEventListener("click", back);
  $("#next").addEventListener("click", next);
  kioskBtn.addEventListener("click", () => setKiosk(!kiosk));
  fsBtn.addEventListener("click", toggleFs);

  // Controls appear when the mouse moves, then fade away.
  let uiTimer;
  function wake() {
    document.body.classList.add("show-ui");
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => document.body.classList.remove("show-ui"), 2500);
  }
  addEventListener("mousemove", wake);
  const hint = $(".hint");
  setTimeout(() => hint.classList.add("gone"), 6000);

  /* ---------- QR codes + presenter names ---------- */
  const base = T.siteUrl ? T.siteUrl() : location.href;
  $$(".qr-slot").forEach((slot) => {
    const url = base + (slot.dataset.hash || "");
    if (!T.isPublic) { slot.innerHTML = '<span class="note">QR appears once the site is published</span>'; return; }
    T.qrSvg(url).then((q) => (slot.innerHTML = q.svg)).catch(() => {});
    const out = slot.dataset.urlOut && document.getElementById(slot.dataset.urlOut);
    if (out) out.textContent = url.replace(/^https?:\/\//, "");
  });
  // Names come from the "About this exhibit" list on the main page, so they are edited in one place.
  fetch("index.html").then((r) => r.text()).then((html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = $$(".credits > div", doc)
      .map((d) => [d.querySelector("dt").textContent.trim(), d.querySelector("dd").textContent.trim()])
      .filter(([, v]) => v);
    const who = $("#who");
    if (rows.length && who) {
      who.innerHTML = rows.map(([k, v]) => `${k}: <b></b>`).join("<br>");
      $$("b", who).forEach((b, i) => (b.textContent = rows[i][1]));
    }
  }).catch(() => {});

  /* ---------- Start ---------- */
  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);
  if (new URLSearchParams(location.search).has("kiosk")) setKiosk(true);
})();
