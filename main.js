/*
 * COPERO CAREER EDITOR
 * Generated automatically.
 * Do not edit main.js directly.
 * Edit files inside src/ and run npm run build.
 */
(() => {
  // src/config.js
  var CONFIG = {
    prefix: "careerEditor.",
    version: "3.1.1",
    globalName: null,
    maxHistoryEntries: 50,
    autoBackupOnInstall: true,
    safeMode: true,
    debug: false,
    maxReactNodes: 15e3
  };
  function deriveGlobalName(config = CONFIG) {
    const name = config.globalName ?? config.prefix.trim().replace(/\.+$/, "");
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`Nombre global inv\xE1lido: ${name}`);
    return name;
  }

  // src/core/runtime.js
  var createRuntime = () => ({ installedAt: (/* @__PURE__ */ new Date()).toISOString(), lastLocator: null, lastError: null, watcherTimer: null, freezes: /* @__PURE__ */ new Map(), panelHost: null });

  // src/core/logger.js
  var Logger = class {
    constructor(config) {
      this.config = config;
      this.tag = `[${config.prefix.replace(/\.+$/, "")}]`;
    }
    success(message, value = "") {
      console.log(`%c${this.tag} ${message}`, "color:#22c55e;font-weight:700", value);
    }
    info(message, value = "") {
      console.info(this.tag, message, value);
    }
    warning(message, value = "") {
      console.warn(this.tag, message, value);
    }
    error(message, error = "") {
      console.error(this.tag, message, error);
    }
    debug(message, value = "") {
      if (this.config.debug) console.debug(this.tag, message, value);
    }
    group(label, collapsed = false) {
      console[collapsed ? "groupCollapsed" : "group"](`${this.tag} ${label}`);
    }
  };

  // src/core/utilities.js
  var isObject = (value) => value !== null && typeof value === "object";
  var isPlainObject = (value) => isObject(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  var clone = (value) => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }
  var normalizeText = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  var timestampName = (prefix = "backup") => `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
  function attachMethods(target, methods) {
    for (const [name, method] of Object.entries(methods)) {
      Object.defineProperty(target, name, {
        value: method,
        enumerable: true,
        configurable: true,
        writable: false
      });
    }
    return target;
  }

  // src/core/validator.js
  var BLOCKED_PATH_PARTS = ["__proto__", "prototype", "constructor"];
  var Validator = class {
    constructor(config) {
      this.config = config;
    }
    number(value, label, { integer = false, min, max } = {}) {
      const result = Number(value);
      assert(Number.isFinite(result), `${label} debe ser un n\xFAmero v\xE1lido.`);
      if (integer) assert(Number.isInteger(result), `${label} debe ser entero.`);
      if (min !== void 0) assert(result >= min, `${label} debe ser >= ${min}.`);
      if (max !== void 0) assert(result <= max, `${label} debe ser <= ${max}.`);
      return result;
    }
    path(path) {
      assert(typeof path === "string" && path.trim(), "La ruta debe ser texto no vac\xEDo.");
      const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
      assert(parts.length > 0, "La ruta est\xE1 vac\xEDa.");
      for (const part of parts) assert(!BLOCKED_PATH_PARTS.includes(part), `Segmento prohibido: ${part}.`);
      return parts;
    }
    gameState(value) {
      return Boolean(isObject(value) && typeof value.phase === "string" && Array.isArray(value.seasons) && isObject(value.totals));
    }
    patch(value, label = "patch") {
      assert(isPlainObject(value), `${label} debe ser un objeto.`);
      return value;
    }
  };

  // src/core/react-locator.js
  function isGameState(value) {
    return Boolean(isObject(value) && typeof value.phase === "string" && Array.isArray(value.seasons) && isObject(value.totals));
  }
  function scoreGameState(value) {
    if (!isGameState(value)) return -Infinity;
    let score = 10;
    for (const key of ["player", "currentEvent", "currentTeamId", "contractTeamId", "rngState", "mode", "step"]) if (key in value) score += 2;
    return score;
  }
  var ReactLocator = class {
    constructor(config, runtime) {
      this.config = config;
      this.runtime = runtime;
    }
    fiber(node) {
      const key = node && Object.keys(node).find((k) => ["__reactFiber$", "__reactInternalInstance$", "__reactContainer$"].some((p) => k.startsWith(p)));
      return key ? node[key] : null;
    }
    locate({ silent = true } = {}) {
      const nodes = [...document.querySelectorAll("[data-career-phase]")];
      for (const node of [...nodes]) {
        if (node.parentElement) nodes.push(node.parentElement);
        nodes.push(...node.children);
      }
      if (document.body) nodes.push(document.body);
      const candidates = [];
      const seen = /* @__PURE__ */ new Set();
      for (const node of new Set(nodes)) {
        const queue = [this.fiber(node)];
        let visited = 0;
        while (queue.length && visited++ < this.config.maxReactNodes) {
          const fiber = queue.shift();
          if (!fiber || seen.has(fiber)) continue;
          seen.add(fiber);
          for (const candidateFiber of [fiber, fiber.alternate]) {
            let hook = candidateFiber?.memoizedState;
            const seenHooks = /* @__PURE__ */ new Set();
            let hookIndex = 0;
            while (isObject(hook) && !seenHooks.has(hook)) {
              seenHooks.add(hook);
              const dispatch = hook.queue?.dispatch;
              for (const state of [hook.queue?.lastRenderedState, hook.memoizedState, hook.baseState]) if (isGameState(state) && typeof dispatch === "function") candidates.push({ state, dispatch, hookIndex, score: scoreGameState(state), sourceNode: node });
              hook = hook.next;
              hookIndex++;
            }
          }
          queue.push(fiber.return, fiber.child, fiber.sibling, fiber.alternate);
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      if (!best) throw new Error("No se encontr\xF3 el estado React. Abre una partida y ejecuta careerEditor.diagnose().");
      this.runtime.lastLocator = { score: best.score, hookIndex: best.hookIndex, candidateCount: candidates.length, phase: best.state.phase, foundAt: (/* @__PURE__ */ new Date()).toISOString() };
      if (!silent) console.debug("[careerEditor] Estado localizado", this.runtime.lastLocator);
      return best;
    }
  };

  // src/core/history-manager.js
  var HistoryManager = class {
    constructor(limit = 50) {
      this.limit = limit;
      this.undoStack = [];
      this.redoStack = [];
    }
    record(state, label) {
      this.undoStack.push({ state: clone(state), label, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      this.undoStack.splice(0, Math.max(0, this.undoStack.length - this.limit));
      this.redoStack.length = 0;
    }
    undo(current) {
      const entry = this.undoStack.pop();
      if (!entry) throw new Error("No hay cambios para deshacer.");
      this.redoStack.push({ state: clone(current), label: entry.label });
      return clone(entry.state);
    }
    redo(current) {
      const entry = this.redoStack.pop();
      if (!entry) throw new Error("No hay cambios para rehacer.");
      this.undoStack.push({ state: clone(current), label: entry.label });
      return clone(entry.state);
    }
    clear() {
      this.undoStack.length = this.redoStack.length = 0;
    }
    list() {
      return { undo: this.undoStack.map(({ label, timestamp }) => ({ label, timestamp })), redo: this.redoStack.map(({ label, timestamp }) => ({ label, timestamp })) };
    }
  };

  // src/core/backup-manager.js
  var BackupManager = class {
    constructor(stateManager) {
      this.stateManager = stateManager;
      this.store = /* @__PURE__ */ new Map();
    }
    create(name) {
      if (!name) throw new Error("El backup necesita nombre.");
      this.store.set(String(name), { name: String(name), timestamp: (/* @__PURE__ */ new Date()).toISOString(), state: this.stateManager.snapshot() });
      return String(name);
    }
    restore(name) {
      const item = this.store.get(String(name));
      if (!item) throw new Error(`No existe el backup "${name}".`);
      return this.stateManager.replace(`Restaurar backup ${name}`, item.state);
    }
    remove(name) {
      if (!this.store.delete(String(name))) throw new Error(`No existe el backup "${name}".`);
      return true;
    }
    list() {
      return [...this.store.values()].map(({ name, timestamp, state }) => ({ name, timestamp, phase: state.phase, seasons: state.seasons.length }));
    }
    exists(name) {
      return this.store.has(String(name));
    }
  };

  // src/core/state-manager.js
  var StateManager = class {
    constructor(locator, validator, history, logger) {
      this.locator = locator;
      this.validator = validator;
      this.history = history;
      this.logger = logger;
      this.connection = null;
    }
    refreshConnection() {
      this.connection = this.locator.locate({ silent: false });
      return this.connection;
    }
    get() {
      this.connection = this.locator.locate();
      return this.connection.state;
    }
    snapshot() {
      return clone(this.get());
    }
    validate(state) {
      if (!this.validator.gameState(state)) throw new Error("El resultado no conserva una partida v\xE1lida.");
      return true;
    }
    mutate(label, mutator) {
      const connection = this.locator.locate();
      const before = clone(connection.state);
      const draft = clone(before);
      const result = mutator(draft) ?? draft;
      this.validate(result);
      connection.dispatch((previous) => {
        const base = this.validator.gameState(previous) ? previous : before;
        this.history.record(base, label);
        return clone(result);
      });
      this.logger.success(label);
      return result;
    }
    replace(label, state, { history = true } = {}) {
      this.validate(state);
      const connection = this.locator.locate();
      if (history) this.history.record(connection.state, label);
      connection.dispatch(() => clone(state));
      this.logger.success(label);
      return state;
    }
  };

  // src/core/command-registry.js
  var CommandRegistry = class {
    constructor() {
      this.commands = /* @__PURE__ */ new Map();
      this.aliases = /* @__PURE__ */ new Map();
    }
    register(command2) {
      for (const key of ["name", "category", "description", "usage", "examples", "aliases", "dangerous", "validate", "execute"]) if (!(key in command2)) throw new Error(`Comando incompleto (${command2.name ?? "?"}): falta ${key}.`);
      if (this.commands.has(command2.name)) throw new Error(`Comando duplicado: ${command2.name}.`);
      this.commands.set(command2.name, command2);
      for (const alias of command2.aliases) {
        if (this.aliases.has(alias) || this.commands.has(alias)) throw new Error(`Alias duplicado: ${alias}.`);
        this.aliases.set(alias, command2.name);
      }
      return command2;
    }
    get(name) {
      return this.commands.get(name) ?? this.commands.get(this.aliases.get(name));
    }
    list(category) {
      return [...this.commands.values()].filter((c) => !category || c.category === category);
    }
    categories() {
      return [...new Set(this.list().map((c) => c.category))];
    }
  };

  // src/core/command-handler.js
  var CommandHandler = class {
    constructor(registry, context) {
      this.registry = registry;
      this.context = context;
    }
    run(name, ...args) {
      return this.context.errorHandler.guard(name, () => {
        const command2 = this.registry.get(name);
        if (!command2) throw new Error(`Comando desconocido: ${name}. Usa ${this.context.config.prefix}help.`);
        command2.validate(args, this.context);
        return command2.execute(this.context, ...args);
      });
    }
  };

  // src/core/error-handler.js
  function normalizeError(value) {
    if (value instanceof Error) return value;
    if (typeof value === "string") return new Error(value);
    try {
      return new Error(JSON.stringify(value));
    } catch {
      return new Error(String(value));
    }
  }
  function likelyCause(error, phase) {
    const message = error.message.toLowerCase();
    if (message.includes("read only property") || message.includes("readonly")) return "Una propiedad protegida del navegador entr\xF3 en conflicto con la API.";
    if (message.includes("estado react") || message.includes("react")) return "La partida no est\xE1 abierta, React est\xE1 en transici\xF3n o cambi\xF3 su estructura interna.";
    if (message.includes("json")) return "El texto importado no es JSON v\xE1lido o no contiene una partida compatible.";
    if (message.includes("club") || message.includes("oferta")) return "El club no fue verificado o el evento no contiene una plantilla compatible.";
    if (phase === "install") return "La API no pudo construirse. Puede ser una versi\xF3n antigua en cach\xE9 o una incompatibilidad.";
    return "El comando recibi\xF3 datos inv\xE1lidos o el estado cambi\xF3 mientras se ejecutaba.";
  }
  var ErrorHandler = class {
    constructor(config, runtime) {
      this.config = config;
      this.runtime = runtime;
    }
    capture(value, details = {}) {
      const error = normalizeError(value);
      const report = { id: `CEE-${Date.now().toString(36).toUpperCase()}`, editorVersion: this.config.version, phase: details.phase ?? "command", command: details.command ?? null, message: error.message, likelyCause: likelyCause(error, details.phase), recovery: details.recovery ?? [`${this.config.prefix}diagnose()`, `${this.config.prefix}refresh()`, "Recarga la p\xE1gina y ejecuta de nuevo el loader."], timestamp: (/* @__PURE__ */ new Date()).toISOString(), stack: this.config.debug ? error.stack : void 0 };
      this.runtime.lastError = report;
      console.group(`%c[${this.config.prefix.replace(/\.+$/, "")}] Error ${report.id}`, "color:#ef4444;font-weight:900");
      console.error("Qu\xE9 fall\xF3:", report.command ? `Comando ${report.command}` : "Instalaci\xF3n del editor");
      console.error("Mensaje:", report.message);
      console.warn("Causa probable:", report.likelyCause);
      console.info("C\xF3mo recuperarte:");
      for (const step of report.recovery) console.info(`\u2022 ${step}`);
      if (report.stack) console.debug(report.stack);
      console.groupEnd();
      return report;
    }
    guard(command2, action) {
      try {
        return action();
      } catch (error) {
        this.capture(error, { phase: "command", command: command2 });
        return void 0;
      }
    }
  };
  function installFailureApi(globalObject, globalName, config, report) {
    const api = { __coperoCareerEditor: true, installationFailed: true, version: config.version, prefix: config.prefix, error: report, diagnose() {
      console.table(report);
      return report;
    }, destroy() {
      try {
        delete globalObject[globalName];
      } catch {
        globalObject[globalName] = void 0;
      }
      return true;
    } };
    try {
      Object.defineProperty(globalObject, globalName, { value: api, configurable: true, writable: true });
    } catch {
      globalObject[globalName] = api;
    }
    return api;
  }

  // src/modules/helpers.js
  function command(registry, data) {
    return registry.register({ examples: [], aliases: [], dangerous: false, validate: () => {
    }, ...data });
  }
  function resolveSeasonIndexes(state, selector = "last") {
    const seasons = state.seasons;
    if (!seasons.length) throw new Error("No existen temporadas.");
    if (selector == null || selector === "last") return [seasons.length - 1];
    if (selector === "first") return [0];
    if (selector === "all") return seasons.map((_, i) => i);
    if (typeof selector === "number") {
      const i = selector < 0 ? seasons.length + selector : selector - 1;
      if (!seasons[i]) throw new Error(`No existe la temporada ${selector}.`);
      return [i];
    }
    if (typeof selector === "string") {
      const i = seasons.findIndex((s) => s.id === selector);
      if (i < 0) throw new Error(`No existe temporada con id ${selector}.`);
      return [i];
    }
    if (selector && typeof selector === "object") {
      const indexes = seasons.map((s, i) => ({ s, i })).filter(({ s }) => Object.entries(selector).every(([k, v]) => s[k] === v)).map((x) => x.i);
      if (!indexes.length) throw new Error("Ninguna temporada coincide.");
      return indexes;
    }
    throw new Error("Selector de temporada inv\xE1lido.");
  }
  function recalculateTotals(state) {
    const totals = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, goalsConceded: 0, trophies: 0, awards: 0 };
    for (const item of [...state.seasons ?? [], ...state.nationalTeamPeriods ?? []]) {
      for (const key of ["appearances", "goals", "assists", "cleanSheets", "goalsConceded"]) totals[key] += Number(item.stats?.[key]) || 0;
      totals.trophies += item.trophies?.length ?? 0;
      totals.awards += item.awards?.length ?? 0;
    }
    return totals;
  }

  // src/modules/player.js
  var aliases = { ovr: "overall", rating: "overall", price: "marketValue", value: "marketValue", name: "lastName", surname: "lastName", number: "preferredNumber", foot: "preferredFoot", team: "currentTeamId" };
  function normalizePlayerPatch(input, validator, safe = true) {
    validator.patch(input, "player");
    const patch = { ...input };
    for (const [alias, canonical] of Object.entries(aliases)) {
      if (alias in patch && !(canonical in patch)) patch[canonical] = patch[alias];
      delete patch[alias];
    }
    if ("overall" in patch) patch.overall = validator.number(patch.overall, "overall", safe ? { integer: true, min: 1, max: 99 } : { integer: true });
    if ("age" in patch) patch.age = validator.number(patch.age, "age", { integer: true, min: 0, ...safe ? { max: 100 } : {} });
    if ("preferredNumber" in patch) patch.preferredNumber = validator.number(patch.preferredNumber, "dorsal", { integer: true, min: 1, max: 99 });
    if ("marketValue" in patch) patch.marketValue = validator.number(patch.marketValue, "valor", { min: 0 });
    if ("preferredFoot" in patch) {
      patch.preferredFoot = String(patch.preferredFoot).toLowerCase();
      if (safe && !["left", "right"].includes(patch.preferredFoot)) throw new Error("Pie inv\xE1lido.");
    }
    if ("position" in patch) patch.position = String(patch.position).toUpperCase();
    for (const key of ["lastName", "currentTeamId"]) if (key in patch) patch[key] = String(patch[key]);
    return patch;
  }
  function registerPlayer(registry) {
    command(registry, { name: "player.set", category: "player", description: "Actualiza el jugador.", usage: "careerEditor.player.set({...})", aliases: ["player"], execute: ({ stateManager, validator, config }, patch) => stateManager.mutate("Jugador actualizado", (draft) => {
      if (!draft.player) throw new Error("La partida no tiene jugador.");
      const normalized2 = normalizePlayerPatch(patch, validator, config.safeMode);
      draft.player = { ...draft.player, ...normalized2 };
      if ("currentTeamId" in normalized2) {
        draft.currentTeamId = normalized2.currentTeamId;
        if (draft.contractTeamId != null) draft.contractTeamId = normalized2.currentTeamId;
      }
    }) });
    for (const [name, field] of Object.entries({ overall: "overall", price: "marketValue", age: "age", name: "lastName", number: "preferredNumber", foot: "preferredFoot", position: "position", team: "currentTeamId" })) command(registry, { name: `player.${name}`, category: "player", description: `Cambia ${field}.`, usage: `careerEditor.player.${name}(value)`, aliases: [name], execute: (ctx, value, options = {}) => {
      const result = ctx.registry.get("player.set").execute(ctx, { [field]: value });
      if (options.lastSeason && ctx.stateManager.get().seasons.length) ctx.registry.get("seasons.edit").execute(ctx, "last", { [field === "currentTeamId" ? "teamId" : field]: value });
      return result;
    } });
    command(registry, { name: "player.get", category: "player", description: "Obtiene el jugador.", usage: "careerEditor.player.get()", execute: ({ stateManager }) => structuredClone(stateManager.get().player) });
  }

  // src/modules/seasons.js
  function registerSeasons(registry) {
    command(registry, { name: "seasons.get", category: "seasons", description: "Obtiene temporadas.", usage: "careerEditor.seasons.get(3)", execute: ({ stateManager }, selector = "all") => {
      const state = stateManager.get();
      return resolveSeasonIndexes(state, selector).map((i) => structuredClone(state.seasons[i]));
    } });
    command(registry, { name: "seasons.edit", category: "seasons", description: "Edita temporadas.", usage: "careerEditor.seasons.edit(3,{...})", aliases: ["season"], execute: ({ stateManager, validator }, selector, patch) => {
      validator.patch(patch, "temporada");
      return stateManager.mutate("Temporada actualizada", (draft) => {
        for (const i of resolveSeasonIndexes(draft, selector)) draft.seasons[i] = { ...draft.seasons[i], ...structuredClone(patch), stats: patch.stats ? { ...draft.seasons[i].stats, ...patch.stats } : draft.seasons[i].stats };
      });
    } });
    command(registry, { name: "seasons.last", category: "seasons", description: "Obtiene o edita la \xFAltima.", usage: "careerEditor.seasons.last({...})", aliases: ["lastSeason"], execute: (ctx, patch) => patch === void 0 ? ctx.registry.get("seasons.get").execute(ctx, "last")[0] : ctx.registry.get("seasons.edit").execute(ctx, "last", patch) });
    command(registry, { name: "seasons.all", category: "seasons", description: "Edita todas.", usage: "careerEditor.allSeasons({...})", aliases: ["allSeasons"], execute: (ctx, patch) => ctx.registry.get("seasons.edit").execute(ctx, "all", patch) });
    command(registry, { name: "seasons.table", category: "seasons", description: "Tabla de temporadas.", usage: "careerEditor.seasons.table()", execute: ({ stateManager }) => {
      const rows = stateManager.get().seasons.map((s, i) => ({ season: i + 1, age: s.age, team: s.teamId, overall: s.overall, marketValue: s.marketValue, appearances: s.stats?.appearances ?? 0, goals: s.stats?.goals ?? 0, assists: s.stats?.assists ?? 0, trophies: s.trophies?.length ?? 0, awards: s.awards?.length ?? 0 }));
      console.table(rows);
      return rows;
    } });
    command(registry, { name: "seasons.compare", category: "seasons", description: "Compara temporadas.", usage: "careerEditor.seasons.compare(3,5)", execute: (ctx, a, b) => {
      const rows = [a, b].map((x) => ctx.registry.get("seasons.get").execute(ctx, x)[0]);
      console.table(rows);
      return rows;
    } });
  }

  // src/modules/stats.js
  var keys = ["appearances", "goals", "assists", "cleanSheets", "goalsConceded", "trophies", "awards"];
  function normalized(patch, validator) {
    validator.patch(patch, "estad\xEDsticas");
    return Object.fromEntries(Object.entries(patch).map(([k, v]) => {
      if (!keys.includes(k)) throw new Error(`Estad\xEDstica desconocida: ${k}.`);
      return [k, validator.number(v, k, { integer: true, min: 0 })];
    }));
  }
  function registerStats(registry) {
    command(registry, { name: "stats.get", category: "stats", description: "Obtiene totales.", usage: "careerEditor.stats.get()", execute: ({ stateManager }) => structuredClone(stateManager.get().totals) });
    command(registry, { name: "stats.set", category: "stats", description: "Reemplaza totales indicados.", usage: "careerEditor.stats.set({...})", aliases: ["totals"], execute: ({ stateManager, validator }, patch) => stateManager.mutate("Totales actualizados", (d) => {
      d.totals = { ...d.totals, ...normalized(patch, validator) };
    }) });
    command(registry, { name: "stats.add", category: "stats", description: "Suma a totales.", usage: "careerEditor.stats.add({...})", execute: ({ stateManager, validator }, patch) => stateManager.mutate("Totales incrementados", (d) => {
      for (const [k, v] of Object.entries(normalized(patch, validator))) d.totals[k] = (Number(d.totals[k]) || 0) + v;
    }) });
    command(registry, { name: "stats.recalculate", category: "stats", description: "Recalcula desde temporadas.", usage: "careerEditor.stats.recalculate()", aliases: ["recalculateTotals"], execute: ({ stateManager }) => stateManager.mutate("Totales recalculados", (d) => {
      d.totals = recalculateTotals(d);
    }) });
    command(registry, { name: "stats.lastSeason", category: "stats", description: "Edita estad\xEDsticas de \xFAltima temporada.", usage: "careerEditor.stats.lastSeason({...})", execute: (ctx, patch) => ctx.registry.get("seasons.edit").execute(ctx, "last", { stats: normalized(patch, ctx.validator) }) });
  }

  // src/modules/trophies.js
  var TROPHIES = ["league", "cup", "continental_primary", "continental_secondary", "club_world_cup", "national_continental", "world_cup"];
  var AWARDS = ["ballon_dor", "golden_boot", "golden_glove"];
  function registerCollection(registry, plural, singular, known, legacyAdd, legacyRemove) {
    command(registry, { name: `${plural}.add`, category: plural, description: `A\xF1ade ${singular}.`, usage: `careerEditor.${plural}.add(id)`, aliases: [legacyAdd], execute: ({ stateManager, config }, id, options = {}) => {
      id = String(id);
      if (config.safeMode && !known.includes(id)) throw new Error(`${singular} desconocido: ${id}.`);
      const amount = Number(options.amount ?? 1);
      return stateManager.mutate(`${singular} a\xF1adido`, (d) => {
        for (const i of resolveSeasonIndexes(d, options.season ?? "last")) {
          const list = d.seasons[i][plural] ??= [];
          for (let n = 0; n < amount; n++) if (options.allowDuplicates || !list.includes(id)) list.push(id);
        }
        d.totals = recalculateTotals(d);
      });
    } });
    command(registry, { name: `${plural}.remove`, category: plural, description: `Elimina ${singular}.`, usage: `careerEditor.${plural}.remove(id)`, aliases: [legacyRemove], execute: ({ stateManager }, id, selector = "last") => stateManager.mutate(`${singular} eliminado`, (d) => {
      for (const i of resolveSeasonIndexes(d, selector)) d.seasons[i][plural] = (d.seasons[i][plural] ?? []).filter((x) => x !== id);
      d.totals = recalculateTotals(d);
    }) });
    command(registry, { name: `${plural}.set`, category: plural, description: `Fija cantidad de ${singular}.`, usage: `careerEditor.${plural}.set(id,n)`, execute: (ctx, id, amount, selector = "last") => {
      ctx.registry.get(`${plural}.remove`).execute(ctx, id, selector);
      return ctx.registry.get(`${plural}.add`).execute(ctx, id, { amount, season: selector, allowDuplicates: true });
    } });
    command(registry, { name: `${plural}.list`, category: plural, description: `Lista ${plural}.`, usage: `careerEditor.${plural}.list()`, execute: ({ stateManager }) => stateManager.get().seasons.flatMap((s) => s[plural] ?? []) });
    command(registry, { name: `${plural}.count`, category: plural, description: `Cuenta ${plural}.`, usage: `careerEditor.${plural}.count()`, execute: (ctx) => ctx.registry.get(`${plural}.list`).execute(ctx).reduce((m, id) => ({ ...m, [id]: (m[id] ?? 0) + 1 }), {}) });
    command(registry, { name: `${plural}.clear`, category: plural, description: `Borra ${plural}.`, usage: `careerEditor.${plural}.clear()`, dangerous: true, execute: ({ stateManager }) => stateManager.mutate(`${plural} eliminados`, (d) => {
      for (const s of d.seasons) s[plural] = [];
      d.totals = recalculateTotals(d);
    }) });
  }
  function registerTrophies(registry) {
    registerCollection(registry, "trophies", "trofeo", TROPHIES, "addTrophy", "removeTrophy");
    registerCollection(registry, "awards", "premio", AWARDS, "addAward", "removeAward");
  }

  // src/modules/clubs.js
  var CLUB_KEYS = ["teamId", "clubId", "currentTeamId", "targetTeamId"];
  var ClubCatalog = class {
    constructor(stateManager) {
      this.stateManager = stateManager;
      this.clubs = /* @__PURE__ */ new Map();
    }
    add(value) {
      if (typeof value === "string" && value) this.clubs.set(value, this.clubs.get(value) ?? { id: value, name: value });
      else if (value && typeof value === "object") {
        const id = value.id ?? value.teamId ?? value.clubId ?? value.slug;
        if (id) this.clubs.set(String(id), { ...this.clubs.get(String(id)), ...value, id: String(id), name: value.name ?? value.name_en ?? value.name_es ?? String(id) });
      }
    }
    refresh() {
      this.clubs.clear();
      const state = this.stateManager.get();
      this.add(state.currentTeamId);
      this.add(state.contractTeamId);
      this.add(state.player?.currentTeamId);
      for (const s of state.seasons ?? []) this.add(s.team ?? s.teamId);
      for (const option of state.currentEvent?.options ?? []) {
        this.add(option.team ?? option.club);
        for (const key of CLUB_KEYS) this.add(option[key]);
      }
      return this.list();
    }
    list(filters = {}) {
      return [...this.clubs.values()].filter((c) => (!filters.country || [c.country, c.countryCode, c.country_id].includes(filters.country)) && (!filters.division || Number(c.division ?? c.divisionLevel) === Number(filters.division)) && (!filters.minReputation || Number(c.reputation ?? c.international_reputation ?? 0) >= filters.minReputation));
    }
    getById(id) {
      if (!this.clubs.size) this.refresh();
      return this.clubs.get(String(id));
    }
    search(query) {
      if (!this.clubs.size) this.refresh();
      const q = normalizeText(query);
      return this.list().filter((c) => normalizeText(`${c.name} ${c.id}`).includes(q));
    }
    has(id) {
      return Boolean(this.getById(id));
    }
  };
  function compatibleOffers(state) {
    return (state.currentEvent?.options ?? []).map((option, index) => ({ option, index, key: CLUB_KEYS.find((k) => k in option) })).filter((x) => x.key);
  }
  function replaceOfferState(state, humanIndex, club, add = false) {
    const offers = compatibleOffers(state);
    if (!offers.length) throw new Error("El evento actual no contiene una oferta compatible que pueda clonarse.");
    const source = add ? offers[0] : offers[Number(humanIndex) - 1];
    if (!source) throw new Error(`No existe la oferta ${humanIndex}.`);
    if (offers.some((x) => String(x.option[x.key]) === club.id)) throw new Error("Ese club ya est\xE1 ofrecido.");
    const copy = structuredClone(source.option);
    copy[source.key] = club.id;
    for (const nested of ["team", "club"]) if (copy[nested] && typeof copy[nested] === "object") copy[nested] = { ...copy[nested], ...club, id: club.id };
    if ("id" in copy) copy.id = `${copy.id}-editor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (add) state.currentEvent.options.push(copy);
    else state.currentEvent.options[source.index] = copy;
    return copy;
  }
  function registerClubs(registry, catalog) {
    command(registry, { name: "clubs.list", category: "clubs", description: "Lista clubes descubiertos.", usage: "careerEditor.clubs.list()", execute: (_, filters) => {
      catalog.refresh();
      const rows = catalog.list(filters);
      console.table(rows);
      return rows;
    } });
    command(registry, { name: "clubs.search", category: "clubs", description: "Busca clubes.", usage: 'careerEditor.clubs.search("Barcelona")', execute: (_, query) => {
      catalog.refresh();
      const rows = catalog.search(query);
      console.table(rows);
      return rows;
    } });
    command(registry, { name: "clubs.current", category: "clubs", description: "Club actual.", usage: "careerEditor.clubs.current()", execute: ({ stateManager }) => {
      catalog.refresh();
      return catalog.getById(stateManager.get().player?.currentTeamId ?? stateManager.get().currentTeamId);
    } });
    command(registry, { name: "clubs.offers", category: "clubs", description: "Ofertas actuales.", usage: "careerEditor.clubs.offers()", execute: ({ stateManager }) => compatibleOffers(stateManager.get()).map(({ option, index, key }) => ({ number: index + 1, clubId: option[key], option })) });
    for (const [name, add] of [["replaceOffer", false], ["addOffer", true]]) command(registry, { name: `clubs.${name}`, category: "clubs", description: `${add ? "A\xF1ade" : "Reemplaza"} una oferta clonada.`, usage: `careerEditor.clubs.${name}(${add ? "" : "1,"}"club")`, execute: ({ stateManager }, first, second) => {
      catalog.refresh();
      const id = add ? first : second;
      const club = catalog.getById(id);
      if (!club) throw new Error(`Club no verificado: ${id}. Usa careerEditor.clubs.search().`);
      let result;
      stateManager.mutate(`Oferta ${add ? "a\xF1adida" : "reemplazada"}`, (d) => {
        result = replaceOfferState(d, add ? 1 : first, club, add);
      });
      return result;
    } });
    command(registry, { name: "clubs.removeOffer", category: "clubs", description: "Elimina una oferta.", usage: "careerEditor.clubs.removeOffer(2)", dangerous: true, execute: ({ stateManager }, number) => stateManager.mutate("Oferta eliminada", (d) => {
      const i = Number(number) - 1;
      if (!d.currentEvent?.options?.[i]) throw new Error("Oferta inexistente.");
      d.currentEvent.options.splice(i, 1);
    }) });
    command(registry, { name: "clubs.choose", category: "clubs", description: "Prepara una oferta para elegirla en la UI.", usage: 'careerEditor.clubs.choose("club")', execute: (ctx, id, options = {}) => {
      const strategy = options.strategy ?? "auto";
      const result = strategy === "add" ? ctx.registry.get("clubs.addOffer").execute(ctx, id) : ctx.registry.get("clubs.replaceOffer").execute(ctx, options.offer ?? 1, id);
      ctx.logger.info("Oferta preparada. Pulsa la opci\xF3n en la interfaz original.");
      return result;
    } });
  }

  // src/modules/import-export.js
  function registerImportExport(registry) {
    command(registry, { name: "export", category: "data", description: "Exporta JSON.", usage: "careerEditor.export()", execute: async ({ stateManager, config }, options = {}) => {
      const value = options.legacy ? stateManager.snapshot() : { editorVersion: config.version, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), gameState: stateManager.snapshot() };
      const json = JSON.stringify(value, null, options.pretty === false ? 0 : 2);
      if (options.copy !== false && navigator.clipboard?.writeText) await navigator.clipboard.writeText(json);
      return json;
    } });
    command(registry, { name: "import", category: "data", description: "Importa estado.", usage: "careerEditor.import(json)", dangerous: true, execute: ({ stateManager, validator }, input) => {
      const parsed = typeof input === "string" ? JSON.parse(input) : input;
      const state = parsed?.gameState ?? parsed;
      if (!validator.gameState(state)) throw new Error("La importaci\xF3n no contiene un estado v\xE1lido.");
      return stateManager.replace("Partida importada", state);
    } });
    command(registry, { name: "download", category: "data", description: "Descarga JSON.", usage: "careerEditor.download()", execute: async (ctx, filename = `career-${Date.now()}.json`) => {
      const json = await registry.get("export").execute(ctx, { copy: false });
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
      return filename;
    } });
  }

  // src/modules/presets.js
  var initial = /* @__PURE__ */ new Map([["wonderkid", { overall: 80, age: 18 }], ["elite", { overall: 90 }], ["goat", { overall: 99 }], ["realistic", { overall: 85 }]]);
  function registerPresets(registry) {
    command(registry, { name: "presets.list", category: "presets", description: "Lista presets.", usage: "careerEditor.presets.list()", execute: () => [...initial.keys()] });
    command(registry, { name: "presets.apply", category: "presets", description: "Aplica preset solo al jugador.", usage: 'careerEditor.presets.apply("goat")', execute: (ctx, name) => {
      const patch = initial.get(name);
      if (!patch) throw new Error("Preset desconocido.");
      return ctx.registry.get("player.set").execute(ctx, patch);
    } });
    command(registry, { name: "presets.create", category: "presets", description: "Crea preset.", usage: 'careerEditor.presets.create("x",{...})', execute: ({ validator }, name, patch) => {
      validator.patch(patch);
      initial.set(String(name), structuredClone(patch));
      return name;
    } });
    command(registry, { name: "presets.remove", category: "presets", description: "Elimina preset.", usage: 'careerEditor.presets.remove("x")', execute: (_, name) => initial.delete(String(name)) });
  }

  // src/core/paths.js
  var getAtPath = (root, path, validator) => validator.path(path).reduce((v, key) => v?.[key], root);
  function setAtPath(root, path, value, validator) {
    const parts = validator.path(path);
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!isObject(cursor[key])) cursor[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cursor = cursor[key];
    }
    cursor[parts.at(-1)] = value;
  }
  function deleteAtPath(root, path, validator) {
    const parts = validator.path(path);
    let cursor = root;
    for (const key2 of parts.slice(0, -1)) {
      cursor = cursor?.[key2];
      if (!isObject(cursor)) return false;
    }
    const key = parts.at(-1);
    if (!(key in cursor)) return false;
    if (Array.isArray(cursor) && /^\d+$/.test(key)) cursor.splice(Number(key), 1);
    else delete cursor[key];
    return true;
  }

  // src/modules/watcher.js
  function registerWatcher(registry) {
    command(registry, { name: "watch", category: "runtime", description: "Observa cambios.", usage: "careerEditor.watch()", execute: ({ runtime, stateManager, logger }, ms = 1e3) => {
      clearInterval(runtime.watcherTimer);
      let prior = JSON.stringify(stateManager.get());
      runtime.watcherTimer = setInterval(() => {
        try {
          const next = JSON.stringify(stateManager.get());
          if (next !== prior) logger.info("Cambio detectado");
          prior = next;
        } catch {
        }
      }, Math.max(250, Number(ms)));
      return true;
    } });
    command(registry, { name: "unwatch", category: "runtime", description: "Detiene watcher.", usage: "careerEditor.unwatch()", execute: ({ runtime }) => {
      clearInterval(runtime.watcherTimer);
      runtime.watcherTimer = null;
      return true;
    } });
    command(registry, { name: "freeze", category: "runtime", description: "Congela ruta.", usage: 'careerEditor.freeze("player.overall",99)', execute: ({ runtime, stateManager, validator }, path, value) => {
      validator.path(path);
      if (runtime.freezes.has(path)) clearInterval(runtime.freezes.get(path));
      runtime.freezes.set(path, setInterval(() => {
        try {
          if (getAtPath(stateManager.get(), path, validator) !== value) stateManager.mutate(`Freeze ${path}`, (d) => {
            const parts = validator.path(path);
            let c = d;
            for (const k of parts.slice(0, -1)) c = c[k];
            c[parts.at(-1)] = structuredClone(value);
          });
        } catch {
        }
      }, 1e3));
      return true;
    } });
    command(registry, { name: "unfreeze", category: "runtime", description: "Descongela ruta.", usage: "careerEditor.unfreeze(path)", execute: ({ runtime }, path) => {
      clearInterval(runtime.freezes.get(path));
      return runtime.freezes.delete(path);
    } });
    command(registry, { name: "unfreezeAll", category: "runtime", description: "Detiene freezes.", usage: "careerEditor.unfreezeAll()", execute: ({ runtime }) => {
      for (const timer of runtime.freezes.values()) clearInterval(timer);
      runtime.freezes.clear();
      return true;
    } });
  }

  // src/modules/core-commands.js
  function registerCore(registry, help, panels) {
    command(registry, { name: "inspect", category: "core", description: "Copia estado.", usage: "careerEditor.inspect()", execute: ({ stateManager }) => stateManager.snapshot() });
    command(registry, { name: "summary", category: "core", description: "Resumen.", usage: "careerEditor.summary()", execute: ({ stateManager }) => {
      const s = stateManager.get();
      const v = { phase: s.phase, step: s.step, player: s.player, seasons: s.seasons.length, totals: s.totals, currentEvent: s.currentEvent ? { id: s.currentEvent.id, type: s.currentEvent.type, options: s.currentEvent.options?.length } : null };
      console.log(v);
      return v;
    } });
    command(registry, { name: "set", category: "core", description: "Modifica ruta.", usage: "careerEditor.set(path,value)", execute: ({ stateManager, validator }, path, value) => stateManager.mutate(`Ruta modificada: ${path}`, (d) => setAtPath(d, path, clone(value), validator)) });
    command(registry, { name: "merge", category: "core", description: "Fusiona objeto.", usage: "careerEditor.merge(path,patch)", execute: ({ stateManager, validator }, path, patch) => stateManager.mutate(`Ruta fusionada: ${path}`, (d) => {
      validator.patch(patch);
      const current = getAtPath(d, path, validator);
      validator.patch(current);
      setAtPath(d, path, { ...current, ...clone(patch) }, validator);
    }) });
    command(registry, { name: "remove", category: "core", description: "Elimina ruta.", usage: "careerEditor.remove(path)", dangerous: true, execute: ({ stateManager, validator, config }, path) => {
      if (config.safeMode && ["phase", "seed", "player", "seasons", "totals"].includes(validator.path(path)[0])) throw new Error("Modo seguro bloquea eliminar una propiedad esencial.");
      return stateManager.mutate(`Ruta eliminada: ${path}`, (d) => {
        if (!deleteAtPath(d, path, validator)) throw new Error("La ruta no existe.");
      });
    } });
    command(registry, { name: "backup", category: "backups", description: "Crea backup.", usage: "careerEditor.backup(name)", execute: ({ backupManager }, name = timestampName()) => backupManager.create(name) });
    command(registry, { name: "restore", category: "backups", description: "Restaura backup.", usage: "careerEditor.restore(name)", dangerous: true, execute: ({ backupManager }, name = "original") => backupManager.restore(name) });
    command(registry, { name: "deleteBackup", category: "backups", description: "Elimina backup.", usage: "careerEditor.deleteBackup(name)", dangerous: true, execute: ({ backupManager }, name) => backupManager.remove(name) });
    command(registry, { name: "undo", category: "backups", description: "Deshace.", usage: "careerEditor.undo()", execute: ({ stateManager, historyManager }) => stateManager.replace("Deshacer", historyManager.undo(stateManager.get()), { history: false }) });
    command(registry, { name: "redo", category: "backups", description: "Rehace.", usage: "careerEditor.redo()", execute: ({ stateManager, historyManager }) => stateManager.replace("Rehacer", historyManager.redo(stateManager.get()), { history: false }) });
    command(registry, { name: "safeMode", category: "core", description: "Configura modo seguro.", usage: "careerEditor.safeMode(true)", execute: ({ config }, value) => config.safeMode = Boolean(value) });
    command(registry, { name: "validate", category: "core", description: "Valida estado.", usage: "careerEditor.validate()", execute: ({ stateManager }) => stateManager.validate(stateManager.get()) });
    command(registry, { name: "repair", category: "core", description: "Repara \xFAnicamente colecciones seguras.", usage: "careerEditor.repair()", execute: ({ stateManager }) => stateManager.mutate("Reparaci\xF3n segura", (d) => {
      d.seasons ??= [];
      d.totals ??= {};
      d.log ??= [];
    }) });
    command(registry, { name: "refresh", category: "runtime", description: "Relocaliza React.", usage: "careerEditor.refresh()", execute: ({ stateManager }) => stateManager.refreshConnection() });
    command(registry, { name: "diagnose", category: "runtime", description: "Diagn\xF3stico.", usage: "careerEditor.diagnose()", execute: ({ runtime, historyManager, backupManager }) => {
      const v = { locator: runtime.lastLocator, history: historyManager.list(), backups: backupManager.list(), panelOpen: Boolean(runtime.panelHost) };
      console.log(v);
      return v;
    } });
    command(registry, { name: "helpFor", category: "core", description: "Ayuda de categor\xEDa.", usage: "careerEditor.helpFor(category)", execute: (_, name) => help.category(name) });
    command(registry, { name: "helpCommand", category: "core", description: "Ayuda de comando.", usage: "careerEditor.helpCommand(name)", execute: (_, name) => help.command(name) });
    command(registry, { name: "panel", category: "runtime", description: "Abre panel.", usage: "careerEditor.panel()", execute: (ctx) => panels.open(ctx) });
    command(registry, { name: "closePanel", category: "runtime", description: "Cierra panel.", usage: "careerEditor.closePanel()", execute: (ctx) => panels.close(ctx) });
  }

  // src/help/help-renderer.js
  var icons = { player: "\u{1F464}", seasons: "\u{1F4C5}", trophies: "\u{1F3C6}", awards: "\u{1F947}", clubs: "\u{1F3DF}\uFE0F", backups: "\u{1F4BE}", stats: "\u{1F4CA}", data: "\u{1F4E6}", runtime: "\u2699\uFE0F", presets: "\u2728", core: "\u{1F9F0}" };
  var HelpRenderer = class {
    constructor(registry, config) {
      this.registry = registry;
      this.config = config;
    }
    overview() {
      console.group(`%c\u26BD COPERO CAREER EDITOR v${this.config.version}`, "color:#22c55e;font-weight:900;font-size:14px");
      console.log(`Prefijo: ${this.config.prefix}`);
      console.log("Categor\xEDas");
      for (const c of this.registry.categories()) console.log(`${icons[c] ?? "\u2022"} ${c}: ${this.config.prefix}helpFor("${c}")`);
      console.log("Ejemplos:", `${this.config.prefix}overall(99)`, `${this.config.prefix}clubs.search("Barcelona")`, `${this.config.prefix}backup("antes")`);
      console.groupEnd();
    }
    category(name) {
      const commands = this.registry.list(name);
      if (!commands.length) throw new Error(`Categor\xEDa desconocida: ${name}.`);
      console.group(`${icons[name] ?? "\u2022"} ${name}`);
      for (const c of commands) console.log(`%c${c.usage}`, "color:#38bdf8", `\u2014 ${c.description}${c.dangerous ? " \u26A0\uFE0F" : ""}`);
      console.groupEnd();
      return commands;
    }
    command(name) {
      const c = this.registry.get(name);
      if (!c) throw new Error(`Comando desconocido: ${name}.`);
      console.group(c.usage);
      console.log(c.description);
      if (c.dangerous) console.warn("\u26A0\uFE0F Operaci\xF3n peligrosa");
      for (const example of c.examples) console.log(example);
      console.groupEnd();
      return c;
    }
  };

  // src/ui/styles.js
  var PANEL_CSS = `:host{all:initial}.panel{position:fixed;right:20px;top:20px;z-index:2147483647;width:360px;max-height:80vh;overflow:auto;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:16px;font:14px system-ui;box-shadow:0 20px 50px #0008}button,input,select{font:inherit}button{background:#22c55e;border:0;border-radius:7px;padding:7px 10px;cursor:pointer}.close{float:right;background:#ef4444}.row{padding:8px;border-bottom:1px solid #334155}.muted{color:#94a3b8}input,select{box-sizing:border-box;width:100%;padding:8px;margin:6px 0;background:#1e293b;color:#fff;border:1px solid #475569;border-radius:6px}`;

  // src/ui/panel.js
  function openPanel(context, api) {
    closePanel(context);
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PANEL_CSS}</style><div class="panel"><button class="close">\xD7</button><h2>Copero Career Editor</h2><p class="muted">Panel modular v${context.config.version}</p><div id="summary"></div><button id="backup">Crear backup</button><button id="clubs">Selector de clubes</button></div>`;
    root.querySelector(".close").onclick = () => closePanel(context);
    root.querySelector("#backup").onclick = () => api.backup();
    root.querySelector("#clubs").onclick = () => api.clubs.panel();
    try {
      const s = context.stateManager.get();
      root.querySelector("#summary").textContent = `${s.player?.lastName ?? "Jugador"} \xB7 OVR ${s.player?.overall ?? "?"} \xB7 ${s.seasons.length} temporadas`;
    } catch (e) {
      root.querySelector("#summary").textContent = e.message;
    }
    document.documentElement.append(host);
    context.runtime.panelHost = host;
    return host;
  }
  function closePanel(context) {
    context.runtime.panelHost?.remove();
    context.runtime.panelHost = null;
  }

  // src/ui/club-picker.js
  function openClubPicker(context, api, catalog) {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PANEL_CSS}</style><div class="panel"><button class="close">\xD7</button><h2>Clubes verificados</h2><input placeholder="Buscar club"><select><option value="replace">Reemplazar oferta 1</option><option value="add">A\xF1adir oferta</option></select><div class="results"></div><div class="muted message"></div></div>`;
    root.querySelector(".close").onclick = () => host.remove();
    const input = root.querySelector("input"), results = root.querySelector(".results"), message = root.querySelector(".message");
    const render = () => {
      try {
        catalog.refresh();
        results.replaceChildren(...catalog.search(input.value).map((club) => {
          const row = document.createElement("div");
          row.className = "row";
          row.textContent = `${club.name} (${club.id}) \xB7 ${club.country ?? "?"} \xB7 D${club.division ?? "?"} \xB7 Rep ${club.reputation ?? club.international_reputation ?? "?"}`;
          row.onclick = () => {
            try {
              api.clubs.choose(club.id, { strategy: root.querySelector("select").value });
              message.textContent = "Oferta preparada; p\xFAlsala en la interfaz del juego.";
            } catch (e) {
              message.textContent = e.message;
            }
          };
          return row;
        }));
      } catch (e) {
        message.textContent = e.message;
      }
    };
    input.oninput = render;
    render();
    document.documentElement.append(host);
    return host;
  }

  // src/index.js
  function installCareerEditor() {
    const globalName = deriveGlobalName(CONFIG);
    const runtime = createRuntime();
    const logger = new Logger(CONFIG);
    const errorHandler = new ErrorHandler(CONFIG, runtime);
    try {
      const old = window[globalName];
      if (old?.__coperoCareerEditor) old.destroy?.({ silent: true });
      const validator = new Validator(CONFIG), historyManager = new HistoryManager(CONFIG.maxHistoryEntries), locator = new ReactLocator(CONFIG, runtime);
      const stateManager = new StateManager(locator, validator, historyManager, logger), backupManager = new BackupManager(stateManager), registry = new CommandRegistry(), catalog = new ClubCatalog(stateManager), help = new HelpRenderer(registry, CONFIG);
      let api;
      const context = { config: CONFIG, runtime, stateManager, historyManager, backupManager, validator, logger, registry, errorHandler };
      const panels = { open: (ctx) => openPanel(ctx, api), close: closePanel };
      registerPlayer(registry);
      registerSeasons(registry);
      registerStats(registry);
      registerTrophies(registry);
      registerClubs(registry, catalog);
      registerImportExport(registry);
      registerPresets(registry);
      registerWatcher(registry);
      registerCore(registry, help, panels);
      const handler = new CommandHandler(registry, context);
      api = { __coperoCareerEditor: true, version: CONFIG.version, prefix: CONFIG.prefix };
      const namespaces = {};
      for (const registered of registry.list()) {
        const parts = registered.name.split(".");
        if (parts.length === 2) {
          const [space, name] = parts;
          (namespaces[space] ??= {})[name] = (...args) => handler.run(registered.name, ...args);
        }
        for (const alias of registered.aliases) api[alias] = (...args) => handler.run(alias, ...args);
        if (parts.length === 1) api[registered.name] = (...args) => handler.run(registered.name, ...args);
      }
      for (const [space, methods] of Object.entries(namespaces)) {
        if (typeof api[space] === "function") attachMethods(api[space], methods);
        else api[space] = methods;
      }
      api.backups = { ...api.backups, create: (...a) => handler.run("backup", ...a), restore: (...a) => handler.run("restore", ...a), remove: (...a) => handler.run("deleteBackup", ...a), list: () => backupManager.list(), exists: (name) => backupManager.exists(name) };
      api.clubs.panel = () => errorHandler.guard("clubs.panel", () => openClubPicker(context, api, catalog));
      api.lastError = () => runtime.lastError;
      api.destroy = ({ silent = false } = {}) => {
        handler.run("unwatch");
        handler.run("unfreezeAll");
        closePanel(context);
        try {
          delete window[globalName];
        } catch {
          window[globalName] = void 0;
        }
        if (!silent) logger.success("Editor desinstalado.");
        return true;
      };
      Object.defineProperties(api, { help: { enumerable: true, get() {
        return errorHandler.guard("help", () => help.overview());
      } }, status: { enumerable: true, get() {
        return handler.run("summary");
      } }, get: { enumerable: true, get() {
        return handler.run("inspect");
      } } });
      window[globalName] = api;
      try {
        if (CONFIG.autoBackupOnInstall) backupManager.create("original");
      } catch (error) {
        logger.warning('Editor instalado sin backup original. Abre una partida y usa careerEditor.backup("original").', error.message);
      }
      logger.success(`v${CONFIG.version} instalado. Usa ${CONFIG.prefix}help`);
      return api;
    } catch (error) {
      const report = errorHandler.capture(error, { phase: "install", recovery: ["Comprueba que GitHub contiene el main.js m\xE1s reciente.", "Recarga la p\xE1gina y vuelve a ejecutar el loader.", `${CONFIG.prefix}diagnose()`] });
      return installFailureApi(window, globalName, CONFIG, report);
    }
  }
  installCareerEditor();
})();
