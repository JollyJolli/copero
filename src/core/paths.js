import { isObject } from './utilities.js';
export const getAtPath = (root, path, validator) => validator.path(path).reduce((v, key) => v?.[key], root);
export function setAtPath(root, path, value, validator) {
  const parts = validator.path(path); let cursor = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]; if (!isObject(cursor[key])) cursor[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cursor = cursor[key];
  } cursor[parts.at(-1)] = value;
}
export function deleteAtPath(root, path, validator) {
  const parts = validator.path(path); let cursor = root;
  for (const key of parts.slice(0, -1)) { cursor = cursor?.[key]; if (!isObject(cursor)) return false; }
  const key = parts.at(-1); if (!(key in cursor)) return false;
  if (Array.isArray(cursor) && /^\d+$/.test(key)) cursor.splice(Number(key), 1); else delete cursor[key]; return true;
}
