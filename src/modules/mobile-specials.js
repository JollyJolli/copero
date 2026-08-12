import { command } from './helpers.js';
import { TROPHIES, legitAwardsForPosition } from './trophies.js';

const OVR_PATH = 'player.overall';

function store(runtime) {
  return runtime.mobileSpecials ??= {
    ovr99: false,
    autoAll: false,
    autoAllTimer: null,
    busy: false,
    backupName: null,
    lastCompletedSeason: null,
    completions: 0
  };
}

function seasonIdentity(state) {
  const index = (state.seasons?.length ?? 0) - 1;
  if (index < 0) return null;
  const season = state.seasons[index];
  return String(season.id ?? `${index + 1}:${season.age ?? ''}:${season.teamId ?? ''}`);
}

function missingAchievements(state) {
  const season = state.seasons?.at(-1);
  if (!season) return 0;
  const awards = legitAwardsForPosition(state.player?.position);
  return TROPHIES.filter(id => !season.trophies?.includes(id)).length + awards.filter(id => !season.awards?.includes(id)).length;
}

function ensureSafetyBackup(context) {
  const special = store(context.runtime);
  if (special.backupName && context.backupManager.exists(special.backupName)) return special.backupName;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  special.backupName = `antes-especiales-${stamp}`;
  context.backupManager.create(special.backupName);
  return special.backupName;
}

export function completeCurrentSeason(context) {
  const special = store(context.runtime);
  if (special.busy) return false;
  let state;
  try { state = context.stateManager.get(); } catch { return false; }
  if (!state.seasons?.length || !missingAchievements(state)) return false;
  special.busy = true;
  try {
    context.registry.get('addLegitSeason').execute(context);
    special.lastCompletedSeason = seasonIdentity(context.stateManager.get());
    special.completions += 1;
    return true;
  } finally { special.busy = false; }
}

function setOvr99(context, enabled) {
  const special = store(context.runtime);
  if (enabled) {
    ensureSafetyBackup(context);
    context.registry.get('player.overall').execute(context, 99);
    context.registry.get('freeze').execute(context, OVR_PATH, 99);
    special.ovr99 = true;
  } else {
    context.registry.get('unfreeze').execute(context, OVR_PATH);
    special.ovr99 = false;
  }
  return mobileSpecialsStatus(context.runtime);
}

function setAutoAll(context, enabled) {
  const special = store(context.runtime);
  clearInterval(special.autoAllTimer);
  special.autoAllTimer = null;
  special.autoAll = Boolean(enabled);
  if (special.autoAll) {
    ensureSafetyBackup(context);
    completeCurrentSeason(context);
    special.autoAllTimer = setInterval(() => { try { completeCurrentSeason(context); } catch {} }, 900);
  }
  return mobileSpecialsStatus(context.runtime);
}

export function mobileSpecialsStatus(runtime) {
  const special = store(runtime);
  const ovr99 = special.ovr99 && runtime.freezes.has(OVR_PATH);
  const autoAll = special.autoAll && Boolean(special.autoAllTimer);
  return {
    ovr99,
    autoAll,
    godMode: ovr99 && autoAll,
    backupName: special.backupName,
    lastCompletedSeason: special.lastCompletedSeason,
    completions: special.completions
  };
}

export function registerMobileSpecials(registry) {
  command(registry, { name:'mobileSpecials.status', category:'runtime', description:'Estado de los especiales móviles.', usage:'careerEditor.mobileSpecials.status()', execute:({ runtime }) => mobileSpecialsStatus(runtime) });
  command(registry, { name:'mobileSpecials.ovr99', category:'runtime', description:'Activa o desactiva el OVR 99 Freeze.', usage:'careerEditor.mobileSpecials.ovr99(true)', execute:(context, enabled = true) => setOvr99(context, Boolean(enabled)) });
  command(registry, { name:'mobileSpecials.autoAll', category:'runtime', description:'Completa automáticamente trofeos y premios compatibles con la posición.', usage:'careerEditor.mobileSpecials.autoAll(true)', execute:(context, enabled = true) => setAutoAll(context, Boolean(enabled)) });
  command(registry, { name:'mobileSpecials.godMode', category:'runtime', description:'Combina OVR 99 Freeze y temporadas realistas automáticas.', usage:'careerEditor.mobileSpecials.godMode(true)', execute:(context, enabled = true) => { if (enabled) { ensureSafetyBackup(context); setOvr99(context, true); setAutoAll(context, true); } else { setOvr99(context, false); setAutoAll(context, false); } return mobileSpecialsStatus(context.runtime); } });
  command(registry, { name:'mobileSpecials.stopAll', category:'runtime', description:'Detiene todos los especiales móviles.', usage:'careerEditor.mobileSpecials.stopAll()', execute:context => { setOvr99(context, false); setAutoAll(context, false); return mobileSpecialsStatus(context.runtime); } });
}
