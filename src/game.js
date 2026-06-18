import { CARD_DATABASE, createCardRecord, getPlayableCards, toPlayableCard, validateDeckCopies } from './cardDatabase.js';
export const CARD_TYPES = {
  ORO: 'Oro',
  ALIADO: 'Aliado',
  TALISMAN: 'Talismán',
  TOTEM: 'Tótem',
  ARMA: 'Arma',
};

export const PHASES = ['Vigilia', 'Declaración de Ataque', 'Declaración de Bloqueadores', 'Guerra de Talismanes', 'Asignación de Daño', 'Fase Final', 'Robo'];
export const CASTLE_SIZE = 50;
export const STARTING_HAND_SIZE = 8;
export const STARTING_GOLD = 1;
export const DECK_COMPOSITION = {
  [CARD_TYPES.ORO]: 15,
  [CARD_TYPES.ALIADO]: 25,
  [CARD_TYPES.TALISMAN]: 4,
  [CARD_TYPES.TOTEM]: 4,
  [CARD_TYPES.ARMA]: 2,
};

const makeCard = (id, name, type, cost = 0, strength = 0, text = '', ability = null, race = null, imageUrl = '', rarity = 'Común', edition = 'Base Austral', product = 'Mazo Inicial Austral') => ({ id, code: id, name, type, cost, strength, text, ability, race, imageUrl, rarity, edition, product });
const clone = (card, id) => ({ ...card, id });
const abilityLabels = {
  raceGuardian: 'Guardia de raza: Aliados de la misma raza en defensa obtienen +1.',
  drawOnEnter: 'Entrada: roba 1 carta.',
  banishOnHit: 'Impacto: si no es bloqueado, destierra 1 carta adicional.',
  haste: 'Ímpetu: puede atacar el turno que entra en juego.',
  recycleOnEnter: 'Entrada: baraja 2 cartas de tu Cementerio en tu Mazo Castillo.',
  drawTwo: 'Roba 2 cartas.',
  banishTwoFromCastle: 'Destierra 2 cartas del Castillo rival.',
  foyeDefenseBuff: 'Continuo: tus Aliados en Línea de Defensa tienen +1 fuerza.',
  machiExtraDraw: 'Continuo: en Robo, roba 1 carta adicional.',
  weaponBuff: 'Anexar: el Aliado portador obtiene +2 fuerza.',
  finalGroupGold: 'En la Fase Final puedes agrupar este Oro.',
  counterCard: 'Anula una carta que se está jugando y la envía al Cementerio.',
  cancelAbility: 'Cancela una habilidad activada o disparada que esté en la pila.',
};
const abilityKinds = {
  raceGuardian: 'continua',
  foyeDefenseBuff: 'continua',
  machiExtraDraw: 'continua',
  weaponBuff: 'continua',
  drawOnEnter: 'disparada',
  banishOnHit: 'disparada',
  recycleOnEnter: 'disparada',
  drawTwo: 'activada',
  banishTwoFromCastle: 'activada',
  finalGroupGold: 'activada',
  haste: 'continua',
  counterCard: 'activada',
  cancelAbility: 'activada',
};
function getAbilities(card) { return Array.isArray(card.ability) ? card.ability : (card.ability ? [card.ability] : []); }
function hasAbility(card, ability) { return getAbilities(card).includes(ability); }
function abilityText(card) {
  const abilities = getAbilities(card);
  if (!abilities.length) return card.text || 'Sin habilidad.';
  return abilities.map((ability) => abilityLabels[ability] || ability).join(' / ');
}
function abilityKind(card) {
  const kinds = [...new Set(getAbilities(card).map((ability) => abilityKinds[ability] || 'activada'))];
  return kinds.length ? kinds.join(' + ') : '—';
}
function shuffleDeck(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function balancedShuffle(cards) {
  const gold = shuffleDeck(cards.filter((card) => card.type === CARD_TYPES.ORO));
  const other = shuffleDeck(cards.filter((card) => card.type !== CARD_TYPES.ORO));
  const result = [];
  const interval = Math.max(2, Math.round(cards.length / Math.max(1, gold.length)));
  while (other.length || gold.length) {
    for (let i = 0; i < interval - 1 && other.length; i += 1) result.push(other.pop());
    if (gold.length) result.push(gold.pop());
  }
  return result;
}
function loadSavedLibrary() {
  if (typeof localStorage === 'undefined') return { customCards: [], userDecks: [] };
  try { return JSON.parse(localStorage.getItem('austral-tcg-library')) || { customCards: [], userDecks: [] }; } catch { return { customCards: [], userDecks: [] }; }
}
function saveLibrary(state) {
  if (typeof localStorage === 'undefined') return;
  const customCards = state.cardCatalog.filter((card) => card.custom);
  const userDecks = state.decks.filter((deck) => deck.source === 'user');
  localStorage.setItem('austral-tcg-library', JSON.stringify({ customCards, userDecks }));
}

export const cardPool = getPlayableCards();

export function buildDeck() {
  const recipe = [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 1], [9, 1], [10, 1], [11, 1], [12, 2], [13, 2], [14, 2]];
  return balancedShuffle(recipe.flatMap(([poolIndex, amount]) => Array.from({ length: amount }, (_, i) => clone(cardPool[poolIndex], `${cardPool[poolIndex].id}-${i}`))));
}

export function countByType(deck) {
  return deck.reduce((counts, card) => ({ ...counts, [card.type]: (counts[card.type] || 0) + 1 }), {});
}

function cloneDeckForGame(cards) { return cards.map((card, index) => clone(card, `${card.code || card.id || card.name}-game-${Date.now()}-${index}`)); }

