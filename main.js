(() => {
  'use strict';

  /* ================================================================
   * CONFIGURACIÓN RÁPIDA
   * Cambia únicamente esta línea para modificar el prefijo global.
   * Mantén el punto final si quieres escribir comandos como:
   * careerEditor.help
   * ================================================================ */
  const PREFIX = 'careerEditor.';

  const VERSION = '2.0.0';
  const GLOBAL_NAME = PREFIX.trim().replace(/\.+$/, '') || 'careerEditor';

  const CONFIG = Object.freeze({
    autoBackupOnInstall: true,
    autoHistory: true,
    maxHistoryEntries: 50,
    syncCurrentTeamFields: true,
    strictEnums: false,
    consoleTag: `[${GLOBAL_NAME}]`,
    panelId: `${GLOBAL_NAME}-panel-host`,
    selectors: ['[data-career-phase]'],
  });

  const KNOWN = Object.freeze({
    positions: [
      'LW',
      'ST',
      'RW',
      'LM',
      'CAM',
      'RM',
      'LB',
      'CM',
      'RB',
      'CDM',
      'CB',
      'GK',
    ],
    feet: ['left', 'right'],
    trophies: [
      'league',
      'cup',
      'continental_primary',
      'continental_secondary',
      'club_world_cup',
      'national_continental',
      'world_cup',
    ],
    awards: [
      'ballon_dor',
      'golden_boot',
      'golden_glove',
    ],
    phases: [
      'intro',
      'identity',
      'career',
      'summary',
    ],
  });

  const runtime = {
    installedAt: new Date().toISOString(),
    original: null,
    backups: new Map(),
    undoStack: [],
    redoStack: [],
    watcherTimer: null,
    watcherLastFingerprint: null,
    panelHost: null,
    panelTimer: null,
    lastLocator: null,
  };

  const styles = {
    title: 'color:#22c55e;font-weight:900;font-size:14px',
    ok: 'color:#22c55e;font-weight:700',
    warn: 'color:#f59e0b;font-weight:700',
    error: 'color:#ef4444;font-weight:800',
    info: 'color:#38bdf8;font-weight:700',
    dim: 'color:#94a3b8',
  };

  function log(...args) {
    console.log(CONFIG.consoleTag, ...args);
  }

  function ok(message, value) {
    console.log(
      `%c${CONFIG.consoleTag} ${message}`,
      styles.ok,
      value ?? '',
    );
  }

  function warn(message, value) {
    console.warn(
      `%c${CONFIG.consoleTag} ${message}`,
      styles.warn,
      value ?? '',
    );
  }

  function fail(message, error) {
    console.error(
      `%c${CONFIG.consoleTag} ${message}`,
      styles.error,
      error ?? '',
    );
  }

  function clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return value !== null && typeof value === 'object';
  }

  function isPlainObject(value) {
    if (!isObject(value)) {
      return false;
    }

    const proto = Object.getPrototypeOf(value);

    return (
      proto === Object.prototype ||
      proto === null
    );
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function asFiniteNumber(
    value,
    label,
    options = {},
  ) {
    const number = Number(value);

    assert(
      Number.isFinite(number),
      `${label} debe ser un número válido.`,
    );

    if (options.integer) {
      assert(
        Number.isInteger(number),
        `${label} debe ser un número entero.`,
      );
    }

    if (options.min !== undefined) {
      assert(
        number >= options.min,
        `${label} debe ser mayor o igual a ${options.min}.`,
      );
    }

    if (options.max !== undefined) {
      assert(
        number <= options.max,
        `${label} debe ser menor o igual a ${options.max}.`,
      );
    }

    return number;
  }

  function asString(
    value,
    label,
    options = {},
  ) {
    assert(
      typeof value === 'string',
      `${label} debe ser texto.`,
    );

    const result =
      options.trim === false
        ? value
        : value.trim();

    if (options.nonEmpty) {
      assert(
        result.length > 0,
        `${label} no puede estar vacío.`,
      );
    }

    return result;
  }

  function ensureArray(value, label) {
    assert(
      Array.isArray(value),
      `${label} debe ser un array.`,
    );

    return value;
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function timestampName(prefix = 'backup') {
    const now = new Date();

    const pad = number =>
      String(number).padStart(2, '0');

    return (
      `${prefix}-` +
      `${now.getFullYear()}` +
      `${pad(now.getMonth() + 1)}` +
      `${pad(now.getDate())}-` +
      `${pad(now.getHours())}` +
      `${pad(now.getMinutes())}` +
      `${pad(now.getSeconds())}`
    );
  }

  function isGameState(value) {
    return Boolean(
      isObject(value) &&
      typeof value.phase === 'string' &&
      typeof value.seed === 'string' &&
      Array.isArray(value.seasons) &&
      Array.isArray(value.log) &&
      isObject(value.totals) &&
      Array.isArray(
        value.nationalTeamPeriods ?? [],
      ),
    );
  }

  function scoreGameState(value) {
    if (!isGameState(value)) {
      return -Infinity;
    }

    let score = 0;

    if (KNOWN.phases.includes(value.phase)) {
      score += 10;
    }

    if ('player' in value) {
      score += 5;
    }

    if ('currentEvent' in value) {
      score += 5;
    }

    if ('currentTeamId' in value) {
      score += 3;
    }

    if ('contractTeamId' in value) {
      score += 2;
    }

    if ('rngState' in value) {
      score += 2;
    }

    if ('mode' in value) {
      score += 2;
    }

    if ('step' in value) {
      score += 2;
    }

    return score;
  }

  function getReactFiberFromNode(node) {
    if (!node) {
      return null;
    }

    const key = Object.keys(node).find(name =>
      (
        name.startsWith('__reactFiber$') ||
        name.startsWith(
          '__reactInternalInstance$',
        ) ||
        name.startsWith('__reactContainer$')
      ),
    );

    return key
      ? node[key]
      : null;
  }

  function collectCandidateNodes() {
    const nodes = [];

    for (const selector of CONFIG.selectors) {
      document
        .querySelectorAll(selector)
        .forEach(node => nodes.push(node));
    }

    if (document.body) {
      nodes.push(document.body);
    }

    if (document.documentElement) {
      nodes.push(document.documentElement);
    }

    return unique(nodes);
  }

  function inspectHookChain(
    fiber,
    sourceNode,
    candidates,
  ) {
    if (
      !fiber ||
      typeof fiber !== 'object'
    ) {
      return;
    }

    let hook = fiber.memoizedState;
    let hookIndex = 0;

    const seenHooks = new Set();

    while (
      hook &&
      typeof hook === 'object' &&
      !seenHooks.has(hook)
    ) {
      seenHooks.add(hook);

      const possibleValues = [
        hook.queue?.lastRenderedState,
        hook.memoizedState,
        hook.baseState,
      ];

      for (const value of possibleValues) {
        if (!isGameState(value)) {
          continue;
        }

        const dispatch =
          hook.queue?.dispatch;

        if (typeof dispatch !== 'function') {
          continue;
        }

        candidates.push({
          fiber,
          hook,
          hookIndex,
          state: value,
          dispatch,
          sourceNode,
          score: scoreGameState(value),
        });
      }

      hook = hook.next;
      hookIndex += 1;
    }
  }

  function walkFiberTree(
    startFiber,
    sourceNode,
    candidates,
    maxNodes = 15000,
  ) {
    if (!startFiber) {
      return;
    }

    const queue = [startFiber];
    const seen = new Set();

    let visited = 0;

    while (
      queue.length &&
      visited < maxNodes
    ) {
      const fiber = queue.shift();

      if (
        !fiber ||
        seen.has(fiber)
      ) {
        continue;
      }

      seen.add(fiber);
      visited += 1;

      inspectHookChain(
        fiber,
        sourceNode,
        candidates,
      );

      inspectHookChain(
        fiber.alternate,
        sourceNode,
        candidates,
      );

      if (fiber.return) {
        queue.push(fiber.return);
      }

      if (fiber.child) {
        queue.push(fiber.child);
      }

      if (fiber.sibling) {
        queue.push(fiber.sibling);
      }

      if (fiber.alternate) {
        queue.push(fiber.alternate);
      }
    }
  }

  function locate(options = {}) {
    const candidates = [];
    const nodes = collectCandidateNodes();

    for (const node of nodes) {
      const fiber =
        getReactFiberFromNode(node);

      if (fiber) {
        walkFiberTree(
          fiber,
          node,
          candidates,
        );
      }
    }

    candidates.sort(
      (a, b) => b.score - a.score,
    );

    const best = candidates[0];

    if (!best) {
      throw new Error(
        'No encontré el estado React del simulador. ' +
        'Abre una partida, espera a que termine ' +
        'cualquier animación y vuelve a ejecutar ' +
        'el comando.',
      );
    }

    runtime.lastLocator = {
      hookIndex: best.hookIndex,
      score: best.score,
      phase: best.state.phase,
      seed: best.state.seed,
      foundAt: new Date().toISOString(),
      candidateCount: candidates.length,
    };

    if (!options.silent) {
      console.debug(
        CONFIG.consoleTag,
        'Estado localizado:',
        runtime.lastLocator,
      );
    }

    return best;
  }

  function currentState() {
    return locate({
      silent: true,
    }).state;
  }

  function pushUndoSnapshot(
    state,
    label,
  ) {
    if (!CONFIG.autoHistory) {
      return;
    }

    runtime.undoStack.push({
      label,
      timestamp: new Date().toISOString(),
      state: clone(state),
    });

    if (
      runtime.undoStack.length >
      CONFIG.maxHistoryEntries
    ) {
      runtime.undoStack.splice(
        0,
        runtime.undoStack.length -
          CONFIG.maxHistoryEntries,
      );
    }

    runtime.redoStack.length = 0;
  }

  function dispatchState(
    nextStateOrUpdater,
    options = {},
  ) {
    const locator = locate({
      silent: true,
    });

    const label =
      options.label ??
      'Cambio manual';

    const recordHistory =
      options.recordHistory !== false;

    locator.dispatch(previous => {
      const base =
        isGameState(previous)
          ? previous
          : locator.state;

      if (recordHistory) {
        pushUndoSnapshot(
          base,
          label,
        );
      }

      const next =
        typeof nextStateOrUpdater ===
        'function'
          ? nextStateOrUpdater(
              clone(base),
            )
          : clone(nextStateOrUpdater);

      assert(
        isGameState(next),
        'El resultado no conserva la ' +
        'estructura válida de la partida.',
      );

      return next;
    });

    setTimeout(() => {
      refreshPanel();
    }, 0);
  }

  function mutate(
    mutator,
    label = 'Cambio manual',
  ) {
    assert(
      typeof mutator === 'function',
      'mutator debe ser una función.',
    );

    dispatchState(
      draft => {
        const result = mutator(draft);

        return result === undefined
          ? draft
          : result;
      },
      {
        label,
      },
    );

    ok(label);

    return api;
  }

  function replaceState(
    state,
    label = 'Reemplazar partida',
    options = {},
  ) {
    assert(
      isGameState(state),
      'El objeto proporcionado no parece ' +
      'una partida válida.',
    );

    dispatchState(
      clone(state),
      {
        label,
        recordHistory:
          options.recordHistory !== false,
      },
    );

    ok(label);

    return api;
  }

  function normalizePlayerPatch(input) {
    assert(
      isPlainObject(input),
      'El cambio del jugador debe ser ' +
      'un objeto.',
    );

    const patch = {
      ...input,
    };

    const aliases = {
      ovr: 'overall',
      rating: 'overall',
      price: 'marketValue',
      value: 'marketValue',
      market_value: 'marketValue',
      name: 'lastName',
      surname: 'lastName',
      number: 'preferredNumber',
      shirtNumber: 'preferredNumber',
      foot: 'preferredFoot',
      team: 'currentTeamId',
      teamId: 'currentTeamId',
    };

    for (
      const [alias, canonical]
      of Object.entries(aliases)
    ) {
      if (
        alias in patch &&
        !(canonical in patch)
      ) {
        patch[canonical] =
          patch[alias];
      }

      delete patch[alias];
    }

    if ('overall' in patch) {
      patch.overall =
        asFiniteNumber(
          patch.overall,
          'overall',
          {
            integer: true,
          },
        );
    }

    if ('marketValue' in patch) {
      patch.marketValue =
        asFiniteNumber(
          patch.marketValue,
          'marketValue',
          {
            min: 0,
          },
        );
    }

    if ('age' in patch) {
      patch.age =
        asFiniteNumber(
          patch.age,
          'age',
          {
            integer: true,
            min: 0,
          },
        );
    }

    if ('lastName' in patch) {
      patch.lastName =
        asString(
          String(patch.lastName),
          'lastName',
          {
            trim: false,
          },
        );
    }

    if ('preferredNumber' in patch) {
      patch.preferredNumber =
        asFiniteNumber(
          patch.preferredNumber,
          'preferredNumber',
          {
            integer: true,
            min: 1,
            max: 99,
          },
        );
    }

    if ('preferredFoot' in patch) {
      patch.preferredFoot =
        asString(
          patch.preferredFoot,
          'preferredFoot',
          {
            nonEmpty: true,
          },
        ).toLowerCase();

      if (CONFIG.strictEnums) {
        assert(
          KNOWN.feet.includes(
            patch.preferredFoot,
          ),
          `preferredFoot debe ser: ` +
          `${KNOWN.feet.join(', ')}.`,
        );
      }
    }

    if ('position' in patch) {
      patch.position =
        asString(
          patch.position,
          'position',
          {
            nonEmpty: true,
          },
        ).toUpperCase();

      if (CONFIG.strictEnums) {
        assert(
          KNOWN.positions.includes(
            patch.position,
          ),
          `position debe ser: ` +
          `${KNOWN.positions.join(', ')}.`,
        );
      }
    }

    if (
      'currentTeamId' in patch &&
      patch.currentTeamId !== null
    ) {
      patch.currentTeamId =
        asString(
          String(
            patch.currentTeamId,
          ),
          'currentTeamId',
          {
            nonEmpty: true,
          },
        );
    }

    return patch;
  }

  function normalizeStatsPatch(input) {
    assert(
      isPlainObject(input),
      'Las estadísticas deben enviarse ' +
      'como objeto.',
    );

    const patch = {
      ...input,
    };

    const allowed = [
      'appearances',
      'goals',
      'assists',
      'cleanSheets',
      'goalsConceded',
      'trophies',
      'awards',
    ];

    for (const key of Object.keys(patch)) {
      assert(
        allowed.includes(key),
        `Estadística desconocida: ${key}.`,
      );

      patch[key] =
        asFiniteNumber(
          patch[key],
          key,
          {
            integer: true,
            min: 0,
          },
        );
    }

    return patch;
  }

  function normalizeSeasonPatch(input) {
    assert(
      isPlainObject(input),
      'El cambio de temporada debe ser ' +
      'un objeto.',
    );

    const patch = {
      ...input,
    };

    if (
      'ovr' in patch &&
      !('overall' in patch)
    ) {
      patch.overall =
        patch.ovr;
    }

    if (
      'price' in patch &&
      !('marketValue' in patch)
    ) {
      patch.marketValue =
        patch.price;
    }

    if (
      'value' in patch &&
      !('marketValue' in patch)
    ) {
      patch.marketValue =
        patch.value;
    }

    if (
      'team' in patch &&
      !('teamId' in patch)
    ) {
      patch.teamId =
        patch.team;
    }

    delete patch.ovr;
    delete patch.price;
    delete patch.value;
    delete patch.team;

    if ('overall' in patch) {
      patch.overall =
        asFiniteNumber(
          patch.overall,
          'overall',
          {
            integer: true,
          },
        );
    }

    if ('marketValue' in patch) {
      patch.marketValue =
        asFiniteNumber(
          patch.marketValue,
          'marketValue',
          {
            min: 0,
          },
        );
    }

    if ('age' in patch) {
      patch.age =
        asFiniteNumber(
          patch.age,
          'age',
          {
            integer: true,
            min: 0,
          },
        );
    }

    if ('periodIndex' in patch) {
      patch.periodIndex =
        asFiniteNumber(
          patch.periodIndex,
          'periodIndex',
          {
            integer: true,
            min: 1,
          },
        );
    }

    if ('index' in patch) {
      patch.index =
        asFiniteNumber(
          patch.index,
          'index',
          {
            integer: true,
            min: 1,
          },
        );
    }

    if ('teamId' in patch) {
      patch.teamId =
        asString(
          String(patch.teamId),
          'teamId',
          {
            nonEmpty: true,
          },
        );
    }

    if ('stats' in patch) {
      patch.stats =
        normalizeStatsPatch(
          patch.stats,
        );
    }

    if ('trophies' in patch) {
      patch.trophies =
        unique(
          ensureArray(
            patch.trophies,
            'trophies',
          ).map(String),
        );

      if (CONFIG.strictEnums) {
        for (
          const trophy
          of patch.trophies
        ) {
          assert(
            KNOWN.trophies.includes(
              trophy,
            ),
            `Trofeo desconocido: ${trophy}.`,
          );
        }
      }
    }

    if ('awards' in patch) {
      patch.awards =
        unique(
          ensureArray(
            patch.awards,
            'awards',
          ).map(String),
        );

      if (CONFIG.strictEnums) {
        for (
          const award
          of patch.awards
        ) {
          assert(
            KNOWN.awards.includes(
              award,
            ),
            `Premio desconocido: ${award}.`,
          );
        }
      }
    }

    return patch;
  }

  function patchPlayer(
    draft,
    input,
  ) {
    assert(
      draft.player,
      'La partida todavía no tiene ' +
      'un jugador creado.',
    );

    const patch =
      normalizePlayerPatch(input);

    draft.player = {
      ...draft.player,
      ...patch,
    };

    if (
      'currentTeamId' in patch &&
      CONFIG.syncCurrentTeamFields
    ) {
      draft.currentTeamId =
        patch.currentTeamId;

      if (
        draft.contractTeamId !== null &&
        draft.contractTeamId !== undefined
      ) {
        draft.contractTeamId =
          patch.currentTeamId;
      }
    }

    return draft;
  }

  function resolveSeasonIndexes(
    state,
    selector = 'last',
  ) {
    const seasons = state.seasons;

    assert(
      seasons.length > 0,
      'Todavía no existe ninguna ' +
      'temporada terminada.',
    );

    if (
      selector === undefined ||
      selector === null ||
      selector === 'last'
    ) {
      return [
        seasons.length - 1,
      ];
    }

    if (selector === 'first') {
      return [0];
    }

    if (selector === 'all') {
      return seasons.map(
        (_, index) => index,
      );
    }

    if (typeof selector === 'number') {
      const humanIndex =
        asFiniteNumber(
          selector,
          'selector de temporada',
          {
            integer: true,
          },
        );

      const index =
        humanIndex < 0
          ? seasons.length +
            humanIndex
          : humanIndex - 1;

      assert(
        index >= 0 &&
        index < seasons.length,
        `No existe la temporada ${selector}.`,
      );

      return [index];
    }

    if (typeof selector === 'string') {
      const index =
        seasons.findIndex(
          season =>
            season.id === selector,
        );

      assert(
        index >= 0,
        `No encontré una temporada ` +
        `con id "${selector}".`,
      );

      return [index];
    }

    if (isPlainObject(selector)) {
      const matches =
        seasons
          .map(
            (season, index) => ({
              season,
              index,
            }),
          )
          .filter(
            ({ season }) => {
              if (
                'id' in selector &&
                season.id !== selector.id
              ) {
                return false;
              }

              if (
                'index' in selector &&
                season.index !==
                  selector.index
              ) {
                return false;
              }

              if (
                'age' in selector &&
                season.age !==
                  selector.age
              ) {
                return false;
              }

              if (
                'teamId' in selector &&
                season.teamId !==
                  selector.teamId
              ) {
                return false;
              }

              if (
                'periodIndex' in selector &&
                season.periodIndex !==
                  selector.periodIndex
              ) {
                return false;
              }

              return true;
            },
          )
          .map(
            item => item.index,
          );

      assert(
        matches.length > 0,
        'Ninguna temporada coincide ' +
        'con el selector indicado.',
      );

      return matches;
    }

    throw new Error(
      'Selector de temporada no válido. ' +
      'Usa "last", "first", "all", ' +
      'un número, un id o un objeto filtro.',
    );
  }

  function patchSeasonObject(
    season,
    input,
  ) {
    const patch =
      normalizeSeasonPatch(input);

    const {
      stats,
      trophies,
      awards,
      ...fields
    } = patch;

    const next = {
      ...season,
      ...fields,
    };

    if (stats) {
      next.stats = {
        ...(season.stats ?? {}),
        ...stats,
      };
    }

    if (trophies) {
      next.trophies = [
        ...trophies,
      ];
    }

    if (awards) {
      next.awards = [
        ...awards,
      ];
    }

    return next;
  }

  function recalculateTotalsObject(
    state,
  ) {
    const totals = {
      appearances: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      goalsConceded: 0,
      trophies: 0,
      awards: 0,
    };

    const addStats = stats => {
      if (!stats) {
        return;
      }

      totals.appearances +=
        Number(
          stats.appearances,
        ) || 0;

      totals.goals +=
        Number(
          stats.goals,
        ) || 0;

      totals.assists +=
        Number(
          stats.assists,
        ) || 0;

      totals.cleanSheets +=
        Number(
          stats.cleanSheets,
        ) || 0;

      totals.goalsConceded +=
        Number(
          stats.goalsConceded,
        ) || 0;
    };

    for (
      const season
      of state.seasons ?? []
    ) {
      addStats(season.stats);

      totals.trophies +=
        Array.isArray(
          season.trophies,
        )
          ? season.trophies.length
          : 0;

      totals.awards +=
        Array.isArray(
          season.awards,
        )
          ? season.awards.length
          : 0;
    }

    for (
      const period
      of state.nationalTeamPeriods ?? []
    ) {
      addStats(period.stats);

      totals.trophies +=
        Array.isArray(
          period.trophies,
        )
          ? period.trophies.length
          : 0;

      totals.awards +=
        Array.isArray(
          period.awards,
        )
          ? period.awards.length
          : 0;
    }

    return totals;
  }

  function parsePath(path) {
    const text =
      asString(
        path,
        'path',
        {
          nonEmpty: true,
        },
      );

    const normalized =
      text.replace(
        /\[(\d+)\]/g,
        '.$1',
      );

    const parts =
      normalized
        .split('.')
        .filter(Boolean);

    assert(
      parts.length > 0,
      'La ruta está vacía.',
    );

    for (const part of parts) {
      assert(
        ![
          '__proto__',
          'prototype',
          'constructor',
        ].includes(part),
        `Segmento de ruta prohibido: ${part}.`,
      );
    }

    return parts;
  }

  function getAtPath(
    root,
    path,
  ) {
    return parsePath(path).reduce(
      (value, key) =>
        value?.[key],
      root,
    );
  }

  function setAtPath(
    root,
    path,
    value,
  ) {
    const parts =
      parsePath(path);

    let cursor = root;

    for (
      let index = 0;
      index < parts.length - 1;
      index += 1
    ) {
      const key =
        parts[index];

      const nextKey =
        parts[index + 1];

      if (!isObject(cursor[key])) {
        cursor[key] =
          /^\d+$/.test(nextKey)
            ? []
            : {};
      }

      cursor =
        cursor[key];
    }

    cursor[parts.at(-1)] =
      value;
  }

  function deleteAtPath(
    root,
    path,
  ) {
    const parts =
      parsePath(path);

    let cursor = root;

    for (
      let index = 0;
      index < parts.length - 1;
      index += 1
    ) {
      cursor =
        cursor?.[parts[index]];

      if (!isObject(cursor)) {
        return false;
      }
    }

    const key =
      parts.at(-1);

    if (!(key in cursor)) {
      return false;
    }

    if (
      Array.isArray(cursor) &&
      /^\d+$/.test(key)
    ) {
      cursor.splice(
        Number(key),
        1,
      );
    } else {
      delete cursor[key];
    }

    return true;
  }

  function formatMoney(value) {
    const number =
      Number(value) || 0;

    try {
      return new Intl.NumberFormat(
        'es-ES',
        {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        },
      ).format(number);
    } catch {
      return String(number);
    }
  }

  function summarize(
    state = currentState(),
  ) {
    const player =
      state.player;

    const lastSeason =
      state.seasons?.at(-1) ??
      null;

    return {
      phase: state.phase,
      mode: state.mode,
      seed: state.seed,
      step: state.step,

      player: player
        ? {
            lastName:
              player.lastName,

            age:
              player.age,

            overall:
              player.overall,

            marketValue:
              player.marketValue,

            formattedMarketValue:
              formatMoney(
                player.marketValue,
              ),

            position:
              player.position,

            preferredNumber:
              player.preferredNumber,

            preferredFoot:
              player.preferredFoot,

            currentTeamId:
              player.currentTeamId,
          }
        : null,

      stateTeam: {
        currentTeamId:
          state.currentTeamId,

        contractTeamId:
          state.contractTeamId,
      },

      seasons:
        state.seasons?.length ??
        0,

      lastSeason: lastSeason
        ? {
            id:
              lastSeason.id,

            index:
              lastSeason.index,

            age:
              lastSeason.age,

            teamId:
              lastSeason.teamId,

            overall:
              lastSeason.overall,

            marketValue:
              lastSeason.marketValue,

            stats:
              clone(
                lastSeason.stats,
              ),

            trophies:
              clone(
                lastSeason.trophies,
              ),

            awards:
              clone(
                lastSeason.awards,
              ),
          }
        : null,

      totals:
        clone(state.totals),

      currentEvent:
        state.currentEvent
          ? {
              id:
                state.currentEvent.id,

              type:
                state.currentEvent.type,

              eventKey:
                state.currentEvent.eventKey,

              optionCount:
                state.currentEvent
                  .options?.length ?? 0,
            }
          : null,
    };
  }

  function fingerprint(state) {
    const summary =
      summarize(state);

    return JSON.stringify({
      phase:
        summary.phase,

      step:
        summary.step,

      player:
        summary.player,

      seasons:
        summary.seasons,

      totals:
        summary.totals,

      currentEvent:
        summary.currentEvent,
    });
  }

  function makeCommandRows() {
    const p = PREFIX;

    return [
      [
        `${p}help`,
        'Muestra esta ayuda.',
      ],
      [
        `${p}status`,
        'Muestra un resumen de la partida actual.',
      ],
      [
        `${p}get`,
        'Devuelve una copia completa de la partida.',
      ],
      [
        `${p}player({...})`,
        'Modifica varios datos del jugador.',
      ],
      [
        `${p}overall(99)`,
        'Cambia el OVR actual.',
      ],
      [
        `${p}price(250_000_000)`,
        'Cambia el valor de mercado actual.',
      ],
      [
        `${p}age(25)`,
        'Cambia la edad actual.',
      ],
      [
        `${p}name('GOAT')`,
        'Cambia el apellido mostrado.',
      ],
      [
        `${p}number(10)`,
        'Cambia el dorsal preferido.',
      ],
      [
        `${p}foot('left')`,
        'Cambia el pie preferido.',
      ],
      [
        `${p}position('ST')`,
        'Cambia la posición.',
      ],
      [
        `${p}team('barcelona')`,
        'Cambia el identificador del equipo actual.',
      ],
      [
        `${p}totals({...})`,
        'Modifica estadísticas totales.',
      ],
      [
        `${p}season('last', {...})`,
        'Modifica una o varias temporadas.',
      ],
      [
        `${p}lastSeason({...})`,
        'Atajo para la última temporada.',
      ],
      [
        `${p}allSeasons({...})`,
        'Aplica un cambio a todas las temporadas.',
      ],
      [
        `${p}addTrophy('league')`,
        'Añade un trofeo a una temporada.',
      ],
      [
        `${p}removeTrophy('league')`,
        'Elimina un trofeo.',
      ],
      [
        `${p}addAward('ballon_dor')`,
        'Añade un premio.',
      ],
      [
        `${p}removeAward('ballon_dor')`,
        'Elimina un premio.',
      ],
      [
        `${p}recalculateTotals()`,
        'Recalcula los totales desde las temporadas.',
      ],
      [
        `${p}set('player.overall', 99)`,
        'Modifica cualquier ruta del estado.',
      ],
      [
        `${p}merge('totals', {...})`,
        'Fusiona un objeto en cualquier ruta.',
      ],
      [
        `${p}remove('ruta')`,
        'Elimina una propiedad de una ruta.',
      ],
      [
        `${p}backup('nombre')`,
        'Crea un backup en memoria.',
      ],
      [
        `${p}restore('nombre')`,
        'Restaura un backup.',
      ],
      [
        `${p}undo() / ${p}redo()`,
        'Deshacer o rehacer cambios del editor.',
      ],
      [
        `${p}export()`,
        'Exporta la partida a JSON y la copia.',
      ],
      [
        `${p}import(json)`,
        'Importa una partida desde JSON u objeto.',
      ],
      [
        `${p}download()`,
        'Descarga la partida como archivo JSON.',
      ],
      [
        `${p}watch()`,
        'Muestra cambios detectados en tiempo real.',
      ],
      [
        `${p}unwatch()`,
        'Detiene el observador.',
      ],
      [
        `${p}panel()`,
        'Abre un panel visual rápido.',
      ],
      [
        `${p}closePanel()`,
        'Cierra el panel visual.',
      ],
      [
        `${p}diagnose()`,
        'Muestra diagnóstico del localizador React.',
      ],
      [
        `${p}destroy()`,
        'Desinstala el editor de esta pestaña.',
      ],
    ].map(
      ([command, description]) => ({
        command,
        description,
      }),
    );
  }

  function printHelp() {
    console.group(
      `%c${GLOBAL_NAME} v${VERSION}`,
      styles.title,
    );

    console.log(
      '%cEditor local para la partida actual. ' +
      'No modifica el servidor y se pierde ' +
      'al recargar la página.',
      styles.dim,
    );

    console.table(
      makeCommandRows(),
    );

    console.log(
      '%cEjemplo rápido:',
      styles.info,
    );

    console.log(
      `${PREFIX}player({ ` +
      `overall: 99, ` +
      `price: 250_000_000, ` +
      `age: 25, ` +
      `name: 'GOAT' ` +
      `})`,
    );

    console.log(
      `${PREFIX}lastSeason({ ` +
      `overall: 99, ` +
      `price: 250_000_000, ` +
      `stats: { ` +
      `goals: 60, ` +
      `assists: 25 ` +
      `} ` +
      `})`,
    );

    console.log(
      `${PREFIX}backup('antes-de-probar')`,
    );

    console.log(
      `${PREFIX}restore('antes-de-probar')`,
    );

    console.groupEnd();

    return undefined;
  }

  function printExamples() {
    const examples = {
      jugador:
        `${PREFIX}player({ ` +
        `overall: 99, ` +
        `price: 300_000_000, ` +
        `age: 24, ` +
        `name: 'GOAT', ` +
        `number: 10, ` +
        `foot: 'left' ` +
        `})`,

      ultimaTemporada:
        `${PREFIX}lastSeason({ ` +
        `overall: 99, ` +
        `stats: { ` +
        `appearances: 60, ` +
        `goals: 55, ` +
        `assists: 25 ` +
        `}, ` +
        `trophies: [` +
        `'league',` +
        `'cup',` +
        `'continental_primary'` +
        `], ` +
        `awards: [` +
        `'ballon_dor',` +
        `'golden_boot'` +
        `] ` +
        `})`,

      totales:
        `${PREFIX}totals({ ` +
        `appearances: 500, ` +
        `goals: 400, ` +
        `assists: 200, ` +
        `trophies: 20, ` +
        `awards: 8 ` +
        `})`,

      rutaGenerica:
        `${PREFIX}set(` +
        `'player.overall', ` +
        `99` +
        `)`,

      backup:
        `${PREFIX}backup(` +
        `'mi-backup'` +
        `)`,

      restaurar:
        `${PREFIX}restore(` +
        `'mi-backup'` +
        `)`,
    };

    console.table(examples);

    return examples;
  }

  function copyText(text) {
    if (
      navigator.clipboard?.writeText
    ) {
      return navigator.clipboard
        .writeText(text);
    }

    const textarea =
      document.createElement(
        'textarea',
      );

    textarea.value = text;
    textarea.style.position =
      'fixed';
    textarea.style.opacity =
      '0';

    document.body.appendChild(
      textarea,
    );

    textarea.select();

    document.execCommand(
      'copy',
    );

    textarea.remove();

    return Promise.resolve();
  }

  function refreshPanel() {
    if (
      !runtime.panelHost?.shadowRoot
    ) {
      return;
    }

    const root =
      runtime.panelHost.shadowRoot;

    const status =
      root.querySelector(
        '[data-status]',
      );

    if (!status) {
      return;
    }

    try {
      const summary =
        summarize();

      status.textContent =
        summary.player
          ? (
              `OVR ` +
              `${summary.player.overall} · ` +
              `${
                summary.formattedMarketValue ??
                summary.player
                  .formattedMarketValue
              } · ` +
              `Edad ` +
              `${summary.player.age}`
            )
          : (
              `Fase: ` +
              `${summary.phase}`
            );

      const inputs = {
        overall:
          summary.player?.overall,

        marketValue:
          summary.player?.marketValue,

        age:
          summary.player?.age,

        lastName:
          summary.player?.lastName,

        preferredNumber:
          summary.player
            ?.preferredNumber,
      };

      for (
        const [name, value]
        of Object.entries(inputs)
      ) {
        const input =
          root.querySelector(
            `[name="${name}"]`,
          );

        if (
          input &&
          document.activeElement !== input &&
          root.activeElement !== input
        ) {
          input.value =
            value ?? '';
        }
      }
    } catch (error) {
      status.textContent =
        `No se encontró la partida: ` +
        `${error.message}`;
    }
  }

  function buildPanel() {
    if (
      runtime.panelHost?.isConnected
    ) {
      runtime.panelHost.style.display =
        'block';

      refreshPanel();

      return runtime.panelHost;
    }

    const existing =
      document.getElementById(
        CONFIG.panelId,
      );

    if (existing) {
      existing.remove();
    }

    const host =
      document.createElement('div');

    host.id =
      CONFIG.panelId;

    host.style.position =
      'fixed';

    host.style.top =
      '18px';

    host.style.right =
      '18px';

    host.style.zIndex =
      '2147483647';

    host.style.width =
      '320px';

    host.style.maxWidth =
      'calc(100vw - 36px)';

    const root =
      host.attachShadow({
        mode: 'open',
      });

    root.innerHTML = `
      <style>
        :host {
          all: initial;
        }

        * {
          box-sizing: border-box;
        }

        .panel {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          background:
            rgba(15, 23, 42, 0.98);

          color:
            #e2e8f0;

          border:
            1px solid
            rgba(148, 163, 184, 0.28);

          border-radius:
            16px;

          box-shadow:
            0 24px 80px
            rgba(0, 0, 0, .45);

          overflow:
            hidden;

          backdrop-filter:
            blur(18px);
        }

        header {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          padding:
            12px 14px;

          background:
            rgba(30, 41, 59, .9);

          border-bottom:
            1px solid
            rgba(148, 163, 184, .2);

          cursor:
            move;

          user-select:
            none;
        }

        h1 {
          font-size:
            14px;

          margin:
            0;

          color:
            #f8fafc;
        }

        .version {
          font-size:
            10px;

          color:
            #94a3b8;

          margin-left:
            6px;
        }

        button {
          appearance:
            none;

          border:
            1px solid
            rgba(148, 163, 184, .22);

          background:
            #1e293b;

          color:
            #f8fafc;

          border-radius:
            9px;

          padding:
            8px 10px;

          font-weight:
            700;

          cursor:
            pointer;
        }

        button:hover {
          background:
            #334155;
        }

        button.primary {
          background:
            #16a34a;

          border-color:
            #22c55e;
        }

        button.primary:hover {
          background:
            #15803d;
        }

        button.danger {
          background:
            #7f1d1d;

          border-color:
            #ef4444;
        }

        .close {
          padding:
            4px 8px;

          font-size:
            13px;
        }

        main {
          padding:
            14px;

          display:
            grid;

          gap:
            12px;
        }

        .status {
          font-size:
            12px;

          color:
            #bae6fd;

          background:
            rgba(14, 116, 144, .18);

          padding:
            9px 10px;

          border-radius:
            10px;

          border:
            1px solid
            rgba(56, 189, 248, .22);
        }

        .grid {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            9px;
        }

        label {
          display:
            grid;

          gap:
            5px;

          font-size:
            11px;

          color:
            #94a3b8;
        }

        label.full {
          grid-column:
            1 / -1;
        }

        input {
          width:
            100%;

          border:
            1px solid
            rgba(148, 163, 184, .24);

          background:
            #0f172a;

          color:
            #f8fafc;

          border-radius:
            9px;

          padding:
            9px 10px;

          outline:
            none;
        }

        input:focus {
          border-color:
            #38bdf8;

          box-shadow:
            0 0 0 3px
            rgba(56, 189, 248, .12);
        }

        .actions {
          display:
            grid;

          grid-template-columns:
            1fr 1fr 1fr;

          gap:
            8px;
        }

        .footer {
          font-size:
            10px;

          color:
            #64748b;

          text-align:
            center;
        }
      </style>

      <section class="panel">
        <header data-drag>
          <div>
            <h1>
              Copero Career Editor
              <span class="version">
                v${VERSION}
              </span>
            </h1>
          </div>

          <button
            class="close"
            type="button"
            data-close
          >
            ✕
          </button>
        </header>

        <main>
          <div
            class="status"
            data-status
          >
            Buscando partida…
          </div>

          <div class="grid">
            <label>
              OVR

              <input
                name="overall"
                type="number"
                step="1"
              >
            </label>

            <label>
              Precio

              <input
                name="marketValue"
                type="number"
                step="1"
              >
            </label>

            <label>
              Edad

              <input
                name="age"
                type="number"
                step="1"
              >
            </label>

            <label>
              Dorsal

              <input
                name="preferredNumber"
                type="number"
                min="1"
                max="99"
                step="1"
              >
            </label>

            <label class="full">
              Apellido

              <input
                name="lastName"
                type="text"
              >
            </label>
          </div>

          <button
            class="primary"
            type="button"
            data-apply
          >
            Aplicar al jugador
          </button>

          <div class="actions">
            <button
              type="button"
              data-backup
            >
              Backup
            </button>

            <button
              type="button"
              data-undo
            >
              Undo
            </button>

            <button
              class="danger"
              type="button"
              data-restore
            >
              Original
            </button>
          </div>

          <div class="footer">
            Solo modifica la pestaña actual.
            Recargar elimina los cambios.
          </div>
        </main>
      </section>
    `;

    root
      .querySelector(
        '[data-close]',
      )
      .addEventListener(
        'click',
        () => api.closePanel(),
      );

    root
      .querySelector(
        '[data-apply]',
      )
      .addEventListener(
        'click',
        () => {
          const patch = {};

          for (
            const name
            of [
              'overall',
              'marketValue',
              'age',
              'preferredNumber',
              'lastName',
            ]
          ) {
            const input =
              root.querySelector(
                `[name="${name}"]`,
              );

            if (
              !input ||
              input.value === ''
            ) {
              continue;
            }

            patch[name] =
              input.type === 'number'
                ? Number(input.value)
                : input.value;
          }

          api.player(patch);
        },
      );

    root
      .querySelector(
        '[data-backup]',
      )
      .addEventListener(
        'click',
        () => api.backup(),
      );

    root
      .querySelector(
        '[data-undo]',
      )
      .addEventListener(
        'click',
        () => api.undo(),
      );

    root
      .querySelector(
        '[data-restore]',
      )
      .addEventListener(
        'click',
        () =>
          api.restore('original'),
      );

    const dragArea =
      root.querySelector(
        '[data-drag]',
      );

    let dragging = null;

    dragArea.addEventListener(
      'pointerdown',
      event => {
        if (
          event.target.closest(
            'button',
          )
        ) {
          return;
        }

        const rect =
          host.getBoundingClientRect();

        dragging = {
          offsetX:
            event.clientX -
            rect.left,

          offsetY:
            event.clientY -
            rect.top,
        };

        dragArea.setPointerCapture(
          event.pointerId,
        );
      },
    );

    dragArea.addEventListener(
      'pointermove',
      event => {
        if (!dragging) {
          return;
        }

        host.style.left =
          `${
            Math.max(
              0,
              event.clientX -
              dragging.offsetX,
            )
          }px`;

        host.style.top =
          `${
            Math.max(
              0,
              event.clientY -
              dragging.offsetY,
            )
          }px`;

        host.style.right =
          'auto';
      },
    );

    dragArea.addEventListener(
      'pointerup',
      event => {
        dragging = null;

        try {
          dragArea.releasePointerCapture(
            event.pointerId,
          );
        } catch {}
      },
    );

    document.documentElement
      .appendChild(host);

    runtime.panelHost =
      host;

    runtime.panelTimer =
      setInterval(
        refreshPanel,
        1000,
      );

    refreshPanel();

    return host;
  }

  const api = {
    __coperoCareerEditor: true,
    version: VERSION,
    prefix: PREFIX,

    showHelp() {
      printHelp();

      return api;
    },

    inspect() {
      return clone(
        currentState(),
      );
    },

    summary() {
      const value =
        summarize();

      console.log(value);

      return value;
    },

    player(patch) {
      return mutate(
        draft =>
          patchPlayer(
            draft,
            patch,
          ),
        'Jugador actualizado',
      );
    },

    overall(
      value,
      options = {},
    ) {
      const number =
        asFiniteNumber(
          value,
          'overall',
          {
            integer: true,
          },
        );

      mutate(
        draft =>
          patchPlayer(
            draft,
            {
              overall: number,
            },
          ),
        `OVR cambiado a ${number}`,
      );

      if (
        options.lastSeason === true &&
        currentState()
          .seasons.length
      ) {
        api.lastSeason({
          overall: number,
        });
      }

      return api;
    },

    price(
      value,
      options = {},
    ) {
      const number =
        asFiniteNumber(
          value,
          'price',
          {
            min: 0,
          },
        );

      mutate(
        draft =>
          patchPlayer(
            draft,
            {
              marketValue: number,
            },
          ),
        `Precio cambiado a ${number}`,
      );

      if (
        options.lastSeason === true &&
        currentState()
          .seasons.length
      ) {
        api.lastSeason({
          marketValue: number,
        });
      }

      return api;
    },

    age(value) {
      return api.player({
        age: value,
      });
    },

    name(value) {
      return api.player({
        lastName: value,
      });
    },

    number(value) {
      return api.player({
        preferredNumber: value,
      });
    },

    foot(value) {
      return api.player({
        preferredFoot: value,
      });
    },

    position(value) {
      return api.player({
        position: value,
      });
    },

    team(value) {
      return api.player({
        currentTeamId: value,
      });
    },

    totals(patch) {
      const normalized =
        normalizeStatsPatch(patch);

      return mutate(
        draft => {
          draft.totals = {
            ...(draft.totals ?? {}),
            ...normalized,
          };
        },
        'Totales actualizados',
      );
    },

    season(
      selector,
      patch,
    ) {
      const normalized =
        normalizeSeasonPatch(patch);

      return mutate(
        draft => {
          const indexes =
            resolveSeasonIndexes(
              draft,
              selector,
            );

          for (
            const index
            of indexes
          ) {
            draft.seasons[index] =
              patchSeasonObject(
                draft.seasons[index],
                normalized,
              );
          }
        },
        `Temporada actualizada ` +
        `(${String(selector)})`,
      );
    },

    lastSeason(patch) {
      return api.season(
        'last',
        patch,
      );
    },

    allSeasons(patch) {
      return api.season(
        'all',
        patch,
      );
    },

    addTrophy(
      trophy,
      selector = 'last',
    ) {
      trophy =
        asString(
          String(trophy),
          'trophy',
          {
            nonEmpty: true,
          },
        );

      if (CONFIG.strictEnums) {
        assert(
          KNOWN.trophies.includes(
            trophy,
          ),
          `Trofeo desconocido: ` +
          `${trophy}.`,
        );
      }

      return mutate(
        draft => {
          const indexes =
            resolveSeasonIndexes(
              draft,
              selector,
            );

          for (
            const index
            of indexes
          ) {
            const season =
              draft.seasons[index];

            season.trophies =
              unique([
                ...(season.trophies ?? []),
                trophy,
              ]);
          }
        },
        `Trofeo añadido: ${trophy}`,
      );
    },

    removeTrophy(
      trophy,
      selector = 'last',
    ) {
      trophy =
        String(trophy);

      return mutate(
        draft => {
          const indexes =
            resolveSeasonIndexes(
              draft,
              selector,
            );

          for (
            const index
            of indexes
          ) {
            const season =
              draft.seasons[index];

            season.trophies =
              (
                season.trophies ??
                []
              ).filter(
                item =>
                  item !== trophy,
              );
          }
        },
        `Trofeo eliminado: ${trophy}`,
      );
    },

    addAward(
      award,
      selector = 'last',
    ) {
      award =
        asString(
          String(award),
          'award',
          {
            nonEmpty: true,
          },
        );

      if (CONFIG.strictEnums) {
        assert(
          KNOWN.awards.includes(
            award,
          ),
          `Premio desconocido: ` +
          `${award}.`,
        );
      }

      return mutate(
        draft => {
          const indexes =
            resolveSeasonIndexes(
              draft,
              selector,
            );

          for (
            const index
            of indexes
          ) {
            const season =
              draft.seasons[index];

            season.awards =
              unique([
                ...(season.awards ?? []),
                award,
              ]);
          }
        },
        `Premio añadido: ${award}`,
      );
    },

    removeAward(
      award,
      selector = 'last',
    ) {
      award =
        String(award);

      return mutate(
        draft => {
          const indexes =
            resolveSeasonIndexes(
              draft,
              selector,
            );

          for (
            const index
            of indexes
          ) {
            const season =
              draft.seasons[index];

            season.awards =
              (
                season.awards ??
                []
              ).filter(
                item =>
                  item !== award,
              );
          }
        },
        `Premio eliminado: ${award}`,
      );
    },

    recalculateTotals() {
      return mutate(
        draft => {
          draft.totals =
            recalculateTotalsObject(
              draft,
            );
        },
        'Totales recalculados',
      );
    },

    set(path, value) {
      return mutate(
        draft => {
          setAtPath(
            draft,
            path,
            clone(value),
          );
        },
        `Ruta modificada: ${path}`,
      );
    },

    merge(path, patch) {
      assert(
        isPlainObject(patch),
        'merge requiere un objeto ' +
        'como segundo argumento.',
      );

      return mutate(
        draft => {
          const current =
            getAtPath(
              draft,
              path,
            );

          assert(
            isPlainObject(current),
            `La ruta "${path}" no contiene ` +
            `un objeto fusionable.`,
          );

          setAtPath(
            draft,
            path,
            {
              ...current,
              ...clone(patch),
            },
          );
        },
        `Objeto fusionado: ${path}`,
      );
    },

    remove(path) {
      return mutate(
        draft => {
          const removed =
            deleteAtPath(
              draft,
              path,
            );

          assert(
            removed,
            `La ruta "${path}" no existe.`,
          );
        },
        `Ruta eliminada: ${path}`,
      );
    },

    backup(
      name = timestampName(),
    ) {
      name =
        asString(
          String(name),
          'nombre del backup',
          {
            nonEmpty: true,
          },
        );

      runtime.backups.set(
        name,
        {
          name,
          timestamp:
            new Date().toISOString(),

          state:
            clone(
              currentState(),
            ),
        },
      );

      ok(
        `Backup creado: ${name}`,
      );

      return name;
    },

    restore(
      name = 'original',
    ) {
      const backup =
        runtime.backups.get(name);

      assert(
        backup,
        `No existe el backup "${name}".`,
      );

      return replaceState(
        backup.state,
        `Backup restaurado: ${name}`,
      );
    },

    deleteBackup(name) {
      const deleted =
        runtime.backups.delete(name);

      assert(
        deleted,
        `No existe el backup "${name}".`,
      );

      ok(
        `Backup eliminado: ${name}`,
      );

      return api;
    },

    undo() {
      const entry =
        runtime.undoStack.pop();

      assert(
        entry,
        'No hay cambios para deshacer.',
      );

      const current =
        clone(
          currentState(),
        );

      runtime.redoStack.push({
        label:
          `Rehacer: ${entry.label}`,

        timestamp:
          new Date().toISOString(),

        state:
          current,
      });

      dispatchState(
        entry.state,
        {
          label:
            `Deshacer: ${entry.label}`,

          recordHistory:
            false,
        },
      );

      ok(
        `Deshecho: ${entry.label}`,
      );

      return api;
    },

    redo() {
      const entry =
        runtime.redoStack.pop();

      assert(
        entry,
        'No hay cambios para rehacer.',
      );

      runtime.undoStack.push({
        label:
          `Antes de rehacer: ` +
          `${entry.label}`,

        timestamp:
          new Date().toISOString(),

        state:
          clone(
            currentState(),
          ),
      });

      dispatchState(
        entry.state,
        {
          label:
            entry.label,

          recordHistory:
            false,
        },
      );

      ok(entry.label);

      return api;
    },

    async export(
      options = {},
    ) {
      const pretty =
        options.pretty !== false;

      const shouldCopy =
        options.copy !== false;

      const json =
        JSON.stringify(
          currentState(),
          null,
          pretty
            ? 2
            : 0,
        );

      if (shouldCopy) {
        await copyText(json);

        ok(
          'Partida copiada al portapapeles.',
        );
      }

      return json;
    },

    import(input) {
      let value = input;

      if (
        typeof input === 'string'
      ) {
        try {
          value =
            JSON.parse(input);
        } catch (error) {
          throw new Error(
            `JSON inválido: ` +
            `${error.message}`,
          );
        }
      }

      assert(
        isGameState(value),
        'El contenido importado no parece ' +
        'una partida válida.',
      );

      return replaceState(
        value,
        'Partida importada',
      );
    },

    download(
      filename =
        `${GLOBAL_NAME}-` +
        `${Date.now()}.json`,
    ) {
      const json =
        JSON.stringify(
          currentState(),
          null,
          2,
        );

      const blob =
        new Blob(
          [json],
          {
            type:
              'application/json;charset=utf-8',
          },
        );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href = url;
      anchor.download = filename;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      setTimeout(
        () =>
          URL.revokeObjectURL(url),
        1000,
      );

      ok(
        `Archivo preparado: ${filename}`,
      );

      return api;
    },

    watch(
      intervalMs = 1000,
    ) {
      intervalMs =
        asFiniteNumber(
          intervalMs,
          'intervalMs',
          {
            integer: true,
            min: 250,
          },
        );

      api.unwatch({
        silent: true,
      });

      runtime.watcherLastFingerprint =
        null;

      runtime.watcherTimer =
        setInterval(
          () => {
            try {
              const state =
                currentState();

              const nextFingerprint =
                fingerprint(state);

              if (
                runtime
                  .watcherLastFingerprint !==
                  null &&
                nextFingerprint !==
                  runtime
                    .watcherLastFingerprint
              ) {
                console.log(
                  `%c${CONFIG.consoleTag} ` +
                  `Cambio detectado`,
                  styles.info,
                  summarize(state),
                );
              }

              runtime
                .watcherLastFingerprint =
                nextFingerprint;
            } catch (error) {
              warn(
                `Watcher: ` +
                `${error.message}`,
              );
            }
          },
          intervalMs,
        );

      ok(
        `Watcher activo cada ` +
        `${intervalMs} ms.`,
      );

      return api;
    },

    unwatch(
      options = {},
    ) {
      if (
        runtime.watcherTimer
      ) {
        clearInterval(
          runtime.watcherTimer,
        );
      }

      runtime.watcherTimer =
        null;

      runtime.watcherLastFingerprint =
        null;

      if (!options.silent) {
        ok(
          'Watcher detenido.',
        );
      }

      return api;
    },

    panel() {
      buildPanel();

      ok(
        'Panel abierto.',
      );

      return api;
    },

    closePanel() {
      if (
        runtime.panelTimer
      ) {
        clearInterval(
          runtime.panelTimer,
        );
      }

      runtime.panelTimer =
        null;

      runtime.panelHost?.remove();

      runtime.panelHost =
        null;

      ok(
        'Panel cerrado.',
      );

      return api;
    },

    diagnose() {
      let locator = null;
      let error = null;

      try {
        locator =
          locate({
            silent: true,
          });
      } catch (caught) {
        error = caught;
      }

      const report = {
        editor: {
          version:
            VERSION,

          prefix:
            PREFIX,

          globalName:
            GLOBAL_NAME,

          installedAt:
            runtime.installedAt,
        },

        page: {
          url:
            location.href,

          title:
            document.title,

          careerElementCount:
            document
              .querySelectorAll(
                '[data-career-phase]',
              )
              .length,
        },

        react: locator
          ? {
              found: true,

              hookIndex:
                locator.hookIndex,

              score:
                locator.score,

              phase:
                locator.state.phase,

              seed:
                locator.state.seed,
            }
          : {
              found: false,

              error:
                error?.message,
            },

        memory: {
          backups:
            runtime.backups.size,

          undoEntries:
            runtime.undoStack.length,

          redoEntries:
            runtime.redoStack.length,

          watcherActive:
            Boolean(
              runtime.watcherTimer,
            ),

          panelOpen:
            Boolean(
              runtime.panelHost
                ?.isConnected,
            ),
        },
      };

      console.table(
        report.editor,
      );

      console.log(report);

      return report;
    },

    refresh() {
      const locator =
        locate({
          silent: false,
        });

      refreshPanel();

      ok(
        `Conexión actualizada. ` +
        `Fase: ${locator.state.phase}`,
      );

      return api;
    },

    destroy(
      options = {},
    ) {
      api.unwatch({
        silent: true,
      });

      if (
        runtime.panelTimer
      ) {
        clearInterval(
          runtime.panelTimer,
        );
      }

      runtime.panelTimer =
        null;

      runtime.panelHost?.remove();

      runtime.panelHost =
        null;

      try {
        delete window[GLOBAL_NAME];
      } catch {
        window[GLOBAL_NAME] =
          undefined;
      }

      if (!options.silent) {
        ok(
          `Editor desinstalado. ` +
          `Para cargarlo otra vez, ` +
          `vuelve a ejecutar el loader.`,
        );
      }

      return true;
    },
  };

  Object.defineProperties(
    api,
    {
      help: {
        enumerable: true,
        configurable: false,

        get() {
          return printHelp();
        },
      },

      status: {
        enumerable: true,
        configurable: false,

        get() {
          const value =
            summarize();

          console.log(
            `%c${CONFIG.consoleTag} ` +
            `Estado actual`,
            styles.info,
            value,
          );

          return value;
        },
      },

      get: {
        enumerable: true,
        configurable: false,

        get() {
          return clone(
            currentState(),
          );
        },
      },

      backups: {
        enumerable: true,
        configurable: false,

        get() {
          const list =
            [
              ...runtime.backups
                .values(),
            ].map(item => ({
              name:
                item.name,

              timestamp:
                item.timestamp,

              phase:
                item.state.phase,

              step:
                item.state.step,

              overall:
                item.state.player
                  ?.overall ?? null,

              seasons:
                item.state.seasons
                  ?.length ?? 0,
            }));

          console.table(list);

          return list;
        },
      },

      history: {
        enumerable: true,
        configurable: false,

        get() {
          const value = {
            undo:
              runtime.undoStack.map(
                ({
                  label,
                  timestamp,
                }) => ({
                  label,
                  timestamp,
                }),
              ),

            redo:
              runtime.redoStack.map(
                ({
                  label,
                  timestamp,
                }) => ({
                  label,
                  timestamp,
                }),
              ),
          };

          console.log(value);

          return value;
        },
      },

      examples: {
        enumerable: true,
        configurable: false,

        get() {
          return printExamples();
        },
      },

      known: {
        enumerable: true,
        configurable: false,

        get() {
          const value =
            clone(KNOWN);

          console.log(value);

          return value;
        },
      },

      config: {
        enumerable: true,
        configurable: false,

        get() {
          const value =
            clone(CONFIG);

          console.log(value);

          return value;
        },
      },
    },
  );

  try {
    if (
      !/^[A-Za-z_$][\w$]*$/.test(
        GLOBAL_NAME,
      )
    ) {
      warn(
        `El prefijo "${GLOBAL_NAME}" ` +
        `no es válido para usarlo con ` +
        `notación de punto. Usa ` +
        `window[${JSON.stringify(
          GLOBAL_NAME,
        )}] o cambia PREFIX.`,
      );
    }

    const previous =
      window[GLOBAL_NAME];

    if (
      previous?.__coperoCareerEditor &&
      typeof previous.destroy ===
        'function'
    ) {
      previous.destroy({
        silent: true,
      });
    }

    window[GLOBAL_NAME] =
      api;

    const initial =
      currentState();

    runtime.original =
      clone(initial);

    if (
      CONFIG.autoBackupOnInstall
    ) {
      runtime.backups.set(
        'original',
        {
          name:
            'original',

          timestamp:
            new Date().toISOString(),

          state:
            clone(initial),
        },
      );
    }

    console.log(
      `%c${GLOBAL_NAME} ` +
      `v${VERSION} ` +
      `cargado correctamente`,
      styles.title,
    );

    console.log(
      `Escribe %c${PREFIX}help%c ` +
      `para ver todos los comandos.`,
      styles.info,
      '',
    );

    console.log(
      `Ejemplo: ` +
      `%c${PREFIX}player({ ` +
      `overall: 99, ` +
      `price: 250_000_000 ` +
      `})`,
      styles.ok,
    );
  } catch (error) {
    window[GLOBAL_NAME] =
      api;

    fail(
      'El editor se cargó, pero ' +
      'todavía no pudo conectarse ' +
      'a una partida.',
      error,
    );

    console.log(
      `Abre una partida y luego ejecuta: ` +
      `%c${PREFIX}refresh()`,
      styles.info,
    );

    console.log(
      `Después escribe: ` +
      `%c${PREFIX}help`,
      styles.info,
    );
  }
})();
