// Every tuning number, colour and layout rect in one place. The table is a fixed 1280x720
// logical area; the renderer scales it to the window, so no rule depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** Both duelists start here; healing never goes above it. */
export const START_HP = 30;
/** A hand never holds more than this many cards. */
export const HAND_MAX = 7;
/** Mana refills to the round number, capped here. */
export const MANA_MAX = 10;
/** Playing a second card of the same suit in one turn adds this to its value. */
export const COMBO_BONUS = 2;
/** Points for winning, added to the damage dealt. */
export const WIN_BONUS = 100;

/** The four original suits: told apart by colour AND shape, never by text alone. */
export const SUITS = {
  ember: { name: 'Ember', color: '#e5534b', dark: '#8f2b25', glyph: 'flame' },
  tide: { name: 'Tide', color: '#4f9cf7', dark: '#2456a8', glyph: 'wave' },
  thorn: { name: 'Thorn', color: '#4caf6d', dark: '#256b3f', glyph: 'leaf' },
  star: { name: 'Star', color: '#f2c94c', dark: '#9a7414', glyph: 'star' },
};

export const KINDS = {
  strike: { name: 'Strike', verb: 'deals' },
  ward: { name: 'Ward', verb: 'gains' },
  mend: { name: 'Mend', verb: 'restores' },
  hybrid: { name: 'Snare', verb: 'deals' },
};

export const PALETTE = {
  backdrop: '#10131a',
  felt: '#1d5c38',
  feltDark: '#14452a',
  feltLine: '#2a7a4b',
  gold: '#f2c94c',
  goldDark: '#8a6d1f',
  panel: '#232a38',
  panelEdge: '#3a4356',
  text: '#eef1f5',
  muted: '#9aa3b2',
  cardFace: '#f7f2e6',
  cardInk: '#23262e',
  cardBack: '#7a2e2e',
  cardBackEdge: '#e5534b',
  hp: '#e5534b',
  hpBack: '#3a2020',
  shield: '#7ec8f7',
  mana: '#6ec6ff',
  manaBack: '#1d2f45',
  logBack: 'rgba(16, 19, 26, 0.72)',
  endTurn: '#2a7a4b',
  endTurnHover: '#35945e',
  danger: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Card size on the table; the hand fans them with this overlap. */
export const CARD = { width: 116, height: 158, gap: 14, lift: 26 };
/** Opponent card backs at the top of the table. */
export const BACK = { width: 64, height: 88, gap: 10 };

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ember-court.best';

/** The player's hand sits on this baseline (top edge of the cards). */
export function handTop() {
  return FIELD.height - CARD.height - 18;
}

/** The rect of the i-th card in a hand of `count` cards, centred on the table. */
export function handCardRect(index, count) {
  const total = count * CARD.width + (count - 1) * CARD.gap;
  const x = (FIELD.width - total) / 2 + index * (CARD.width + CARD.gap);
  return { x, y: handTop(), width: CARD.width, height: CARD.height };
}

/** The rect of the i-th opponent card back in a hand of `count`. */
export function backCardRect(index, count) {
  const total = count * BACK.width + (count - 1) * BACK.gap;
  const x = (FIELD.width - total) / 2 + index * (BACK.width + BACK.gap);
  return { x, y: 96, width: BACK.width, height: BACK.height };
}

/** The rival portrait circle (centre + radius) at the top of the table. */
export function rivalPortrait() {
  return { x: 92, y: 150, r: 52 };
}

/** The player portrait circle at the middle left, clear of the hand fan below. */
export function playerPortrait() {
  return { x: 92, y: 470, r: 46 };
}

/** The End Turn button, above the hand fan so a full hand never slides under it. */
export function endTurnRect() {
  return { x: FIELD.width - 218, y: 478, width: 188, height: 58 };
}

/** The centre stage where the last played card is shown face up. */
export function stageRect() {
  return { x: (FIELD.width - CARD.width) / 2, y: 268, width: CARD.width, height: CARD.height };
}
