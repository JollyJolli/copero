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
    version: "3.0.0",
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
  var createRuntime = () => ({ installedAt: (/* @__PURE__ */ new Date()).toISOString(), lastLocator: null, watcherTimer: null, freezes: /* @__PURE__ */ new Map(), panelHost: null });

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
    constructor(config, runtime2) {
      this.config = config;
      this.runtime = runtime2;
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
    constructor(stateManager2) {
      this.stateManager = stateManager2;
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
    constructor(locator2, validator2, history, logger2) {
      this.locator = locator2;
      this.validator = validator2;
      this.history = history;
      this.logger = logger2;
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
    constructor(registry2, context2) {
      this.registry = registry2;
      this.context = context2;
    }
    run(name, ...args) {
      try {
        const command2 = this.registry.get(name);
        if (!command2) throw new Error(`Comando desconocido: ${name}. Usa ${this.context.config.prefix}help.`);
        command2.validate(args, this.context);
        return command2.execute(this.context, ...args);
      } catch (error) {
        this.context.logger.error(`Fall\xF3 ${name}. Prueba ${this.context.config.prefix}diagnose().`, this.context.config.debug ? error : error.message);
        return void 0;
      }
    }
  };

  // src/modules/helpers.js
  function command(registry2, data) {
    return registry2.register({ examples: [], aliases: [], dangerous: false, validate: () => {
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
  function normalizePlayerPatch(input, validator2, safe = true) {
    validator2.patch(input, "player");
    const patch = { ...input };
    for (const [alias, canonical] of Object.entries(aliases)) {
      if (alias in patch && !(canonical in patch)) patch[canonical] = patch[alias];
      delete patch[alias];
    }
    if ("overall" in patch) patch.overall = validator2.number(patch.overall, "overall", safe ? { integer: true, min: 1, max: 99 } : { integer: true });
    if ("age" in patch) patch.age = validator2.number(patch.age, "age", { integer: true, min: 0, ...safe ? { max: 100 } : {} });
    if ("preferredNumber" in patch) patch.preferredNumber = validator2.number(patch.preferredNumber, "dorsal", { integer: true, min: 1, max: 99 });
    if ("marketValue" in patch) patch.marketValue = validator2.number(patch.marketValue, "valor", { min: 0 });
    if ("preferredFoot" in patch) {
      patch.preferredFoot = String(patch.preferredFoot).toLowerCase();
      if (safe && !["left", "right"].includes(patch.preferredFoot)) throw new Error("Pie inv\xE1lido.");
    }
    if ("position" in patch) patch.position = String(patch.position).toUpperCase();
    for (const key of ["lastName", "currentTeamId"]) if (key in patch) patch[key] = String(patch[key]);
    return patch;
  }
  function registerPlayer(registry2) {
    command(registry2, { name: "player.set", category: "player", description: "Actualiza el jugador.", usage: "careerEditor.player.set({...})", aliases: ["player"], execute: ({ stateManager: stateManager2, validator: validator2, config }, patch) => stateManager2.mutate("Jugador actualizado", (draft) => {
      if (!draft.player) throw new Error("La partida no tiene jugador.");
      const normalized2 = normalizePlayerPatch(patch, validator2, config.safeMode);
      draft.player = { ...draft.player, ...normalized2 };
      if ("currentTeamId" in normalized2) {
        draft.currentTeamId = normalized2.currentTeamId;
        if (draft.contractTeamId != null) draft.contractTeamId = normalized2.currentTeamId;
      }
    }) });
    for (const [name, field] of Object.entries({ overall: "overall", price: "marketValue", age: "age", name: "lastName", number: "preferredNumber", foot: "preferredFoot", position: "position", team: "currentTeamId" })) command(registry2, { name: `player.${name}`, category: "player", description: `Cambia ${field}.`, usage: `careerEditor.player.${name}(value)`, aliases: [name], execute: (ctx, value, options = {}) => {
      const result = ctx.registry.get("player.set").execute(ctx, { [field]: value });
      if (options.lastSeason && ctx.stateManager.get().seasons.length) ctx.registry.get("seasons.edit").execute(ctx, "last", { [field === "currentTeamId" ? "teamId" : field]: value });
      return result;
    } });
    command(registry2, { name: "player.get", category: "player", description: "Obtiene el jugador.", usage: "careerEditor.player.get()", execute: ({ stateManager: stateManager2 }) => structuredClone(stateManager2.get().player) });
  }

  // src/modules/seasons.js
  function registerSeasons(registry2) {
    command(registry2, { name: "seasons.get", category: "seasons", description: "Obtiene temporadas.", usage: "careerEditor.seasons.get(3)", execute: ({ stateManager: stateManager2 }, selector = "all") => {
      const state = stateManager2.get();
      return resolveSeasonIndexes(state, selector).map((i) => structuredClone(state.seasons[i]));
    } });
    command(registry2, { name: "seasons.edit", category: "seasons", description: "Edita temporadas.", usage: "careerEditor.seasons.edit(3,{...})", aliases: ["season"], execute: ({ stateManager: stateManager2, validator: validator2 }, selector, patch) => {
      validator2.patch(patch, "temporada");
      return stateManager2.mutate("Temporada actualizada", (draft) => {
        for (const i of resolveSeasonIndexes(draft, selector)) draft.seasons[i] = { ...draft.seasons[i], ...structuredClone(patch), stats: patch.stats ? { ...draft.seasons[i].stats, ...patch.stats } : draft.seasons[i].stats };
      });
    } });
    command(registry2, { name: "seasons.last", category: "seasons", description: "Obtiene o edita la \xFAltima.", usage: "careerEditor.seasons.last({...})", aliases: ["lastSeason"], execute: (ctx, patch) => patch === void 0 ? ctx.registry.get("seasons.get").execute(ctx, "last")[0] : ctx.registry.get("seasons.edit").execute(ctx, "last", patch) });
    command(registry2, { name: "seasons.all", category: "seasons", description: "Edita todas.", usage: "careerEditor.allSeasons({...})", aliases: ["allSeasons"], execute: (ctx, patch) => ctx.registry.get("seasons.edit").execute(ctx, "all", patch) });
    command(registry2, { name: "seasons.table", category: "seasons", description: "Tabla de temporadas.", usage: "careerEditor.seasons.table()", execute: ({ stateManager: stateManager2 }) => {
      const rows = stateManager2.get().seasons.map((s, i) => ({ season: i + 1, age: s.age, team: s.teamId, overall: s.overall, marketValue: s.marketValue, appearances: s.stats?.appearances ?? 0, goals: s.stats?.goals ?? 0, assists: s.stats?.assists ?? 0, trophies: s.trophies?.length ?? 0, awards: s.awards?.length ?? 0 }));
      console.table(rows);
      return rows;
    } });
    command(registry2, { name: "seasons.compare", category: "seasons", description: "Compara temporadas.", usage: "careerEditor.seasons.compare(3,5)", execute: (ctx, a, b) => {
      const rows = [a, b].map((x) => ctx.registry.get("seasons.get").execute(ctx, x)[0]);
      console.table(rows);
      return rows;
    } });
  }

  // src/modules/stats.js
  var keys = ["appearances", "goals", "assists", "cleanSheets", "goalsConceded", "trophies", "awards"];
  function normalized(patch, validator2) {
    validator2.patch(patch, "estad\xEDsticas");
    return Object.fromEntries(Object.entries(patch).map(([k, v]) => {
      if (!keys.includes(k)) throw new Error(`Estad\xEDstica desconocida: ${k}.`);
      return [k, validator2.number(v, k, { integer: true, min: 0 })];
    }));
  }
  function registerStats(registry2) {
    command(registry2, { name: "stats.get", category: "stats", description: "Obtiene totales.", usage: "careerEditor.stats.get()", execute: ({ stateManager: stateManager2 }) => structuredClone(stateManager2.get().totals) });
    command(registry2, { name: "stats.set", category: "stats", description: "Reemplaza totales indicados.", usage: "careerEditor.stats.set({...})", aliases: ["totals"], execute: ({ stateManager: stateManager2, validator: validator2 }, patch) => stateManager2.mutate("Totales actualizados", (d) => {
      d.totals = { ...d.totals, ...normalized(patch, validator2) };
    }) });
    command(registry2, { name: "stats.add", category: "stats", description: "Suma a totales.", usage: "careerEditor.stats.add({...})", execute: ({ stateManager: stateManager2, validator: validator2 }, patch) => stateManager2.mutate("Totales incrementados", (d) => {
      for (const [k, v] of Object.entries(normalized(patch, validator2))) d.totals[k] = (Number(d.totals[k]) || 0) + v;
    }) });
    command(registry2, { name: "stats.recalculate", category: "stats", description: "Recalcula desde temporadas.", usage: "careerEditor.stats.recalculate()", aliases: ["recalculateTotals"], execute: ({ stateManager: stateManager2 }) => stateManager2.mutate("Totales recalculados", (d) => {
      d.totals = recalculateTotals(d);
    }) });
    command(registry2, { name: "stats.lastSeason", category: "stats", description: "Edita estad\xEDsticas de \xFAltima temporada.", usage: "careerEditor.stats.lastSeason({...})", execute: (ctx, patch) => ctx.registry.get("seasons.edit").execute(ctx, "last", { stats: normalized(patch, ctx.validator) }) });
  }

  // src/modules/trophies.js
  var TROPHIES = ["league", "cup", "continental_primary", "continental_secondary", "club_world_cup", "national_continental", "world_cup"];
  var AWARDS = ["ballon_dor", "golden_boot", "golden_glove"];
  function registerCollection(registry2, plural, singular, known, legacyAdd, legacyRemove) {
    command(registry2, { name: `${plural}.add`, category: plural, description: `A\xF1ade ${singular}.`, usage: `careerEditor.${plural}.add(id)`, aliases: [legacyAdd], execute: ({ stateManager: stateManager2, config }, id, options = {}) => {
      id = String(id);
      if (config.safeMode && !known.includes(id)) throw new Error(`${singular} desconocido: ${id}.`);
      const amount = Number(options.amount ?? 1);
      return stateManager2.mutate(`${singular} a\xF1adido`, (d) => {
        for (const i of resolveSeasonIndexes(d, options.season ?? "last")) {
          const list = d.seasons[i][plural] ??= [];
          for (let n = 0; n < amount; n++) if (options.allowDuplicates || !list.includes(id)) list.push(id);
        }
        d.totals = recalculateTotals(d);
      });
    } });
    command(registry2, { name: `${plural}.remove`, category: plural, description: `Elimina ${singular}.`, usage: `careerEditor.${plural}.remove(id)`, aliases: [legacyRemove], execute: ({ stateManager: stateManager2 }, id, selector = "last") => stateManager2.mutate(`${singular} eliminado`, (d) => {
      for (const i of resolveSeasonIndexes(d, selector)) d.seasons[i][plural] = (d.seasons[i][plural] ?? []).filter((x) => x !== id);
      d.totals = recalculateTotals(d);
    }) });
    command(registry2, { name: `${plural}.set`, category: plural, description: `Fija cantidad de ${singular}.`, usage: `careerEditor.${plural}.set(id,n)`, execute: (ctx, id, amount, selector = "last") => {
      ctx.registry.get(`${plural}.remove`).execute(ctx, id, selector);
      return ctx.registry.get(`${plural}.add`).execute(ctx, id, { amount, season: selector, allowDuplicates: true });
    } });
    command(registry2, { name: `${plural}.list`, category: plural, description: `Lista ${plural}.`, usage: `careerEditor.${plural}.list()`, execute: ({ stateManager: stateManager2 }) => stateManager2.get().seasons.flatMap((s) => s[plural] ?? []) });
    command(registry2, { name: `${plural}.count`, category: plural, description: `Cuenta ${plural}.`, usage: `careerEditor.${plural}.count()`, execute: (ctx) => ctx.registry.get(`${plural}.list`).execute(ctx).reduce((m, id) => ({ ...m, [id]: (m[id] ?? 0) + 1 }), {}) });
    command(registry2, { name: `${plural}.clear`, category: plural, description: `Borra ${plural}.`, usage: `careerEditor.${plural}.clear()`, dangerous: true, execute: ({ stateManager: stateManager2 }) => stateManager2.mutate(`${plural} eliminados`, (d) => {
      for (const s of d.seasons) s[plural] = [];
      d.totals = recalculateTotals(d);
    }) });
  }
  function registerTrophies(registry2) {
    registerCollection(registry2, "trophies", "trofeo", TROPHIES, "addTrophy", "removeTrophy");
    registerCollection(registry2, "awards", "premio", AWARDS, "addAward", "removeAward");
  }

  // src/modules/clubs.js
  var CLUB_KEYS = ["teamId", "clubId", "currentTeamId", "targetTeamId"];
  var ClubCatalog = class {
    constructor(stateManager2) {
      this.stateManager = stateManager2;
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
  function registerClubs(registry2, catalog2) {
    command(registry2, { name: "clubs.list", category: "clubs", description: "Lista clubes descubiertos.", usage: "careerEditor.clubs.list()", execute: (_, filters) => {
      catalog2.refresh();
      const rows = catalog2.list(filters);
      console.table(rows);
      return rows;
    } });
    command(registry2, { name: "clubs.search", category: "clubs", description: "Busca clubes.", usage: 'careerEditor.clubs.search("Barcelona")', execute: (_, query) => {
      catalog2.refresh();
      const rows = catalog2.search(query);
      console.table(rows);
      return rows;
    } });
    command(registry2, { name: "clubs.current", category: "clubs", description: "Club actual.", usage: "careerEditor.clubs.current()", execute: ({ stateManager: stateManager2 }) => {
      catalog2.refresh();
      return catalog2.getById(stateManager2.get().player?.currentTeamId ?? stateManager2.get().currentTeamId);
    } });
    command(registry2, { name: "clubs.offers", category: "clubs", description: "Ofertas actuales.", usage: "careerEditor.clubs.offers()", execute: ({ stateManager: stateManager2 }) => compatibleOffers(stateManager2.get()).map(({ option, index, key }) => ({ number: index + 1, clubId: option[key], option })) });
    for (const [name, add] of [["replaceOffer", false], ["addOffer", true]]) command(registry2, { name: `clubs.${name}`, category: "clubs", description: `${add ? "A\xF1ade" : "Reemplaza"} una oferta clonada.`, usage: `careerEditor.clubs.${name}(${add ? "" : "1,"}"club")`, execute: ({ stateManager: stateManager2 }, first, second) => {
      catalog2.refresh();
      const id = add ? first : second;
      const club = catalog2.getById(id);
      if (!club) throw new Error(`Club no verificado: ${id}. Usa careerEditor.clubs.search().`);
      let result;
      stateManager2.mutate(`Oferta ${add ? "a\xF1adida" : "reemplazada"}`, (d) => {
        result = replaceOfferState(d, add ? 1 : first, club, add);
      });
      return result;
    } });
    command(registry2, { name: "clubs.removeOffer", category: "clubs", description: "Elimina una oferta.", usage: "careerEditor.clubs.removeOffer(2)", dangerous: true, execute: ({ stateManager: stateManager2 }, number) => stateManager2.mutate("Oferta eliminada", (d) => {
      const i = Number(number) - 1;
      if (!d.currentEvent?.options?.[i]) throw new Error("Oferta inexistente.");
      d.currentEvent.options.splice(i, 1);
    }) });
    command(registry2, { name: "clubs.choose", category: "clubs", description: "Prepara una oferta para elegirla en la UI.", usage: 'careerEditor.clubs.choose("club")', execute: (ctx, id, options = {}) => {
      const strategy = options.strategy ?? "auto";
      const result = strategy === "add" ? ctx.registry.get("clubs.addOffer").execute(ctx, id) : ctx.registry.get("clubs.replaceOffer").execute(ctx, options.offer ?? 1, id);
      ctx.logger.info("Oferta preparada. Pulsa la opci\xF3n en la interfaz original.");
      return result;
    } });
  }

  // src/modules/import-export.js
  function registerImportExport(registry2) {
    command(registry2, { name: "export", category: "data", description: "Exporta JSON.", usage: "careerEditor.export()", execute: async ({ stateManager: stateManager2, config }, options = {}) => {
      const value = options.legacy ? stateManager2.snapshot() : { editorVersion: config.version, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), gameState: stateManager2.snapshot() };
      const json = JSON.stringify(value, null, options.pretty === false ? 0 : 2);
      if (options.copy !== false && navigator.clipboard?.writeText) await navigator.clipboard.writeText(json);
      return json;
    } });
    command(registry2, { name: "import", category: "data", description: "Importa estado.", usage: "careerEditor.import(json)", dangerous: true, execute: ({ stateManager: stateManager2, validator: validator2 }, input) => {
      const parsed = typeof input === "string" ? JSON.parse(input) : input;
      const state = parsed?.gameState ?? parsed;
      if (!validator2.gameState(state)) throw new Error("La importaci\xF3n no contiene un estado v\xE1lido.");
      return stateManager2.replace("Partida importada", state);
    } });
    command(registry2, { name: "download", category: "data", description: "Descarga JSON.", usage: "careerEditor.download()", execute: async (ctx, filename = `career-${Date.now()}.json`) => {
      const json = await registry2.get("export").execute(ctx, { copy: false });
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
  function registerPresets(registry2) {
    command(registry2, { name: "presets.list", category: "presets", description: "Lista presets.", usage: "careerEditor.presets.list()", execute: () => [...initial.keys()] });
    command(registry2, { name: "presets.apply", category: "presets", description: "Aplica preset solo al jugador.", usage: 'careerEditor.presets.apply("goat")', execute: (ctx, name) => {
      const patch = initial.get(name);
      if (!patch) throw new Error("Preset desconocido.");
      return ctx.registry.get("player.set").execute(ctx, patch);
    } });
    command(registry2, { name: "presets.create", category: "presets", description: "Crea preset.", usage: 'careerEditor.presets.create("x",{...})', execute: ({ validator: validator2 }, name, patch) => {
      validator2.patch(patch);
      initial.set(String(name), structuredClone(patch));
      return name;
    } });
    command(registry2, { name: "presets.remove", category: "presets", description: "Elimina preset.", usage: 'careerEditor.presets.remove("x")', execute: (_, name) => initial.delete(String(name)) });
  }

  // src/core/paths.js
  var getAtPath = (root, path, validator2) => validator2.path(path).reduce((v, key) => v?.[key], root);
  function setAtPath(root, path, value, validator2) {
    const parts = validator2.path(path);
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!isObject(cursor[key])) cursor[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cursor = cursor[key];
    }
    cursor[parts.at(-1)] = value;
  }
  function deleteAtPath(root, path, validator2) {
    const parts = validator2.path(path);
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
  function registerWatcher(registry2) {
    command(registry2, { name: "watch", category: "runtime", description: "Observa cambios.", usage: "careerEditor.watch()", execute: ({ runtime: runtime2, stateManager: stateManager2, logger: logger2 }, ms = 1e3) => {
      clearInterval(runtime2.watcherTimer);
      let prior = JSON.stringify(stateManager2.get());
      runtime2.watcherTimer = setInterval(() => {
        try {
          const next = JSON.stringify(stateManager2.get());
          if (next !== prior) logger2.info("Cambio detectado");
          prior = next;
        } catch {
        }
      }, Math.max(250, Number(ms)));
      return true;
    } });
    command(registry2, { name: "unwatch", category: "runtime", description: "Detiene watcher.", usage: "careerEditor.unwatch()", execute: ({ runtime: runtime2 }) => {
      clearInterval(runtime2.watcherTimer);
      runtime2.watcherTimer = null;
      return true;
    } });
    command(registry2, { name: "freeze", category: "runtime", description: "Congela ruta.", usage: 'careerEditor.freeze("player.overall",99)', execute: ({ runtime: runtime2, stateManager: stateManager2, validator: validator2 }, path, value) => {
      validator2.path(path);
      if (runtime2.freezes.has(path)) clearInterval(runtime2.freezes.get(path));
      runtime2.freezes.set(path, setInterval(() => {
        try {
          if (getAtPath(stateManager2.get(), path, validator2) !== value) stateManager2.mutate(`Freeze ${path}`, (d) => {
            const parts = validator2.path(path);
            let c = d;
            for (const k of parts.slice(0, -1)) c = c[k];
            c[parts.at(-1)] = structuredClone(value);
          });
        } catch {
        }
      }, 1e3));
      return true;
    } });
    command(registry2, { name: "unfreeze", category: "runtime", description: "Descongela ruta.", usage: "careerEditor.unfreeze(path)", execute: ({ runtime: runtime2 }, path) => {
      clearInterval(runtime2.freezes.get(path));
      return runtime2.freezes.delete(path);
    } });
    command(registry2, { name: "unfreezeAll", category: "runtime", description: "Detiene freezes.", usage: "careerEditor.unfreezeAll()", execute: ({ runtime: runtime2 }) => {
      for (const timer of runtime2.freezes.values()) clearInterval(timer);
      runtime2.freezes.clear();
      return true;
    } });
  }

  // src/modules/core-commands.js
  function registerCore(registry2, help2, panels2) {
    command(registry2, { name: "inspect", category: "core", description: "Copia estado.", usage: "careerEditor.inspect()", execute: ({ stateManager: stateManager2 }) => stateManager2.snapshot() });
    command(registry2, { name: "summary", category: "core", description: "Resumen.", usage: "careerEditor.summary()", execute: ({ stateManager: stateManager2 }) => {
      const s = stateManager2.get();
      const v = { phase: s.phase, step: s.step, player: s.player, seasons: s.seasons.length, totals: s.totals, currentEvent: s.currentEvent ? { id: s.currentEvent.id, type: s.currentEvent.type, options: s.currentEvent.options?.length } : null };
      console.log(v);
      return v;
    } });
    command(registry2, { name: "set", category: "core", description: "Modifica ruta.", usage: "careerEditor.set(path,value)", execute: ({ stateManager: stateManager2, validator: validator2 }, path, value) => stateManager2.mutate(`Ruta modificada: ${path}`, (d) => setAtPath(d, path, clone(value), validator2)) });
    command(registry2, { name: "merge", category: "core", description: "Fusiona objeto.", usage: "careerEditor.merge(path,patch)", execute: ({ stateManager: stateManager2, validator: validator2 }, path, patch) => stateManager2.mutate(`Ruta fusionada: ${path}`, (d) => {
      validator2.patch(patch);
      const current = getAtPath(d, path, validator2);
      validator2.patch(current);
      setAtPath(d, path, { ...current, ...clone(patch) }, validator2);
    }) });
    command(registry2, { name: "remove", category: "core", description: "Elimina ruta.", usage: "careerEditor.remove(path)", dangerous: true, execute: ({ stateManager: stateManager2, validator: validator2, config }, path) => {
      if (config.safeMode && ["phase", "seed", "player", "seasons", "totals"].includes(validator2.path(path)[0])) throw new Error("Modo seguro bloquea eliminar una propiedad esencial.");
      return stateManager2.mutate(`Ruta eliminada: ${path}`, (d) => {
        if (!deleteAtPath(d, path, validator2)) throw new Error("La ruta no existe.");
      });
    } });
    command(registry2, { name: "backup", category: "backups", description: "Crea backup.", usage: "careerEditor.backup(name)", execute: ({ backupManager: backupManager2 }, name = timestampName()) => backupManager2.create(name) });
    command(registry2, { name: "restore", category: "backups", description: "Restaura backup.", usage: "careerEditor.restore(name)", dangerous: true, execute: ({ backupManager: backupManager2 }, name = "original") => backupManager2.restore(name) });
    command(registry2, { name: "deleteBackup", category: "backups", description: "Elimina backup.", usage: "careerEditor.deleteBackup(name)", dangerous: true, execute: ({ backupManager: backupManager2 }, name) => backupManager2.remove(name) });
    command(registry2, { name: "undo", category: "backups", description: "Deshace.", usage: "careerEditor.undo()", execute: ({ stateManager: stateManager2, historyManager: historyManager2 }) => stateManager2.replace("Deshacer", historyManager2.undo(stateManager2.get()), { history: false }) });
    command(registry2, { name: "redo", category: "backups", description: "Rehace.", usage: "careerEditor.redo()", execute: ({ stateManager: stateManager2, historyManager: historyManager2 }) => stateManager2.replace("Rehacer", historyManager2.redo(stateManager2.get()), { history: false }) });
    command(registry2, { name: "safeMode", category: "core", description: "Configura modo seguro.", usage: "careerEditor.safeMode(true)", execute: ({ config }, value) => config.safeMode = Boolean(value) });
    command(registry2, { name: "validate", category: "core", description: "Valida estado.", usage: "careerEditor.validate()", execute: ({ stateManager: stateManager2 }) => stateManager2.validate(stateManager2.get()) });
    command(registry2, { name: "repair", category: "core", description: "Repara \xFAnicamente colecciones seguras.", usage: "careerEditor.repair()", execute: ({ stateManager: stateManager2 }) => stateManager2.mutate("Reparaci\xF3n segura", (d) => {
      d.seasons ??= [];
      d.totals ??= {};
      d.log ??= [];
    }) });
    command(registry2, { name: "refresh", category: "runtime", description: "Relocaliza React.", usage: "careerEditor.refresh()", execute: ({ stateManager: stateManager2 }) => stateManager2.refreshConnection() });
    command(registry2, { name: "diagnose", category: "runtime", description: "Diagn\xF3stico.", usage: "careerEditor.diagnose()", execute: ({ runtime: runtime2, historyManager: historyManager2, backupManager: backupManager2 }) => {
      const v = { locator: runtime2.lastLocator, history: historyManager2.list(), backups: backupManager2.list(), panelOpen: Boolean(runtime2.panelHost) };
      console.log(v);
      return v;
    } });
    command(registry2, { name: "helpFor", category: "core", description: "Ayuda de categor\xEDa.", usage: "careerEditor.helpFor(category)", execute: (_, name) => help2.category(name) });
    command(registry2, { name: "helpCommand", category: "core", description: "Ayuda de comando.", usage: "careerEditor.helpCommand(name)", execute: (_, name) => help2.command(name) });
    command(registry2, { name: "panel", category: "runtime", description: "Abre panel.", usage: "careerEditor.panel()", execute: (ctx) => panels2.open(ctx) });
    command(registry2, { name: "closePanel", category: "runtime", description: "Cierra panel.", usage: "careerEditor.closePanel()", execute: (ctx) => panels2.close(ctx) });
  }

  // src/help/help-renderer.js
  var icons = { player: "\u{1F464}", seasons: "\u{1F4C5}", trophies: "\u{1F3C6}", awards: "\u{1F947}", clubs: "\u{1F3DF}\uFE0F", backups: "\u{1F4BE}", stats: "\u{1F4CA}", data: "\u{1F4E6}", runtime: "\u2699\uFE0F", presets: "\u2728", core: "\u{1F9F0}" };
  var HelpRenderer = class {
    constructor(registry2, config) {
      this.registry = registry2;
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
  function openPanel(context2, api2) {
    closePanel(context2);
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PANEL_CSS}</style><div class="panel"><button class="close">\xD7</button><h2>Copero Career Editor</h2><p class="muted">Panel modular v${context2.config.version}</p><div id="summary"></div><button id="backup">Crear backup</button><button id="clubs">Selector de clubes</button></div>`;
    root.querySelector(".close").onclick = () => closePanel(context2);
    root.querySelector("#backup").onclick = () => api2.backup();
    root.querySelector("#clubs").onclick = () => api2.clubs.panel();
    try {
      const s = context2.stateManager.get();
      root.querySelector("#summary").textContent = `${s.player?.lastName ?? "Jugador"} \xB7 OVR ${s.player?.overall ?? "?"} \xB7 ${s.seasons.length} temporadas`;
    } catch (e) {
      root.querySelector("#summary").textContent = e.message;
    }
    document.documentElement.append(host);
    context2.runtime.panelHost = host;
    return host;
  }
  function closePanel(context2) {
    context2.runtime.panelHost?.remove();
    context2.runtime.panelHost = null;
  }

  // src/ui/club-picker.js
  function openClubPicker(context2, api2, catalog2) {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PANEL_CSS}</style><div class="panel"><button class="close">\xD7</button><h2>Clubes verificados</h2><input placeholder="Buscar club"><select><option value="replace">Reemplazar oferta 1</option><option value="add">A\xF1adir oferta</option></select><div class="results"></div><div class="muted message"></div></div>`;
    root.querySelector(".close").onclick = () => host.remove();
    const input = root.querySelector("input"), results = root.querySelector(".results"), message = root.querySelector(".message");
    const render = () => {
      try {
        catalog2.refresh();
        results.replaceChildren(...catalog2.search(input.value).map((club) => {
          const row = document.createElement("div");
          row.className = "row";
          row.textContent = `${club.name} (${club.id}) \xB7 ${club.country ?? "?"} \xB7 D${club.division ?? "?"} \xB7 Rep ${club.reputation ?? club.international_reputation ?? "?"}`;
          row.onclick = () => {
            try {
              api2.clubs.choose(club.id, { strategy: root.querySelector("select").value });
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
  var globalName = deriveGlobalName(CONFIG);
  var old = window[globalName];
  if (old?.__coperoCareerEditor) old.destroy?.({ silent: true });
  var runtime = createRuntime();
  var logger = new Logger(CONFIG);
  var validator = new Validator(CONFIG);
  var historyManager = new HistoryManager(CONFIG.maxHistoryEntries);
  var locator = new ReactLocator(CONFIG, runtime);
  var stateManager = new StateManager(locator, validator, historyManager, logger);
  var backupManager = new BackupManager(stateManager);
  var registry = new CommandRegistry();
  var catalog = new ClubCatalog(stateManager);
  var help = new HelpRenderer(registry, CONFIG);
  var api;
  var context = { config: CONFIG, runtime, stateManager, historyManager, backupManager, validator, logger, registry };
  var panels = { open: (ctx) => openPanel(ctx, api), close: closePanel };
  registerPlayer(registry);
  registerSeasons(registry);
  registerStats(registry);
  registerTrophies(registry);
  registerClubs(registry, catalog);
  registerImportExport(registry);
  registerPresets(registry);
  registerWatcher(registry);
  registerCore(registry, help, panels);
  var handler = new CommandHandler(registry, context);
  api = { __coperoCareerEditor: true, version: CONFIG.version, prefix: CONFIG.prefix };
  var namespaces = {};
  for (const c of registry.list()) {
    const parts = c.name.split(".");
    if (parts.length === 2) {
      const [space, name] = parts;
      (namespaces[space] ??= {})[name] = (...args) => handler.run(c.name, ...args);
    }
    for (const alias of c.aliases) api[alias] = (...args) => handler.run(alias, ...args);
    if (parts.length === 1) api[c.name] = (...args) => handler.run(c.name, ...args);
  }
  for (const [space, methods] of Object.entries(namespaces)) {
    if (typeof api[space] === "function") attachMethods(api[space], methods);
    else api[space] = methods;
  }
  api.backups = { ...api.backups, create: (...a) => handler.run("backup", ...a), restore: (...a) => handler.run("restore", ...a), remove: (...a) => handler.run("deleteBackup", ...a), list: () => backupManager.list(), exists: (n) => backupManager.exists(n) };
  api.clubs.panel = () => openClubPicker(context, api, catalog);
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
    return help.overview();
  } }, status: { enumerable: true, get() {
    return handler.run("summary");
  } }, get: { enumerable: true, get() {
    return handler.run("inspect");
  } } });
  window[globalName] = api;
  try {
    if (CONFIG.autoBackupOnInstall) backupManager.create("original");
    logger.success(`v${CONFIG.version} instalado. Usa ${CONFIG.prefix}help`);
  } catch (error) {
    logger.warning('Editor instalado, pero no se cre\xF3 backup original. Abre una partida y usa careerEditor.backup("original").', error.message);
  }
})();
