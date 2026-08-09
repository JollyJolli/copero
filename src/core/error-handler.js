import { CONSOLE_THEME as T } from './console-theme.js';

export function normalizeError(value) {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try { return new Error(JSON.stringify(value)); } catch { return new Error(String(value)); }
}

function likelyCause(error, phase) {
  const message = error.message.toLowerCase();
  if (message.includes('read only property') || message.includes('readonly')) return 'Una propiedad protegida del navegador entró en conflicto con la API.';
  if (message.includes('estado react') || message.includes('react')) return 'La partida no está abierta, React está en transición o Copero cambió su estructura interna.';
  if (message.includes('json')) return 'El texto importado no es JSON válido o no contiene una partida compatible.';
  if (message.includes('club') || message.includes('oferta')) return 'El club no fue verificado o el evento no contiene una plantilla de oferta compatible.';
  if (message.includes('fetch') || message.includes('http')) return 'La conexión falló o GitHub no respondió correctamente.';
  if (phase === 'install') return 'La API no pudo construirse; puede existir una incompatibilidad o una versión antigua en caché.';
  return 'El comando recibió datos inválidos o el estado cambió mientras se ejecutaba.';
}

function printReport(report, prefix) {
  const recovery = Array.isArray(report.recovery) && report.recovery.length ? report.recovery : ['Recarga la página y vuelve a ejecutar el loader.', `${prefix}diagnose()`];
  console.group(`%c CEE %c × ERROR %c ${report.id ?? 'CEE-FATAL'} `, T.mark, T.error, T.chip);
  console.log('%cNO PUDIMOS COMPLETAR LA OPERACIÓN', T.section);
  console.log('%c' + (report.command ? `Comando: ${report.command}` : 'Instalación del editor'), T.title);
  console.log('\n%c MENSAJE ', T.error); console.error(report.message);
  console.log('\n%c CAUSA PROBABLE ', T.warning); console.warn(report.likelyCause ?? 'La instalación se interrumpió antes de completar el diagnóstico.');
  console.log('\n%c RECUPERACIÓN ', T.info);
  recovery.forEach((step, index) => console.log(`%c ${index + 1} %c ${step}`, T.chip, index === 0 ? T.command : T.text));
  console.log('\n%cDIAGNÓSTICO%c  ' + `${prefix}lastError()`, T.section, T.command);
  if (report.stack) { console.groupCollapsed('%c DETALLES TÉCNICOS ', T.debug); console.debug(report.stack); console.groupEnd(); }
  console.groupEnd();
}

export class ErrorHandler {
  constructor(config, runtime) { this.config = config; this.runtime = runtime; }
  capture(value, details = {}) {
    const error = normalizeError(value);
    const report = { id:`CEE-${Date.now().toString(36).toUpperCase()}`, editorVersion:this.config.version, phase:details.phase ?? 'command', command:details.command ?? null, message:error.message, likelyCause:likelyCause(error, details.phase), recovery:details.recovery ?? [`${this.config.prefix}diagnose()`,`${this.config.prefix}refresh()`,'Recarga la página y ejecuta de nuevo el loader.'], timestamp:new Date().toISOString(), stack:this.config.debug ? error.stack : undefined };
    this.runtime.lastError = report; printReport(report, this.config.prefix); return report;
  }
  guard(command, action) { try { return action(); } catch (error) { this.capture(error, { phase:'command', command }); return undefined; } }
}

export function installFailureApi(globalObject, globalName, config, report) {
  const api = { __coperoCareerEditor:true, installationFailed:true, version:config.version, prefix:config.prefix, error:report, diagnose() { printReport(report, config.prefix); return report; }, destroy() { try { delete globalObject[globalName]; } catch { globalObject[globalName] = undefined; } return true; } };
  try { Object.defineProperty(globalObject, globalName, { value:api, configurable:true, writable:true }); } catch { globalObject[globalName] = api; }
  return api;
}
