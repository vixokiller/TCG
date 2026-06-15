import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_TYPES,
  CASTLE_SIZE,
  DECK_COMPOSITION,
  STARTING_GOLD,
  STARTING_HAND_SIZE,
  advancePhase,
  assignDamage,
  availableGold,
  buildDeck,
  checkWinner,
  countByType,
  createGame,
  declareBlocker,
  groupPaidGold,
  moveAllyToAttack,
  playCard,
  returnAllyToHand,
  shuffleAllyIntoCastle,
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

test('players start in vigilia after automatic initial grouping', () => {
  const state = createGame();
  const player = state.players[0];
  assert.equal(state.phase, 'Vigilia');
  assert.equal(player.gold.length, STARTING_GOLD);
  assert.equal(availableGold(player), STARTING_GOLD);
  assert.equal(player.hand.length, STARTING_HAND_SIZE);
  assert.equal(player.deck.length, CASTLE_SIZE - STARTING_GOLD - STARTING_HAND_SIZE);
});

test('paid gold returns to reserve during automatic grouping helper', () => {
  const state = createGame();
  const player = state.players[0];
  player.paidGold.push(...player.gold.splice(0, 1));
  assert.equal(groupPaidGold(player), 1);
  assert.equal(player.gold.length, 1);
  assert.equal(player.paidGold.length, 0);
});

test('allies are played to defense line and can move to attack line in vigilia', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand.unshift({ id: 'ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, cost: 1, strength: 2 });
  assert.match(playCard(state, 0, 0), /Línea de Defensa/);
  assert.equal(player.defenseLine.length, 1);
  assert.match(moveAllyToAttack(player, 0), /Línea de Ataque/);
  assert.equal(player.attackLine.length, 1);
});

test('weapons attach to one ally and are destroyed with the bearer', () => {
  const state = createGame();
  const player = state.players[0];
  player.gold.push({ id: 'extra-gold', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.defenseLine.push({ id: 'ally', name: 'Portador', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, weapon: null });
  player.hand.unshift({ id: 'weapon', name: 'Arma Test', type: CARD_TYPES.ARMA, cost: 1, strength: 2 });
  assert.match(playCard(state, 0, 0), /anexada/);
  assert.equal(player.defenseLine[0].weapon.name, 'Arma Test');
  returnAllyToHand(player, 'defenseLine', 0);
  assert.equal(player.discard.at(-1).name, 'Arma Test');
});

test('attached weapon is shuffled with ally when bearer returns to castle', () => {
  const state = createGame();
  const player = state.players[0];
  const before = player.deck.length;
  player.defenseLine.push({ id: 'ally', name: 'Portador', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, weapon: { id: 'weapon', name: 'Arma Test', type: CARD_TYPES.ARMA, strength: 2 } });
  shuffleAllyIntoCastle(player, 'defenseLine', 0);
  assert.equal(player.deck.length, before + 2);
});

test('battle advances through attack, blockers, talisman war and damage assignment', () => {
  const state = createGame();
  state.players[0].attackLine.push({ id: 'attacker', name: 'Atacante', type: CARD_TYPES.ALIADO, strength: 3, bonus: 0, exhausted: false, weapon: null });
  state.players[1].defenseLine.push({ id: 'defender', name: 'Defensor', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false, weapon: null });
  advancePhase(state);
  assert.equal(state.phase, 'Declaración de Ataque');
  advancePhase(state);
  assert.equal(state.phase, 'Declaración de Bloqueadores');
  assert.match(declareBlocker(state, 0, 0), /bloquea/);
  advancePhase(state);
  assert.equal(state.phase, 'Guerra de Talismanes');
  advancePhase(state);
  assert.equal(state.phase, 'Asignación de Daño');
  assert.match(assignDamage(state), /Daño asignado/);
  assert.equal(state.players[1].discard.at(-1).name, 'Defensor');
});

test('a player with an empty castle loses immediately', () => {
  const state = createGame();
  state.players[0].deck = [];
  checkWinner(state);
  assert.equal(state.loser, 'Jugador');
  assert.equal(state.winner, 'Rival');
});
