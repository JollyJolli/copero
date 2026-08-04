import { clone } from './utilities.js';
export class BackupManager {
  constructor(stateManager) { this.stateManager = stateManager; this.store = new Map(); }
  create(name) { if (!name) throw new Error('El backup necesita nombre.'); this.store.set(String(name), { name: String(name), timestamp: new Date().toISOString(), state: this.stateManager.snapshot() }); return String(name); }
  restore(name) { const item = this.store.get(String(name)); if (!item) throw new Error(`No existe el backup "${name}".`); return this.stateManager.replace(`Restaurar backup ${name}`, item.state); }
  remove(name) { if (!this.store.delete(String(name))) throw new Error(`No existe el backup "${name}".`); return true; }
  list() { return [...this.store.values()].map(({ name, timestamp, state }) => ({ name, timestamp, phase: state.phase, seasons: state.seasons.length })); }
  exists(name) { return this.store.has(String(name)); }
}
