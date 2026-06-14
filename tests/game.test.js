import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_TYPES, attack, availableGold, createGame, playCard } from '../src/game.js';

test('playing one gold increases available resources', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand.unshift({ id: 'test-gold', name: 'Oro Test', type: CARD_TYPES.ORO });

  const result = playCard(state, 0, 0);

  assert.match(result, /Oro/);
  assert.equal(availableGold(player), 1);
});

test('an ally attack mills the opposing castle', () => {
  const state = createGame();
  state.players[0].field.push({ id: 'ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, strength: 3, bonus: 1, exhausted: false });
  const before = state.players[1].deck.length;

  const result = attack(state, 0, 0);

  assert.match(result, /4 cartas/);
  assert.equal(state.players[1].deck.length, before - 4);
});
