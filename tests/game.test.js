import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_TYPES,
  CASTLE_SIZE,
  DECK_COMPOSITION,
  STARTING_GOLD,
  STARTING_HAND_SIZE,
  advancePhase,
  attack,
  availableGold,
  buildDeck,
  checkWinner,
  countByType,
  createGame,
  groupPaidGold,
  playCard,
} from '../src/game.js';

test('standard castle deck has 50 cards with requested type composition', () => {
  const deck = buildDeck();
  const counts = countByType(deck);

  assert.equal(deck.length, CASTLE_SIZE);
  assert.equal(counts[CARD_TYPES.ORO], DECK_COMPOSITION[CARD_TYPES.ORO]);
  assert.equal(counts[CARD_TYPES.ALIADO], DECK_COMPOSITION[CARD_TYPES.ALIADO]);
  assert.equal(counts[CARD_TYPES.TALISMAN], DECK_COMPOSITION[CARD_TYPES.TALISMAN]);
  assert.equal(counts[CARD_TYPES.TOTEM], DECK_COMPOSITION[CARD_TYPES.TOTEM]);
  assert.equal(counts[CARD_TYPES.ARMA], DECK_COMPOSITION[CARD_TYPES.ARMA]);
});

test('players start with one gold and eight cards in hand', () => {
  const state = createGame();
  const player = state.players[0];

  assert.equal(player.gold.length, STARTING_GOLD);
  assert.equal(availableGold(player), STARTING_GOLD);
  assert.equal(player.hand.length, STARTING_HAND_SIZE);
  assert.equal(player.deck.length, CASTLE_SIZE - STARTING_GOLD - STARTING_HAND_SIZE);
});

test('paid gold returns to gold zone during grouping phase', () => {
  const state = createGame();
  const player = state.players[0];
  player.paidGold.push(...player.gold.splice(0, 1));

  const grouped = groupPaidGold(player);

  assert.equal(grouped, 1);
  assert.equal(player.gold.length, 1);
  assert.equal(player.paidGold.length, 0);
});

test('playing cards is restricted to vigilia and gold payment moves to paid gold', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand.unshift({ id: 'ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, cost: 1, strength: 2 });

  assert.match(playCard(state, 0, 0), /Vigilia/);
  advancePhase(state);
  const result = playCard(state, 0, 0, 'attackLine');

  assert.match(result, /Línea de Ataque/);
  assert.equal(player.attackLine.length, 1);
  assert.equal(player.gold.length, 0);
  assert.equal(player.paidGold.length, 1);
});

test('totems are played to support line during vigilia', () => {
  const state = createGame();
  const player = state.players[0];
  player.gold.push({ id: 'extra-gold', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.hand.unshift({ id: 'totem', name: 'Tótem Test', type: CARD_TYPES.TOTEM, cost: 2, text: 'Continuo.' });
  advancePhase(state);

  const result = playCard(state, 0, 0);

  assert.match(result, /Línea de Apoyo/);
  assert.equal(player.supportLine.length, 1);
});

test('ready opposing defense line allies defend before castle damage during battle', () => {
  const state = createGame();
  state.phaseIndex = 2;
  state.phase = 'Batalla Mitológica';
  state.players[0].attackLine.push({ id: 'attacker', name: 'Atacante', type: CARD_TYPES.ALIADO, strength: 3, bonus: 0, exhausted: false });
  state.players[1].defenseLine.push({ id: 'defender', name: 'Defensor', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false });
  const before = state.players[1].deck.length;

  const result = attack(state, 0, 0);

  assert.match(result, /vence/);
  assert.equal(state.players[1].deck.length, before);
  assert.equal(state.players[1].discard.at(-1).name, 'Defensor');
});

test('an unblocked ally attack mills the opposing castle during battle', () => {
  const state = createGame();
  state.phaseIndex = 2;
  state.phase = 'Batalla Mitológica';
  state.players[0].attackLine.push({ id: 'ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, strength: 3, bonus: 1, exhausted: false });
  const before = state.players[1].deck.length;

  const result = attack(state, 0, 0);

  assert.match(result, /4 de daño/);
  assert.equal(state.players[1].deck.length, before - 4);
});

test('a player with an empty castle loses immediately', () => {
  const state = createGame();
  state.players[0].deck = [];

  checkWinner(state);

  assert.equal(state.loser, 'Jugador');
  assert.equal(state.winner, 'Rival');
});
