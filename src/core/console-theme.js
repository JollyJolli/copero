export const CONSOLE_THEME = Object.freeze({
  mark: 'background:linear-gradient(145deg,#fb7185,#be123c);color:#fff;border-radius:7px;padding:5px 9px;font-weight:950;font-size:13px',
  brand: 'background:#18181b;color:#fafafa;border-radius:0 7px 7px 0;padding:5px 10px;font-weight:900;font-size:13px;letter-spacing:.04em',
  version: 'background:#3f0b18;color:#fecdd3;border:1px solid #881337;border-radius:999px;padding:3px 8px;font-weight:900',
  section: 'color:#f43f5e;font-weight:950;font-size:11px;letter-spacing:.12em',
  title: 'color:#fafafa;font-weight:900;font-size:14px',
  text: 'color:#d4d4d8;font-weight:600',
  muted: 'color:#8e8e99;font-weight:500',
  command: 'color:#7dd3fc;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:750',
  success: 'background:#064e3b;color:#d1fae5;border-radius:5px;padding:2px 7px;font-weight:900',
  info: 'background:#0c4a6e;color:#e0f2fe;border-radius:5px;padding:2px 7px;font-weight:900',
  warning: 'background:#78350f;color:#fef3c7;border-radius:5px;padding:2px 7px;font-weight:900',
  error: 'background:#881337;color:#ffe4e6;border-radius:5px;padding:2px 7px;font-weight:900',
  debug: 'background:#4c1d95;color:#ede9fe;border-radius:5px;padding:2px 7px;font-weight:900',
  chip: 'background:#27272a;color:#d4d4d8;border-radius:4px;padding:2px 6px;font-weight:800',
  danger: 'color:#fb7185;font-weight:900'
});

export function consoleBrand(version, collapsed = false) {
  console[collapsed ? 'groupCollapsed' : 'group'](`%c C %c COPERO CAREER EDITOR %c ${version} `, CONSOLE_THEME.mark, CONSOLE_THEME.brand, CONSOLE_THEME.version);
}

export function consoleSection(label) {
  console.log(`\n%c${label.toUpperCase()}`, CONSOLE_THEME.section);
}
