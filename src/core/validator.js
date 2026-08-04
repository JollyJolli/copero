import { assert, isObject, isPlainObject } from './utilities.js';
export const BLOCKED_PATH_PARTS = ['__proto__', 'prototype', 'constructor'];
export class Validator {
  constructor(config) { this.config = config; }
  number(value, label, { integer = false, min, max } = {}) {
    const result = Number(value); assert(Number.isFinite(result), `${label} debe ser un número válido.`);
    if (integer) assert(Number.isInteger(result), `${label} debe ser entero.`);
    if (min !== undefined) assert(result >= min, `${label} debe ser >= ${min}.`);
    if (max !== undefined) assert(result <= max, `${label} debe ser <= ${max}.`);
    return result;
  }
  path(path) {
    assert(typeof path === 'string' && path.trim(), 'La ruta debe ser texto no vacío.');
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    assert(parts.length > 0, 'La ruta está vacía.');
    for (const part of parts) assert(!BLOCKED_PATH_PARTS.includes(part), `Segmento prohibido: ${part}.`);
    return parts;
  }
  gameState(value) { return Boolean(isObject(value) && typeof value.phase === 'string' && Array.isArray(value.seasons) && isObject(value.totals)); }
  patch(value, label = 'patch') { assert(isPlainObject(value), `${label} debe ser un objeto.`); return value; }
}