export function createPlayer(name, deckOverride = null) {
  const deck = deckOverride ? balancedShuffle(cloneDeckForGame(deckOverride)) : buildDeck();
  const startingGold = [];
  while (startingGold.length < STARTING_GOLD) {
    const goldIndex = deck.findIndex((card) => card.type === CARD_TYPES.ORO);
    if (goldIndex < 0) break;
    startingGold.push({ ...deck.splice(goldIndex, 1)[0], paid: false, initial: true });
  }
  return { name, deck, hand: deck.splice(0, Math.min(STARTING_HAND_SIZE, deck.length)), gold: startingGold, paidGold: [], defenseLine: [], attackLine: [], supportLine: [], discard: [], banished: [], playedGold: false, damageThisTurn: 0 };
}

export function availableGold(player) { return player.gold.length; }

export function draw(player, amount = 1) {
  const drawn = [];
  for (let i = 0; i < amount && player.deck.length > 0; i += 1) {
    const card = player.deck.shift();
    player.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

export function checkWinner(state) {
  if (state.winner) return state.winner;
  const loserIndex = state.players.findIndex((player) => player.deck.length === 0);
  if (loserIndex >= 0) {
    state.loser = state.players[loserIndex].name;
    state.winner = state.players[1 - loserIndex].name;
    state.log.push(`${state.loser} queda sin Castillo. ${state.winner} gana la partida.`);
  }
  return state.winner;
}

export function groupPaidGold(player) {
  const amount = player.paidGold.length;
  player.gold.push(...player.paidGold.map((card) => ({ ...card, paid: false })));
  player.paidGold = [];
  return amount;
}

function payCost(player, cost) { player.paidGold.push(...player.gold.splice(0, cost).map((card) => ({ ...card, paid: true }))); }
function allAllies(player) { return [...player.attackLine, ...player.defenseLine]; }
function weaponBonus(ally) { return ally.weapon?.strength || 0; }
function totemBonus(player, ally, line) { return player.supportLine.some((card) => hasAbility(card, 'foyeDefenseBuff')) && line === 'defenseLine' ? 1 : 0; }
function raceBonus(player, ally, line) {
  if (!ally.race) return 0;
  return player.defenseLine.some((other) => other !== ally && hasAbility(other, 'raceGuardian') && other.race === ally.race && line === 'defenseLine') ? 1 : 0;
}
function abilityBonus(ally, line) { return hasAbility(ally, 'raceGuardian') && line === 'defenseLine' ? 1 : 0; }
function totalStrength(player, ally, line) { return ally.strength + (ally.bonus || 0) + weaponBonus(ally) + totemBonus(player, ally, line) + raceBonus(player, ally, line) + abilityBonus(ally, line); }

function destroyAlly(player, line, index) {
  const [ally] = player[line].splice(index, 1);
  if (!ally) return;
  if (ally.weapon) player.discard.push(ally.weapon);
  player.discard.push({ ...ally, weapon: undefined });
}

export function shuffleAllyIntoCastle(player, line, index) {
  const [ally] = player[line].splice(index, 1);
  if (!ally) return;
  const cards = [{ ...ally, weapon: undefined }];
  if (ally.weapon) cards.push(ally.weapon);
  player.deck = shuffleDeck([...player.deck, ...cards]);
}

export function returnAllyToHand(player, line, index) {
  const [ally] = player[line].splice(index, 1);
  if (!ally) return;
  if (ally.weapon) player.discard.push(ally.weapon);
  player.hand.push({ ...ally, weapon: undefined });
}

export function moveAllyToAttack(player, defenseIndex, state = null) {
  const ally = player.defenseLine[defenseIndex];
  if (!ally) return 'No hay Aliado en esa posición.';
  if (state?.phase && state.phase !== 'Vigilia') return 'Solo puedes declarar atacantes en Vigilia.';
  if (state && ally.enteredTurn === state.turn && !hasAbility(ally, 'haste')) return `${ally.name} no puede atacar el turno que entró en juego.`;
  player.defenseLine.splice(defenseIndex, 1);
  player.attackLine.push({ ...ally, exhausted: false });
  return `${ally.name} se movió a la Línea de Ataque.`;
}


export function moveAllyToDefense(player, attackIndex, state = null) {
  const ally = player.attackLine[attackIndex];
  if (!ally) return 'No hay Aliado atacante en esa posición.';
  if (state?.phase !== 'Vigilia') return 'Solo puedes volver a Defensa antes de la Declaración de Ataque.';
  player.attackLine.splice(attackIndex, 1);
  player.defenseLine.push({ ...ally, exhausted: false });
  return `${ally.name} volvió a la Línea de Defensa.`;
}

function resolvePlayedCard(state, card) {
  const top = state.stack.at(-1);
  if (top?.card === card) state.stack.pop();
}

function resolveStackEntry(state, entry) {
  if (!entry) return 'No hay carta en la pila.';
  const { card, playerIndex } = entry;
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];

  if (card.type === CARD_TYPES.ALIADO) {
    player.defenseLine.push({ ...card, exhausted: false, bonus: 0, weapon: null, enteredTurn: state.turn });
    if (hasAbility(card, 'drawOnEnter')) queueAbility(state, playerIndex, card, 'drawOnEnter', 'disparada', () => draw(player, 1));
    if (hasAbility(card, 'recycleOnEnter')) queueAbility(state, playerIndex, card, 'recycleOnEnter', 'disparada', () => { player.deck = shuffleDeck([...player.deck, ...player.discard.splice(0, 2)]); });
    resolveAbilities(state);
    return `${player.name} invocó a ${card.name} en Línea de Defensa.`;
  }
  if (card.type === CARD_TYPES.TOTEM) {
    player.supportLine.push({ ...card, continuous: true });
    return `${player.name} levantó ${card.name} en Línea de Apoyo.`;
  }
  if (card.type === CARD_TYPES.ARMA) {
    const allies = allAllies(player);
    const targetAlly = Number.isInteger(entry.target?.allyIndex) ? allies[entry.target.allyIndex] : allies.find((ally) => !ally.weapon);
    if (!targetAlly) {
      player.discard.push(card);
      return 'No había Aliado para anexar el Arma.';
    }
    if (targetAlly.weapon) {
      player.discard.push(card);
      return `${targetAlly.name} ya tiene un Arma anexada.`;
    }
    targetAlly.weapon = { ...card, attached: true };
    return `${card.name} fue anexada a ${targetAlly.name}.`;
  }
  if (card.type === CARD_TYPES.TALISMAN) {
    player.discard.push(card);
    if (hasAbility(card, 'drawTwo')) queueAbility(state, playerIndex, card, 'drawTwo', 'activada', () => draw(player, 2));
    if (hasAbility(card, 'banishTwoFromCastle')) queueAbility(state, playerIndex, card, 'banishTwoFromCastle', 'activada', () => opponent.banished.push(...opponent.deck.splice(0, 2)));
    resolveAbilities(state);
    checkWinner(state);
    return `${player.name} resolvió ${card.name}.`;
  }
  return 'Tipo de carta no reconocido.';
}

function queueAbility(state, playerIndex, source, ability, kind, resolve) {
  state.abilityStack.push({ playerIndex, source, ability, kind, resolve });
  state.log.push(`Habilidad ${kind}: ${source.name} — ${abilityText(source)}.`);
}

function resolveAbilities(state) {
  while (state.abilityStack.length) {
    const ability = state.abilityStack.pop();
    ability.resolve();
    state.log.push(`Se resolvió la habilidad de ${ability.source.name}.`);
  }
}

function resolveTopCard(state) {
  const entry = state.stack.pop();
  const message = resolveStackEntry(state, entry);
  state.log.push(message);
  return message;
}

export function playCard(state, playerIndex, handIndex, target = {}) {
  if (state.winner) return 'La partida ya terminó.';
  const player = state.players[playerIndex];
  const card = player.hand[handIndex];
  if (!card) return 'No hay carta en esa posición.';
  const isTalismanWar = state.phase === 'Guerra de Talismanes' && card.type === CARD_TYPES.TALISMAN && playerIndex === state.talismanPriority;
  const isResponse = hasAbility(card, 'counterCard') || hasAbility(card, 'cancelAbility');
  if (state.phase !== 'Vigilia' && !isTalismanWar && !isResponse) return 'Solo puedes jugar cartas en Vigilia; los Talismanes se juegan en Guerra de Talismanes con preferencia.';

  if (hasAbility(card, 'counterCard')) {
    if (!state.stack.length) return 'No hay carta que anular.';
    if (availableGold(player) < card.cost) return `Necesitas ${card.cost} Oro disponible.`;
    payCost(player, card.cost);
    player.hand.splice(handIndex, 1);
    const canceled = state.stack.pop();
    state.players[canceled.playerIndex].discard.push(canceled.card);
    player.discard.push(card);
    state.responsePrompt = null;
    return `${player.name} anuló ${canceled.card.name}.`;
  }

  if (hasAbility(card, 'cancelAbility')) {
    const cancelableIndex = state.abilityStack.findLastIndex((entry) => entry.kind === 'activada' || entry.kind === 'disparada');
    if (cancelableIndex < 0) return 'No hay habilidad activada o disparada que cancelar.';
    if (availableGold(player) < card.cost) return `Necesitas ${card.cost} Oro disponible.`;
    payCost(player, card.cost);
    player.hand.splice(handIndex, 1);
    const [canceled] = state.abilityStack.splice(cancelableIndex, 1);
    player.discard.push(card);
    return `${player.name} canceló la habilidad de ${canceled.source.name}.`;
  }

  if (card.type === CARD_TYPES.ORO) {
    if (state.phase !== 'Vigilia') return 'El Oro solo se juega en Vigilia.';
    if (player.playedGold) return 'Solo puedes jugar un Oro por turno.';
    player.gold.push({ ...card, paid: false });
    player.hand.splice(handIndex, 1);
    player.playedGold = true;
    return `${player.name} puso un Oro en la Reserva de Oros.`;
  }
  if (card.type === CARD_TYPES.ARMA && !Number.isInteger(target.allyIndex)) return 'Selecciona un Aliado para anexar el Arma.';
  if (availableGold(player) < card.cost) return `Necesitas ${card.cost} Oro disponible.`;
  payCost(player, card.cost);
  player.hand.splice(handIndex, 1);
  state.stack.push({ card, playerIndex, target });
  if (target.holdForResponse) return `${player.name} está jugando ${card.name}. Esperando respuesta.`;
  return resolveTopCard(state);
}

export function declareAttack(state) {
  const attacker = state.players[state.currentPlayer];
  state.pendingAttacks = attacker.attackLine.map((ally, index) => ({ attackerIndex: index, blockerIndex: null, damage: totalStrength(attacker, ally, 'attackLine') })).filter(({ attackerIndex }) => !attacker.attackLine[attackerIndex].exhausted);
  return state.pendingAttacks.reduce((sum, attack) => sum + attack.damage, 0);
}

export function declareBlocker(state, blockerIndex, attackerIndex) {
  if (state.phase !== 'Declaración de Bloqueadores') return 'Los bloqueadores solo se declaran en su subfase.';
  const defender = state.players[1 - state.currentPlayer];
  const block = state.pendingAttacks.find((attack) => attack.attackerIndex === attackerIndex);
  if (!block) return 'No existe ese ataque.';
  if (state.pendingAttacks.some((attack) => attack.blockerIndex === blockerIndex)) return 'Ese Aliado ya está bloqueando.';
  if (!defender.defenseLine[blockerIndex]) return 'No existe ese bloqueador.';
  block.blockerIndex = blockerIndex;
  return `${defender.defenseLine[blockerIndex].name} bloquea a ${state.players[state.currentPlayer].attackLine[attackerIndex].name}.`;
}

export function passTalismanPriority(state) {
  if (state.phase !== 'Guerra de Talismanes') return 'No estamos en Guerra de Talismanes.';
  state.talismanPasses += 1;
  state.talismanPriority = 1 - state.talismanPriority;
  return state.talismanPasses >= 2 ? advancePhase(state) : `Preferencia de Talismanes: ${state.players[state.talismanPriority].name}.`;
}

export function assignDamage(state) {
  if (state.phase !== 'Asignación de Daño') return 'El daño solo se asigna en su subfase.';
  const attacker = state.players[state.currentPlayer];
  const defender = state.players[1 - state.currentPlayer];
  [...state.pendingAttacks].sort((a, b) => b.attackerIndex - a.attackerIndex).forEach((attackInfo) => {
    const attackingAlly = attacker.attackLine[attackInfo.attackerIndex];
    if (!attackingAlly) return;
    attackingAlly.exhausted = true;
    if (attackInfo.blockerIndex !== null) {
      const blockingAlly = defender.defenseLine[attackInfo.blockerIndex];
      if (!blockingAlly) return;
      const attackForce = totalStrength(attacker, attackingAlly, 'attackLine');
      const defenseForce = totalStrength(defender, blockingAlly, 'defenseLine');
      if (attackForce >= defenseForce) destroyAlly(defender, 'defenseLine', attackInfo.blockerIndex);
      if (defenseForce >= attackForce) destroyAlly(attacker, 'attackLine', attackInfo.attackerIndex);
      return;
    }
    const damage = totalStrength(attacker, attackingAlly, 'attackLine');
    defender.discard.push(...defender.deck.splice(0, damage));
    if (hasAbility(attackingAlly, 'banishOnHit')) defender.banished.push(...defender.deck.splice(0, 1));
    attacker.damageThisTurn += damage;
  });
  checkWinner(state);
  state.pendingAttacks = [];
  return 'Daño asignado.';
}

function readyPlayer(player) { [...player.attackLine, ...player.defenseLine].forEach((ally) => { ally.exhausted = false; }); }
function automaticGrouping(state) {
  const player = state.players[state.currentPlayer];
  const grouped = groupPaidGold(player);
  const returning = player.attackLine.splice(0).map((ally) => ({ ...ally, exhausted: false }));
  player.defenseLine.push(...returning);
  state.log.push(`Agrupación automática: ${grouped} Oro pagado vuelve a Reserva y ${returning.length} Aliado(s) vuelven a Defensa.`);
}
function automaticFinal(state) {
  const player = state.players[state.currentPlayer];
  const regroupable = player.paidGold.filter((gold) => hasAbility(gold, 'finalGroupGold'));
  if (regroupable.length) {
    player.paidGold = player.paidGold.filter((gold) => !hasAbility(gold, 'finalGroupGold'));
    player.gold.push(...regroupable.map((gold) => ({ ...gold, paid: false })));
    state.log.push(`Fase Final: ${regroupable.length} Oro(s) con habilidad vuelven a Reserva.`);
    return;
  }
  state.log.push('Fase Final automática: se cierra el turno activo.');
}

export function advancePhase(state) {
  if (state.winner) return 'La partida ya terminó.';
  if (state.phase === 'Vigilia') {
    state.phase = 'Declaración de Ataque';
    const damage = declareAttack(state);
    state.log.push(`Declaración de Ataque: daño potencial ${damage}.`);
    return state.phase;
  }
  if (state.phase === 'Declaración de Ataque') {
    state.phase = 'Declaración de Bloqueadores';
    state.log.push('Declaración de Bloqueadores: cada Aliado solo puede bloquear una vez.');
    return state.phase;
  }
  if (state.phase === 'Declaración de Bloqueadores') {
    state.phase = 'Guerra de Talismanes';
    state.talismanPriority = 1 - state.currentPlayer;
    state.talismanPasses = 0;
    state.log.push(`Guerra de Talismanes: preferencia de ${state.players[state.talismanPriority].name}.`);
    return state.phase;
  }
  if (state.phase === 'Guerra de Talismanes') {
    state.phase = 'Asignación de Daño';
    state.log.push('Asignación de Daño.');
    return state.phase;
  }
  if (state.phase === 'Asignación de Daño') {
    state.log.push(assignDamage(state));
    state.phase = 'Fase Final';
    state.log.push('Comienza la Fase Final: concluyen los efectos del turno que no indiquen lo contrario.');
    return state.phase;
  }
  if (state.phase === 'Fase Final') {
    automaticFinal(state);
    state.phase = 'Robo';
    state.log.push('Fase de Robo: roba 1 carta y descarta hasta quedar con 8 cartas.');
    return state.phase;
  }
  if (state.phase === 'Robo') {
    const player = state.players[state.currentPlayer];
    const extraDraw = player.supportLine.some((card) => hasAbility(card, 'machiExtraDraw')) ? 1 : 0;
    draw(player, 1 + extraDraw);
    while (player.hand.length > 8) player.discard.push(player.hand.pop());
    checkWinner(state);
    player.playedGold = false;
    player.damageThisTurn = 0;
    state.currentPlayer = 1 - state.currentPlayer;
    state.turn += 1;
    state.phase = 'Vigilia';
    readyPlayer(state.players[state.currentPlayer]);
    automaticGrouping(state);
    state.log.push(`Turno ${state.turn}: juega ${state.players[state.currentPlayer].name}. Fase de Vigilia.`);
    return state.phase;
  }
  return state.phase;
}

function resetMatchState(state, playerDeck = null) {
  state.players = [createPlayer('Jugador', playerDeck), createPlayer('Rival')];
  state.currentPlayer = 0;
  state.turn = 1;
  state.phase = 'Vigilia';
  state.log = ['Nueva partida iniciada con el mazo seleccionado.'];
  state.winner = null;
  state.loser = null;
  state.pendingAttacks = [];
  state.talismanPriority = null;
  state.talismanPasses = 0;
  state.selectedBlockerIndex = null;
  state.viewedZone = null;
  state.stack = [];
  state.abilityStack = [];
  state.responsePrompt = null;
  state.pendingWeaponHandIndex = null;
  automaticGrouping(state);
  return state;
}

export function startGameWithSelectedDeck(state) {
  const deck = selectedDeck(state);
  const selectedCards = deck?.cards?.length ? deck.cards : null;
  resetMatchState(state, selectedCards);
  state.log.push(selectedCards ? `Probando ${deck.name} con ${selectedCards.length} carta(s).` : 'El mazo seleccionado está vacío; se usó el mazo base.');
  state.currentTab = 'game';
  return state;
}

export function createGame() {
  const saved = loadSavedLibrary();
  const baseDeck = { id: 'base', name: 'Austral Base', cards: buildDeck(), source: 'computer' };
  const state = { players: [createPlayer('Jugador'), createPlayer('Rival')], currentPlayer: 0, turn: 1, phase: 'Vigilia', log: ['Agrupación inicial automática. Comienza la Vigilia.'], winner: null, loser: null, pendingAttacks: [], talismanPriority: null, talismanPasses: 0, selectedBlockerIndex: null, viewedZone: null, previewCard: null, previewTimer: null, draggingAlly: null, currentTab: 'game', cardCatalog: [...cardPool, ...saved.customCards], decks: [baseDeck, ...saved.userDecks], selectedDeckId: saved.userDecks[0]?.id || 'base', stack: [], abilityStack: [], responsePrompt: null, responseTimer: null, pendingWeaponHandIndex: null };
  automaticGrouping(state);
  return state;
}

function renderCard(card, index, zone, onClick, state = null) {
  const button = document.createElement('button');
  const imageHtml = card.imageUrl ? `<img class="card-art" src="${card.imageUrl}" alt="${card.name}">` : `<div class="card-art missing-art" aria-label="${card.name}">${card.name}</div>`;
  button.className = `card image-only ${card.type.toLowerCase()} ${card.imageUrl ? 'has-art' : 'no-art'} ${card.exhausted ? 'exhausted' : ''} ${card.weapon ? 'armed' : ''} ${state?.pendingWeaponHandIndex !== null && (zone === 'defensa' || zone === 'ataque') ? 'weapon-target' : ''}`;
  button.innerHTML = `${card.weapon ? `<div class="attached-weapon">${card.weapon.name}</div>` : ''}${imageHtml}`;
  button.title = zone;
  button.disabled = zone.includes('mazo') || zone.includes('cementerio') || zone.includes('destierro') || zone.includes('oro');
  if (zone === 'defensa' || zone === 'ataque') {
    button.draggable = true;
    button.addEventListener('dragstart', () => { if (state) state.draggingAlly = { line: zone === 'defensa' ? 'defenseLine' : 'attackLine', index }; });
  }
  if (state) {
    button.addEventListener('mouseenter', () => { state.previewTimer = setTimeout(() => { state.previewCard = card; render(state); }, 2000); });
    button.addEventListener('mouseleave', () => { clearTimeout(state.previewTimer); state.previewCard = null; render(state); });
  }
  button.addEventListener('click', () => onClick(index));
  return button;
}

function renderZone(selector, cards, zone, onClick, state = null) { const element = document.querySelector(selector); cards.forEach((card, index) => element.appendChild(renderCard(card, index, zone, onClick, state))); }
function zoneSummary(title, cards, key) {
  const isDeck = key.endsWith(':deck');
  const tag = isDeck ? 'article' : 'button';
  const data = isDeck ? '' : ` data-zone="${key}"`;
  const topCard = cards.at(-1);
  const face = isDeck ? '<div class="pile-card back">◆</div>' : `<div class="pile-card face"><strong>${topCard?.name || 'Vacío'}</strong><small>${topCard?.type || ''}</small></div>`;
  return `<${tag} class="zone-card pile ${isDeck ? 'locked-zone' : ''}"${data}>${face}<h3>${title}</h3><p>${cards.length} carta${cards.length === 1 ? '' : 's'}</p>${isDeck ? '<small>Contenido oculto</small>' : ''}</${tag}>`;
}
function renderSideZones(player, prefix) { return `<aside class="side-zones"><div class="pile-slot cemetery">${zoneSummary('Cementerio', player.discard, `${prefix}:discard`)}</div><div class="pile-slot paid">${zoneSummary('Oros pagados', player.paidGold, `${prefix}:paidGold`)}</div><div class="pile-slot deck">${zoneSummary('Mazo Castillo', player.deck, `${prefix}:deck`)}</div><div class="pile-slot banished">${zoneSummary('Destierro', player.banished, `${prefix}:banished`)}</div><div class="pile-slot gold">${zoneSummary('Reserva de Oros', player.gold, `${prefix}:gold`)}</div></aside>`; }
function renderLines(prefix, links = '') { return `<section class="lines"><h3>Línea de Ataque</h3><div id="${prefix}Attack" class="zone compact"></div>${links}<h3>Línea de Defensa</h3><div id="${prefix}Defense" class="zone compact"></div><h3>Línea de Apoyo</h3><div id="${prefix}Support" class="zone compact"></div></section>`; }



function renderBattleLinks(state, attacker, defender) {
  if (!state.pendingAttacks?.length) return '';
  const rows = state.pendingAttacks
    .filter((attack) => attack.blockerIndex !== null)
    .map((attack) => {
      const attackingAlly = attacker.attackLine[attack.attackerIndex];
      const blocker = defender.defenseLine[attack.blockerIndex];
      if (!attackingAlly || !blocker) return '';
      return `<div class="block-link board-line"><span>${blocker.name}</span><i></i><span>${attackingAlly.name}</span></div>`;
    }).join('');
  return rows ? `<div class="field-block-lines">${rows}</div>` : '';
}

function renderViewedZone(state, active, opponent) {
  if (!state.viewedZone) return '';
  const [owner, zone] = state.viewedZone.split(':');
  const player = owner === 'player' ? active : opponent;
  const cards = player[zone] || [];
  return `<section class="viewer"><button id="closeViewer">Cerrar</button><h2>${player.name}: ${zone}</h2><div id="viewerCards" class="zone"></div></section>`;
}


function selectedDeck(state) { return state.decks.find((deck) => deck.id === state.selectedDeckId); }
function renderDeckBuilder(state) {
  const deck = selectedDeck(state);
  return `<main class="shell"><header><div><p class="eyebrow">Constructor</p><h1>Biblioteca Austral</h1><p class="phase">Mazo seleccionado: <b>${deck?.name || 'Ninguno'}</b></p></div><button id="tabGame">Ir al juego</button><button id="testDeck">Probar mazo seleccionado</button></header><section class="builder-grid"><article class="builder-panel"><h2>Mazos</h2><div id="deckList"></div><button id="newDeck">Crear mazo vacío</button><p>Debes seleccionar un mazo para jugar. Hay mazos pre diseñados y mazos creados por el usuario.</p></article><article class="builder-panel"><h2>Enciclopedia de cartas</h2><div id="catalog" class="zone"></div></article><article class="builder-panel"><h2>Crear carta</h2><form id="cardForm"><input name="name" placeholder="Nombre" required><select name="type"><option>Aliado</option><option>Oro</option><option>Talismán</option><option>Tótem</option><option>Arma</option></select><input name="cost" type="number" min="0" value="1"><input name="strength" type="number" min="0" value="1"><input name="race" placeholder="Raza"><select name="ability"><option value="">Sin habilidad funcional</option><option value="drawOnEnter">Entrada: roba 1</option><option value="drawTwo">Roba 2</option><option value="haste">Ímpetu</option><option value="recycleOnEnter">Recicla 2 del Cementerio</option><option value="banishOnHit">Destierra al impactar</option><option value="raceGuardian">Bonifica raza en defensa</option><option value="counterCard">Anular carta</option><option value="cancelAbility">Cancelar habilidad</option><option value="finalGroupGold">Oro: agrupar en Final</option></select><label><input name="unique" type="checkbox"> Carta Única</label><input name="copyLimit" type="number" min="1" value="3" placeholder="Máximo de copias"><input name="rarity" placeholder="Rareza" value="Común"><input name="edition" placeholder="Edición" value="Usuario"><input name="product" placeholder="Producto" value="Carta creada"><input name="imageUrl" placeholder="URL de imagen opcional"><input name="text" placeholder="Texto / habilidad"><button>Crear carta</button></form><h2>Cartas del mazo</h2><p class="deck-errors">${validateDeckCopies(deck?.cards || []).join(' ')}</p><div id="deckCards" class="zone compact"></div></article></section></main>`;
}
function wireDeckBuilder(state) {
  document.querySelector('#tabGame')?.addEventListener('click', () => { state.currentTab = 'game'; render(state); });
  document.querySelector('#testDeck')?.addEventListener('click', () => { startGameWithSelectedDeck(state); render(state); });
  const deckList = document.querySelector('#deckList');
  state.decks.forEach((deck) => {
    const button = document.createElement('button');
    button.className = `deck-button ${deck.id === state.selectedDeckId ? 'selected' : ''}`;
    button.textContent = `${deck.name} (${deck.cards.length}) · ${deck.source === 'computer' ? 'CPU' : 'Usuario'}`;
    button.addEventListener('click', () => { state.selectedDeckId = deck.id; render(state); });
    deckList.appendChild(button);
  });
  document.querySelector('#newDeck')?.addEventListener('click', () => {
    const deck = { id: `user-${Date.now()}`, name: `Mazo usuario ${state.decks.length}`, cards: [], source: 'user' };
    state.decks.push(deck); state.selectedDeckId = deck.id; saveLibrary(state); render(state);
  });
  renderZone('#catalog', state.cardCatalog, 'catalogo', (i) => { selectedDeck(state)?.cards.push({ ...state.cardCatalog[i], id: `${state.cardCatalog[i].id}-deck-${Date.now()}` }); saveLibrary(state); render(state); });
  renderZone('#deckCards', selectedDeck(state)?.cards || [], 'mazo usuario', () => {});
  document.querySelector('#cardForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const type = data.get('type');
    const record = createCardRecord({ code: `USR-${Date.now()}`, name: data.get('name'), type, cost: Number(data.get('cost')), strength: Number(data.get('strength')), text: data.get('text'), ability: data.get('ability') || null, race: data.get('race') || null, image: data.get('imageUrl') || '', rarity: data.get('rarity') || 'Común', edition: data.get('edition') || 'Usuario', product: data.get('product') || 'Carta creada', unique: data.get('unique') === 'on', copyLimit: Number(data.get('copyLimit') || 3) });
    const card = { ...toPlayableCard(record), custom: true };
    state.cardCatalog.push(card); selectedDeck(state)?.cards.push(card); saveLibrary(state); render(state);
  });
}


