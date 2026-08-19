/**
 * contribute.js — client-side filter for the "Submit a domain" category grid.
 * Progressive enhancement: without JS all category buttons are shown.
 */
const input = document.getElementById("cat-filter");
const grid = document.getElementById("cat-btn-grid");
const empty = document.getElementById("cat-empty");

if (input && grid) {
  const items = Array.from(grid.children);
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    for (const el of items) {
      const hay = el.getAttribute("data-name") || el.textContent.toLowerCase();
      const match = q === "" || hay.includes(q);
      el.hidden = !match;
      if (match) visible++;
    }
    if (empty) empty.hidden = visible !== 0;
  };
  input.addEventListener("input", apply);
  apply();
}
