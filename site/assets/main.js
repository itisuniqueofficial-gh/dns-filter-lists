/**
 * main.js — global behaviour shared by every page.
 *  - accessible mobile navigation (toggle, Escape, click-outside, auto-close)
 *  - copy-to-clipboard buttons with graceful fallback + visible confirmation
 *  - optional live hydration of statistics from /stats.json (never hard-coded)
 *
 * All features degrade gracefully: with JavaScript disabled the site remains
 * fully navigable and every .txt / JSON endpoint is directly reachable.
 */

/* ---------------------------------------------------------- navigation */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      // Move focus to the first link for keyboard users.
      const first = nav.querySelector("a, button");
      if (first) first.focus();
    }
  };

  // Focus trap: while the menu is open, keep Tab within the toggle + nav.
  const focusables = () => [
    toggle,
    ...nav.querySelectorAll("a[href], button:not([disabled])"),
  ];
  nav.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    const items = focusables();
    if (items.length === 0) return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  });

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Close after following a link.
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  // Escape closes and restores focus to the toggle.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  // Click outside closes.
  document.addEventListener("click", (e) => {
    if (
      toggle.getAttribute("aria-expanded") === "true" &&
      !e.target.closest(".site-nav") &&
      !e.target.closest(".nav-toggle")
    ) {
      setOpen(false);
    }
  });

  // Reset when resizing up to desktop.
  const mq = window.matchMedia("(min-width: 821px)");
  mq.addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
}

/* ------------------------------------------------------------- copy */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function initCopy() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const text = btn.getAttribute("data-copy");
    if (!text) return;

    const label = btn.querySelector("span");
    const iconEl = btn.querySelector("i");
    const original = label ? label.textContent : "";
    const ok = await copyText(text);

    btn.classList.add("copied");
    if (label) label.textContent = ok ? "Copied" : "Copy failed";
    if (iconEl && ok) {
      iconEl.classList.remove("fa-copy");
      iconEl.classList.add("fa-check");
    }
    btn.setAttribute("aria-live", "polite");

    window.clearTimeout(btn._copyTimer);
    btn._copyTimer = window.setTimeout(() => {
      btn.classList.remove("copied");
      if (label) label.textContent = original;
      if (iconEl && ok) {
        iconEl.classList.remove("fa-check");
        iconEl.classList.add("fa-copy");
      }
    }, 1600);
  });
}

/* ------------------------------------------------------- live stats */
function setStat(key, value) {
  document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => {
    el.textContent = Number(value).toLocaleString("en-US");
  });
}

async function hydrateStats() {
  if (!document.querySelector("[data-stat]")) return;
  try {
    const res = await fetch("/stats.json", { cache: "no-cache" });
    if (!res.ok) return;
    const s = await res.json();
    setStat("totals.domains", s.totals.domains);
    setStat("totals.categories", s.totals.categories);
    setStat("totals.files", s.totals.files);
    setStat("totals.contributors", s.totals.contributors);
  } catch {
    /* Static HTML already contains correct build-time values. */
  }
}

initNav();
initCopy();
hydrateStats();
