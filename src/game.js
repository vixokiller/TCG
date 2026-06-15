export const CARD_TYPES = {
  ORO: 'Oro',
  ALIADO: 'Aliado',
  TALISMAN: 'Talismán',
  TOTEM: 'Tótem',
  ARMA: 'Arma',
};

export const PHASES = ['Vigilia', 'Declaración de Ataque', 'Declaración de Bloqueadores', 'Guerra de Talismanes', 'Asignación de Daño', 'Robo'];
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

const makeCard = (id, name, type, cost = 0, strength = 0, text = '', ability = null, race = null) => ({ id, name, type, cost, strength, text, ability, race });
const clone = (card, id) => ({ ...card, id });
const abilityLabels = {
  raceGuardian: 'Guardia de raza: Aliados de la misma raza en defensa obtienen +1.',
  drawOnEnter: 'Entrada: roba 1 carta.',
  banishOnHit: 'Impacto: si no es bloqueado, destierra 1 carta adicional.',
  haste: 'Ímpetu: puede atacar el turno que entra en juego.',
  recycleOnEnter: 'Entrada: baraja 2 cartas de tu Cementerio en tu Mazo Castillo.',
};
function abilityText(card) { return card.ability ? abilityLabels[card.ability] || card.ability : 'Sin habilidad.'; }

export const cardPool = [
  makeCard('oro-canelo', 'Oro de Canelo', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-copihue', 'Oro de Copihue', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('oro-volcan', 'Oro del Volcán', CARD_TYPES.ORO, 0, 0, 'Paga costes y despierta leyendas.'),
  makeCard('aliado-trauco', 'Guardián del Bosque', CARD_TYPES.ALIADO, 1, 2, 'Caballero · Guardia: tus Caballeros en defensa tienen +1.', 'raceGuardian', 'Caballero'),
  makeCard('aliado-pincoya', 'Danzante de Mareas', CARD_TYPES.ALIADO, 2, 3, 'Faerie · Marea: cuando entra en juego, roba 1 carta.', 'drawOnEnter', 'Faerie'),
  makeCard('aliado-caleuche', 'Nave Fantasma', CARD_TYPES.ALIADO, 3, 5, 'Dragón · Evasivo: si no es bloqueado, destierra 1 carta adicional.', 'banishOnHit', 'Dragón'),
  makeCard('aliado-condor', 'Cóndor del Alba', CARD_TYPES.ALIADO, 2, 4, 'Héroe · Ímpetu: puede atacar el turno que entra en juego.', 'haste', 'Héroe'),
  makeCard('aliado-pillan', 'Pillán de la Cumbre', CARD_TYPES.ALIADO, 4, 6, 'Titán · Memoria: al entrar baraja 2 cartas de tu Cementerio.', 'recycleOnEnter', 'Titán'),
  makeCard('talisman-luna', 'Rito de Luna Austral', CARD_TYPES.TALISMAN, 1, 0, 'Roba 2 cartas.'),
  makeCard('talisman-tormenta', 'Tormenta del Pacífico', CARD_TYPES.TALISMAN, 2, 0, 'Destierra 2 cartas del Castillo rival.'),
  makeCard('totem-foye', 'Tótem del Foye', CARD_TYPES.TOTEM, 2, 0, 'Continuo: tus Aliados en Línea de Defensa tienen +1 fuerza.'),
  makeCard('totem-machi', 'Tótem de la Machi', CARD_TYPES.TOTEM, 3, 0, 'Continuo: en Robo, roba 1 carta adicional.'),
  makeCard('arma-lanza', 'Lanza de Colihue', CARD_TYPES.ARMA, 1, 2, 'Anexar: el Aliado portador obtiene +2 fuerza.'),
];

export function buildDeck() {
  const recipe = [[0, 5], [1, 5], [2, 5], [3, 6], [4, 6], [5, 5], [6, 5], [7, 3], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2]];
  return recipe.flatMap(([poolIndex, amount]) => Array.from({ length: amount }, (_, i) => clone(cardPool[poolIndex], `${cardPool[poolIndex].id}-${i}`))).sort(() => Math.random() - 0.5);
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
  return { name, deck, hand: deck.splice(0, STARTING_HAND_SIZE), gold: startingGold, paidGold: [], defenseLine: [], attackLine: [], supportLine: [], discard: [], banished: [], playedGold: false, damageThisTurn: 0 };
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
function totemBonus(player, ally, line) { return player.supportLine.some((card) => card.name === 'Tótem del Foye') && line === 'defenseLine' ? 1 : 0; }
function raceBonus(player, ally, line) {
  if (!ally.race) return 0;
  return player.defenseLine.some((other) => other !== ally && other.ability === 'raceGuardian' && other.race === ally.race && line === 'defenseLine') ? 1 : 0;
}
function abilityBonus(ally, line) { return ally.ability === 'raceGuardian' && line === 'defenseLine' ? 1 : 0; }
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
  player.deck.push(...cards);
  player.deck.sort(() => Math.random() - 0.5);
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
  if (state && ally.enteredTurn === state.turn && ally.ability !== 'haste') return `${ally.name} no puede atacar el turno que entró en juego.`;
  player.defenseLine.splice(defenseIndex, 1);
  player.attackLine.push({ ...ally, exhausted: false });
  return `${ally.name} se movió a la Línea de Ataque.`;
}