function renderPreviewPanel(state) {
  const card = state.previewCard;
  if (!card) return '';
  return `<aside class="card-info-window">${card.imageUrl ? `<img class="info-art" src="${card.imageUrl}" alt="${card.name}">` : ''}<p><b>Coste:</b> ${card.cost || 0}</p><p><b>Fuerza:</b> ${card.effectiveStrength ?? card.strength ?? 0}</p><p><b>Raza:</b> ${card.race || '—'}</p><p><b>Habilidad:</b> ${abilityText(card)}</p></aside>`;
}

function renderResponsePrompt(state) {
  const prompt = state.responsePrompt;
  if (!prompt) return '';
  const card = state.stack.at(-1)?.card;
  return `<section class="response-prompt"><h2>Respuesta disponible</h2><p>El Rival está jugando <b>${card?.name || 'una carta'}</b>. ¿Quieres anularla?</p><p>Tienes 10 segundos; si no respondes, se considera que no activas nada.</p><div class="response-timer"><span></span></div><button id="acceptResponse">Anular carta</button><button id="declineResponse">No responder</button></section>`;
}

function declineResponse(state) {
  if (!state.responsePrompt) return;
  clearTimeout(state.responseTimer);
  state.responsePrompt = null;
  resolveTopCard(state);
  autoPlayIfNeeded(state);
}

