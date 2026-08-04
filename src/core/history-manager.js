import { clone } from './utilities.js';
export class HistoryManager {
  constructor(limit = 50) { this.limit = limit; this.undoStack = []; this.redoStack = []; }
  record(state, label) { this.undoStack.push({ state: clone(state), label, timestamp: new Date().toISOString() }); this.undoStack.splice(0, Math.max(0, this.undoStack.length - this.limit)); this.redoStack.length = 0; }
  undo(current) { const entry = this.undoStack.pop(); if (!entry) throw new Error('No hay cambios para deshacer.'); this.redoStack.push({ state: clone(current), label: entry.label }); return clone(entry.state); }
  redo(current) { const entry = this.redoStack.pop(); if (!entry) throw new Error('No hay cambios para rehacer.'); this.undoStack.push({ state: clone(current), label: entry.label }); return clone(entry.state); }
  clear() { this.undoStack.length = this.redoStack.length = 0; }
  list() { return { undo: this.undoStack.map(({ label, timestamp }) => ({ label, timestamp })), redo: this.redoStack.map(({ label, timestamp }) => ({ label, timestamp })) }; }
}
