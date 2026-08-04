import { CONFIG, deriveGlobalName, normalizePrefix } from './config.js';
import { createRuntime } from './core/runtime.js';
import { Logger, emitInstallSignature } from './core/logger.js'; import { Validator } from './core/validator.js'; import { ReactLocator } from './core/react-locator.js';
import { HistoryManager } from './core/history-manager.js'; import { BackupManager } from './core/backup-manager.js'; import { StateManager } from './core/state-manager.js';
import { CommandRegistry } from './core/command-registry.js'; import { CommandHandler } from './core/command-handler.js'; import { ErrorHandler, installFailureApi } from './core/error-handler.js'; import { attachMethods } from './core/utilities.js';
import { registerPlayer } from './modules/player.js'; import { registerSeasons } from './modules/seasons.js'; import { registerStats } from './modules/stats.js'; import { registerTrophies } from './modules/trophies.js';
import { ClubCatalog, registerClubs } from './modules/clubs.js'; import { registerImportExport } from './modules/import-export.js'; import { registerPresets } from './modules/presets.js'; import { registerWatcher } from './modules/watcher.js'; import { registerCore } from './modules/core-commands.js';
import { HelpRenderer } from './help/help-renderer.js'; import { openPanel, closePanel } from './ui/panel.js'; import { openClubPicker, closeClubPicker } from './ui/club-picker.js';
import { createUpdater } from './core/updater.js';

function installCareerEditor() {
  const globalName = deriveGlobalName(CONFIG); const runtime = createRuntime(); runtime.globalName = globalName; const logger = new Logger(CONFIG); const errorHandler = new ErrorHandler(CONFIG, runtime);
  try {
    const old = window[globalName]; if (old?.__coperoCareerEditor) old.destroy?.({ silent: true });
    const validator = new Validator(CONFIG), historyManager = new HistoryManager(CONFIG.maxHistoryEntries), locator = new ReactLocator(CONFIG, runtime);
    const stateManager = new StateManager(locator, validator, historyManager, logger), backupManager = new BackupManager(stateManager), registry = new CommandRegistry(), catalog = new ClubCatalog(stateManager), help = new HelpRenderer(registry, CONFIG);
    let api; const context = { config: CONFIG, runtime, stateManager, historyManager, backupManager, validator, logger, registry, errorHandler }; const panels = { open: ctx => openPanel(ctx, api), close: closePanel };
    registerPlayer(registry); registerSeasons(registry); registerStats(registry); registerTrophies(registry); registerClubs(registry, catalog); registerImportExport(registry); registerPresets(registry); registerWatcher(registry); registerCore(registry, help, panels);
    const handler = new CommandHandler(registry, context); api = { __coperoCareerEditor: true, version: CONFIG.version }; const namespaces = {};
    for (const registered of registry.list()) {
      const parts = registered.name.split('.');
      if (parts.length === 2) { const [space, name] = parts; (namespaces[space] ??= {})[name] = (...args) => handler.run(registered.name, ...args); }
      for (const alias of registered.aliases) api[alias] = (...args) => handler.run(alias, ...args);
      if (parts.length === 1) api[registered.name] = (...args) => handler.run(registered.name, ...args);
    }
    for (const [space, methods] of Object.entries(namespaces)) { if (typeof api[space] === 'function') attachMethods(api[space], methods); else api[space] = methods; }
    api.backups = { ...api.backups, create: (...a) => handler.run('backup', ...a), restore: (...a) => handler.run('restore', ...a), remove: (...a) => handler.run('deleteBackup', ...a), list: () => backupManager.list(), exists: name => backupManager.exists(name) };
    api.clubs.panel = () => errorHandler.guard('clubs.panel', () => openClubPicker(context, api, catalog)); api.lastError = () => runtime.lastError;
    runtime.setPrefix = value => {
      const next = normalizePrefix(value); const previousName = runtime.globalName;
      if (next.name === previousName) return api;
      if (next.name in window && window[next.name] !== api) throw new Error(`window.${next.name} ya existe. Elige otro prefijo.`);
      Object.defineProperty(window, next.name, { value: api, configurable: true, writable: true });
      try { delete window[previousName]; } catch { window[previousName] = undefined; }
      CONFIG.prefix = next.prefix; runtime.globalName = next.name;
      logger.success(`Prefijo temporal cambiado. Ahora usa ${next.prefix}help`); return api;
    };
    api.destroy = ({ silent = false } = {}) => { handler.run('unwatch'); handler.run('unfreezeAll'); closePanel(context); closeClubPicker(context); const activeName = runtime.globalName; try { delete window[activeName]; } catch { window[activeName] = undefined; } if (!silent) logger.success('Editor desinstalado.'); return true; };
    runtime.update = createUpdater({ config: CONFIG, runtime, logger, errorHandler, getApi: () => api });
    Object.defineProperties(api, { prefix: { enumerable: true, get() { return CONFIG.prefix; } }, help: { enumerable: true, get() { return errorHandler.guard('help', () => help.overview()); } }, status: { enumerable: true, get() { return handler.run('summary'); } }, get: { enumerable: true, get() { return handler.run('inspect'); } } });
    window[globalName] = api;
    try { if (CONFIG.autoBackupOnInstall) backupManager.create('original'); } catch (error) { logger.warning('Editor instalado sin backup original. Abre una partida y usa careerEditor.backup("original").', error.message); }
    logger.success(`v${CONFIG.version} instalado. Usa ${CONFIG.prefix}help`); emitInstallSignature(); return api;
  } catch (error) {
    const report = errorHandler.capture(error, { phase: 'install', recovery: ['Comprueba que GitHub contiene el main.js más reciente.', 'Recarga la página y vuelve a ejecutar el loader.', `${CONFIG.prefix}diagnose()`] });
    return installFailureApi(window, globalName, CONFIG, report);
  }
}

installCareerEditor();
