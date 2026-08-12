export const CONSOLE_THEME = Object.freeze({
  mark: 'background:linear-gradient(145deg,#00baba,#006b6b);color:#fff;border-radius:7px;padding:5px 9px;font-weight:950;font-size:13px',
  brand: 'background:#020808;color:#efffff;border-radius:0 7px 7px 0;padding:5px 10px;font-weight:900;font-size:13px;letter-spacing:.04em',
  version: 'background:#001b1b;color:#78ffff;border:1px solid #009797;border-radius:999px;padding:3px 8px;font-weight:900',
  section: 'color:#00dada;font-weight:950;font-size:11px;letter-spacing:.12em',
  title: 'color:#efffff;font-weight:900;font-size:14px',
  text: 'color:#c8eaea;font-weight:600',
  muted: 'color:#739999;font-weight:500',
  command: 'color:#54eeee;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:750',
  success: 'background:#004747;color:#dfffff;border-radius:5px;padding:2px 7px;font-weight:900',
  info: 'background:#003535;color:#cfffff;border-radius:5px;padding:2px 7px;font-weight:900',
  warning: 'background:#063535;color:#bfffff;border-radius:5px;padding:2px 7px;font-weight:900',
  error: 'background:#061919;color:#efffff;border:1px solid #009797;border-radius:5px;padding:2px 7px;font-weight:900',
  debug: 'background:#003030;color:#cfffff;border-radius:5px;padding:2px 7px;font-weight:900',
  chip: 'background:#082020;color:#bfeeee;border-radius:4px;padding:2px 6px;font-weight:800',
  danger: 'color:#00dada;font-weight:900'
});

export function consoleBrand(version, collapsed = false) {
  console[collapsed ? 'groupCollapsed' : 'group'](`%c C %c COPERO CAREER EDITOR %c ${version} `, CONSOLE_THEME.mark, CONSOLE_THEME.brand, CONSOLE_THEME.version);
}

export function consoleSection(label) {
  console.log(`\n%c${label.toUpperCase()}`, CONSOLE_THEME.section);
}
