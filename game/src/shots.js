// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the real rules
// forward from a fresh world with the seeded deck: the player's turns use the same policy
// the Rival uses, so the frame is what a short game really looks like and the same seed
// always gives the same frame. A scene that has not ended by its round limit is finished
// by the rules too: a lethal card is put in the winner's hand and played for real.
import { chooseCard } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const PLAY_ROUNDS = 5;
const END_ROUNDS = 14;

/** Play one full player turn with the policy, then run the Rival's turn to its end. */
function playRound(world) {
  const state = world.state;
  let guard = 0;
  while (state.phase === 'player' && guard < 12) {
    guard += 1;
    const index = chooseCard(state.player.hand, state.player, state.rival, state.mana, state.lastSuit);
    if (index < 0) break;
    world.playCard(state.player, state.rival, 'you', index);
    if (state.phase === 'over') return;
  }
  if (state.phase !== 'player') return;
  world.endTurn();
  while (state.phase === 'ai') {
    const result = world.aiAct();
    if (result === 'done' || result === 'over' || result === 'idle') break;
  }
}

/** Run rounds until the game ends or `limit` rounds pass; returns whether it ended. */
function runRounds(world, limit) {
  for (let round = 0; round < limit; round += 1) {
    playRound(world);
    if (world.state.phase === 'over') return true;
  }
  return world.state.phase === 'over';
}

/** Put a strike card of at least `damage` into `side`'s hand, with the mana to play it. */
function armLethal(world, side, foe, damage) {
  const state = world.state;
  let index = side.hand.findIndex((c) => (c.kind === 'strike' || c.kind === 'hybrid') && c.value >= damage);
  if (index < 0) {
    const fromDeck = side.deck.findIndex((c) => (c.kind === 'strike' || c.kind === 'hybrid') && c.value >= damage);
    if (fromDeck < 0) return -1;
    const [card] = side.deck.splice(fromDeck, 1);
    side.hand.push(card);
    index = side.hand.length - 1;
  }
  if (side === state.player) state.mana = Math.max(state.mana, side.hand[index].cost);
  else side.mana = Math.max(side.mana, side.hand[index].cost);
  return index;
}

/**
 * Set `world` to the named scene (start, play, win or loss; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    for (let rounds = PLAY_ROUNDS; rounds >= 1; rounds -= 1) {
      world.reset();
      runRounds(world, rounds);
      if (state.phase === 'player' && state.player.hand.length > 0) {
        // A fuller hand reads better: top it up from the deck, for real, to five cards.
        while (state.player.hand.length < 5 && state.player.deck.length > 0) {
          state.player.hand.push(state.player.deck.pop());
        }
        return { screen: SCREEN_PLAY, best: world.score() };
      }
    }
    world.reset();
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win' || name === 'loss') {
    world.reset();
    if (name === 'win') {
      runRounds(world, END_ROUNDS);
      if (state.phase !== 'over') {
        state.rival.hp = 2;
        state.rival.shield = 0;
        state.phase = 'player';
        const index = armLethal(world, state.player, state.rival, 2);
        if (index >= 0) world.playCard(state.player, state.rival, 'you', index);
      }
      if (state.winner !== 'you') {
        // The scripted game went the other way: stage the win directly from a fresh deal.
        world.reset();
        state.rival.hp = 2;
        state.rival.shield = 0;
        const index = armLethal(world, state.player, state.rival, 2);
        if (index >= 0) world.playCard(state.player, state.rival, 'you', index);
      }
    } else {
      // The player sits out; the Rival's policy does the damage.
      for (let round = 0; round < END_ROUNDS && state.phase !== 'over'; round += 1) {
        if (state.phase === 'player') world.endTurn();
        while (state.phase === 'ai') {
          const result = world.aiAct();
          if (result === 'done' || result === 'over' || result === 'idle') break;
        }
      }
      if (state.phase !== 'over') {
        state.player.hp = 2;
        state.player.shield = 0;
        state.phase = 'ai';
        state.rival.mana = 10;
        const index = armLethal(world, state.rival, state.player, 2);
        if (index >= 0) world.playCard(state.rival, state.player, 'rival', index);
      }
      if (state.winner !== 'rival') {
        world.reset();
        state.player.hp = 2;
        state.player.shield = 0;
        state.phase = 'ai';
        state.rival.mana = 10;
        const index = armLethal(world, state.rival, state.player, 2);
        if (index >= 0) world.playCard(state.rival, state.player, 'rival', index);
      }
    }
    return { screen: SCREEN_OVER, best: world.score() };
  }
  world.reset();
  return { screen: SCREEN_TITLE, best: 0 };
}
