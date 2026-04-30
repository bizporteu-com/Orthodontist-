// Sticky header shadow
const header = document.getElementById("siteHeader");
const onScroll = () => {
  if (window.scrollY > 8) header.classList.add("is-scrolled");
  else header.classList.remove("is-scrolled");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Reveal-on-scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Mobile menu
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

// Form handling — graceful no-op until backend is wired
const form = document.querySelector(".contact__form");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const button = form.querySelector("button[type=submit]");
  const original = button.textContent;
  button.textContent = "Thank You — We'll Be In Touch";
  button.disabled = true;
  form.reset();
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 4000);
});

// Year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