export function playCard(state, playerIndex, handIndex, target = {}) {
  if (state.winner) return 'La partida ya terminó.';
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const card = player.hand[handIndex];
  if (!card) return 'No hay carta en esa posición.';
  const isTalismanWar = state.phase === 'Guerra de Talismanes' && card.type === CARD_TYPES.TALISMAN && playerIndex === state.talismanPriority;
  if (state.phase !== 'Vigilia' && !isTalismanWar) return 'Solo puedes jugar cartas en Vigilia; los Talismanes se juegan en Guerra de Talismanes con preferencia.';

  if (card.type === CARD_TYPES.ORO) {
    if (state.phase !== 'Vigilia') return 'El Oro solo se juega en Vigilia.';
    if (player.playedGold) return 'Solo puedes jugar un Oro por turno.';
    player.gold.push({ ...card, paid: false });
    player.hand.splice(handIndex, 1);
    player.playedGold = true;
    return `${player.name} puso un Oro en la Reserva de Oros.`;
  }
  if (availableGold(player) < card.cost) return `Necesitas ${card.cost} Oro disponible.`;
  payCost(player, card.cost);
  player.hand.splice(handIndex, 1);

  if (card.type === CARD_TYPES.ALIADO) {
    player.defenseLine.push({ ...card, exhausted: false, bonus: 0, weapon: null, enteredTurn: state.turn });
    if (card.ability === 'drawOnEnter') draw(player, 1);
    if (card.ability === 'recycleOnEnter') player.deck.push(...player.discard.splice(0, 2));
    return `${player.name} invocó a ${card.name} en Línea de Defensa.`;
  }
  if (card.type === CARD_TYPES.TOTEM) {
    player.supportLine.push({ ...card, continuous: true });
    return `${player.name} levantó ${card.name} en Línea de Apoyo.`;
  }
  if (card.type === CARD_TYPES.ARMA) {
    const allies = allAllies(player);
    const targetAlly = Number.isInteger(target.allyIndex) ? allies[target.allyIndex] : allies.find((ally) => !ally.weapon);
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
    if (card.name === 'Rito de Luna Austral') draw(player, 2);
    if (card.name === 'Tormenta del Pacífico') opponent.banished.push(...opponent.deck.splice(0, 2));
    if (isTalismanWar) state.talismanPasses = 0;
    checkWinner(state);
    return `${player.name} resolvió ${card.name}.`;
  }
  return 'Tipo de carta no reconocido.';
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
    if (attackingAlly.ability === 'banishOnHit') defender.banished.push(...defender.deck.splice(0, 1));
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
function automaticFinal(state) { state.log.push('Fase Final automática: se cierra el turno activo.'); }

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
    automaticFinal(state);
    state.phase = 'Robo';
    return state.phase;
  }
  if (state.phase === 'Robo') {
    const player = state.players[state.currentPlayer];
    const extraDraw = player.supportLine.some((card) => card.name === 'Tótem de la Machi') ? 1 : 0;
    draw(player, 1 + extraDraw);
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

export function createGame() {
  const state = { players: [createPlayer('Jugador'), createPlayer('Rival')], currentPlayer: 0, turn: 1, phase: 'Vigilia', log: ['Agrupación inicial automática. Comienza la Vigilia.'], winner: null, loser: null, pendingAttacks: [], talismanPriority: null, talismanPasses: 0, selectedBlockerIndex: null, viewedZone: null };
  automaticGrouping(state);
  return state;
}

function renderCard(card, index, zone, onClick) {
  const button = document.createElement('button');
  button.className = `card ${card.type.toLowerCase()} ${card.exhausted ? 'exhausted' : ''} ${card.weapon ? 'armed' : ''}`;
  button.innerHTML = `${card.weapon ? `<div class="attached-weapon">${card.weapon.name}</div>` : ''}<strong>${card.name}</strong><span>${card.type}${card.race ? ` · ${card.race}` : ''}${card.cost ? ` · Coste ${card.cost}` : ''}</span><p>${card.strength ? `Fuerza ${card.strength + (card.bonus || 0) + weaponBonus(card)}` : card.text}</p><small>${abilityText(card)}</small><div class="card-detail"><h3>${card.name}</h3><p>Tipo: ${card.type}</p><p>Coste: ${card.cost || 0}</p><p>Fuerza: ${card.strength || 0}${card.weapon ? ` (+${card.weapon.strength} por Arma)` : ''}</p><p>Raza: ${card.race || '—'}</p><p>Habilidad: ${abilityText(card)}</p></div>`;
  button.title = zone;
  button.disabled = zone.includes('mazo') || zone.includes('cementerio') || zone.includes('destierro') || zone.includes('oro');
  button.addEventListener('click', () => onClick(index));
  return button;
}

function renderZone(selector, cards, zone, onClick) { const element = document.querySelector(selector); cards.forEach((card, index) => element.appendChild(renderCard(card, index, zone, onClick))); }
function zoneSummary(title, cards, key) {
  const isDeck = key.endsWith(':deck');
  const tag = isDeck ? 'article' : 'button';
  const data = isDeck ? '' : ` data-zone="${key}"`;
  return `<${tag} class="zone-card ${isDeck ? 'locked-zone' : ''}"${data}><h3>${title}</h3><p>${cards.length} carta${cards.length === 1 ? '' : 's'}</p>${isDeck ? '<small>Contenido oculto</small>' : ''}</${tag}>`;
}
function renderSideZones(player, prefix) { return `<aside class="side-zones"><div class="top-pile">${zoneSummary('Cementerio', player.discard, `${prefix}:discard`)}${zoneSummary('Oros pagados', player.paidGold, `${prefix}:paidGold`)}</div><div class="middle-pile">${zoneSummary('Mazo Castillo', player.deck, `${prefix}:deck`)}</div><div class="bottom-pile">${zoneSummary('Destierro', player.banished, `${prefix}:banished`)}${zoneSummary('Reserva de Oros', player.gold, `${prefix}:gold`)}</div></aside>`; }
function renderLines(prefix) { return `<section class="lines"><h3>Línea de Ataque</h3><div id="${prefix}Attack" class="zone compact"></div><h3>Línea de Defensa</h3><div id="${prefix}Defense" class="zone compact"></div><h3>Línea de Apoyo</h3><div id="${prefix}Support" class="zone compact"></div></section>`; }



function renderBattleLinks(state, active, opponent) {
  if (!state.pendingAttacks?.length) return '';
  const rows = state.pendingAttacks
    .filter((attack) => attack.blockerIndex !== null)
    .map((attack) => {
      const attacker = active.attackLine[attack.attackerIndex];
      const blocker = opponent.defenseLine[attack.blockerIndex];
      if (!attacker || !blocker) return '';
      return `<div class="block-link"><span>${blocker.name}</span><i></i><span>${attacker.name}</span></div>`;
    }).join('');
  return rows ? `<section class="block-links"><h2>Bloqueos declarados</h2>${rows}</section>` : '';
}

function renderViewedZone(state, active, opponent) {
  if (!state.viewedZone) return '';
  const [owner, zone] = state.viewedZone.split(':');
  const player = owner === 'active' ? active : opponent;
  const cards = player[zone] || [];
  return `<section class="viewer"><button id="closeViewer">Cerrar</button><h2>${player.name}: ${zone}</h2><div id="viewerCards" class="zone"></div></section>`;
}

function render(state) {
  const app = document.querySelector('#app');
  const active = state.players[state.currentPlayer];
  const opponent = state.players[1 - state.currentPlayer];
  const status = state.winner ? `<section class="result"><h2>${state.winner} gana</h2><p>${state.loser} perdió por quedarse sin cartas en su Castillo.</p></section>` : '';
  app.innerHTML = `<main class="shell"><header><div><p class="eyebrow">Turno ${state.turn} · ${active.name}</p><h1>Crónicas del Austral</h1><p class="phase">Fase actual: <b>${state.phase}</b></p></div><button id="nextPhase" ${state.winner ? 'disabled' : ''}>Siguiente paso</button></header>${status}<section class="rules"><h2>Batalla Mitológica</h2><ol>${PHASES.map((phase) => `<li class="${phase === state.phase ? 'active-phase' : ''}">${phase}</li>`).join('')}</ol></section><section class="table"><div class="player-board opponent-board">${renderSideZones(opponent, 'opponent')}${renderLines('opponent')}</div><div class="player-board">${renderSideZones(active, 'active')}${renderLines('active')}</div></section>${renderBattleLinks(state, active, opponent)}<h2>Mano</h2><div id="hand" class="zone"></div>${renderViewedZone(state, active, opponent)}<aside><h2>Bitácora</h2><ul>${state.log.slice(-12).map((entry) => `<li>${entry}</li>`).join('')}</ul></aside></main>`;
  document.querySelector('#nextPhase').addEventListener('click', () => { advancePhase(state); autoPlayIfNeeded(state); render(state); });
  document.querySelectorAll('.zone-card').forEach((button) => button.addEventListener('click', () => { state.viewedZone = button.dataset.zone; render(state); }));
  document.querySelector('#closeViewer')?.addEventListener('click', () => { state.viewedZone = null; render(state); });
  if (state.viewedZone) { const [owner, zone] = state.viewedZone.split(':'); const cards = (owner === 'active' ? active : opponent)[zone] || []; renderZone('#viewerCards', cards, 'visor', () => {}); }
  renderZone('#opponentAttack', opponent.attackLine, 'ataque oponente', (i) => { if (state.phase === 'Declaración de Bloqueadores' && state.selectedBlockerIndex !== null) { state.log.push(declareBlocker(state, state.selectedBlockerIndex, i)); state.selectedBlockerIndex = null; render(state); } });
  renderZone('#opponentDefense', opponent.defenseLine, 'defensa oponente', (i) => { if (state.phase === 'Declaración de Bloqueadores') { state.selectedBlockerIndex = i; state.log.push(`${opponent.defenseLine[i].name} seleccionado para bloquear.`); render(state); } });
  renderZone('#opponentSupport', opponent.supportLine, 'apoyo oponente', () => {});
  renderZone('#activeAttack', active.attackLine, 'ataque', (i) => { if (state.phase === 'Declaración de Bloqueadores' && state.selectedBlockerIndex !== null) { state.log.push(declareBlocker(state, state.selectedBlockerIndex, i)); state.selectedBlockerIndex = null; render(state); } });
  renderZone('#activeDefense', active.defenseLine, 'defensa', (i) => { if (state.phase === 'Vigilia') state.log.push(moveAllyToAttack(active, i, state)); render(state); });
  renderZone('#activeSupport', active.supportLine, 'apoyo', () => {});
  renderZone('#hand', active.hand, 'mano', (i) => { state.log.push(playCard(state, state.currentPlayer, i)); render(state); });
}

function autoPlayIfNeeded(state) {
  if (state.currentPlayer !== 1 || state.winner) return;
  const rival = state.players[1];
  while (state.currentPlayer === 1 && !state.winner) {
    if (state.phase === 'Vigilia') {
      const goldIndex = rival.hand.findIndex((card) => card.type === CARD_TYPES.ORO);
      if (goldIndex >= 0) state.log.push(playCard(state, 1, goldIndex));
      let played = true;
      while (played) {
        const index = rival.hand.findIndex((card) => card.type !== CARD_TYPES.ORO && card.cost <= availableGold(rival));
        played = index >= 0;
        if (played) state.log.push(playCard(state, 1, index));
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
