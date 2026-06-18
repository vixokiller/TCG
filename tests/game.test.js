import { CARD_DATABASE, validateDeckCopies } from '../src/cardDatabase.js';
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
  moveAllyToDefense,
  playCard,
  returnAllyToHand,
  shuffleAllyIntoCastle,
  startGameWithSelectedDeck,
} from '../src/game.js';



test('card database exposes required management fields', () => {
  const card = CARD_DATABASE[0];
  for (const field of ['name', 'image', 'cost', 'strength', 'type', 'race', 'ability', 'rarity', 'code', 'edition', 'product']) {
    assert.ok(Object.hasOwn(card, field));
  }
});



test('deck validation enforces unique and copy limits', () => {
  const unique = { code: 'U-1', name: 'Única Test', unique: true, copyLimit: 1 };
  const regular = { code: 'R-1', name: 'Regular Test', copyLimit: 3 };

  assert.deepEqual(validateDeckCopies([unique, unique]), ['Única Test excede el máximo de 1 copia(s).']);
  assert.equal(validateDeckCopies([regular, regular, regular, regular]).at(-1), 'Regular Test excede el máximo de 3 copia(s).');
});

test('finalGroupGold returns paid gold to reserve during final phase', () => {
  const state = createGame();
  const player = state.players[0];
  player.paidGold.push({ id: 'gold-final', name: 'Oro Final', type: CARD_TYPES.ORO, ability: 'finalGroupGold', paid: true });
  state.phase = 'Asignación de Daño';

  advancePhase(state);
  assert.equal(state.phase, 'Fase Final');
  advancePhase(state);

  assert.ok(player.gold.some((card) => card.name === 'Oro Final'));
  assert.equal(state.phase, 'Robo');
});

test('counterCard cancels a pending card and sends both cards to cemeteries', () => {
  const state = createGame();
  const pending = { id: 'pending', name: 'Carta Pendiente', type: CARD_TYPES.TALISMAN, cost: 1 };
  state.stack.push({ card: pending, playerIndex: 0 });
  state.players[1].gold.push({ id: 'gold-counter-1', name: 'Oro', type: CARD_TYPES.ORO }, { id: 'gold-counter-2', name: 'Oro', type: CARD_TYPES.ORO });
  state.players[1].hand.unshift({ id: 'counter', name: 'Anular Test', type: CARD_TYPES.TALISMAN, cost: 2, ability: 'counterCard' });

  const result = playCard(state, 1, 0);

  assert.match(result, /anuló/);
  assert.equal(state.players[0].discard.at(-1).name, 'Carta Pendiente');
  assert.equal(state.players[1].discard.at(-1).name, 'Anular Test');
});



test('cancelAbility cancels an activated or triggered ability in the stack', () => {
  const state = createGame();
  let resolved = false;
  state.abilityStack.push({ playerIndex: 1, source: { name: 'Habilidad Test' }, ability: 'drawTwo', kind: 'activada', resolve: () => { resolved = true; } });
  state.players[0].gold.push({ id: 'gold-cancel', name: 'Oro', type: CARD_TYPES.ORO });
  state.players[0].hand.unshift({ id: 'cancel', name: 'Cancelar Habilidad', type: CARD_TYPES.TALISMAN, cost: 1, ability: 'cancelAbility' });

  const result = playCard(state, 0, 0);

  assert.match(result, /canceló/);
  assert.equal(state.abilityStack.length, 0);
  assert.equal(resolved, false);
});

test('draw phase discards down to eight cards after drawing', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand = Array.from({ length: 9 }, (_, index) => ({ id: `h${index}`, name: `Mano ${index}`, type: CARD_TYPES.TALISMAN }));
  state.phase = 'Robo';

  advancePhase(state);

  assert.equal(player.hand.length, 8);
  assert.ok(player.discard.length >= 1);
});




test('invalidForDeck cards are rejected by deck validation', () => {
  const invalid = { code: 'OLD-1', name: 'Carta Antigua', invalidForDeck: true };
  assert.deepEqual(validateDeckCopies([invalid]), ['Carta Antigua no es válida para construir mazos.']);
});

