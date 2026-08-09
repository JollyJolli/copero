import { clone } from './utilities.js';
export function syncCurrentEventReference(currentState,nextState){
  const target=currentState?.currentEvent,source=nextState?.currentEvent;
  if(!target||!source||typeof target!=='object'||typeof source!=='object')return false;
  const snapshot=clone(source);
  for(const key of Object.keys(target))if(!(key in snapshot))delete target[key];
  Object.assign(target,snapshot);return true;
}
export class StateManager {
  constructor(locator, validator, history, logger) { this.locator = locator; this.validator = validator; this.history = history; this.logger = logger; this.connection = null; }
  refreshConnection() { this.connection = this.locator.locate({ silent: false }); return this.connection; }
  get() { this.connection = this.locator.locate(); return this.connection.state; }
  snapshot() { return clone(this.get()); }
  validate(state) { if (!this.validator.gameState(state)) throw new Error('El resultado no conserva una partida válida.'); return true; }
  mutate(label, mutator, { syncCurrentEvent = false } = {}) {
    const connection = this.locator.locate(); const before = clone(connection.state); const draft = clone(before); const result = mutator(draft) ?? draft; this.validate(result);
    if(syncCurrentEvent)try{syncCurrentEventReference(connection.state,result);}catch(error){this.logger.debug('No se pudo sincronizar la tarjeta visual del evento.',error);}
    connection.dispatch(previous => { const base = this.validator.gameState(previous) ? previous : before; this.history.record(base, label); return clone(result); });
    this.logger.success(label); return result;
  }
  replace(label, state, { history = true } = {}) { this.validate(state); const connection = this.locator.locate(); if (history) this.history.record(connection.state, label); connection.dispatch(() => clone(state)); this.logger.success(label); return state; }
}
