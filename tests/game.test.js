import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_TYPES,
  CASTLE_SIZE,
  STARTING_GOLD,
  STARTING_HAND_SIZE,
  attack,
  availableGold,
  buildDeck,
  checkWinner,
  createGame,
  playCard,
} from '../src/game.js';

test('castle deck recipe contains 50 cards before setup', () => {
  assert.equal(buildDeck().length, CASTLE_SIZE);
});

test('players start with one gold and eight cards in hand', () => {
  const state = createGame();
  const player = state.players[0];

  assert.equal(player.gold.length, STARTING_GOLD);
  assert.equal(availableGold(player), STARTING_GOLD);
  assert.equal(player.hand.length, STARTING_HAND_SIZE);
  assert.equal(player.deck.length, CASTLE_SIZE - STARTING_GOLD - STARTING_HAND_SIZE);
});

test('playing one gold increases available resources', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand.unshift({ id: 'test-gold', name: 'Oro Test', type: CARD_TYPES.ORO });

  const result = playCard(state, 0, 0);

  assert.match(result, /Oro/);
  assert.equal(availableGold(player), STARTING_GOLD + 1);
});

test('ready opposing allies defend before castle damage', () => {
  const state = createGame();
  state.players[0].field.push({ id: 'attacker', name: 'Atacante', type: CARD_TYPES.ALIADO, strength: 3, bonus: 0, exhausted: false });
  state.players[1].field.push({ id: 'defender', name: 'Defensor', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false });
  const before = state.players[1].deck.length;

  const result = attack(state, 0, 0);

  assert.match(result, /vence/);
  assert.equal(state.players[1].deck.length, before);
  assert.equal(state.players[1].discard.at(-1).name, 'Defensor');
});

test('an unblocked ally attack mills the opposing castle', () => {
  const state = createGame();
  state.players[0].field.push({ id: 'ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, strength: 3, bonus: 1, exhausted: false });
  const before = state.players[1].deck.length;

  const result = attack(state, 0, 0);

  assert.match(result, /4 cartas/);
  assert.equal(state.players[1].deck.length, before - 4);
});

test('a player with an empty castle loses immediately', () => {
  const state = createGame();
  state.players[0].deck = [];

  checkWinner(state);

  assert.equal(state.loser, 'Jugador');
  assert.equal(state.winner, 'Rival');
});
