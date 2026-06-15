export const CARD_TYPES = {
  ORO: 'Oro',
  ALIADO: 'Aliado',
  TALISMAN: 'Talismán',
  TOTEM: 'Tótem',
  ARMA: 'Arma',
};

export const PHASES = ['Agrupación', 'Vigilia', 'Batalla Mitológica', 'Final', 'Robo'];
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

const makeCard = (id, name, type, cost = 0, strength = 0, text = '') => ({ id, name, type, cost, strength, text });
const clone = (card, id) => ({ ...card, id });

export const cardPool = [
  makeCard('oro-canelo', 'Oro de Canelo', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-copihue', 'Oro de Copihue', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-volcan', 'Oro del Volcán', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('aliado-trauco', 'Guardián del Bosque', CARD_TYPES.ALIADO, 1, 2, 'Entra a la Línea de Defensa.'),
  makeCard('aliado-pincoya', 'Danzante de Mareas', CARD_TYPES.ALIADO, 2, 3, 'Cuando entra en juego, roba 1 carta.'),
  makeCard('aliado-caleuche', 'Nave Fantasma', CARD_TYPES.ALIADO, 3, 5, 'Un atacante difícil de detener.'),
  makeCard('aliado-condor', 'Cóndor del Alba', CARD_TYPES.ALIADO, 2, 4, 'Un defensor orgulloso de la cordillera.'),
  makeCard('aliado-pillan', 'Pillán de la Cumbre', CARD_TYPES.ALIADO, 4, 6, 'Una fuerza volcánica para cerrar partidas.'),
  makeCard('talisman-luna', 'Rito de Luna Austral', CARD_TYPES.TALISMAN, 1, 0, 'Roba 2 cartas.'),
  makeCard('talisman-tormenta', 'Tormenta del Pacífico', CARD_TYPES.TALISMAN, 2, 0, 'Destierra 2 cartas del Castillo rival.'),
  makeCard('totem-foye', 'Tótem del Foye', CARD_TYPES.TOTEM, 2, 0, 'Continuo: tus Aliados en Línea de Defensa tienen +1 fuerza.'),
  makeCard('totem-machi', 'Tótem de la Machi', CARD_TYPES.TOTEM, 3, 0, 'Continuo: al inicio de Robo, roba 1 carta adicional.'),
  makeCard('arma-lanza', 'Lanza de Colihue', CARD_TYPES.ARMA, 1, 2, 'Da +2 de fuerza a un Aliado listo.'),
];

export function buildDeck() {
  const recipe = [
    [0, 5], [1, 5], [2, 5],
    [3, 6], [4, 6], [5, 5], [6, 5], [7, 3],
    [8, 2], [9, 2],
    [10, 2], [11, 2],
    [12, 2],
  ];
  return recipe.flatMap(([poolIndex, amount]) => (
    Array.from({ length: amount }, (_, i) => clone(cardPool[poolIndex], `${cardPool[poolIndex].id}-${i}`))
  )).sort(() => Math.random() - 0.5);
}

export function countByType(deck) {
  return deck.reduce((counts, card) => ({ ...counts, [card.type]: (counts[card.type] || 0) + 1 }), {});
}

export function createPlayer(name) {
  const deck = buildDeck();
  const startingGold = [];
  while (startingGold.length < STARTING_GOLD) {
    const goldIndex = deck.findIndex((card) => card.type === CARD_TYPES.ORO);
    if (goldIndex < 0) break;
    startingGold.push({ ...deck.splice(goldIndex, 1)[0], paid: false, initial: true });
  }
  return {
    name,
    deck,
    hand: deck.splice(0, STARTING_HAND_SIZE),
    gold: startingGold,
    paidGold: [],
    defenseLine: [],
    attackLine: [],
    supportLine: [],
    discard: [],
    banished: [],
    damageThisTurn: 0,
    playedGold: false,
  };
}

export function availableGold(player) {
  return player.gold.length;
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

export function groupPaidGold(player) {
  if (player.paidGold.length === 0) return 0;
  const amount = player.paidGold.length;
  player.gold.push(...player.paidGold.map((card) => ({ ...card, paid: false })));
  player.paidGold = [];
  return amount;
}

function requirePhase(state, phase) {
  return state.phase === phase;
}

function payCost(player, cost) {
  const paid = player.gold.splice(0, cost).map((card) => ({ ...card, paid: true }));
  player.paidGold.push(...paid);
}

function allAllies(player) {
  return [...player.attackLine, ...player.defenseLine];
}

function totemBonus(player, ally, line) {
  const hasFoye = player.supportLine.some((card) => card.name === 'Tótem del Foye');
  return hasFoye && line === 'defenseLine' ? 1 : 0;
}

function totalStrength(player, ally, line = 'attackLine') {
  return ally.strength + (ally.bonus || 0) + totemBonus(player, ally, line);
}

export function playCard(state, playerIndex, handIndex, targetLine = 'defenseLine') {
  if (state.winner) return 'La partida ya terminó.';
  if (!requirePhase(state, 'Vigilia')) return 'Solo puedes jugar cartas durante la fase de Vigilia.';
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const card = player.hand[handIndex];
  if (!card) return 'No hay carta en esa posición.';

  if (card.type === CARD_TYPES.ORO) {
    if (player.playedGold) return 'Solo puedes jugar un Oro por turno.';
    player.gold.push({ ...card, paid: false });
    player.hand.splice(handIndex, 1);
    player.playedGold = true;
    return `${player.name} puso un Oro en la zona de Oro.`;
  }

  if (availableGold(player) < card.cost) return `Necesitas ${card.cost} Oro disponible.`;
  payCost(player, card.cost);
  player.hand.splice(handIndex, 1);

  if (card.type === CARD_TYPES.ALIADO) {
    const line = targetLine === 'attackLine' ? 'attackLine' : 'defenseLine';
    player[line].push({ ...card, exhausted: true, bonus: 0 });
    if (card.name === 'Danzante de Mareas') draw(player, 1);
    return `${player.name} invocó a ${card.name} en ${line === 'attackLine' ? 'Línea de Ataque' : 'Línea de Defensa'}.`;
  }
  if (card.type === CARD_TYPES.TOTEM) {
    player.supportLine.push({ ...card, continuous: true });
    return `${player.name} levantó ${card.name} en la Línea de Apoyo.`;
  }
  if (card.type === CARD_TYPES.TALISMAN) {
    player.discard.push(card);
    if (card.name === 'Rito de Luna Austral') draw(player, 2);
    if (card.name === 'Tormenta del Pacífico') {
      const banished = opponent.deck.splice(0, 2);
      opponent.banished.push(...banished);
      checkWinner(state);
    }
    return `${player.name} resolvió ${card.name}.`;
  }
  if (card.type === CARD_TYPES.ARMA) {
    const target = allAllies(player).find((ally) => !ally.exhausted);
    if (target) target.bonus += card.strength;
    player.discard.push(card);
    return target ? `${target.name} recibe +${card.strength} fuerza.` : 'No había Aliado listo para equipar.';
  }
  return 'Tipo de carta no reconocido.';
}

function chooseDefender(opponent) {
  return opponent.defenseLine
    .map((ally, index) => ({ ally, index, line: 'defenseLine' }))
    .filter(({ ally }) => !ally.exhausted)
    .sort((a, b) => totalStrength(opponent, b.ally, b.line) - totalStrength(opponent, a.ally, a.line))[0];
}

export function attack(state, playerIndex, fieldIndex, defenderIndex = null) {
  if (state.winner) return 'La partida ya terminó.';
  if (!requirePhase(state, 'Batalla Mitológica')) return 'Solo puedes atacar durante la Batalla Mitológica.';
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const attacker = player.attackLine[fieldIndex];
  if (!attacker) return 'No hay Aliado atacante en la Línea de Ataque.';
  if (attacker.exhausted) return `${attacker.name} no está listo.`;

  const defenderChoice = defenderIndex === null
    ? chooseDefender(opponent)
    : { ally: opponent.defenseLine[defenderIndex], index: defenderIndex, line: 'defenseLine' };

  attacker.exhausted = true;

  if (defenderChoice?.ally && !defenderChoice.ally.exhausted) {
    const defender = defenderChoice.ally;
    defender.exhausted = true;
    const attackForce = totalStrength(player, attacker, 'attackLine');
    const defenseForce = totalStrength(opponent, defender, 'defenseLine');
    const attackerName = attacker.name;
    const defenderName = defender.name;

    if (attackForce >= defenseForce) {
      opponent.discard.push(...opponent.defenseLine.splice(defenderChoice.index, 1));
    }
    if (defenseForce >= attackForce) {
      player.discard.push(...player.attackLine.splice(fieldIndex, 1));
    }
    if (attackForce === defenseForce) return `${attackerName} y ${defenderName} se destruyen mutuamente.`;
    return attackForce > defenseForce
      ? `${attackerName} vence a ${defenderName} en combate de Aliados.`
      : `${defenderName} defiende y destruye a ${attackerName}.`;
  }

  const damage = totalStrength(player, attacker, 'attackLine');
  const milled = opponent.deck.splice(0, damage);
  opponent.discard.push(...milled);
  player.damageThisTurn += damage;
  checkWinner(state);
  return `${attacker.name} hizo ${damage} de daño al Castillo rival.`;
}

function readyPlayer(player) {
  [...player.attackLine, ...player.defenseLine].forEach((ally) => { ally.exhausted = false; });
}

export function advancePhase(state) {
  if (state.winner) return 'La partida ya terminó.';
  const player = state.players[state.currentPlayer];
  const currentPhase = state.phase;

  if (currentPhase === 'Agrupación') {
    const grouped = groupPaidGold(player);
    state.log.push(grouped ? `${player.name} agrupó ${grouped} Oro pagado.` : `${player.name} no tiene Oros pagados que agrupar.`);
  }

  if (currentPhase === 'Robo') {
    const extraDraw = player.supportLine.some((card) => card.name === 'Tótem de la Machi') ? 1 : 0;
    draw(player, 1 + extraDraw);
    checkWinner(state);
    player.playedGold = false;
    player.damageThisTurn = 0;
    state.currentPlayer = 1 - state.currentPlayer;
    state.turn += 1;
    state.phaseIndex = 0;
    state.phase = PHASES[state.phaseIndex];
    readyPlayer(state.players[state.currentPlayer]);
    state.log.push(`Turno ${state.turn}: juega ${state.players[state.currentPlayer].name}. Fase de Agrupación.`);
    return state.phase;
  }

  state.phaseIndex += 1;
  state.phase = PHASES[state.phaseIndex];
  state.log.push(`Fase de ${state.phase}.`);
  return state.phase;
}

export function createGame() {
  return {
    players: [createPlayer('Jugador'), createPlayer('Rival')],
    currentPlayer: 0,
    turn: 1,
    phaseIndex: 0,
    phase: PHASES[0],
    log: ['Comienza la leyenda. Fase de Agrupación: los Oros pagados vuelven a la zona de Oro.'],
    winner: null,
    loser: null,
  };
}

function renderCard(card, index, zone, onClick) {
  const button = document.createElement('button');
  button.className = `card ${card.type.toLowerCase()} ${card.exhausted ? 'exhausted' : ''}`;
  button.innerHTML = `<strong>${card.name}</strong><span>${card.type}${card.cost ? ` · Coste ${card.cost}` : ''}</span><p>${card.strength ? `Fuerza ${card.strength + (card.bonus || 0)}` : card.text}</p>`;
  button.title = zone;
  button.disabled = zone.includes('oponente') || zone.includes('mazo') || zone.includes('cementerio') || zone.includes('destierro') || zone.includes('oro');
  button.addEventListener('click', () => onClick(index));
  return button;
}

function renderZone(selector, cards, zone, onClick) {
  const element = document.querySelector(selector);
  cards.forEach((card, index) => element.appendChild(renderCard(card, index, zone, onClick)));
}

function zoneSummary(title, cards) {
  return `<article class="zone-card"><h3>${title}</h3><p>${cards.length} carta${cards.length === 1 ? '' : 's'}</p></article>`;
}

function renderBoard(prefix, player, isOpponent = false) {
  return `<section class="board ${isOpponent ? 'opponent' : ''}"><h2>${isOpponent ? 'Zonas del oponente' : 'Tus zonas'}</h2><div class="zone-summaries">${zoneSummary('Mazo Castillo', player.deck)}${zoneSummary('Zona de Oro', player.gold)}${zoneSummary('Oros pagados', player.paidGold)}${zoneSummary('Cementerio', player.discard)}${zoneSummary('Destierro', player.banished)}</div><h3>Línea de Apoyo</h3><div id="${prefix}Support" class="zone compact"></div><h3>Línea de Defensa</h3><div id="${prefix}Defense" class="zone compact"></div><h3>Línea de Ataque</h3><div id="${prefix}Attack" class="zone compact"></div></section>`;
}

function render(state) {
  const app = document.querySelector('#app');
  const active = state.players[state.currentPlayer];
  const opponent = state.players[1 - state.currentPlayer];
  const status = state.winner
    ? `<section class="result"><h2>${state.winner} gana</h2><p>${state.loser} perdió por quedarse sin cartas en su Castillo.</p></section>`
    : '';
  app.innerHTML = `<main class="shell"><header><div><p class="eyebrow">Turno ${state.turn} · ${active.name}</p><h1>Crónicas del Austral</h1><p class="phase">Fase actual: <b>${state.phase}</b></p></div><button id="nextPhase" ${state.winner ? 'disabled' : ''}>Siguiente fase</button></header>${status}<section class="rules"><h2>Fases</h2><ol>${PHASES.map((phase) => `<li class="${phase === state.phase ? 'active-phase' : ''}">${phase}</li>`).join('')}</ol></section><section class="score"><article><h3>${active.name}</h3><p>Castillo: ${active.deck.length} · Mano: ${active.hand.length} · Oro: ${availableGold(active)} · Oros pagados: ${active.paidGold.length} · Cementerio: ${active.discard.length} · Destierro: ${active.banished.length}</p></article><article><h3>${opponent.name}</h3><p>Castillo: ${opponent.deck.length} · Mano: ${opponent.hand.length} · Oro: ${availableGold(opponent)} · Oros pagados: ${opponent.paidGold.length} · Cementerio: ${opponent.discard.length} · Destierro: ${opponent.banished.length}</p></article></section>${renderBoard('opponent', opponent, true)}${renderBoard('active', active)}<h2>Mano</h2><div id="hand" class="zone"></div><aside><h2>Bitácora</h2><ul>${state.log.slice(-10).map((entry) => `<li>${entry}</li>`).join('')}</ul></aside></main>`;
  document.querySelector('#nextPhase').addEventListener('click', () => { advancePhase(state); autoPlayIfNeeded(state); render(state); });
  renderZone('#opponentSupport', opponent.supportLine, 'apoyo oponente', () => {});
  renderZone('#opponentDefense', opponent.defenseLine, 'defensa oponente', () => {});
  renderZone('#opponentAttack', opponent.attackLine, 'ataque oponente', () => {});
  renderZone('#activeSupport', active.supportLine, 'apoyo', () => {});
  renderZone('#activeDefense', active.defenseLine, 'defensa', () => {});
  renderZone('#activeAttack', active.attackLine, 'ataque', (i) => { state.log.push(attack(state, state.currentPlayer, i)); render(state); });
  renderZone('#hand', active.hand, 'mano', (i) => { state.log.push(playCard(state, state.currentPlayer, i, 'attackLine')); render(state); });
}

function autoPlayIfNeeded(state) {
  if (state.currentPlayer !== 1 || state.winner) return;
  while (state.currentPlayer === 1 && !state.winner) {
    if (state.phase === 'Agrupación') advancePhase(state);
    if (state.phase === 'Vigilia') {
      const rival = state.players[1];
      const goldIndex = rival.hand.findIndex((card) => card.type === CARD_TYPES.ORO);
      if (goldIndex >= 0) state.log.push(playCard(state, 1, goldIndex));
      let played = true;
      while (played && !state.winner) {
        const index = rival.hand.findIndex((card) => card.type !== CARD_TYPES.ORO && card.cost <= availableGold(rival));
        played = index >= 0;
        if (played) state.log.push(playCard(state, 1, index, 'attackLine'));
      }
      advancePhase(state);
    }
    if (state.phase === 'Batalla Mitológica') {
      const rival = state.players[1];
      [...rival.attackLine].forEach((ally) => {
        const index = rival.attackLine.indexOf(ally);
        if (index >= 0 && !ally.exhausted && !state.winner) state.log.push(attack(state, 1, index));
      });
      advancePhase(state);
    }
    if (state.phase === 'Final') advancePhase(state);
    if (state.phase === 'Robo') advancePhase(state);
  }
}

if (typeof document !== 'undefined') {
  render(createGame());
}
