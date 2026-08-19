/**
 * icons.js — Font Awesome (self-hosted) icon helper.
 *
 * The project self-hosts Font Awesome 6 Free (CSS + webfonts under
 * /assets/fontawesome/) so there are zero third-party requests and the strict
 * same-origin Content-Security-Policy is preserved.
 *
 * Icons are sized with `font-size` via CSS on their context (a Font Awesome
 * glyph is 1em), so we never emit inline styles (which the CSP would block).
 * A single coherent family is used: `fa-solid` for UI icons and `fa-brands`
 * for GitHub.
 */

/** semantic name -> [style, faName]. Keeps call sites stable and meaningful. */
const MAP = {
  // Category icons
  "share-nodes": ["solid", "share-nodes"],
  "triangle-exclamation": ["solid", "triangle-exclamation"],
  "rectangle-ad": ["solid", "rectangle-ad"],
  eye: ["solid", "eye"],
  bug: ["solid", "bug"],
  fish: ["solid", "fish"],
  "layer-group": ["solid", "layer-group"],
  "user-lock": ["solid", "user-lock"],
  dice: ["solid", "dice"],
  play: ["solid", "play"],
  gamepad: ["solid", "gamepad"],
  bitcoin: ["brands", "bitcoin"],
  "cart-shopping": ["solid", "cart-shopping"],
  heart: ["solid", "heart"],
  envelope: ["solid", "envelope"],
  comments: ["solid", "comments"],
  "comment-dots": ["solid", "comment-dots"],
  newspaper: ["solid", "newspaper"],
  "wand-magic-sparkles": ["solid", "wand-magic-sparkles"],
  "chart-line": ["solid", "chart-line"],
  "wave-square": ["solid", "wave-square"],
  "cookie-bite": ["solid", "cookie-bite"],
  link: ["solid", "link"],
  "arrow-right-arrow-left": ["solid", "arrow-right-arrow-left"],
  "shield-halved": ["solid", "shield-halved"],
  server: ["solid", "server"],
  "graduation-cap": ["solid", "graduation-cap"],
  coins: ["solid", "coins"],
  "building-columns": ["solid", "building-columns"],
  "heart-pulse": ["solid", "heart-pulse"],
  toolbox: ["solid", "toolbox"],

  // UI / actions
  copy: ["solid", "copy"],
  check: ["solid", "check"],
  download: ["solid", "download"],
  external: ["solid", "arrow-up-right-from-square"],
  search: ["solid", "magnifying-glass"],
  menu: ["solid", "bars"],
  close: ["solid", "xmark"],
  arrow: ["solid", "arrow-right"],
  "arrow-left": ["solid", "arrow-left"],
  "chevron-right": ["solid", "chevron-right"],
  book: ["solid", "book"],
  code: ["solid", "code"],
  shield: ["solid", "shield-halved"],
  bolt: ["solid", "bolt"],
  cloud: ["solid", "cloud"],
  users: ["solid", "users"],
  list: ["solid", "list"],
  clock: ["solid", "clock"],
  file: ["solid", "file-lines"],
  home: ["solid", "house"],
  globe: ["solid", "globe"],
  folder: ["solid", "folder"],

  // Contribution workflow
  "code-branch": ["solid", "code-branch"],
  "code-fork": ["solid", "code-fork"],
  terminal: ["solid", "terminal"],
  "cloud-arrow-up": ["solid", "cloud-arrow-up"],
  "file-circle-plus": ["solid", "file-circle-plus"],
  "code-pull-request": ["solid", "code-pull-request"],
  robot: ["solid", "robot"],
  "user-check": ["solid", "user-check"],
  "code-merge": ["solid", "code-merge"],
  "circle-exclamation": ["solid", "circle-exclamation"],
  "circle-info": ["solid", "circle-info"],

  // Brands
  github: ["brands", "github"],
};

/**
 * Return a Font Awesome `<i>` element string.
 * @param {string} name - semantic icon name (see MAP)
 * @param {{ label?: string, className?: string, fixedWidth?: boolean }} [opts]
 *   - label: makes the icon meaningful (role="img" + aria-label)
 *   - className: extra classes on the <i>
 *   - fixedWidth: add fa-fw for consistent alignment in lists/menus
 */
export function icon(name, opts = {}) {
  const entry = MAP[name];
  if (!entry) return "";
  const [style, fa] = entry;
  const classes = [`fa-${style}`, `fa-${fa}`];
  if (opts.fixedWidth) classes.push("fa-fw");
  if (opts.className) classes.push(opts.className);
  const a11y = opts.label
    ? ` role="img" aria-label="${opts.label}"`
    : ' aria-hidden="true"';
  return `<i class="${classes.join(" ")}"${a11y}></i>`;
}
