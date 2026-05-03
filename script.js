/* ================================================================
   Smile by Medi — interactions, animations, scroll showcase, cursor
   Performance-conscious: single scroll rAF, idle-aware cursor,
   off-screen animation pausing.
   ================================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// --- Page-load curtain (also remove from layer tree once gone) ---
const curtainEl = document.querySelector(".curtain");
function dismissLoading() {
  if (!document.body.classList.contains("is-loading")) return;
  document.body.classList.remove("is-loading");
  // Take it fully out of the compositor after the fade
  setTimeout(() => { if (curtainEl) curtainEl.style.display = "none"; }, 1400);
}
window.addEventListener("load", () => setTimeout(dismissLoading, 300));
setTimeout(dismissLoading, 2200);

// --- Custom cursor: only animate while moving + brief coast ---
(function initCursor() {
  if (!isFinePointer || reduceMotion) return;
  const dot = document.querySelector(".cursor");
  const ring = document.querySelector(".cursor__ring");
  if (!dot || !ring) return;

  let mx = -100, my = -100;
  let dx = mx, dy = my;
  let rx = mx, ry = my;
  let raf = null;
  let lastMoveTs = 0;

  function tick() {
    const dotDist = Math.hypot(mx - dx, my - dy);
    const ringDist = Math.hypot(mx - rx, my - ry);
    dx += (mx - dx) * 0.55;
    dy += (my - dy) * 0.55;
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

    // Sleep once we've coasted to rest and no recent movement
    const idle = performance.now() - lastMoveTs > 200;
    if (idle && dotDist < 0.4 && ringDist < 0.4) {
      raf = null;
    } else {
      raf = requestAnimationFrame(tick);
    }
  }
  function wake() {
    if (raf == null) raf = requestAnimationFrame(tick);
  }

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    lastMoveTs = performance.now();
    wake();
  }, { passive: true });
  window.addEventListener("mouseleave", () => { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); });
  window.addEventListener("mouseenter", () => { dot.classList.remove("is-hidden"); ring.classList.remove("is-hidden"); });

  document.querySelectorAll("a, button, input, textarea, select, label, [data-magnetic]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      dot.classList.add("is-hover");
      ring.classList.add("is-hover");
    });
    el.addEventListener("mouseleave", () => {
      dot.classList.remove("is-hover");
      ring.classList.remove("is-hover");
    });
  });
})();

// --- Magnetic buttons (rAF-throttled) ---
(function initMagnetic() {
  if (!isFinePointer || reduceMotion) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    let raf = null;
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    });
    el.addEventListener("mouseleave", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = ""; });
    });
  });
})();

// --- Split words for headings (one-time DOM walk) ---
function splitHeading(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = "1";
  const walk = (node, parent) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        text.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            parent.appendChild(document.createTextNode(part));
          } else {
            const word = document.createElement("span");
            word.className = "word";
            const inner = document.createElement("span");
            inner.textContent = part;
            word.appendChild(inner);
            parent.appendChild(word);
          }
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === "BR") {
          parent.appendChild(child.cloneNode(true));
        } else {
          const clone = child.cloneNode(false);
          parent.appendChild(clone);
          walk(child, clone);
        }
      }
    });
  };
  const fragment = document.createDocumentFragment();
  const tmp = document.createElement("div");
  walk(el, tmp);
  while (tmp.firstChild) fragment.appendChild(tmp.firstChild);
  el.innerHTML = "";
  el.appendChild(fragment);
}
document.querySelectorAll("[data-split]").forEach(splitHeading);

// --- Reveal on scroll ---
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
);
document
  .querySelectorAll(".reveal, .split-reveal, .stagger, .chapter")
  .forEach((el) => revealObserver.observe(el));

// --- Pause off-screen continuous animations (hero ornaments, marquee) ---
(function initPauseOffscreen() {
  const pausables = document.querySelectorAll(".hero, .marquee");
  if (!pausables.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-paused", !entry.isIntersecting);
      });
    },
    { rootMargin: "100px 0px" }
  );
  pausables.forEach((el) => io.observe(el));
})();

// --- Count-up numbers ---
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
function runCountUp(el) {
  const target = parseInt(el.dataset.countTo, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(target * easeOutCubic(t)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCountUp(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count-to]").forEach((el) => countObserver.observe(el));

// --- Single scroll orchestrator (header + parallax + showcase) ---
const header = document.getElementById("siteHeader");
const navLinks = Array.from(document.querySelectorAll(".nav a[href^='#']"));
const navTargets = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);
const parallaxEls = reduceMotion ? [] : Array.from(document.querySelectorAll("[data-parallax]"));
const showcaseStage = document.querySelector("[data-showcase]");
const showcaseItems = showcaseStage ? Array.from(showcaseStage.querySelectorAll("[data-item]")) : [];
const showcaseDevices = showcaseStage ? Array.from(showcaseStage.querySelectorAll("[data-device]")) : [];
const showcaseNav = showcaseStage ? Array.from(showcaseStage.querySelectorAll(".showcase__nav button")) : [];
const showcaseProgress = showcaseStage ? showcaseStage.querySelector(".showcase__progress-bar") : null;
const showcaseTotal = showcaseItems.length;
let currentSeg = -1;

const pricesNav = document.querySelector(".prices__nav");
const pricesLinks = pricesNav ? Array.from(pricesNav.querySelectorAll("a[href^='#']")) : [];
const pricesTargets = pricesLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

let ticking = false;
function frame() {
  ticking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;

  // Header scrolled state
  if (header) {
    if (y > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }

  // Active section in primary nav
  if (navTargets.length) {
    const probe = y + 140;
    let activeId = null;
    for (const s of navTargets) if (s.offsetTop <= probe) activeId = s.id;
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + activeId);
    });
  }

  // Parallax
  for (const el of parallaxEls) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) continue;
    const speed = parseFloat(el.dataset.parallax) || 0.05;
    const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
    el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  }

  // Showcase
  if (showcaseStage && !reduceMotion) {
    const rect = showcaseStage.getBoundingClientRect();
    const stageHeight = showcaseStage.offsetHeight - vh;
    if (stageHeight > 0 && rect.bottom > 0 && rect.top < vh) {
      const progress = Math.min(1, Math.max(0, -rect.top / stageHeight));
      const seg = Math.min(showcaseTotal - 1, Math.floor(progress * showcaseTotal * 0.999));

      if (seg !== currentSeg) {
        currentSeg = seg;
        showcaseItems.forEach((el, i) => el.classList.toggle("is-active", i === seg));
        showcaseDevices.forEach((el, i) => el.classList.toggle("is-active", i === seg));
        showcaseNav.forEach((b, i) => b.classList.toggle("is-active", i === seg));
      }

      if (showcaseProgress) showcaseProgress.style.width = (progress * 100).toFixed(2) + "%";

      const segProgress = (progress * showcaseTotal) - seg;
      const activeDevice = showcaseDevices[seg];
      if (activeDevice) {
        const svg = activeDevice.querySelector("svg");
        if (svg) {
          const rotY = -22 + segProgress * 44;
          const rotX = -8 + Math.sin(progress * Math.PI) * 4;
          const tilt = (segProgress - 0.5) * 4;
          svg.style.transform =
            `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${tilt.toFixed(2)}deg)`;
        }
      }
    }
  }

  // Prices nav scroll-spy
  if (pricesLinks.length) {
    const probe = y + 160;
    let active = null;
    pricesTargets.forEach((t) => { if (t.offsetTop <= probe) active = t.id; });
    pricesLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + active));
  }
}
function requestFrame() {
  if (!ticking) {
    requestAnimationFrame(frame);
    ticking = true;
  }
}
window.addEventListener("scroll", requestFrame, { passive: true });
window.addEventListener("resize", requestFrame, { passive: true });
frame();

// Showcase nav click-to-jump
showcaseNav.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!showcaseStage) return;
    const idx = parseInt(btn.dataset.go, 10);
    const rect = showcaseStage.getBoundingClientRect();
    const stageTop = window.scrollY + rect.top;
    const stageHeight = showcaseStage.offsetHeight - window.innerHeight;
    const target = stageTop + (idx / Math.max(1, showcaseTotal - 1)) * stageHeight + 20;
    window.scrollTo({ top: target, behavior: "smooth" });
  });
});

// --- Mobile menu ---
const toggle = document.querySelector(".menu-toggle");
toggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".nav a").forEach((link) =>
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  })
);

// --- Form stub ---
const form = document.querySelector(".contact__form");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const button = form.querySelector("button[type=submit]");
  const note = form.querySelector(".form-note");
  const original = button.textContent;
  const originalNote = note?.textContent;
  const thanks = note?.dataset.thanks || "Thank you";
  button.textContent = "✓";
  button.disabled = true;
  if (note) note.textContent = thanks;
  form.reset();
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
    if (note && originalNote) note.textContent = originalNote;
  }, 4500);
});

// --- Year ---
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
