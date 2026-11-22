// The game's rules and state, with no drawing and no browser in it: two 30-card decks, mana,
// hands, shields, the same-suit combo, the rival's readable policy and the win/loss checks.
// Actions return bit flags, so the caller can react without the world knowing about screens.
import { COMBO_BONUS, HAND_MAX, MANA_MAX, START_HP, WIN_BONUS } from './config.js';
import { buildDeck, cardText } from './deck.js';

export const EVENT_PLAYED = 1;
export const EVENT_OVER = 2;
export const EVENT_DRAW = 4;

/** The most cards the rival plays in one turn, so its turn never drags. */
const AI_PLAYS_PER_TURN = 5;

function drawCard(side) {
  if (side.hand.length >= HAND_MAX) return false;
  if (side.deck.length === 0) {
    if (side.discard.length === 0) return false;
    side.deck = side.discard;
    side.discard = [];
    // A reshuffled discard keeps its order; the next draws still vary by what was played.
  }
  side.hand.push(side.deck.pop());
  return true;
}

/** How good a card looks to `self` against `foe`, with `mana` to spend: the rival's policy. */
export function scoreCard(card, self, foe, mana, lastSuit) {
  if (card.cost > mana) return -Infinity;
  const combo = lastSuit !== null && card.suit === lastSuit ? COMBO_BONUS : 0;
  const value = card.value + combo;
  let score = 0;
  if (card.kind === 'strike') {
    if (value >= foe.hp + foe.shield) return 1000;
    score += value * 2;
    if (foe.hp - Math.max(0, value - foe.shield) <= 6) score += 5;
  } else if (card.kind === 'ward') {
    score += self.hp <= 15 ? value * 2 : value * 0.8;
  } else if (card.kind === 'mend') {
    const missing = START_HP - self.hp;
    score += missing <= 0 ? 0 : Math.min(value, missing) * 2;
  } else if (card.kind === 'hybrid') {
    if (value >= foe.hp + foe.shield) return 1000;
    score += value * 2 + (card.shield + combo) * (self.hp <= 15 ? 1.5 : 0.7);
  }
  if (card.draw && self.hand.length < 5) score += 1.5;
  return score;
}

