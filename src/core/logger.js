import { CONSOLE_THEME as T, consoleBrand } from './console-theme.js';

const LEVELS = Object.freeze({
  success: { icon:'✓', label:'LISTO', style:T.success, method:'log' },
  info: { icon:'i', label:'INFO', style:T.info, method:'log' },
  warning: { icon:'!', label:'AVISO', style:T.warning, method:'warn' },
  error: { icon:'×', label:'ERROR', style:T.error, method:'error' },
  debug: { icon:'◆', label:'DEBUG', style:T.debug, method:'debug' }
});

const AUTHORSHIP_BYTES = Object.freeze([50,63,57,50,53,122,57,53,52,122,102,105,122,42,53,40,122,16,53,54,54,35]);
const revealAuthorship = () => String.fromCharCode(...AUTHORSHIP_BYTES.map(value => value ^ 90));

export function emitInstallSignature() {
  const signature = revealAuthorship();
  console.log(`%c${signature}`, 'color:#71717a;font-weight:750;font-style:italic;font-size:10px');
  return signature;
}

export class Logger {
  constructor(config) { this.config = config; }
  get name() { return this.config.prefix.replace(/\.+$/, ''); }
  print(level, message, value = '') {
    const meta = LEVELS[level] ?? LEVELS.info;
    console[meta.method](`%c CEE %c ${meta.icon} ${meta.label} %c ${message}`, 'background:#18181b;color:#f4f4f5;border-radius:5px 0 0 5px;padding:2px 7px;font-weight:900', meta.style, T.text);
    if (value !== '' && value !== undefined) console.log('%c   ↳', 'color:#52525b;font-weight:900', value);
  }
  welcome() {
    consoleBrand(this.config.version);
    console.log('%cOFICIAL 1 · NEON EDITION', T.section);
    console.log('%cEditor conectado a la partida actual. Los cambios permanecen en esta pestaña.', T.muted);
    console.log('\n%c ● ACTIVO %c API %c ' + this.config.prefix, T.success, T.chip, T.command);
    console.log('%c   ABRIR PANEL  %c' + `${this.config.prefix}panel()`, T.muted, T.command);
    console.log('%c   VER COMANDOS %c' + `${this.config.prefix}help`, T.muted, T.command);
    console.log('%c   CREAR BACKUP %c' + `${this.config.prefix}backup("antes")`, T.muted, T.command);
    console.log('%c   DECISIÓN BUENA %c' + `${this.config.prefix}decisions.good()`, T.muted, T.command);
    console.groupEnd();
  }
  success(message, value = '') { this.print('success', message, value); }
  info(message, value = '') { this.print('info', message, value); }
  warning(message, value = '') { this.print('warning', message, value); }
  error(message, error = '') { this.print('error', message, error); }
  debug(message, value = '') { if (this.config.debug) this.print('debug', message, value); }
  group(label, collapsed = false) {
    console[collapsed ? 'groupCollapsed' : 'group'](`%c CEE %c ${label}`, T.mark, 'color:#fafafa;font-weight:850');
  }
}
