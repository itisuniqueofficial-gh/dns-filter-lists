/**
 * filter.js — client-side filtering for the Lists table. Progressive
 * enhancement: without JS the full table is shown.
 */
const input = document.getElementById("list-filter");
const table = document.getElementById("lists-table");
const empty = document.getElementById("lists-empty");

if (input && table) {
  const rows = Array.from(table.tBodies[0].rows);

  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    for (const row of rows) {
      const hay = row.getAttribute("data-name") || row.textContent.toLowerCase();
      const match = q === "" || hay.includes(q);
      row.hidden = !match;
      if (match) visible++;
    }
    if (empty) empty.hidden = visible !== 0;
  };

  input.addEventListener("input", apply);
  apply();
}
