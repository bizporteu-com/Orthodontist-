/* ================================================================
   Smile by Medi — interactions & animations
   ================================================================ */

// --- Page-load curtain ---
window.addEventListener("load", () => {
  // Small delay so the brand mark is briefly visible
  setTimeout(() => document.body.classList.remove("is-loading"), 350);
});
// Failsafe — ensure we never get stuck behind the curtain
setTimeout(() => document.body.classList.remove("is-loading"), 2500);

// --- Sticky header shadow ---
const header = document.getElementById("siteHeader");
const onScroll = () => {
  if (window.scrollY > 8) header.classList.add("is-scrolled");
  else header.classList.remove("is-scrolled");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// --- Split words for headings (preserves <em>, <br>, line breaks) ---
function splitHeading(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = "1";

  const walk = (node, parent) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        const parts = text.split(/(\s+)/); // keep whitespace
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
          // Preserve inline tag (e.g. <em>) — wrap its text content the same way
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

// --- Reveal-on-scroll ---
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
);
document
  .querySelectorAll(".reveal, .split-reveal, .stagger")
  .forEach((el) => observer.observe(el));

// --- Count-up numbers ---
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
function runCountUp(el) {
  const target = parseInt(el.dataset.countTo, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
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

// --- Parallax (cheap, scroll-driven, rAF-throttled) ---
const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
let ticking = false;
function updateParallax() {
  const vh = window.innerHeight;
  parallaxEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;
    const speed = parseFloat(el.dataset.parallax) || 0.05;
    const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
    el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });
  ticking = false;
}
function requestParallax() {
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}
if (parallaxEls.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  updateParallax();
}

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

// --- Form submission stub ---
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
