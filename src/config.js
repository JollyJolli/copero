export const CONFIG = {
  prefix: 'careerEditor.', version: '3.0.0', globalName: null,
  maxHistoryEntries: 50, autoBackupOnInstall: true, safeMode: true,
  debug: false, maxReactNodes: 15000
};

export function deriveGlobalName(config = CONFIG) {
  const name = config.globalName ?? config.prefix.trim().replace(/\.+$/, '');
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`Nombre global inválido: ${name}`);
  return name;
}