/** The best card in `hand` by the policy above, or -1 when nothing is worth playing. */
export function chooseCard(hand, self, foe, mana, lastSuit) {
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < hand.length; i += 1) {
    const score = scoreCard(hand[i], self, foe, mana, lastSuit);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

export function createWorld(random) {
  const state = {
    phase: 'player',
    round: 1,
    mana: 1,
    maxMana: 1,
    selected: -1,
    winner: null,
    damageDealt: 0,
    damageTaken: 0,
    lastSuit: null,
    lastPlayed: null,
    log: [],
    player: null,
    rival: null,
    aiPlays: 0,
  };

  function freshSide() {
    return { hp: START_HP, shield: 0, hand: [], deck: buildDeck(random), discard: [] };
  }

  function say(line) {
    state.log.push(line);
    if (state.log.length > 4) state.log.shift();
  }

  function startPlayerRound() {
    state.maxMana = Math.min(state.round, MANA_MAX);
    state.mana = state.maxMana;
    state.lastSuit = null;
    state.selected = -1;
    state.phase = 'player';
    if (drawCard(state.player)) say(`Round ${state.round}: you draw a card.`);
    else say(`Round ${state.round}: your deck is empty.`);
  }

  function reset() {
    state.player = freshSide();
    state.rival = freshSide();
    state.round = 1;
    state.mana = 1;
    state.maxMana = 1;
    state.selected = -1;
    state.winner = null;
    state.damageDealt = 0;
    state.damageTaken = 0;
    state.lastSuit = null;
    state.lastPlayed = null;
    state.log = [];
    state.aiPlays = 0;
    state.phase = 'player';
    for (let n = 0; n < 3; n += 1) {
      drawCard(state.player);
      drawCard(state.rival);
    }
    say('Welcome to Ember Court. Play a card, then End Turn.');
  }

  /** Resolve one card for `side` against `foe`. Returns EVENT_PLAYED, plus EVENT_OVER on a win. */
  function playCard(side, foe, who, handIndex) {
    const card = side.hand[handIndex];
    if (!card || card.cost > (who === 'you' ? state.mana : side.mana)) return 0;
    const combo = state.lastSuit !== null && card.suit === state.lastSuit ? COMBO_BONUS : 0;
    const value = card.value + combo;
    if (who === 'you') state.mana -= card.cost;
    else side.mana -= card.cost;
    side.hand.splice(handIndex, 1);
    side.discard.push(card);
    state.lastSuit = card.suit;
    state.lastPlayed = { card, by: who, combo };
    state.selected = -1;
    let events = EVENT_PLAYED;
    const comboText = combo > 0 ? ` (combo +${combo})` : '';
    if (card.kind === 'strike' || card.kind === 'hybrid') {
      const absorbed = Math.min(foe.shield, value);
      foe.shield -= absorbed;
      const hurt = value - absorbed;
      foe.hp = Math.max(0, foe.hp - hurt);
      if (who === 'you') state.damageDealt += hurt;
      else state.damageTaken += hurt;
      say(`${who === 'you' ? 'You play' : 'Rival plays'} ${card.name}${comboText}: ${hurt} damage${absorbed > 0 ? ` (${absorbed} absorbed)` : ''}.`);
      if (card.kind === 'hybrid') {
        side.shield += card.shield + combo;
        say(`${who === 'you' ? 'You gain' : 'Rival gains'} ${card.shield + combo} shield.`);
      }
    } else if (card.kind === 'ward') {
      side.shield += value;
      say(`${who === 'you' ? 'You play' : 'Rival plays'} ${card.name}${comboText}: +${value} shield.`);
    } else if (card.kind === 'mend') {
      const healed = Math.min(value, START_HP - side.hp);
      side.hp += healed;
      say(`${who === 'you' ? 'You play' : 'Rival plays'} ${card.name}${comboText}: +${healed} health.`);
    }
    if (card.draw) {
      for (let n = 0; n < card.draw; n += 1) drawCard(side);
      say(`${who === 'you' ? 'You draw' : 'Rival draws'} ${card.draw} card${card.draw > 1 ? 's' : ''}.`);
    }
    if (foe.hp <= 0) {
      state.winner = who;
      state.phase = 'over';
      events |= EVENT_OVER;
      say(who === 'you' ? 'The Rival falls. Victory!' : 'Your health is gone. Defeat.');
    }
    return events;
  }

  /** Play the selected card (a strike hits the Rival; ward and mend help you). */
  function playSelected() {
    if (state.phase !== 'player' || state.selected < 0) return 0;
    return playCard(state.player, state.rival, 'you', state.selected);
  }

  function selectCard(index) {
    if (state.phase !== 'player') return;
    state.selected = state.selected === index ? -1 : index;
  }

  /** End your turn: the Rival draws, gains mana and plays, one card per aiAct() call. */
  function endTurn() {
    if (state.phase !== 'player') return;
    state.phase = 'ai';
    state.aiPlays = 0;
    state.selected = -1;
    state.rival.mana = state.maxMana;
    state.lastSuit = null;
    if (drawCard(state.rival)) say('Rival draws a card.');
    say('Rival takes its turn.');
  }

  /**
   * One Rival action: play its best card, or finish its turn ('done'). The caller paces the
   * calls so each card lands visibly; 'done' also starts the next round for the player.
   */
  function aiAct() {
    if (state.phase !== 'ai') return 'idle';
    if (state.aiPlays >= AI_PLAYS_PER_TURN) {
      state.round += 1;
      startPlayerRound();
      return 'done';
    }
    const index = chooseCard(state.rival.hand, state.rival, state.player, state.rival.mana, state.lastSuit);
    if (index < 0) {
      state.round += 1;
      startPlayerRound();
      return 'done';
    }
    state.aiPlays += 1;
    playCard(state.rival, state.player, 'rival', index);
    return state.phase === 'over' ? 'over' : 'played';
  }

  /** Your score: damage dealt, plus the win bonus once you have won. */
  function score() {
    return state.damageDealt + (state.winner === 'you' ? WIN_BONUS : 0);
  }

  reset();
  return { state, reset, selectCard, playSelected, playCard, endTurn, aiAct, score, cardText };
}
