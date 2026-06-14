export const CARD_TYPES = {
  ORO: 'Oro',
  ALIADO: 'Aliado',
  TALISMAN: 'Talismán',
  ARMA: 'Arma',
};

const makeCard = (id, name, type, cost = 0, strength = 0, text = '') => ({ id, name, type, cost, strength, text });

export const cardPool = [
  makeCard('oro-canelo', 'Oro de Canelo', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-copihue', 'Oro de Copihue', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-volcan', 'Oro del Volcán', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('aliado-trauco', 'Guardián del Bosque', CARD_TYPES.ALIADO, 1, 2, 'Puede atacar el turno siguiente a ser jugado.'),
  makeCard('aliado-pincoya', 'Danzante de Mareas', CARD_TYPES.ALIADO, 2, 3, 'Cuando entra en juego, roba 1 carta.'),
  makeCard('aliado-caleuche', 'Nave Fantasma', CARD_TYPES.ALIADO, 3, 5, 'Sus ataques son difíciles de detener.'),
  makeCard('aliado-condor', 'Cóndor del Alba', CARD_TYPES.ALIADO, 2, 4, 'Un defensor orgulloso de la cordillera.'),
  makeCard('talisman-luna', 'Rito de Luna Austral', CARD_TYPES.TALISMAN, 1, 0, 'Roba 2 cartas.'),
  makeCard('talisman-tormenta', 'Tormenta del Pacífico', CARD_TYPES.TALISMAN, 2, 0, 'Hace 2 de daño al mazo rival.'),
  makeCard('arma-lanza', 'Lanza de Colihue', CARD_TYPES.ARMA, 1, 2, 'Da +2 de fuerza a un aliado listo.'),
];

export function buildDeck() {
  return [
    ...Array.from({ length: 14 }, (_, i) => ({ ...cardPool[i % 3], id: `${cardPool[i % 3].id}-${i}` })),
    ...Array.from({ length: 3 }, (_, i) => ({ ...cardPool[3], id: `bosque-${i}` })),
    ...Array.from({ length: 3 }, (_, i) => ({ ...cardPool[4], id: `mareas-${i}` })),
    ...Array.from({ length: 2 }, (_, i) => ({ ...cardPool[5], id: `caleuche-${i}` })),
    ...Array.from({ length: 3 }, (_, i) => ({ ...cardPool[6], id: `condor-${i}` })),
    ...Array.from({ length: 2 }, (_, i) => ({ ...cardPool[7], id: `luna-${i}` })),
    ...Array.from({ length: 2 }, (_, i) => ({ ...cardPool[8], id: `tormenta-${i}` })),
    { ...cardPool[9], id: 'lanza-0' },
  ].sort(() => Math.random() - 0.5);
}

export function createPlayer(name) {
  const deck = buildDeck();
  return {
    name,
    deck,
    hand: deck.splice(0, 8),
    gold: [],
    field: [],
    discard: [],
    damageThisTurn: 0,
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

export function playCard(state, playerIndex, handIndex) {
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
  let remaining = card.cost;
  player.gold.forEach((gold) => {
    if (!gold.used && remaining > 0) {
      gold.used = true;
      remaining -= 1;
    }
  });
  player.hand.splice(handIndex, 1);

  if (card.type === CARD_TYPES.ALIADO) {
    player.field.push({ ...card, exhausted: true, bonus: 0 });
    if (card.name === 'Danzante de Mareas') draw(player, 1);
    return `${player.name} invocó a ${card.name}.`;
  }
  if (card.type === CARD_TYPES.TALISMAN) {
    player.discard.push(card);
    if (card.name === 'Rito de Luna Austral') draw(player, 2);
    if (card.name === 'Tormenta del Pacífico') opponent.deck.splice(0, 2);
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

export function attack(state, playerIndex, fieldIndex) {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const attacker = player.field[fieldIndex];
  if (!attacker) return 'No hay aliado atacante.';
  if (attacker.exhausted) return `${attacker.name} no está listo.`;
  const damage = attacker.strength + attacker.bonus;
  const milled = opponent.deck.splice(0, damage);
  opponent.discard.push(...milled);
  player.damageThisTurn += damage;
  attacker.exhausted = true;
  return `${attacker.name} desterró ${damage} cartas del Castillo rival.`;
}

export function endTurn(state) {
  const current = state.players[state.currentPlayer];
  current.playedGold = false;
  current.damageThisTurn = 0;
  current.gold.forEach((gold) => { gold.used = false; });
  state.currentPlayer = 1 - state.currentPlayer;
  const next = state.players[state.currentPlayer];
  next.field.forEach((ally) => { ally.exhausted = false; });
  draw(next, 1);
  state.turn += 1;
}

export function createGame() {
  return { players: [createPlayer('Jugador'), createPlayer('Rival')], currentPlayer: 0, turn: 1, log: ['Comienza la leyenda. Vacía el Castillo rival para ganar.'] };
}

function renderCard(card, index, zone, onClick) {
  const button = document.createElement('button');
  button.className = `card ${card.type.toLowerCase()} ${card.exhausted ? 'exhausted' : ''}`;
  button.innerHTML = `<strong>${card.name}</strong><span>${card.type}${card.cost ? ` · Coste ${card.cost}` : ''}</span><p>${card.strength ? `Fuerza ${card.strength + (card.bonus || 0)}` : card.text}</p>`;
  button.title = zone;
  button.addEventListener('click', () => onClick(index));
  return button;
}

function render(state) {
  const app = document.querySelector('#app');
  const active = state.players[state.currentPlayer];
  const opponent = state.players[1 - state.currentPlayer];
  app.innerHTML = `<main class="shell"><header><div><p class="eyebrow">TCG chileno original</p><h1>Crónicas del Austral</h1></div><button id="endTurn">Terminar turno</button></header><section class="rules"><h2>Reglas rápidas</h2><ol><li>Tu mazo es tu <b>Castillo</b>: si queda vacío, pierdes.</li><li>Juega 1 Oro por turno y úsalo para pagar Aliados, Talismanes y Armas.</li><li>Los Aliados atacan al Castillo rival y descartan cartas igual a su fuerza.</li><li>Al terminar turno, todo Oro se recupera y el rival roba 1 carta.</li></ol></section><section class="score"><article><h3>${active.name}</h3><p>Castillo: ${active.deck.length} · Mano: ${active.hand.length} · Oro: ${availableGold(active)}/${active.gold.length}</p></article><article><h3>${opponent.name}</h3><p>Castillo: ${opponent.deck.length} · Mano: ${opponent.hand.length} · Oro: ${availableGold(opponent)}/${opponent.gold.length}</p></article></section><h2>Campo de ${active.name}</h2><div id="field" class="zone"></div><h2>Mano</h2><div id="hand" class="zone"></div><aside><h2>Bitácora</h2><ul>${state.log.slice(-6).map((entry) => `<li>${entry}</li>`).join('')}</ul></aside></main>`;
  document.querySelector('#endTurn').addEventListener('click', () => { endTurn(state); state.log.push(`Turno ${state.turn}: juega ${state.players[state.currentPlayer].name}.`); autoPlayIfNeeded(state); render(state); });
  const hand = document.querySelector('#hand');
  active.hand.forEach((card, index) => hand.appendChild(renderCard(card, index, 'mano', (i) => { state.log.push(playCard(state, state.currentPlayer, i)); checkWinner(state); render(state); })));
  const field = document.querySelector('#field');
  active.field.forEach((card, index) => field.appendChild(renderCard(card, index, 'campo', (i) => { state.log.push(attack(state, state.currentPlayer, i)); checkWinner(state); render(state); })));
}

function autoPlayIfNeeded(state) {
  if (state.currentPlayer !== 1) return;
  const rival = state.players[1];
  const goldIndex = rival.hand.findIndex((card) => card.type === CARD_TYPES.ORO);
  if (goldIndex >= 0) state.log.push(playCard(state, 1, goldIndex));
  let played = true;
  while (played) {
    const index = rival.hand.findIndex((card) => card.type !== CARD_TYPES.ORO && card.cost <= availableGold(rival));
    played = index >= 0;
    if (played) state.log.push(playCard(state, 1, index));
  }
  rival.field.forEach((ally, index) => { if (!ally.exhausted) state.log.push(attack(state, 1, index)); });
  checkWinner(state);
  endTurn(state);
  state.log.push('El Rival termina su turno.');
}

function checkWinner(state) {
  state.players.forEach((player, index) => {
    if (player.deck.length === 0 && !state.winner) state.winner = state.players[1 - index].name;
  });
  if (state.winner) state.log.push(`${state.winner} gana la partida.`);
}

if (typeof document !== 'undefined') {
  render(createGame());
}
