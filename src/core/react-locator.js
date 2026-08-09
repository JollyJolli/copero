import { isObject } from './utilities.js';
import { CONSOLE_THEME as T } from './console-theme.js';
export function isGameState(value) { return Boolean(isObject(value) && typeof value.phase === 'string' && Array.isArray(value.seasons) && isObject(value.totals)); }
export function scoreGameState(value) {
  if (!isGameState(value)) return -Infinity; let score = 10;
  for (const key of ['player', 'currentEvent', 'currentTeamId', 'contractTeamId', 'rngState', 'mode', 'step']) if (key in value) score += 2;
  return score;
}
export class ReactLocator {
  constructor(config, runtime) { this.config = config; this.runtime = runtime; }
  fiber(node) { const key = node && Object.keys(node).find(k => ['__reactFiber$', '__reactInternalInstance$', '__reactContainer$'].some(p => k.startsWith(p))); return key ? node[key] : null; }
  locate({ silent = true } = {}) {
    const nodes = [...document.querySelectorAll('[data-career-phase]')];
    for (const node of [...nodes]) { if (node.parentElement) nodes.push(node.parentElement); nodes.push(...node.children); }
    if (document.body) nodes.push(document.body); const candidates = []; const seen = new Set();
    for (const node of new Set(nodes)) {
      const queue = [this.fiber(node)]; let visited = 0;
      while (queue.length && visited++ < this.config.maxReactNodes) {
        const fiber = queue.shift(); if (!fiber || seen.has(fiber)) continue; seen.add(fiber);
        for (const candidateFiber of [fiber, fiber.alternate]) {
          let hook = candidateFiber?.memoizedState; const seenHooks = new Set(); let hookIndex = 0;
          while (isObject(hook) && !seenHooks.has(hook)) {
            seenHooks.add(hook); const dispatch = hook.queue?.dispatch;
            for (const state of [hook.queue?.lastRenderedState, hook.memoizedState, hook.baseState]) if (isGameState(state) && typeof dispatch === 'function') candidates.push({ state, dispatch, hookIndex, score: scoreGameState(state), sourceNode: node });
            hook = hook.next; hookIndex++;
          }
        }
        queue.push(fiber.return, fiber.child, fiber.sibling, fiber.alternate);
      }
    }
    candidates.sort((a, b) => b.score - a.score); const best = candidates[0];
    if (!best) throw new Error('No se encontró el estado React. Abre una partida y ejecuta careerEditor.diagnose().');
    this.runtime.lastLocator = { score: best.score, hookIndex: best.hookIndex, candidateCount: candidates.length, phase: best.state.phase, foundAt: new Date().toISOString() };
    if (!silent) console.debug('%c CEE %c ◆ REACT LOCALIZADO ', T.mark, T.debug, this.runtime.lastLocator); return best;
  }
}
