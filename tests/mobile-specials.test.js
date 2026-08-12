import test from 'node:test';
import assert from 'node:assert/strict';
import { BackupManager } from '../src/core/backup-manager.js';
import { CommandRegistry } from '../src/core/command-registry.js';
import { Validator } from '../src/core/validator.js';
import { registerPlayer } from '../src/modules/player.js';
import { registerWatcher } from '../src/modules/watcher.js';
import { registerTrophies, TROPHIES, legitAwardsForPosition } from '../src/modules/trophies.js';
import { completeCurrentSeason, mobileSpecialsStatus, registerMobileSpecials } from '../src/modules/mobile-specials.js';
import { mockState, mockStateManager } from './helpers.js';

function setup() {
  const state = mockState(), stateManager = mockStateManager(state), registry = new CommandRegistry();
  const runtime = { freezes:new Map(), mobileSpecials:null };
  registerPlayer(registry); registerWatcher(registry); registerTrophies(registry); registerMobileSpecials(registry);
  const context = { registry, runtime, stateManager, backupManager:new BackupManager(stateManager), validator:new Validator({}), config:{ safeMode:true }, logger:{ success(){} } };
  return { state, context };
}

test('mobile god mode creates one backup, freezes OVR and completes achievements without duplicates', () => {
  const { state, context } = setup();
  state.seasons[0].trophies = ['league']; state.seasons[0].awards = ['golden_boot'];
  context.registry.get('mobileSpecials.godMode').execute(context, true);
  const active = mobileSpecialsStatus(context.runtime);
  assert.equal(state.player.overall, 99);
  assert.equal(active.godMode, true);
  assert.equal(context.backupManager.list().length, 1);
  assert.deepEqual(state.seasons[0].trophies, TROPHIES);
  assert.deepEqual(state.seasons[0].awards, ['golden_boot', ...legitAwardsForPosition('ST').filter(id => id !== 'golden_boot')]);
  context.registry.get('mobileSpecials.autoAll').execute(context, true);
  assert.equal(context.backupManager.list().length, 1);
  assert.equal(new Set(state.seasons[0].trophies).size, TROPHIES.length);
  state.seasons.push({ ...structuredClone(state.seasons[0]), id:'s2', trophies:[], awards:[] });
  assert.equal(completeCurrentSeason(context), true);
  assert.deepEqual(state.seasons[1].trophies, TROPHIES);
  assert.deepEqual(state.seasons[1].awards, legitAwardsForPosition('ST'));
  context.registry.get('mobileSpecials.stopAll').execute(context);
  assert.deepEqual(mobileSpecialsStatus(context.runtime), { ovr99:false, autoAll:false, godMode:false, backupName:active.backupName, lastCompletedSeason:'s2', completions:2 });
});
