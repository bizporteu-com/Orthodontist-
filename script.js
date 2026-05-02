/* ================================================================
   Smile by Medi — interactions, animations, scroll showcase, cursor
   ================================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// --- Page-load curtain ---
window.addEventListener("load", () => {
  setTimeout(() => document.body.classList.remove("is-loading"), 350);
});
setTimeout(() => document.body.classList.remove("is-loading"), 2500);

// --- Sticky header shadow + active section in nav ---
const header = document.getElementById("siteHeader");
const navLinks = Array.from(document.querySelectorAll(".nav a[href^='#']"));
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

function updateHeader() {
  if (!header) return;
  if (window.scrollY > 8) header.classList.add("is-scrolled");
  else header.classList.remove("is-scrolled");

  // Active section highlight
  const y = window.scrollY + 140;
  let activeId = null;
  for (const s of sections) {
    if (s.offsetTop <= y) activeId = s.id;
  }
  navLinks.forEach((a) => {
    const href = a.getAttribute("href").slice(1);
    a.classList.toggle("is-active", href === activeId);
  });
}
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// --- Custom cursor with lerp + magnetic targets ---
(function initCursor() {
  if (!isFinePointer || reduceMotion) return;
  const dot = document.querySelector(".cursor");
  const ring = document.querySelector(".cursor__ring");
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let dx = mx, dy = my;
  let rx = mx, ry = my;

  window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
  window.addEventListener("mouseleave", () => { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); });
  window.addEventListener("mouseenter", () => { dot.classList.remove("is-hidden"); ring.classList.remove("is-hidden"); });

  const tick = () => {
    dx += (mx - dx) * 0.55;
    dy += (my - dy) * 0.55;
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  tick();

  // Hover-grow on interactive targets
  const hoverables = "a, button, input, textarea, select, label, [data-magnetic]";
  document.querySelectorAll(hoverables).forEach((el) => {
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

// --- Magnetic buttons ---
(function initMagnetic() {
  if (!isFinePointer || reduceMotion) return;
  const els = document.querySelectorAll("[data-magnetic]");
  els.forEach((el) => {
    let raf = null;
    let active = false;
    const strength = 0.25;
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      active = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
    });
    el.addEventListener("mouseleave", () => {
      active = false;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = "";
      });
    });
  });
})();

// --- Split words for headings ---
function splitHeading(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = "1";
  const walk = (node, parent) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        const parts = text.split(/(\s+)/);
        parts.forEach((part) => {
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

// --- Count-up numbers ---
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
function runCountUp(el) {
  const target = parseInt(el.dataset.countTo, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1800;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const value = Math.round(target * easeOutCubic(t));
    el.textContent = value + suffix;
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

// --- Parallax ---
const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
let parallaxTicking = false;
function updateParallax() {
  const vh = window.innerHeight;
  parallaxEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;
    const speed = parseFloat(el.dataset.parallax) || 0.05;
    const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
    el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });
  parallaxTicking = false;
}
function requestParallax() {
  if (!parallaxTicking) {
    requestAnimationFrame(updateParallax);
    parallaxTicking = true;
  }
}
if (parallaxEls.length && !reduceMotion) {
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  updateParallax();
}

// --- Service showcase: scroll-driven device rotation + segment switching ---
(function initShowcase() {
  if (reduceMotion) return;
  const stage = document.querySelector("[data-showcase]");
  if (!stage) return;

  const sticky = stage.querySelector(".showcase__sticky");
  const items = Array.from(stage.querySelectorAll("[data-item]"));
  const devices = Array.from(stage.querySelectorAll("[data-device]"));
  const navButtons = Array.from(stage.querySelectorAll(".showcase__nav button"));
  const progressBar = stage.querySelector(".showcase__progress-bar");
  const total = items.length;

  function setActive(idx) {
    items.forEach((el, i) => el.classList.toggle("is-active", i === idx));
    devices.forEach((el, i) => el.classList.toggle("is-active", i === idx));
    navButtons.forEach((b, i) => b.classList.toggle("is-active", i === idx));
  }

  // Click navigation
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.go, 10);
      const rect = stage.getBoundingClientRect();
      const stageTop = window.scrollY + rect.top;
      const stageHeight = stage.offsetHeight - window.innerHeight;
      const target = stageTop + (idx / (total - 1)) * stageHeight + 20;
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  });

  let ticking = false;
  function update() {
    const rect = stage.getBoundingClientRect();
    const stageHeight = stage.offsetHeight - window.innerHeight;
    if (stageHeight <= 0) { ticking = false; return; }

    // 0 .. 1 progress through the showcase
    const progress = Math.min(1, Math.max(0, -rect.top / stageHeight));

    // active segment
    const seg = Math.min(total - 1, Math.floor(progress * total * 0.999));
    setActive(seg);

    // progress bar
    if (progressBar) progressBar.style.width = (progress * 100).toFixed(2) + "%";

    // local progress within segment 0..1
    const segProgress = (progress * total) - seg;

    // 3D rotation tied to segment progress
    const activeDevice = devices[seg];
    if (activeDevice) {
      const svg = activeDevice.querySelector("svg");
      if (svg) {
        const rotY = -22 + segProgress * 44;        // -22 → +22deg
        const rotX = -8 + Math.sin(progress * Math.PI) * 4;
        const tilt = (segProgress - 0.5) * 4;       // subtle Z tilt
        svg.style.transform =
          `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${tilt.toFixed(2)}deg)`;
      }
    }

    ticking = false;
  }
  function request() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
})();

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

// --- Prices page nav scroll-spy ---
(function initPricesNav() {
  const nav = document.querySelector(".prices__nav");
  if (!nav) return;
  const links = Array.from(nav.querySelectorAll("a[href^='#']"));
  const targets = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  function spy() {
    const y = window.scrollY + 160;
    let active = null;
    targets.forEach((t) => { if (t.offsetTop <= y) active = t.id; });
    links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + active));
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();
})();

// --- Year ---
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
