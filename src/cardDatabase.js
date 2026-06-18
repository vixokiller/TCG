export function createCardRecord({
  code,
  name,
  image = '',
  cost = 0,
  strength = 0,
  type,
  race = null,
  ability = null,
  abilityKind = null,
  text = '',
  rarity = 'Común',
  edition = 'Base Austral',
  product = 'Mazo Inicial Austral',
  unique = false,
  copyLimit = 3,
}) {
  if (!code || !name || !type) throw new Error('Cada carta necesita code, name y type.');
  return { code, name, image, cost, strength, type, race, ability, abilityKind, text, rarity, edition, product, unique, copyLimit: unique ? 1 : copyLimit };
}

export const CARD_DATABASE = [
  createCardRecord({ code: 'BA-ORO-001', name: 'Oro de Canelo', image: '/assets/cards/oro-canelo.svg', type: 'Oro', text: 'Paga costes y despierta leyendas.', rarity: 'Común', copyLimit: 50 }),
  createCardRecord({ code: 'BA-ORO-002', name: 'Oro de Copihue', type: 'Oro', text: 'Paga costes y despierta leyendas.', rarity: 'Común', copyLimit: 50 }),
  createCardRecord({ code: 'BA-ORO-003', name: 'Oro del Volcán', type: 'Oro', ability: 'finalGroupGold', text: 'En la Fase Final puedes agrupar este Oro.', rarity: 'Común', copyLimit: 50 }),
  createCardRecord({ code: 'BA-ALI-001', name: 'Guardián del Bosque', cost: 1, strength: 2, type: 'Aliado', race: 'Caballero', ability: 'raceGuardian', text: 'Guardia de raza: tus Caballeros en defensa tienen +1.', rarity: 'Común' }),
  createCardRecord({ code: 'BA-ALI-002', name: 'Danzante de Mareas', cost: 2, strength: 3, type: 'Aliado', race: 'Faerie', ability: 'drawOnEnter', text: 'Entrada: roba 1 carta.', rarity: 'Infrecuente' }),
  createCardRecord({ code: 'BA-ALI-003', name: 'Nave Fantasma', cost: 3, strength: 5, type: 'Aliado', race: 'Dragón', ability: 'banishOnHit', text: 'Impacto: si no es bloqueado, destierra 1 carta adicional.', rarity: 'Rara' }),
  createCardRecord({ code: 'BA-ALI-004', name: 'Cóndor del Alba', cost: 2, strength: 4, type: 'Aliado', race: 'Héroe', ability: 'haste', text: 'Ímpetu: puede atacar el turno que entra en juego.', rarity: 'Infrecuente' }),
  createCardRecord({ code: 'BA-ALI-005', name: 'Pillán de la Cumbre', cost: 4, strength: 6, type: 'Aliado', race: 'Titán', ability: 'recycleOnEnter', text: 'Única. Entrada: baraja 2 cartas de tu Cementerio en tu Mazo Castillo.', rarity: 'Rara', unique: true }),
  createCardRecord({ code: 'BA-TAL-001', name: 'Rito de Luna Austral', cost: 1, type: 'Talismán', ability: 'drawTwo', text: 'Roba 2 cartas.', rarity: 'Común' }),
  createCardRecord({ code: 'BA-TAL-002', name: 'Tormenta del Pacífico', cost: 2, type: 'Talismán', ability: 'banishTwoFromCastle', text: 'Destierra 2 cartas del Castillo rival.', rarity: 'Infrecuente' }),
  createCardRecord({ code: 'BA-TAL-003', name: 'Negación Austral', cost: 2, type: 'Talismán', ability: 'counterCard', abilityKind: 'activada', text: 'Anula una carta que se está jugando y envíala al Cementerio.', rarity: 'Rara' }),
  createCardRecord({ code: 'BA-TAL-004', name: 'Silencio de los Ngen', cost: 1, type: 'Talismán', ability: 'cancelAbility', abilityKind: 'activada', text: 'Cancela una habilidad activada o disparada.', rarity: 'Infrecuente' }),
  createCardRecord({ code: 'BA-TOT-001', name: 'Tótem del Foye', cost: 2, type: 'Tótem', ability: 'foyeDefenseBuff', text: 'Continuo: tus Aliados en Línea de Defensa tienen +1 fuerza.', rarity: 'Infrecuente' }),
  createCardRecord({ code: 'BA-TOT-002', name: 'Tótem de la Machi', cost: 3, type: 'Tótem', ability: 'machiExtraDraw', text: 'Continuo: en Robo, roba 1 carta adicional.', rarity: 'Rara' }),
  createCardRecord({ code: 'BA-ARM-001', name: 'Lanza de Colihue', cost: 1, strength: 2, type: 'Arma', ability: 'weaponBuff', text: 'Anexar: el Aliado portador obtiene +2 fuerza.', rarity: 'Común' }),
];

export function toPlayableCard(record) {
  return {
    id: record.code,
    code: record.code,
    name: record.name,
    type: record.type,
    cost: record.cost,
    strength: record.strength,
    text: record.text,
    ability: record.ability,
    abilityKind: record.abilityKind,
    race: record.race,
    rarity: record.rarity,
    edition: record.edition,
    product: record.product,
    imageUrl: record.image,
    unique: record.unique,
    copyLimit: record.copyLimit,
  };
}

export function getPlayableCards() {
  return CARD_DATABASE.map(toPlayableCard);
}


export function maxCopiesForCard(card) {
  if (card.unique) return 1;
  return card.copyLimit ?? 3;
}

export function validateDeckCopies(cards) {
  const counts = new Map();
  const errors = [];
  for (const card of cards) {
    const key = card.code || card.id || card.name;
    const next = (counts.get(key) || 0) + 1;
    counts.set(key, next);
    const max = maxCopiesForCard(card);
    if (next > max) errors.push(`${card.name} excede el máximo de ${max} copia(s).`);
  }
  return errors;
}
