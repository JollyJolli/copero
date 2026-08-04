import { command } from './helpers.js';
const aliases = { ovr: 'overall', rating: 'overall', price: 'marketValue', value: 'marketValue', name: 'lastName', surname: 'lastName', number: 'preferredNumber', foot: 'preferredFoot', team: 'currentTeamId' };
export function normalizePlayerPatch(input, validator, safe = true) {
  validator.patch(input, 'player'); const patch = { ...input };
  for (const [alias, canonical] of Object.entries(aliases)) { if (alias in patch && !(canonical in patch)) patch[canonical] = patch[alias]; delete patch[alias]; }
  if ('overall' in patch) patch.overall = validator.number(patch.overall, 'overall', safe ? { integer: true, min: 1, max: 99 } : { integer: true });
  if ('age' in patch) patch.age = validator.number(patch.age, 'age', { integer: true, min: 0, ...(safe ? { max: 100 } : {}) });
  if ('preferredNumber' in patch) patch.preferredNumber = validator.number(patch.preferredNumber, 'dorsal', { integer: true, min: 1, max: 99 });
  if ('marketValue' in patch) patch.marketValue = validator.number(patch.marketValue, 'valor', { min: 0 });
  if ('preferredFoot' in patch) { patch.preferredFoot = String(patch.preferredFoot).toLowerCase(); if (safe && !['left', 'right'].includes(patch.preferredFoot)) throw new Error('Pie inválido.'); }
  if ('position' in patch) patch.position = String(patch.position).toUpperCase();
  for (const key of ['lastName', 'currentTeamId']) if (key in patch) patch[key] = String(patch[key]); return patch;
}
export function registerPlayer(registry) {
  command(registry, { name: 'player.set', category: 'player', description: 'Actualiza el jugador.', usage: 'careerEditor.player.set({...})', aliases: ['player'], execute: ({ stateManager, validator, config }, patch) => stateManager.mutate('Jugador actualizado', draft => { if (!draft.player) throw new Error('La partida no tiene jugador.'); const normalized = normalizePlayerPatch(patch, validator, config.safeMode); draft.player = { ...draft.player, ...normalized }; if ('currentTeamId' in normalized) { draft.currentTeamId = normalized.currentTeamId; if (draft.contractTeamId != null) draft.contractTeamId = normalized.currentTeamId; } }) });
  for (const [name, field] of Object.entries({ overall: 'overall', price: 'marketValue', age: 'age', name: 'lastName', number: 'preferredNumber', foot: 'preferredFoot', position: 'position', team: 'currentTeamId' })) command(registry, { name: `player.${name}`, category: 'player', description: `Cambia ${field}.`, usage: `careerEditor.player.${name}(value)`, aliases: [name], execute: (ctx, value, options = {}) => { const result = ctx.registry.get('player.set').execute(ctx, { [field]: value }); if (options.lastSeason && ctx.stateManager.get().seasons.length) ctx.registry.get('seasons.edit').execute(ctx, 'last', { [field === 'currentTeamId' ? 'teamId' : field]: value }); return result; } });
  command(registry, { name: 'player.get', category: 'player', description: 'Obtiene el jugador.', usage: 'careerEditor.player.get()', execute: ({ stateManager }) => structuredClone(stateManager.get().player) });
}
