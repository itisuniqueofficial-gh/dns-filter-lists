/**
 * icons.js — inline SVG icons.
 *
 * We inline SVGs instead of loading an icon font (e.g. Font Awesome) so the
 * site ships zero render-blocking third-party requests. All icons use
 * `currentColor` and are 24x24 on a 0 0 24 24 viewBox.
 */

/* Each entry is the inner markup of the <svg>. Stroke-based, 1.75 width. */
const PATHS = {
  "share-nodes":
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  "triangle-exclamation":
    '<path d="M12 3.5 21 19.5H3L12 3.5Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  "rectangle-ad":
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15v-4a1.5 1.5 0 0 1 3 0v4M7 13h3"/><path d="M14 15V9M14 15h1.5a1.5 1.5 0 0 0 0-3H14"/>',
  eye:
    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  bug:
    '<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M12 7V5M9 8 7 6M15 8l2-2M8 12H4M20 12h-4M8 16l-2 2M16 16l2 2"/>',
  fish:
    '<path d="M3 12c3-4 8-5 12-3 2 1 4 3 6 3-2 0-4 2-6 3-4 2-9 1-12-3Z"/><path d="M3 12c-.5 1-.5 3 0 4M16 11h.01"/>',
  "layer-group":
    '<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 16.5l8 4 8-4"/>',
  copy:
    '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download:
    '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  github:
    '<path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.9 3.1 5.9 3.4 5.9 3.4a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.5 9.8c0 4.6 2.7 5.7 5.5 6-.4.4-.5.9-.5 1.6V21"/>',
  external:
    '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  search:
    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 5 5 9-11"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  book:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  shield:
    '<path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  bolt: '<path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/>',
  cloud:
    '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 18 18H7Z"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  file: '<path d="M6 2h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M14 2v4h4"/>',
  home: '<path d="m3 11 9-8 9 8M6 10v10h12V10"/>',
};

/**
 * Return an inline <svg> string for the named icon.
 * @param {string} name
 * @param {{ className?: string, size?: number, label?: string }} [opts]
 */
export function icon(name, opts = {}) {
  const inner = PATHS[name];
  if (!inner) return "";
  const size = opts.size || 20;
  const cls = opts.className ? ` class="${opts.className}"` : "";
  const a11y = opts.label
    ? ` role="img" aria-label="${opts.label}"`
    : ' aria-hidden="true" focusable="false"';
  return (
    `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="1.75" ` +
    `stroke-linecap="round" stroke-linejoin="round"${a11y}>${inner}</svg>`
  );
}