function acceptResponse(state) {
  const player = state.players[0];
  const counterIndex = player.hand.findIndex((card) => hasAbility(card, 'counterCard') && card.cost <= availableGold(player));
  if (counterIndex < 0) {
    state.log.push('No tienes una carta de anulación pagable en la mano.');
    declineResponse(state);
    return;
  }
  clearTimeout(state.responseTimer);
  state.log.push(playCard(state, 0, counterIndex));
  state.responsePrompt = null;
  autoPlayIfNeeded(state);
}

function render(state) {
  const app = document.querySelector('#app');
  if (state.currentTab === 'builder') { app.innerHTML = renderDeckBuilder(state); wireDeckBuilder(state); return; }
  const player = state.players[0];
  const rival = state.players[1];
  const active = state.players[state.currentPlayer];
  const opponent = state.players[1 - state.currentPlayer];
  const attacker = state.players[state.currentPlayer];
  const defender = state.players[1 - state.currentPlayer];
  const playerLinks = state.phase === 'Declaración de Bloqueadores' && state.currentPlayer === 1 ? renderBattleLinks(state, rival, player) : '';
  const rivalLinks = state.phase === 'Declaración de Bloqueadores' && state.currentPlayer === 0 ? renderBattleLinks(state, player, rival) : '';
  const status = state.winner ? `<section class="result"><h2>${state.winner} gana</h2><p>${state.loser} perdió por quedarse sin cartas en su Castillo.</p></section>` : '';
  app.innerHTML = `<main class="shell"><header><div><p class="eyebrow">Turno ${state.turn} · Activo: ${active.name}</p><h1>Crónicas del Austral</h1><p class="phase">Fase actual: <b>${state.phase}</b> · Mazo: <b>${selectedDeck(state)?.name || 'sin seleccionar'}</b></p></div><div class="header-actions"><button id="tabBuilder">Constructor</button><button id="nextPhase" ${state.winner ? 'disabled' : ''}>Siguiente paso</button></div></header>${renderPreviewPanel(state)}${renderResponsePrompt(state)}${status}<section class="rules"><h2>Batalla Mitológica</h2><ol>${PHASES.map((phase) => `<li class="${phase === state.phase ? 'active-phase' : ''}">${phase}</li>`).join('')}</ol></section><section class="table"><div class="player-board opponent-board">${renderSideZones(rival, 'rival')}${renderLines('rival', rivalLinks)}</div><div class="player-board">${renderSideZones(player, 'player')}${renderLines('player', playerLinks)}</div></section><h2>Mano</h2><div id="hand" class="zone"></div>${renderViewedZone(state, player, rival)}<aside><h2>Bitácora</h2><ul>${state.log.slice(-12).map((entry) => `<li>${entry}</li>`).join('')}</ul></aside></main>`;
  document.querySelector('#tabBuilder').addEventListener('click', () => { state.currentTab = 'builder'; render(state); });
  document.querySelector('#acceptResponse')?.addEventListener('click', () => { acceptResponse(state); render(state); });
  document.querySelector('#declineResponse')?.addEventListener('click', () => { declineResponse(state); render(state); });
  document.querySelector('#nextPhase').addEventListener('click', () => { advancePhase(state); autoPlayIfNeeded(state); render(state); });
  document.querySelectorAll('.zone-card').forEach((button) => button.addEventListener('click', () => { state.viewedZone = button.dataset.zone; render(state); }));
  document.querySelector('#closeViewer')?.addEventListener('click', () => { state.viewedZone = null; render(state); });
  if (state.viewedZone) { const [owner, zone] = state.viewedZone.split(':'); const cards = (owner === 'player' ? player : rival)[zone] || []; renderZone('#viewerCards', cards, 'visor', () => {}, state); }
  renderZone('#rivalAttack', rival.attackLine.map((card) => ({ ...card, effectiveStrength: totalStrength(rival, card, 'attackLine') })), 'ataque rival', (i) => { if (state.phase === 'Declaración de Bloqueadores' && state.selectedBlockerIndex !== null) { state.log.push(declareBlocker(state, state.selectedBlockerIndex, i)); state.selectedBlockerIndex = null; render(state); } }, state);
  renderZone('#rivalDefense', rival.defenseLine.map((card) => ({ ...card, effectiveStrength: totalStrength(rival, card, 'defenseLine') })), 'defensa rival', (i) => { if (state.phase === 'Declaración de Bloqueadores') { state.selectedBlockerIndex = i; state.log.push(`${rival.defenseLine[i].name} seleccionado para bloquear.`); render(state); } }, state);
  renderZone('#rivalSupport', rival.supportLine, 'apoyo rival', () => {}, state);
  renderZone('#playerAttack', player.attackLine.map((card) => ({ ...card, effectiveStrength: totalStrength(player, card, 'attackLine') })), 'ataque', (i) => {
    if (state.pendingWeaponHandIndex !== null) { state.log.push(playCard(state, 0, state.pendingWeaponHandIndex, { allyIndex: i })); state.pendingWeaponHandIndex = null; render(state); return; }
    if (state.phase === 'Declaración de Bloqueadores' && state.selectedBlockerIndex !== null) { state.log.push(declareBlocker(state, state.selectedBlockerIndex, i)); state.selectedBlockerIndex = null; render(state); }
  }, state);
  renderZone('#playerDefense', player.defenseLine.map((card) => ({ ...card, effectiveStrength: totalStrength(player, card, 'defenseLine') })), 'defensa', (i) => {
    if (state.pendingWeaponHandIndex !== null) { state.log.push(playCard(state, 0, state.pendingWeaponHandIndex, { allyIndex: player.attackLine.length + i })); state.pendingWeaponHandIndex = null; render(state); return; }
    if (state.phase === 'Declaración de Bloqueadores' && state.currentPlayer === 1) { state.selectedBlockerIndex = i; state.log.push(`${player.defenseLine[i].name} seleccionado para bloquear.`); render(state); return; }
    if (state.currentPlayer === 0 && state.phase === 'Vigilia') state.log.push(moveAllyToAttack(player, i, state)); render(state);
  }, state);
  renderZone('#playerSupport', player.supportLine, 'apoyo', () => {}, state);
  document.querySelector('#playerAttack').addEventListener('dragover', (event) => event.preventDefault());
  document.querySelector('#playerAttack').addEventListener('drop', (event) => { event.preventDefault(); if (state.draggingAlly?.line === 'defenseLine') state.log.push(moveAllyToAttack(player, state.draggingAlly.index, state)); state.draggingAlly = null; render(state); });
  document.querySelector('#playerDefense').addEventListener('dragover', (event) => event.preventDefault());
  document.querySelector('#playerDefense').addEventListener('drop', (event) => { event.preventDefault(); if (state.draggingAlly?.line === 'attackLine') state.log.push(moveAllyToDefense(player, state.draggingAlly.index, state)); state.draggingAlly = null; render(state); });
  renderZone('#hand', state.currentPlayer === 0 ? player.hand : [], 'mano', (i) => {
    if (state.currentPlayer === 0) {
      const card = player.hand[i];
      if (card?.type === CARD_TYPES.ARMA) {
        if (!allAllies(player).length) state.log.push('Necesitas un Aliado en juego para anexar un Arma.');
        else { state.pendingWeaponHandIndex = i; state.log.push(`Selecciona el Aliado que portará ${card.name}.`); }
      } else state.log.push(playCard(state, 0, i));
    }
    render(state);
  }, state);
}

