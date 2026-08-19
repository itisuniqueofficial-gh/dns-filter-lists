/**
 * Minimal logging helpers. No dependencies. Colors auto-disable when not a TTY
 * or when NO_COLOR is set (https://no-color.org).
 */
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

const c = (code, s) => (useColor ? `\u001b[${code}m${s}\u001b[0m` : s);

export const color = {
  red: (s) => c("31", s),
  green: (s) => c("32", s),
  yellow: (s) => c("33", s),
  blue: (s) => c("34", s),
  gray: (s) => c("90", s),
  bold: (s) => c("1", s),
};

export function info(msg) {
  console.log(msg);
}
export function step(msg) {
  console.log(color.bold(color.blue("▶ ")) + msg);
}
export function ok(msg) {
  console.log(color.green("✓ ") + msg);
}
export function warn(msg) {
  console.warn(color.yellow("⚠ ") + msg);
}
export function err(msg) {
  console.error(color.red("✗ ") + msg);
}

/** Format an integer with thousands separators. */
export function fmt(n) {
  return Number(n).toLocaleString("en-US");
}
