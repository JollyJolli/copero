export function normalizeError(value) {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try { return new Error(JSON.stringify(value)); } catch { return new Error(String(value)); }
}

function likelyCause(error, phase) {
  const message = error.message.toLowerCase();
  if (message.includes('read only property') || message.includes('readonly')) return 'Una propiedad protegida del navegador entró en conflicto con la API.';
  if (message.includes('estado react') || message.includes('react')) return 'La partida no está abierta, React está en transición o cambió su estructura interna.';
  if (message.includes('json')) return 'El texto importado no es JSON válido o no contiene una partida compatible.';
  if (message.includes('club') || message.includes('oferta')) return 'El club no fue verificado o el evento no contiene una plantilla compatible.';
  if (phase === 'install') return 'La API no pudo construirse. Puede ser una versión antigua en caché o una incompatibilidad.';
  return 'El comando recibió datos inválidos o el estado cambió mientras se ejecutaba.';
}

export class ErrorHandler {
  constructor(config, runtime) { this.config = config; this.runtime = runtime; }
  capture(value, details = {}) {
    const error = normalizeError(value);
    const report = { id: `CEE-${Date.now().toString(36).toUpperCase()}`, editorVersion: this.config.version, phase: details.phase ?? 'command', command: details.command ?? null, message: error.message, likelyCause: likelyCause(error, details.phase), recovery: details.recovery ?? [`${this.config.prefix}diagnose()`, `${this.config.prefix}refresh()`, 'Recarga la página y ejecuta de nuevo el loader.'], timestamp: new Date().toISOString(), stack: this.config.debug ? error.stack : undefined };
    this.runtime.lastError = report;
    console.group(`%c[${this.config.prefix.replace(/\.+$/, '')}] Error ${report.id}`, 'color:#ef4444;font-weight:900');
    console.error('Qué falló:', report.command ? `Comando ${report.command}` : 'Instalación del editor');
    console.error('Mensaje:', report.message); console.warn('Causa probable:', report.likelyCause); console.info('Cómo recuperarte:');
    for (const step of report.recovery) console.info(`• ${step}`);
    if (report.stack) console.debug(report.stack); console.groupEnd(); return report;
  }
  guard(command, action) { try { return action(); } catch (error) { this.capture(error, { phase: 'command', command }); return undefined; } }
}

export function installFailureApi(globalObject, globalName, config, report) {
  const api = { __coperoCareerEditor: true, installationFailed: true, version: config.version, prefix: config.prefix, error: report, diagnose() { console.table(report); return report; }, destroy() { try { delete globalObject[globalName]; } catch { globalObject[globalName] = undefined; } return true; } };
  try { Object.defineProperty(globalObject, globalName, { value: api, configurable: true, writable: true }); } catch { globalObject[globalName] = api; }
  return api;
}