test('Dragon Dorado counters a pending card and banishes itself', () => {
  const state = createGame();
  const pending = { id: 'pending-dragon', name: 'Carta Pendiente', type: CARD_TYPES.TALISMAN, cost: 1 };
  state.stack.push({ card: pending, playerIndex: 1 });
  state.players[0].gold.push(
    { id: 'g1', name: 'Oro', type: CARD_TYPES.ORO },
    { id: 'g2', name: 'Oro', type: CARD_TYPES.ORO },
    { id: 'g3', name: 'Oro', type: CARD_TYPES.ORO },
    { id: 'g4', name: 'Oro', type: CARD_TYPES.ORO },
  );
  state.players[0].hand.unshift({ id: 'dragon-golden', name: 'Dragón Dorado', type: CARD_TYPES.ALIADO, cost: 4, strength: 5, ability: 'dragonGoldenCounter' });

  const result = playCard(state, 0, 0);

  assert.match(result, /desterró Dragón Dorado/);
  assert.equal(state.players[0].banished.at(-1).name, 'Dragón Dorado');
  assert.equal(state.players[1].discard.at(-1).name, 'Carta Pendiente');
});

test('cards can combine multiple abilities from text or explicit arrays', () => {
  const dragon = CARD_DATABASE.find((card) => card.name === 'Dragón Dorado');
  const gaitas = CARD_DATABASE.find((card) => card.name === 'Gaitas');

  assert.equal(dragon.ability, 'dragonGoldenCounter');
  assert.equal(dragon.unique, true);
  assert.deepEqual(gaitas.ability, ['foyeDefenseBuff', 'machiExtraDraw']);
});

test('combined abilities are all functional in gameplay', () => {
  const state = createGame();
  const player = state.players[0];
  player.gold.push(
    { id: 'g1', name: 'Oro', type: CARD_TYPES.ORO },
    { id: 'g2', name: 'Oro', type: CARD_TYPES.ORO },
    { id: 'g3', name: 'Oro', type: CARD_TYPES.ORO },
    { id: 'g4', name: 'Oro', type: CARD_TYPES.ORO },
  );
  player.hand.unshift({ id: 'dragon', name: 'Dragón de Prueba', type: CARD_TYPES.ALIADO, cost: 4, strength: 5, race: 'Dragón', ability: ['haste', 'drawOnEnter', 'banishOnHit'] });
  const handBefore = player.hand.length;

  assert.match(playCard(state, 0, 0), /Dragón de Prueba/);
  assert.equal(player.hand.length, handBefore); // salió el Dragón y robó 1 carta.
  assert.match(moveAllyToAttack(player, 0, state), /Línea de Ataque/);
});



test('selected user deck starts a match even with fewer than 50 cards', () => {
  const state = createGame();
  const tinyDeck = [
    { id: 'tiny-gold', code: 'tiny-gold', name: 'Oro Test', type: CARD_TYPES.ORO },
    { id: 'tiny-ally', code: 'tiny-ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, cost: 1, strength: 2 },
    { id: 'tiny-talisman', code: 'tiny-talisman', name: 'Talismán Test', type: CARD_TYPES.TALISMAN, cost: 0, ability: 'drawTwo' },
  ];
  state.decks.push({ id: 'tiny', name: 'Mazo mínimo', cards: tinyDeck, source: 'user' });
  state.selectedDeckId = 'tiny';

  startGameWithSelectedDeck(state);

  assert.equal(state.players[0].gold.length, 1);
  assert.equal(state.players[0].hand.length, 2);
  assert.equal(state.players[0].deck.length, 0);
  assert.match(state.log.join(' '), /Mazo mínimo con 3 carta/);
});

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

test('grouping returns paid gold to reserve', () => {
  const state = createGame();
  const player = state.players[0];
  player.paidGold.push(...player.gold.splice(0, 1));
  assert.equal(groupPaidGold(player), 1);
  assert.equal(player.gold.length, 1);
  assert.equal(player.paidGold.length, 0);
});

test('automatic grouping returns attack line allies to defense at the next turn start', () => {
  const state = createGame();
  const nextPlayer = state.players[1];
  nextPlayer.attackLine.push({ id: 'ally', name: 'Atacante', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: true });
  state.phase = 'Robo';

  advancePhase(state);

  assert.equal(state.currentPlayer, 1);
  assert.equal(nextPlayer.attackLine.length, 0);
  assert.equal(nextPlayer.defenseLine.at(-1).name, 'Atacante');
});

test('allies are played to defense and cannot attack the turn they enter unless they have haste', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand.unshift({ id: 'ally', name: 'Aliado Test', type: CARD_TYPES.ALIADO, cost: 1, strength: 2 });
  assert.match(playCard(state, 0, 0), /Línea de Defensa/);
  assert.equal(player.defenseLine.length, 1);
  assert.match(moveAllyToAttack(player, 0, state), /no puede atacar/);
  player.defenseLine[0].enteredTurn = state.turn - 1;
  assert.match(moveAllyToAttack(player, 0, state), /Línea de Ataque/);
});



