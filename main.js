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
    version: "B1",
    globalName: null,
    maxHistoryEntries: 50,
    autoBackupOnInstall: true,
    safeMode: true,
    debug: false,
    maxReactNodes: 15e3
  };
  var RESERVED_NAMES = /* @__PURE__ */ new Set(["await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if", "implements", "import", "in", "instanceof", "interface", "let", "new", "null", "package", "private", "protected", "public", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield"]);
  function deriveGlobalName(config = CONFIG) {
    const name = config.globalName ?? config.prefix.trim().replace(/\.+$/, "");
    if (!/^[A-Za-z_$][\w$]*$/.test(name) || RESERVED_NAMES.has(name)) throw new Error(`Nombre global inv\xE1lido: ${name}`);
    return name;
  }
  function normalizePrefix(value) {
    if (typeof value !== "string" || !value.trim()) throw new Error("El prefijo debe ser texto no vac\xEDo.");
    const name = value.trim().replace(/\.+$/, "");
    deriveGlobalName({ prefix: `${name}.`, globalName: null });
    return { name, prefix: `${name}.` };
  }

  // src/core/runtime.js
  var createRuntime = () => ({ installedAt: (/* @__PURE__ */ new Date()).toISOString(), lastLocator: null, lastError: null, watcherTimer: null, freezes: /* @__PURE__ */ new Map(), panelHost: null, clubPanelHost: null });

  // src/core/logger.js
  var COLORS = { success: "#35e39a", info: "#50c7f5", warning: "#fbbf24", error: "#fb7185", debug: "#a78bfa" };
  var Logger = class {
    constructor(config) {
      this.config = config;
    }
    get name() {
      return this.config.prefix.replace(/\.+$/, "");
    }
    print(level, message, value = "") {
      const color = COLORS[level] ?? COLORS.info, label = { success: "SUCCESS", info: "INFO", warning: "WARNING", error: "ERROR", debug: "DEBUG" }[level] ?? level.toUpperCase();
      const method = level === "warning" ? "warn" : level === "error" ? "error" : level === "debug" ? "debug" : "log";
      console[method](`%c ${this.name} %c ${label} %c ${message}`, "background:#07111f;color:#f8fafc;border:1px solid #29425f;border-radius:4px 0 0 4px;padding:2px 6px;font-weight:800", `background:${color};color:#04130d;border-radius:0 4px 4px 0;padding:2px 6px;font-weight:900`, "color:inherit;font-weight:600", value);
    }
    success(message, value = "") {
      this.print("success", message, value);
    }
    info(message, value = "") {
      this.print("info", message, value);
    }
    warning(message, value = "") {
      this.print("warning", message, value);
    }
    error(message, error = "") {
      this.print("error", message, error);
    }
    debug(message, value = "") {
      if (this.config.debug) this.print("debug", message, value);
    }
    group(label, collapsed = false) {
      console[collapsed ? "groupCollapsed" : "group"](`%c ${this.name} %c ${label}`, "background:#35e39a;color:#052218;border-radius:4px;padding:2px 7px;font-weight:900", "color:#8da2bd;font-weight:700");
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
    command(registry, { name: "setPrefix", category: "core", description: "Cambia temporalmente el nombre global del editor.", usage: 'careerEditor.setPrefix("p")', examples: ['careerEditor.setPrefix("p")', "p.panel()"], execute: ({ runtime }, value) => runtime.setPrefix(value) });
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
  var META = { player: ["PLAYER", "Jugador"], seasons: ["SEASONS", "Temporadas"], stats: ["STATS", "Estad\xEDsticas"], trophies: ["TROPHIES", "Trofeos"], awards: ["AWARDS", "Premios"], clubs: ["CLUBS", "Clubes"], backups: ["BACKUPS", "Backups"], presets: ["PRESETS", "Presets"], data: ["DATA", "Datos"], runtime: ["RUNTIME", "Sistema"], core: ["CORE", "General"] };
  var S = { brand: "background:linear-gradient(90deg,#35e39a,#50c7f5);color:#031b14;border-radius:5px;padding:4px 9px;font-weight:950;font-size:13px", version: "color:#35e39a;font-weight:900", muted: "color:#7890aa", heading: "color:#f8fafc;font-weight:900;font-size:12px", command: "color:#50c7f5;font-family:monospace;font-weight:700", danger: "color:#fb7185;font-weight:850", chip: "background:#12243a;color:#9fb4ca;border-radius:3px;padding:2px 5px;font-weight:800" };
  var HelpRenderer = class {
    constructor(registry, config) {
      this.registry = registry;
      this.config = config;
    }
    overview() {
      console.group("%c COPERO CAREER EDITOR %c v" + this.config.version, S.brand, S.version);
      console.log("%cControl total de tu carrera, directamente desde la consola.\n%cAPI activa: %c" + this.config.prefix, S.muted, S.muted, S.command);
      console.log("\n%cNAVEGACI\xD3N", S.heading);
      for (const category of this.registry.categories()) {
        const [code, label] = META[category] ?? [category.toUpperCase(), category];
        const count = this.registry.list(category).length;
        console.log(`%c ${code} %c ${label.padEnd(16)} %c${count} comandos  \u2192  ${this.config.prefix}helpFor("${category}")`, S.chip, "color:#d9e5f1;font-weight:750", S.muted);
      }
      console.log("\n%cINICIO R\xC1PIDO", S.heading);
      for (const example of [`${this.config.prefix}overall(99)`, `${this.config.prefix}player.set({ age: 24, position: "ST" })`, `${this.config.prefix}clubs.search("Barcelona")`, `${this.config.prefix}backup("antes")`, `${this.config.prefix}panel()`]) console.log("%c\u203A %c" + example, "color:#35e39a;font-weight:900", S.command);
      console.log("\n%cTIP%c Usa %s para ver un comando en detalle.", "background:#35e39a;color:#052218;border-radius:3px;padding:2px 5px;font-weight:900", S.muted, `${this.config.prefix}helpCommand("overall")`);
      console.groupEnd();
      return void 0;
    }
    category(name) {
      const commands = this.registry.list(name);
      if (!commands.length) throw new Error(`Categor\xEDa desconocida: ${name}.`);
      const [, label] = META[name] ?? [name, name];
      console.group(`%c ${label.toUpperCase()} %c ${commands.length} comandos`, S.brand, S.muted);
      for (const item of commands) {
        console.groupCollapsed(`%c${item.usage}%c  ${item.dangerous ? "\u26A0 " : ""}${item.description}`, S.command, item.dangerous ? S.danger : S.muted);
        if (item.examples.length) {
          console.log("%cEJEMPLOS", S.heading);
          for (const example of item.examples) console.log("%c\u203A %c" + example, "color:#35e39a", S.command);
        }
        if (item.aliases.length) console.log("%cAliases:%c " + item.aliases.join(", "), S.muted, "color:#d9e5f1");
        console.groupEnd();
      }
      console.groupEnd();
      return commands;
    }
    command(name) {
      const item = this.registry.get(name);
      if (!item) throw new Error(`Comando desconocido: ${name}.`);
      console.group("%c COMMAND %c " + item.name, S.brand, S.heading);
      console.log("%c" + item.description, "color:#d9e5f1;font-size:12px");
      console.log("\n%cUSO\n%c" + item.usage, S.heading, S.command);
      if (item.examples.length) {
        console.log("\n%cEJEMPLOS", S.heading);
        for (const example of item.examples) console.log("%c\u203A %c" + example, "color:#35e39a", S.command);
      }
      if (item.aliases.length) console.log("\n%cALIASES%c  " + item.aliases.join(", "), S.heading, S.muted);
      if (item.dangerous) console.warn("%c\u26A0 OPERACI\xD3N PELIGROSA%c  Crea un backup antes de continuar.", S.danger, S.muted);
      console.groupEnd();
      return item;
    }
  };

  // src/ui/styles.js
  var PANEL_CSS = `
:host{all:initial;color-scheme:dark;--bg:#07111f;--surface:#0d1b2d;--surface-2:#12243a;--line:rgba(148,163,184,.16);--text:#f8fafc;--muted:#8da2bd;--green:#35e39a;--green-2:#16b978;--cyan:#50c7f5;--amber:#fbbf24;--red:#fb7185;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}button,input,select{font:inherit}.cee-shell{position:fixed;right:22px;top:22px;z-index:2147483647;width:min(440px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 44px));display:flex;flex-direction:column;overflow:hidden;color:var(--text);background:linear-gradient(160deg,rgba(15,35,57,.98),rgba(5,14,27,.98));border:1px solid rgba(80,199,245,.2);border-radius:22px;box-shadow:0 32px 90px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.025) inset;backdrop-filter:blur(18px)}
.cee-shell:before{content:"";position:absolute;inset:0 0 auto;height:110px;pointer-events:none;background:radial-gradient(circle at 15% 0,rgba(53,227,154,.18),transparent 58%),radial-gradient(circle at 90% 0,rgba(80,199,245,.13),transparent 48%)}
.cee-header{position:relative;display:flex;align-items:center;gap:12px;padding:16px 17px 13px;cursor:grab;user-select:none}.cee-header:active{cursor:grabbing}.cee-mark{display:grid;place-items:center;width:40px;height:40px;flex:none;border-radius:13px;color:#032218;background:linear-gradient(145deg,#74f2bd,var(--green));box-shadow:0 8px 24px rgba(53,227,154,.24);font-size:19px;font-weight:950}.cee-brand{min-width:0;flex:1}.cee-brand strong{display:block;font-size:14px;letter-spacing:.06em}.cee-brand span{display:block;margin-top:2px;color:var(--muted);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.cee-icon-btn{display:grid;place-items:center;width:32px;height:32px;padding:0;color:var(--muted);background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:.16s ease}.cee-icon-btn:hover{color:var(--text);background:rgba(255,255,255,.09);transform:translateY(-1px)}
.cee-tabs{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:0 12px 10px;padding:4px;background:rgba(1,8,18,.48);border:1px solid var(--line);border-radius:13px}.cee-tab{padding:8px 5px;color:var(--muted);background:transparent;border:0;border-radius:9px;font-size:11px;font-weight:750;cursor:pointer;transition:.16s}.cee-tab:hover{color:var(--text)}.cee-tab.is-active{color:#062218;background:linear-gradient(135deg,var(--green),#6ee7b7);box-shadow:0 5px 16px rgba(53,227,154,.16)}
.cee-body{position:relative;min-height:260px;overflow:auto;padding:5px 16px 16px;scrollbar-width:thin;scrollbar-color:#29425f transparent}.cee-view[hidden]{display:none}.cee-kicker{margin:6px 0 5px;color:var(--green);font-size:10px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}.cee-title{margin:0 0 4px;font-size:23px;line-height:1.08;letter-spacing:-.035em}.cee-subtitle{margin:0 0 15px;color:var(--muted);font-size:12px;line-height:1.5}
.cee-hero{position:relative;overflow:hidden;padding:17px;margin-bottom:12px;background:linear-gradient(135deg,rgba(53,227,154,.13),rgba(80,199,245,.065));border:1px solid rgba(53,227,154,.2);border-radius:17px}.cee-hero:after{content:"";position:absolute;width:130px;height:130px;right:-55px;top:-66px;border:24px solid rgba(255,255,255,.035);border-radius:50%}.cee-player-line{display:flex;align-items:flex-end;justify-content:space-between;gap:15px}.cee-player-name{font-size:21px;font-weight:900;letter-spacing:-.025em}.cee-club{margin-top:3px;color:#b8c7d9;font-size:12px}.cee-ovr{text-align:center}.cee-ovr strong{display:block;color:var(--green);font-size:31px;line-height:.9;letter-spacing:-.06em}.cee-ovr span{font-size:8px;color:var(--muted);font-weight:900;letter-spacing:.16em}
.cee-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:11px 0}.cee-metric{padding:11px 10px;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:13px}.cee-metric span{display:block;color:var(--muted);font-size:9px;font-weight:750;text-transform:uppercase;letter-spacing:.09em}.cee-metric strong{display:block;margin-top:4px;font-size:16px}.cee-section-title{display:flex;align-items:center;justify-content:space-between;margin:15px 1px 8px;font-size:11px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#cfdae8}
.cee-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.cee-button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:39px;padding:8px 11px;color:#062218;background:linear-gradient(135deg,var(--green),#6ee7b7);border:0;border-radius:11px;font-size:11px;font-weight:850;cursor:pointer;transition:.16s;box-shadow:0 7px 18px rgba(53,227,154,.12)}.cee-button:hover{filter:brightness(1.07);transform:translateY(-1px)}.cee-button.secondary{color:#dbe8f5;background:rgba(255,255,255,.055);border:1px solid var(--line);box-shadow:none}.cee-button.danger{color:#ffdbe2;background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.22);box-shadow:none}.cee-button:disabled{opacity:.45;cursor:not-allowed;transform:none}
.cee-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cee-field{display:block}.cee-field.full{grid-column:1/-1}.cee-field span{display:block;margin:0 0 5px;color:var(--muted);font-size:10px;font-weight:700}.cee-input,.cee-select{width:100%;height:39px;padding:0 11px;color:var(--text);background:rgba(2,10,21,.65);border:1px solid var(--line);border-radius:10px;outline:0;transition:.15s}.cee-input:focus,.cee-select:focus{border-color:rgba(53,227,154,.62);box-shadow:0 0 0 3px rgba(53,227,154,.1)}
.cee-list{display:flex;flex-direction:column;gap:7px}.cee-row{display:flex;align-items:center;gap:10px;padding:10px 11px;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:12px}.cee-row-main{min-width:0;flex:1}.cee-row-main strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.cee-row-main span{display:block;margin-top:2px;color:var(--muted);font-size:10px}.cee-pill{flex:none;padding:4px 7px;color:var(--cyan);background:rgba(80,199,245,.09);border:1px solid rgba(80,199,245,.16);border-radius:999px;font-size:9px;font-weight:800}.cee-empty{padding:27px 15px;text-align:center;color:var(--muted);background:rgba(255,255,255,.025);border:1px dashed var(--line);border-radius:14px;font-size:11px;line-height:1.5}
.cee-footer{display:flex;align-items:center;gap:8px;padding:9px 16px;color:var(--muted);background:rgba(1,7,15,.5);border-top:1px solid var(--line);font-size:9px;letter-spacing:.04em}.cee-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green)}.cee-footer code{color:#c9f7e2}.cee-spacer{flex:1}.cee-toast{position:absolute;left:16px;right:16px;bottom:38px;z-index:5;padding:10px 12px;color:#dffbed;background:rgba(9,56,41,.96);border:1px solid rgba(53,227,154,.3);border-radius:11px;box-shadow:0 12px 30px #0008;font-size:11px;transform:translateY(8px);opacity:0;pointer-events:none;transition:.2s}.cee-toast.is-visible{transform:none;opacity:1}.cee-toast.is-error{color:#ffe4e8;background:rgba(77,22,35,.97);border-color:rgba(251,113,133,.34)}
.cee-search{position:relative;margin-bottom:10px}.cee-search .cee-input{padding-left:34px}.cee-search:before{content:"\u2315";position:absolute;left:11px;top:7px;color:var(--muted);font-size:19px}.cee-club-row{cursor:pointer;transition:.14s}.cee-club-row:hover{border-color:rgba(53,227,154,.35);background:rgba(53,227,154,.065);transform:translateX(2px)}.cee-logo{display:grid;place-items:center;width:34px;height:34px;flex:none;overflow:hidden;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:10px;font-size:11px;font-weight:900}.cee-logo img{width:100%;height:100%;object-fit:contain;padding:4px}.cee-message{margin-top:10px;min-height:18px;color:var(--muted);font-size:10px;line-height:1.4}
@media(max-width:520px){.cee-shell{right:12px;top:12px;max-height:calc(100vh - 24px)}.cee-form-grid{grid-template-columns:1fr}.cee-field.full{grid-column:auto}.cee-title{font-size:20px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;

  // src/ui/panel.js
  var money = (value) => {
    try {
      return new Intl.NumberFormat("es-ES", { notation: "compact", style: "currency", currency: "EUR", maximumFractionDigits: 1 }).format(Number(value) || 0);
    } catch {
      return String(value ?? 0);
    }
  };
  var text = (value) => value == null || value === "" ? "\u2014" : String(value);
  var html = (value) => text(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  function enableDrag(host, handle) {
    let drag = null;
    handle.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      const rect = host.getBoundingClientRect();
      drag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove", (event) => {
      if (!drag) return;
      host.style.left = `${Math.max(6, Math.min(innerWidth - host.offsetWidth - 6, event.clientX - drag.x))}px`;
      host.style.top = `${Math.max(6, Math.min(innerHeight - host.offsetHeight - 6, event.clientY - drag.y))}px`;
      host.style.right = "auto";
    });
    handle.addEventListener("pointerup", () => {
      drag = null;
    });
  }
  function openPanel(context, api) {
    closePanel(context);
    const host = document.createElement("div"), root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PANEL_CSS}</style><section class="cee-shell" role="dialog" aria-label="Copero Career Editor"><header class="cee-header"><div class="cee-mark">C</div><div class="cee-brand"><strong>COPERO CAREER EDITOR</strong><span>Control center \xB7 v${context.config.version}</span></div><button class="cee-icon-btn" data-action="refresh" title="Actualizar">\u21BB</button><button class="cee-icon-btn" data-action="close" title="Cerrar">\xD7</button></header><nav class="cee-tabs" aria-label="Secciones"><button class="cee-tab is-active" data-tab="overview">Resumen</button><button class="cee-tab" data-tab="player">Jugador</button><button class="cee-tab" data-tab="seasons">Temporadas</button><button class="cee-tab" data-tab="backups">Backups</button></nav><main class="cee-body"><section class="cee-view" data-view="overview"></section><section class="cee-view" data-view="player" hidden></section><section class="cee-view" data-view="seasons" hidden></section><section class="cee-view" data-view="backups" hidden></section></main><div class="cee-toast"></div><footer class="cee-footer"><i class="cee-dot"></i><span>Editor activo</span><span class="cee-spacer"></span><code class="cee-prefix"></code></footer></section>`;
    const shell = root.querySelector(".cee-shell"), toast = root.querySelector(".cee-toast");
    let toastTimer;
    const notify = (message, error = false) => {
      clearTimeout(toastTimer);
      toast.textContent = message;
      toast.className = `cee-toast is-visible${error ? " is-error" : ""}`;
      toastTimer = setTimeout(() => toast.className = "cee-toast", 2600);
    };
    const call = (label, action) => {
      try {
        const result = action();
        if (result === void 0 && context.runtime.lastError) notify(context.runtime.lastError.message, true);
        else notify(label);
        render();
        return result;
      } catch (error) {
        notify(error.message, true);
      }
    };
    const getState = () => context.stateManager.get();
    const renderOverview = (state) => {
      const p = state.player ?? {}, last = state.seasons?.at(-1);
      root.querySelector('[data-view="overview"]').innerHTML = `<p class="cee-kicker">Partida conectada</p><div class="cee-hero"><div class="cee-player-line"><div><div class="cee-player-name"></div><div class="cee-club"></div></div><div class="cee-ovr"><strong>${html(p.overall)}</strong><span>OVERALL</span></div></div></div><div class="cee-metrics"><div class="cee-metric"><span>Edad</span><strong>${html(p.age)}</strong></div><div class="cee-metric"><span>Valor</span><strong>${html(money(p.marketValue))}</strong></div><div class="cee-metric"><span>Temporadas</span><strong>${state.seasons?.length ?? 0}</strong></div></div><div class="cee-section-title">Acciones r\xE1pidas</div><div class="cee-actions"><button class="cee-button" data-quick="backup">\uFF0B Backup</button><button class="cee-button secondary" data-quick="undo">\u21B6 Deshacer</button><button class="cee-button secondary" data-quick="clubs">\u2315 Buscar club</button><button class="cee-button secondary" data-quick="help">? Ayuda</button></div><div class="cee-section-title">\xDAltima temporada</div><div class="cee-row"><div class="cee-row-main"><strong>${html(last?.teamId ?? "Sin temporadas")}</strong><span>${last ? `${Number(last.stats?.goals) || 0} goles \xB7 ${Number(last.stats?.assists) || 0} asistencias` : "A\xFAn no hay datos"}</span></div><span class="cee-pill">OVR ${html(last?.overall)}</span></div>`;
      root.querySelector(".cee-player-name").textContent = p.lastName || "Jugador";
      root.querySelector(".cee-club").textContent = `${text(p.position)} \xB7 ${text(p.currentTeamId ?? state.currentTeamId)}`;
    };
    const renderPlayer = (state) => {
      const p = state.player ?? {};
      root.querySelector('[data-view="player"]').innerHTML = `<p class="cee-kicker">Editar jugador</p><h2 class="cee-title">Tu carrera, tus reglas.</h2><p class="cee-subtitle">Los cambios se validan y pueden deshacerse desde el historial.</p><div class="cee-form-grid"><label class="cee-field full"><span>Apellido mostrado</span><input class="cee-input" data-field="name" value=""></label><label class="cee-field"><span>Overall</span><input class="cee-input" data-field="overall" type="number" min="1" max="99" value="${p.overall ?? ""}"></label><label class="cee-field"><span>Edad</span><input class="cee-input" data-field="age" type="number" min="0" value="${p.age ?? ""}"></label><label class="cee-field"><span>Valor de mercado</span><input class="cee-input" data-field="price" type="number" min="0" value="${p.marketValue ?? ""}"></label><label class="cee-field"><span>Dorsal</span><input class="cee-input" data-field="number" type="number" min="1" max="99" value="${p.preferredNumber ?? ""}"></label><label class="cee-field"><span>Posici\xF3n</span><input class="cee-input" data-field="position" value="${p.position ?? ""}"></label><label class="cee-field"><span>Pie preferido</span><select class="cee-select" data-field="foot"><option value="right">Derecho</option><option value="left">Izquierdo</option></select></label></div><div class="cee-section-title">Aplicar cambios</div><button class="cee-button" data-save-player>Guardar jugador</button>`;
      root.querySelector('[data-field="name"]').value = p.lastName ?? "";
      root.querySelector('[data-field="foot"]').value = p.preferredFoot ?? "right";
    };
    const renderSeasons = (state) => {
      const seasons = [...state.seasons ?? []].reverse();
      root.querySelector('[data-view="seasons"]').innerHTML = `<p class="cee-kicker">Historial</p><h2 class="cee-title">Temporadas</h2><p class="cee-subtitle">Un vistazo compacto a toda tu trayectoria.</p><div class="cee-list">${seasons.length ? seasons.map((s, i) => `<div class="cee-row"><span class="cee-pill">T${seasons.length - i}</span><div class="cee-row-main"><strong>${html(s.teamId)}</strong><span>${html(s.age)} a\xF1os \xB7 ${Number(s.stats?.appearances) || 0} PJ \xB7 ${Number(s.stats?.goals) || 0} G \xB7 ${Number(s.stats?.assists) || 0} A</span></div><span class="cee-pill">${html(s.overall)} OVR</span></div>`).join("") : '<div class="cee-empty">Todav\xEDa no hay temporadas terminadas.</div>'}</div>`;
    };
    const renderBackups = () => {
      const backups = context.backupManager.list();
      root.querySelector('[data-view="backups"]').innerHTML = `<p class="cee-kicker">Puntos de restauraci\xF3n</p><h2 class="cee-title">Backups</h2><p class="cee-subtitle">Crea una copia antes de probar cambios grandes.</p><div class="cee-actions"><button class="cee-button" data-create-backup>\uFF0B Crear backup</button><button class="cee-button secondary" data-redo>\u21B7 Rehacer</button></div><div class="cee-section-title">Guardados en memoria</div><div class="cee-list">${backups.length ? backups.map((b, i) => `<div class="cee-row"><div class="cee-row-main"><strong></strong><span>${b.phase} \xB7 ${b.seasons} temporadas</span></div><button class="cee-icon-btn" data-restore="${i}" title="Restaurar">\u21BA</button></div>`).join("") : '<div class="cee-empty">No hay backups disponibles.</div>'}</div>`;
      root.querySelectorAll("[data-restore]").forEach((button, i) => {
        button.parentElement.querySelector("strong").textContent = backups[i].name;
        button.onclick = () => call(`Backup ${backups[i].name} restaurado`, () => api.restore(backups[i].name));
      });
    };
    const render = () => {
      root.querySelector(".cee-prefix").textContent = context.config.prefix;
      try {
        const state = getState();
        renderOverview(state);
        renderPlayer(state);
        renderSeasons(state);
        renderBackups();
        bind();
      } catch (error) {
        root.querySelector('[data-view="overview"]').innerHTML = `<div class="cee-empty"><strong>No pude conectar con la partida.</strong><br>${error.message}</div>`;
        notify(error.message, true);
      }
    };
    const bind = () => {
      root.querySelector('[data-quick="backup"]')?.addEventListener("click", () => call("Backup creado", () => api.backup()));
      root.querySelector('[data-quick="undo"]')?.addEventListener("click", () => call("Cambio deshecho", () => api.undo()));
      root.querySelector('[data-quick="clubs"]')?.addEventListener("click", () => api.clubs.panel());
      root.querySelector('[data-quick="help"]')?.addEventListener("click", () => api.showHelp ? api.showHelp() : api.help);
      root.querySelector("[data-save-player]")?.addEventListener("click", () => {
        const patch = {};
        for (const input of root.querySelectorAll("[data-field]")) if (input.value !== "") patch[input.dataset.field] = input.type === "number" ? Number(input.value) : input.value;
        call("Jugador actualizado", () => api.player(patch));
      });
      root.querySelector("[data-create-backup]")?.addEventListener("click", () => call("Backup creado", () => api.backup()));
      root.querySelector("[data-redo]")?.addEventListener("click", () => call("Cambio rehecho", () => api.redo()));
    };
    root.querySelectorAll(".cee-tab").forEach((tab) => tab.onclick = () => {
      root.querySelectorAll(".cee-tab").forEach((x) => x.classList.toggle("is-active", x === tab));
      root.querySelectorAll(".cee-view").forEach((view) => view.hidden = view.dataset.view !== tab.dataset.tab);
    });
    root.querySelector('[data-action="close"]').onclick = () => closePanel(context);
    root.querySelector('[data-action="refresh"]').onclick = () => call("Panel actualizado", () => true);
    document.documentElement.append(host);
    context.runtime.panelHost = host;
    enableDrag(shell, root.querySelector(".cee-header"));
    render();
    return host;
  }
  function closePanel(context) {
    context.runtime.panelHost?.remove();
    context.runtime.panelHost = null;
  }

  // src/ui/club-picker.js
  function closeClubPicker(context) {
    context.runtime.clubPanelHost?.remove();
    context.runtime.clubPanelHost = null;
  }
  function openClubPicker(context, api, catalog) {
    closeClubPicker(context);
    const host = document.createElement("div"), root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PANEL_CSS}</style><section class="cee-shell" role="dialog" aria-label="Selector de clubes"><header class="cee-header"><div class="cee-mark">C</div><div class="cee-brand"><strong>SELECTOR DE CLUBES</strong><span>Cat\xE1logo verificado</span></div><button class="cee-icon-btn" data-close>\xD7</button></header><main class="cee-body"><p class="cee-kicker">Mercado de pases</p><h2 class="cee-title">Elige tu pr\xF3ximo club.</h2><p class="cee-subtitle">Prepararemos una opci\xF3n compatible para que la confirmes desde la interfaz original.</p><div class="cee-search"><input class="cee-input" placeholder="Buscar por nombre o ID\u2026" autocomplete="off"></div><label class="cee-field"><span>Estrategia</span><select class="cee-select"><option value="replace">Reemplazar la oferta 1</option><option value="add">A\xF1adir una oferta nueva</option></select></label><div class="cee-section-title"><span>Resultados</span><span class="cee-count"></span></div><div class="cee-list cee-results"></div><div class="cee-message"></div></main><footer class="cee-footer"><i class="cee-dot"></i><span>Solo clubes verificados</span><span class="cee-spacer"></span><code>${context.config.prefix}</code></footer></section>`;
    const input = root.querySelector("input"), results = root.querySelector(".cee-results"), message = root.querySelector(".cee-message"), count = root.querySelector(".cee-count");
    const showMessage = (value, error = false) => {
      message.textContent = value;
      message.style.color = error ? "var(--red)" : "var(--green)";
    };
    const render = () => {
      try {
        catalog.refresh();
        const clubs = catalog.search(input.value);
        count.textContent = `${clubs.length}`;
        if (!clubs.length) {
          results.innerHTML = '<div class="cee-empty">No encontr\xE9 clubes verificados con esa b\xFAsqueda.</div>';
          return;
        }
        results.replaceChildren(...clubs.slice(0, 50).map((club) => {
          const row = document.createElement("button");
          row.className = "cee-row cee-club-row";
          row.type = "button";
          const logo = document.createElement("span");
          logo.className = "cee-logo";
          if (club.logo_url) {
            const img = document.createElement("img");
            img.src = club.logo_url;
            img.alt = "";
            logo.append(img);
          } else logo.textContent = String(club.name ?? club.id).slice(0, 2).toUpperCase();
          const body = document.createElement("span");
          body.className = "cee-row-main";
          const title = document.createElement("strong");
          title.textContent = club.name ?? club.id;
          const detail = document.createElement("span");
          detail.textContent = `${club.id} \xB7 ${club.country ?? club.country_fifa_code ?? "Pa\xEDs desconocido"} \xB7 Divisi\xF3n ${club.division ?? club.divisionLevel ?? "?"}`;
          body.append(title, detail);
          const rep = document.createElement("span");
          rep.className = "cee-pill";
          rep.textContent = `REP ${club.reputation ?? club.international_reputation ?? "?"}`;
          row.append(logo, body, rep);
          row.onclick = () => {
            const before = context.runtime.lastError;
            const result = api.clubs.choose(club.id, { strategy: root.querySelector("select").value });
            if (result === void 0 && context.runtime.lastError !== before) showMessage(context.runtime.lastError.message, true);
            else showMessage(`Oferta de ${club.name ?? club.id} preparada. Ahora p\xFAlsala en el juego.`);
          };
          return row;
        }));
      } catch (error) {
        results.innerHTML = '<div class="cee-empty">No se pudo cargar el cat\xE1logo.</div>';
        showMessage(error.message, true);
      }
    };
    input.oninput = render;
    root.querySelector("[data-close]").onclick = () => closeClubPicker(context);
    document.documentElement.append(host);
    context.runtime.clubPanelHost = host;
    render();
    input.focus();
    return host;
  }

  // src/index.js
  function installCareerEditor() {
    const globalName = deriveGlobalName(CONFIG);
    const runtime = createRuntime();
    runtime.globalName = globalName;
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
      api = { __coperoCareerEditor: true, version: CONFIG.version };
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
      runtime.setPrefix = (value) => {
        const next = normalizePrefix(value);
        const previousName = runtime.globalName;
        if (next.name === previousName) return api;
        if (next.name in window && window[next.name] !== api) throw new Error(`window.${next.name} ya existe. Elige otro prefijo.`);
        Object.defineProperty(window, next.name, { value: api, configurable: true, writable: true });
        try {
          delete window[previousName];
        } catch {
          window[previousName] = void 0;
        }
        CONFIG.prefix = next.prefix;
        runtime.globalName = next.name;
        logger.success(`Prefijo temporal cambiado. Ahora usa ${next.prefix}help`);
        return api;
      };
      api.destroy = ({ silent = false } = {}) => {
        handler.run("unwatch");
        handler.run("unfreezeAll");
        closePanel(context);
        closeClubPicker(context);
        const activeName = runtime.globalName;
        try {
          delete window[activeName];
        } catch {
          window[activeName] = void 0;
        }
        if (!silent) logger.success("Editor desinstalado.");
        return true;
      };
      Object.defineProperties(api, { prefix: { enumerable: true, get() {
        return CONFIG.prefix;
      } }, help: { enumerable: true, get() {
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
