import test from 'node:test';
import assert from 'node:assert/strict';
import { attachMethods } from '../src/core/utilities.js';

test('callable namespaces can expose a name command', () => {
  const player = (...args) => args;
  const nameCommand = value => value;

  attachMethods(player, {
    set: value => value,
    name: nameCommand,
    overall: value => value
  });

  assert.equal(typeof player, 'function');
  assert.equal(player.name, nameCommand);
  assert.equal(player.name('JOLLY'), 'JOLLY');
  assert.equal(player.overall(99), 99);
});
