export class Logger {
  constructor(config) { this.config = config; this.tag = `[${config.prefix.replace(/\.+$/, '')}]`; }
  success(message, value = '') { console.log(`%c${this.tag} ${message}`, 'color:#22c55e;font-weight:700', value); }
  info(message, value = '') { console.info(this.tag, message, value); }
  warning(message, value = '') { console.warn(this.tag, message, value); }
  error(message, error = '') { console.error(this.tag, message, error); }
  debug(message, value = '') { if (this.config.debug) console.debug(this.tag, message, value); }
  group(label, collapsed = false) { console[collapsed ? 'groupCollapsed' : 'group'](`${this.tag} ${label}`); }
}
