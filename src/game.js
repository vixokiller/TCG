export const CARD_TYPES = {
  ORO: 'Oro',
  ALIADO: 'Aliado',
  TALISMAN: 'Talismán',
  ARMA: 'Arma',
};

export const CASTLE_SIZE = 50;
export const STARTING_HAND_SIZE = 8;
export const STARTING_GOLD = 1;

const makeCard = (id, name, type, cost = 0, strength = 0, text = '') => ({ id, name, type, cost, strength, text });
const clone = (card, id) => ({ ...card, id });

export const cardPool = [
  makeCard('oro-canelo', 'Oro de Canelo', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-copihue', 'Oro de Copihue', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-volcan', 'Oro del Volcán', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('aliado-trauco', 'Guardián del Bosque', CARD_TYPES.ALIADO, 1, 2, 'Puede atacar el turno siguiente a ser jugado.'),
  makeCard('aliado-pincoya', 'Danzante de Mareas', CARD_TYPES.ALIADO, 2, 3, 'Cuando entra en juego, roba 1 carta.'),
  makeCard('aliado-caleuche', 'Nave Fantasma', CARD_TYPES.ALIADO, 3, 5, 'Sus ataques son difíciles de detener.'),
  makeCard('aliado-condor', 'Cóndor del Alba', CARD_TYPES.ALIADO, 2, 4, 'Un defensor orgulloso de la cordillera.'),
  makeCard('aliado-pillan', 'Pillán de la Cumbre', CARD_TYPES.ALIADO, 4, 6, 'Una fuerza volcánica para cerrar partidas.'),
  makeCard('talisman-luna', 'Rito de Luna Austral', CARD_TYPES.TALISMAN, 1, 0, 'Roba 2 cartas.'),
  makeCard('talisman-tormenta', 'Tormenta del Pacífico', CARD_TYPES.TALISMAN, 2, 0, 'Hace 2 de daño al Castillo rival.'),
  makeCard('arma-lanza', 'Lanza de Colihue', CARD_TYPES.ARMA, 1, 2, 'Da +2 de fuerza a un aliado listo.'),
];

export function buildDeck() {
  const recipe = [
    [0, 11], [1, 10], [2, 10],
    [3, 4], [4, 4], [5, 3], [6, 3], [7, 2],
    [8, 1], [9, 1], [10, 1],
  ];
  return recipe.flatMap(([poolIndex, amount]) => (
    Array.from({ length: amount }, (_, i) => clone(cardPool[poolIndex], `${cardPool[poolIndex].id}-${i}`))
  )).sort(() => Math.random() - 0.5);
}

export function createPlayer(name) {
  const deck = buildDeck();
  const startingGold = [];
  while (startingGold.length < STARTING_GOLD) {
    const goldIndex = deck.findIndex((card) => card.type === CARD_TYPES.ORO);
    if (goldIndex < 0) break;
    startingGold.push({ ...deck.splice(goldIndex, 1)[0], used: false, initial: true });
  }
  return {
    name,
    deck,
    hand: deck.splice(0, STARTING_HAND_SIZE),
    gold: startingGold,
    field: [],
    discard: [],
    damageThisTurn: 0,
    playedGold: false,
  };
}

export function availableGold(player) {
  return player.gold.filter((card) => !card.used).length;
}

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

function payCost(player, cost) {
  let remaining = cost;
  player.gold.forEach((gold) => {
    if (!gold.used && remaining > 0) {
      gold.used = true;
      remaining -= 1;
    }
  });
}

export function playCard(state, playerIndex, handIndex) {
  if (state.winner) return 'La partida ya terminó.';
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const card = player.hand[handIndex];
  if (!card) return 'No hay carta en esa posición.';

  if (card.type === CARD_TYPES.ORO) {
    if (player.playedGold) return 'Solo puedes jugar un Oro por turno.';
    player.gold.push({ ...card, used: false });
    player.hand.splice(handIndex, 1);
    player.playedGold = true;
    return `${player.name} puso un Oro en reserva.`;
  }

  if (availableGold(player) < card.cost) return `Necesitas ${card.cost} Oro disponible.`;
  payCost(player, card.cost);
  player.hand.splice(handIndex, 1);

  if (card.type === CARD_TYPES.ALIADO) {
    player.field.push({ ...card, exhausted: true, bonus: 0 });
    if (card.name === 'Danzante de Mareas') draw(player, 1);
    return `${player.name} invocó a ${card.name}.`;
  }
  if (card.type === CARD_TYPES.TALISMAN) {
    player.discard.push(card);
    if (card.name === 'Rito de Luna Austral') draw(player, 2);
    if (card.name === 'Tormenta del Pacífico') {
      const milled = opponent.deck.splice(0, 2);
      opponent.discard.push(...milled);
      checkWinner(state);
    }
    return `${player.name} resolvió ${card.name}.`;
  }
  if (card.type === CARD_TYPES.ARMA) {
    const target = player.field.find((ally) => !ally.exhausted);
    if (target) target.bonus += card.strength;
    player.discard.push(card);
    return target ? `${target.name} recibe +${card.strength} fuerza.` : 'No había aliado listo para equipar.';
  }
  return 'Tipo de carta no reconocido.';
}

function totalStrength(ally) {
  return ally.strength + (ally.bonus || 0);
}

function chooseDefender(opponent) {
  return opponent.field
    .map((ally, index) => ({ ally, index }))
    .filter(({ ally }) => !ally.exhausted)
    .sort((a, b) => totalStrength(b.ally) - totalStrength(a.ally))[0];
}

export function attack(state, playerIndex, fieldIndex, defenderIndex = null) {
  if (state.winner) return 'La partida ya terminó.';
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const attacker = player.field[fieldIndex];
  if (!attacker) return 'No hay aliado atacante.';
  if (attacker.exhausted) return `${attacker.name} no está listo.`;

  const defenderChoice = defenderIndex === null
    ? chooseDefender(opponent)
    : { ally: opponent.field[defenderIndex], index: defenderIndex };

  attacker.exhausted = true;

  if (defenderChoice?.ally && !defenderChoice.ally.exhausted) {
    const defender = defenderChoice.ally;
    defender.exhausted = true;
    const attackForce = totalStrength(attacker);
    const defenseForce = totalStrength(defender);
    const attackerName = attacker.name;
    const defenderName = defender.name;

    if (attackForce >= defenseForce) {
      opponent.discard.push(...opponent.field.splice(defenderChoice.index, 1));
    }
    if (defenseForce >= attackForce) {
      player.discard.push(...player.field.splice(fieldIndex, 1));
    }
    if (attackForce === defenseForce) return `${attackerName} y ${defenderName} se destruyen mutuamente.`;
    return attackForce > defenseForce
      ? `${attackerName} vence a ${defenderName} en combate de Aliados.`
      : `${defenderName} defiende y destruye a ${attackerName}.`;
  }

  const damage = totalStrength(attacker);
  const milled = opponent.deck.splice(0, damage);
  opponent.discard.push(...milled);
  player.damageThisTurn += damage;
  checkWinner(state);
  return `${attacker.name} desterró ${damage} cartas del Castillo rival.`;
}

export function endTurn(state) {
  if (state.winner) return;
  const current = state.players[state.currentPlayer];
  current.playedGold = false;
  current.damageThisTurn = 0;
  current.gold.forEach((gold) => { gold.used = false; });
  state.currentPlayer = 1 - state.currentPlayer;
  const next = state.players[state.currentPlayer];
  next.field.forEach((ally) => { ally.exhausted = false; });
  draw(next, 1);
  checkWinner(state);
  state.turn += 1;
}

export function createGame() {
  return {
    players: [createPlayer('Jugador'), createPlayer('Rival')],
    currentPlayer: 0,
    turn: 1,
    log: ['Comienza la leyenda. Cada jugador parte con 8 cartas, 1 Oro inicial y un Castillo de 50 cartas menos preparación.'],
    winner: null,
    loser: null,
  };
}

function renderCard(card, index, zone, onClick) {
  const button = document.createElement('button');
  button.className = `card ${card.type.toLowerCase()} ${card.exhausted ? 'exhausted' : ''}`;
  button.innerHTML = `<strong>${card.name}</strong><span>${card.type}${card.cost ? ` · Coste ${card.cost}` : ''}</span><p>${card.strength ? `Fuerza ${totalStrength(card)}` : card.text}</p>`;
  button.title = zone;
  button.disabled = zone.includes('oponente') || zone.includes('oro') || zone.includes('descarte');
  button.addEventListener('click', () => onClick(index));
  return button;
}

function renderZone(selector, cards, zone, onClick) {
  const element = document.querySelector(selector);
  cards.forEach((card, index) => element.appendChild(renderCard(card, index, zone, onClick)));
}

function render(state) {
  const app = document.querySelector('#app');
  const active = state.players[state.currentPlayer];
  const opponent = state.players[1 - state.currentPlayer];
  const status = state.winner
    ? `<section class="result"><h2>${state.winner} gana</h2><p>${state.loser} perdió por quedarse sin cartas en su Castillo.</p></section>`
    : '';
  app.innerHTML = `<main class="shell"><header><div><p class="eyebrow">TCG chileno original</p><h1>Crónicas del Austral</h1></div><button id="endTurn" ${state.winner ? 'disabled' : ''}>Terminar turno</button></header>${status}<section class="rules"><h2>Reglas rápidas</h2><ol><li>Tu mazo es tu <b>Castillo</b>: si queda vacío, pierdes.</li><li>Ambos parten con <b>8 cartas</b> y <b>1 Oro inicial</b>.</li><li>Juega 1 Oro por turno y úsalo para pagar Aliados, Talismanes y Armas.</li><li>Los Aliados listos se enfrentan entre sí antes de dañar el Castillo rival.</li><li>Al terminar turno, el siguiente jugador roba 1 carta.</li></ol></section><section class="score"><article><h3>${active.name}</h3><p>Castillo: ${active.deck.length} · Mano: ${active.hand.length} · Oro: ${availableGold(active)}/${active.gold.length} · Descarte: ${active.discard.length}</p></article><article><h3>${opponent.name}</h3><p>Castillo: ${opponent.deck.length} · Mano: ${opponent.hand.length} · Oro: ${availableGold(opponent)}/${opponent.gold.length} · Descarte: ${opponent.discard.length}</p></article></section><h2>Campo oponente</h2><div id="opponentField" class="zone compact"></div><h2>Campo de ${active.name}</h2><div id="field" class="zone compact"></div><h2>Mano</h2><div id="hand" class="zone"></div><aside><h2>Bitácora</h2><ul>${state.log.slice(-8).map((entry) => `<li>${entry}</li>`).join('')}</ul></aside></main>`;
  document.querySelector('#endTurn').addEventListener('click', () => { endTurn(state); if (!state.winner) state.log.push(`Turno ${state.turn}: juega ${state.players[state.currentPlayer].name}.`); autoPlayIfNeeded(state); render(state); });
  renderZone('#opponentField', opponent.field, 'campo oponente', () => {});
  renderZone('#hand', active.hand, 'mano', (i) => { state.log.push(playCard(state, state.currentPlayer, i)); render(state); });
  renderZone('#field', active.field, 'campo', (i) => { state.log.push(attack(state, state.currentPlayer, i)); render(state); });
}

function autoPlayIfNeeded(state) {
  if (state.currentPlayer !== 1 || state.winner) return;
  const rival = state.players[1];
  const goldIndex = rival.hand.findIndex((card) => card.type === CARD_TYPES.ORO);
  if (goldIndex >= 0) state.log.push(playCard(state, 1, goldIndex));
  let played = true;
  while (played && !state.winner) {
    const index = rival.hand.findIndex((card) => card.type !== CARD_TYPES.ORO && card.cost <= availableGold(rival));
    played = index >= 0;
    if (played) state.log.push(playCard(state, 1, index));
  }
  [...rival.field].forEach((ally) => {
    const index = rival.field.indexOf(ally);
    if (index >= 0 && !ally.exhausted && !state.winner) state.log.push(attack(state, 1, index));
  });
  endTurn(state);
  if (!state.winner) state.log.push('El Rival termina su turno.');
}

if (typeof document !== 'undefined') {
  render(createGame());
}
