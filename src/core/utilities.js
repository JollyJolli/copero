export const isObject = value => value !== null && typeof value === 'object';
export const isPlainObject = value => isObject(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
export function assert(condition, message) { if (!condition) throw new Error(message); }
export const unique = values => [...new Set(values)];
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const timestampName = (prefix = 'backup') => `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
