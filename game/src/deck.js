// The cards of Ember Court. Every card is an original design: a name, one of the four suits,
// a cost in mana, a kind and a value. A hybrid card deals damage and grants shield at once.
// `copies` says how many of it go into each 30-card deck; both duelists play the same mix.
import { KINDS } from './config.js';

const DESIGNS = [
  { id: 'cinder-imp', name: 'Cinder Imp', suit: 'ember', cost: 1, kind: 'strike', value: 2, copies: 3 },
  { id: 'flame-lash', name: 'Flame Lash', suit: 'ember', cost: 2, kind: 'strike', value: 4, copies: 3 },
  { id: 'firebrand', name: 'Firebrand', suit: 'ember', cost: 3, kind: 'strike', value: 6, copies: 2 },
  { id: 'inferno', name: 'Inferno', suit: 'ember', cost: 5, kind: 'strike', value: 10, copies: 1 },
  { id: 'ember-guard', name: 'Ember Guard', suit: 'ember', cost: 2, kind: 'ward', value: 4, copies: 2 },
  { id: 'tide-mend', name: 'Tide Mend', suit: 'tide', cost: 2, kind: 'mend', value: 5, copies: 3 },
  { id: 'deep-well', name: 'Deep Well', suit: 'tide', cost: 3, kind: 'mend', value: 8, copies: 1 },
  { id: 'wave-crash', name: 'Wave Crash', suit: 'tide', cost: 4, kind: 'strike', value: 7, copies: 2 },
  { id: 'tide-shield', name: 'Tide Shield', suit: 'tide', cost: 3, kind: 'ward', value: 7, copies: 1 },
  { id: 'thorn-ward', name: 'Thorn Ward', suit: 'thorn', cost: 1, kind: 'ward', value: 3, copies: 2 },
  { id: 'briar-wall', name: 'Briar Wall', suit: 'thorn', cost: 2, kind: 'ward', value: 6, copies: 2 },
  { id: 'vine-snare', name: 'Vine Snare', suit: 'thorn', cost: 2, kind: 'hybrid', value: 3, shield: 2, copies: 2 },
  { id: 'thorn-mend', name: 'Thorn Mend', suit: 'thorn', cost: 3, kind: 'mend', value: 7, copies: 1 },
  { id: 'starlight', name: 'Starlight', suit: 'star', cost: 1, kind: 'strike', value: 1, draw: 1, copies: 2 },
  { id: 'nova', name: 'Nova', suit: 'star', cost: 4, kind: 'strike', value: 8, copies: 1 },
  { id: 'comet', name: 'Comet', suit: 'star', cost: 6, kind: 'strike', value: 12, copies: 1 },
  { id: 'star-ward', name: 'Star Ward', suit: 'star', cost: 2, kind: 'ward', value: 5, copies: 1 },
];

/** The full design table (one entry per design, with its copy count). */
export function cardDesigns() {
  return DESIGNS.map((d) => ({ ...d }));
}

/** A fresh 30-card deck: every design in its copy count, shuffled with `random`. */
export function buildDeck(random) {
  const deck = [];
  for (const design of DESIGNS) {
    for (let n = 0; n < design.copies; n += 1) deck.push({ ...design, uid: `${design.id}-${n}` });
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** One line describing what a card does, for its face and the log. */
export function cardText(card) {
  const kind = KINDS[card.kind].name;
  if (card.kind === 'strike') return `${kind} ${card.value}`;
  if (card.kind === 'ward') return `${kind} ${card.value}`;
  if (card.kind === 'mend') return `${kind} ${card.value}`;
  if (card.kind === 'hybrid') return `Strike ${card.value} + Ward ${card.shield}`;
  return kind;
}