function playerCanCounter(state) { return state.players[0].hand.some((card) => hasAbility(card, 'counterCard') && card.cost <= availableGold(state.players[0])); }

function openResponseWindow(state) {
  state.responsePrompt = { startedAt: Date.now(), seconds: 10 };
  clearTimeout(state.responseTimer);
  if (typeof setTimeout !== 'undefined') {
    state.responseTimer = setTimeout(() => { declineResponse(state); if (typeof document !== 'undefined') render(state); }, 10000);
  }
}

function autoPlayIfNeeded(state) {
  if (state.responsePrompt || state.currentPlayer !== 1 || state.winner) return;
  const rival = state.players[1];
  while (state.currentPlayer === 1 && !state.winner) {
    if (state.phase === 'Vigilia') {
      const goldIndex = rival.hand.findIndex((card) => card.type === CARD_TYPES.ORO);
      if (goldIndex >= 0) state.log.push(playCard(state, 1, goldIndex));
      let played = true;
      while (played) {
        const index = rival.hand.findIndex((card) => card.type !== CARD_TYPES.ORO && card.cost <= availableGold(rival) && (card.type !== CARD_TYPES.ARMA || allAllies(rival).some((ally) => !ally.weapon)));
        played = index >= 0;
        if (played) {
          const card = rival.hand[index];
          const target = card.type === CARD_TYPES.ARMA ? { allyIndex: allAllies(rival).findIndex((ally) => !ally.weapon) } : {};
          const shouldAsk = playerCanCounter(state);
          state.log.push(playCard(state, 1, index, { ...target, holdForResponse: shouldAsk }));
          if (shouldAsk) { openResponseWindow(state); return; }
        }
      }
      if (rival.defenseLine.length) state.log.push(moveAllyToAttack(rival, 0, state));
      advancePhase(state);
    } else if (state.phase === 'Declaración de Bloqueadores') {
      state.log.push('Declara tus bloqueadores contra el Rival y luego presiona Siguiente paso.');
      return;
    } else if (state.phase === 'Guerra de Talismanes') {
      passTalismanPriority(state); passTalismanPriority(state);
    } else {
      advancePhase(state);
    }
  }
}

if (typeof document !== 'undefined') render(createGame());
