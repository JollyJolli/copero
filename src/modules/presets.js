import { command } from './helpers.js';
const initial = new Map([['wonderkid',{ overall: 80, age: 18 }],['elite',{ overall: 90 }],['goat',{ overall: 99 }],['realistic',{ overall: 85 }]]);
export function registerPresets(registry) {
  command(registry, { name: 'presets.list', category: 'presets', description: 'Lista presets.', usage: 'careerEditor.presets.list()', execute: () => [...initial.keys()] });
  command(registry, { name: 'presets.apply', category: 'presets', description: 'Aplica preset solo al jugador.', usage: 'careerEditor.presets.apply("goat")', execute: (ctx, name) => { const patch = initial.get(name); if (!patch) throw new Error('Preset desconocido.'); return ctx.registry.get('player.set').execute(ctx, patch); } });
  command(registry, { name: 'presets.create', category: 'presets', description: 'Crea preset.', usage: 'careerEditor.presets.create("x",{...})', execute: ({ validator }, name, patch) => { validator.patch(patch); initial.set(String(name), structuredClone(patch)); return name; } });
  command(registry, { name: 'presets.remove', category: 'presets', description: 'Elimina preset.', usage: 'careerEditor.presets.remove("x")', execute: (_, name) => initial.delete(String(name)) });
}
