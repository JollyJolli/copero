export const CONFIG = {
  prefix: 'careerEditor.', version: '3.2.0', globalName: null,
  maxHistoryEntries: 50, autoBackupOnInstall: true, safeMode: true,
  debug: false, maxReactNodes: 15000
};

const RESERVED_NAMES = new Set(['await','break','case','catch','class','const','continue','debugger','default','delete','do','else','enum','export','extends','false','finally','for','function','if','implements','import','in','instanceof','interface','let','new','null','package','private','protected','public','return','static','super','switch','this','throw','true','try','typeof','var','void','while','with','yield']);

export function deriveGlobalName(config = CONFIG) {
  const name = config.globalName ?? config.prefix.trim().replace(/\.+$/, '');
  if (!/^[A-Za-z_$][\w$]*$/.test(name) || RESERVED_NAMES.has(name)) throw new Error(`Nombre global inválido: ${name}`);
  return name;
}

export function normalizePrefix(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('El prefijo debe ser texto no vacío.');
  const name = value.trim().replace(/\.+$/, '');
  deriveGlobalName({ prefix: `${name}.`, globalName: null });
  return { name, prefix: `${name}.` };
}
