import test from 'node:test';
import assert from 'node:assert/strict';
import { countryFlag, overallTier, playerFlag } from '../src/ui/player-presentation.js';

test('player flag uses the real ISO alpha-2 nationality', () => {
  assert.equal(countryFlag('mx'), '🇲🇽');
  assert.equal(playerFlag({ player:{ nationality:{ iso_alpha2:'AR' } } }), '🇦🇷');
  assert.equal(countryFlag('MEX'), '🌍');
});

test('OVR tiers match the six Copero card ranges', () => {
  assert.deepEqual([1,69,70,79,80,89,90,94,95,98,99].map(overallTier), ['bronze','bronze','silver','silver','gold','gold','diamond','diamond','elite','elite','ultimate']);
});
