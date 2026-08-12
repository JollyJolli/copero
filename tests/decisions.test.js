import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry } from '../src/core/command-registry.js';
import { decisionOutcomeSpec, nextDecisionRandom, registerDecisions } from '../src/modules/decisions.js';
import { mockState, mockStateManager } from './helpers.js';

function setup(eventKey, optionKeys, variantKey) {
  const state = mockState(); state.rngState = 123456789;
  state.currentEvent = { id:`event-${eventKey}`, type:'career_event', eventKey, variantKey, options:optionKeys.map(optionKey => ({ id:`${eventKey}-${optionKey}`, type:'career_choice', eventKey, optionKey })) };
  const registry = new CommandRegistry(); registerDecisions(registry);
  const context = { registry, stateManager:mockStateManager(state), runtime:{ decisionOutcome:null }, logger:{ info(){} } };
  return { state, registry, context };
}

test('forces either side of a reversed negative random outcome and can restore auto', () => {
  const { state, registry, context } = setup('mysterious_substance', ['consume','reject']); const original = state.rngState;
  const good = registry.get('decisions.outcome').execute(context, 'positive');
  assert.equal(good.armed, true); assert.ok(nextDecisionRandom(state.rngState).value >= .25); assert.deepEqual(good.compatibleOptions, ['consume']);
  registry.get('decisions.auto').execute(context); assert.equal(state.rngState, original); assert.equal(context.runtime.decisionOutcome, null);
  const bad = registry.get('decisions.bad').execute(context); assert.equal(bad.outcome, 'negative'); assert.ok(nextDecisionRandom(state.rngState).value < .25);
});

test('injury at peak picks RNG values that work for either available choice', () => {
  const { state, registry, context } = setup('injury_at_peak', ['play_injured','recover']);
  assert.deepEqual(decisionOutcomeSpec(state.currentEvent)?.thresholds, [.3,.8]);
  registry.get('decisions.good').execute(context); assert.ok(nextDecisionRandom(state.rngState).value < .3);
  registry.get('decisions.bad').execute(context); assert.ok(nextDecisionRandom(state.rngState).value >= .8);
});

test('rejects decisions without a random positive or negative result', () => {
  const { registry, context } = setup('controversial_post', ['support_family','support_club']);
  assert.throws(() => registry.get('decisions.good').execute(context), /no tiene un resultado aleatorio/);
});