test('attack line allies can return to defense during vigilia before attack declaration', () => {
  const state = createGame();
  const player = state.players[0];
  player.attackLine.push({ id: 'ally', name: 'Atacante', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false });

  assert.match(moveAllyToDefense(player, 0, state), /Línea de Defensa/);
  assert.equal(player.attackLine.length, 0);
  assert.equal(player.defenseLine.at(-1).name, 'Atacante');

  advancePhase(state);
  player.attackLine.push({ id: 'ally-2', name: 'Tarde', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false });
  assert.match(moveAllyToDefense(player, 0, state), /antes de la Declaración/);
});

test('haste allies can attack the turn they enter play', () => {
  const state = createGame();
  const player = state.players[0];
  player.hand.unshift({ id: 'hero', name: 'Héroe Test', type: CARD_TYPES.ALIADO, cost: 1, strength: 2, ability: 'haste', race: 'Héroe' });
  playCard(state, 0, 0);
  assert.match(moveAllyToAttack(player, 0, state), /Línea de Ataque/);
});

test('enter-play recycle ability shuffles two cemetery cards into castle', () => {
  const state = createGame();
  const player = state.players[0];
  player.gold.push({ id: 'extra-gold-1', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.gold.push({ id: 'extra-gold-2', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.gold.push({ id: 'extra-gold-3', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.discard.push({ id: 'd1', name: 'Carta 1', type: CARD_TYPES.TALISMAN }, { id: 'd2', name: 'Carta 2', type: CARD_TYPES.TALISMAN });
  const before = player.deck.length;
  player.hand.unshift({ id: 'titan', name: 'Titán Test', type: CARD_TYPES.ALIADO, cost: 4, strength: 6, ability: 'recycleOnEnter', race: 'Titán' });

  playCard(state, 0, 0);

  assert.equal(player.discard.length, 0);
  assert.equal(player.deck.length, before + 2);
});



test('weapons require selecting an ally target before being played', () => {
  const state = createGame();
  const player = state.players[0];
  player.gold.push({ id: 'extra-gold', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.defenseLine.push({ id: 'ally', name: 'Portador', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, weapon: null });
  player.hand.unshift({ id: 'weapon', name: 'Arma Test', type: CARD_TYPES.ARMA, cost: 1, strength: 2 });

  assert.match(playCard(state, 0, 0), /Selecciona un Aliado/);
  assert.equal(player.hand[0].name, 'Arma Test');
  assert.equal(player.gold.length, 2);
});

test('weapons attach to one ally and are destroyed with the bearer', () => {
  const state = createGame();
  const player = state.players[0];
  player.gold.push({ id: 'extra-gold', name: 'Oro Extra', type: CARD_TYPES.ORO });
  player.defenseLine.push({ id: 'ally', name: 'Portador', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, weapon: null });
  player.hand.unshift({ id: 'weapon', name: 'Arma Test', type: CARD_TYPES.ARMA, cost: 1, strength: 2 });
  assert.match(playCard(state, 0, 0, { allyIndex: 0 }), /anexada/);
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

test('blockers must come from opposing defense line and each blocker blocks once', () => {
  const state = createGame();
  state.players[0].attackLine.push({ id: 'a1', name: 'Atacante 1', type: CARD_TYPES.ALIADO, strength: 3, bonus: 0, exhausted: false, weapon: null });
  state.players[0].attackLine.push({ id: 'a2', name: 'Atacante 2', type: CARD_TYPES.ALIADO, strength: 3, bonus: 0, exhausted: false, weapon: null });
  state.players[1].defenseLine.push({ id: 'd1', name: 'Defensor', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false, weapon: null });
  advancePhase(state);
  advancePhase(state);
  assert.match(declareBlocker(state, 0, 0), /bloquea/);
  assert.match(declareBlocker(state, 0, 1), /ya está bloqueando/);
});

test('battle advances through blockers, talisman war and damage assignment', () => {
  const state = createGame();
  state.players[0].attackLine.push({ id: 'attacker', name: 'Atacante', type: CARD_TYPES.ALIADO, strength: 3, bonus: 0, exhausted: false, weapon: null });
  state.players[1].defenseLine.push({ id: 'defender', name: 'Defensor', type: CARD_TYPES.ALIADO, strength: 2, bonus: 0, exhausted: false, weapon: null });
  advancePhase(state);
  advancePhase(state);
  declareBlocker(state, 0, 0);
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
