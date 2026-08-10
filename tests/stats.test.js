import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry } from '../src/core/command-registry.js';
import { Validator } from '../src/core/validator.js';
import { registerStats } from '../src/modules/stats.js';
import { mockState, mockStateManager } from './helpers.js';

test('mobile stat increments update the latest season and synchronized totals atomically', () => {
  const state = mockState(), registry = new CommandRegistry();
  state.nationalTeamPeriods.push({ stats:{ goals:3, assists:2, appearances:4 }, trophies:[], awards:[] });
  registerStats(registry);
  registry.get('stats.addLastSeason').execute({ stateManager:mockStateManager(state), validator:new Validator({}) }, { goals:5, assists:1, appearances:10 });
  assert.deepEqual(state.seasons[0].stats, { goals:7, assists:2, appearances:10 });
  assert.equal(state.totals.goals, 10);
  assert.equal(state.totals.assists, 4);
  assert.equal(state.totals.appearances, 14);
});
