// Boot and the one loop: input is read every frame, the Rival's turn is paced one card at a
// time so each play lands visibly, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the decks. ?shot=start|play|win|loss (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_END, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { endTurnRect, handCardRect, rivalPortrait } from './config.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

/** Milliseconds between the Rival's cards, so its turn reads one play at a time. */
const AI_PACE_MS = 750;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world.score(), -1, false, performance.now());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

/** Which hand card, if any, the pointer is over (-1 when none). */
function hoveredCard(state, pointer) {
  if (!pointer) return -1;
  for (let i = 0; i < state.player.hand.length; i += 1) {
    const rect = handCardRect(i, state.player.hand.length);
    const lifted = state.selected === i;
    const y = rect.y - (lifted ? 26 : 0);
    if (pointer.x >= rect.x && pointer.x < rect.x + rect.width && pointer.y >= y && pointer.y < y + rect.height) return i;
  }
  return -1;
}

function insideRect(pointer, rect) {
  return pointer && pointer.x >= rect.x && pointer.x < rect.x + rect.width && pointer.y >= rect.y && pointer.y < rect.y + rect.height;
}

function insideRival(pointer) {
  if (!pointer) return false;
  const p = rivalPortrait();
  return (pointer.x - p.x) ** 2 + (pointer.y - p.y) ** 2 <= p.r ** 2;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let lastAiAt = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    screen = SCREEN_PLAY;
    announce('Playing. Your turn: play a card, then End Turn.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    const score = world.score();
    if (score > best) {
      best = score;
      saveBest(best);
    }
    announce(world.state.winner === 'you' ? `Victory. Score ${score}.` : `Defeat. Score ${score}.`);
  }

  function handleClick(point) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const state = world.state;
    if (state.phase !== 'player') return;
    const cardIndex = hoveredCard(state, point);
    if (cardIndex >= 0) {
      if (state.selected === cardIndex) world.playSelected();
      else world.selectCard(cardIndex);
      return;
    }
    if (state.selected >= 0 && insideRival(point)) {
      const card = state.player.hand[state.selected];
      if (card && (card.kind === 'strike' || card.kind === 'hybrid')) world.playSelected();
      return;
    }
    if (insideRect(point, endTurnRect())) {
      world.endTurn();
      lastAiAt = performance.now();
    }
  }

  function handleActions(now) {
    const actions = input.takeActions();
    for (const index of input.takeSelects()) {
      if (screen === SCREEN_PLAY && world.state.phase === 'player' && index < world.state.player.hand.length) {
        world.selectCard(index);
      }
    }
    for (const point of input.takeClicks()) handleClick(point);
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PLAY && world.state.phase === 'player') {
        if (world.state.selected >= 0) world.playSelected();
        else {
          world.endTurn();
          lastAiAt = now;
        }
      }
    }
    if (actions & ACTION_END) {
      if (screen === SCREEN_PLAY && world.state.phase === 'player') {
        world.endTurn();
        lastAiAt = now;
      }
    }
    if (world.state.phase === 'over' && screen === SCREEN_PLAY) endGame();
  }

  function stepAi(now) {
    if (world.state.phase !== 'ai') return;
    if (now - lastAiAt < AI_PACE_MS) return;
    lastAiAt = now;
    const result = world.aiAct();
    if (result === 'over') endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    handleActions(now);
    stepAi(now);
    const state = world.state;
    if (state.phase === 'over' && screen === SCREEN_PLAY) endGame();
    const hover = screen === SCREEN_PLAY ? hoveredCard(state, input.pointer()) : -1;
    const hoverEnd = screen === SCREEN_PLAY && insideRect(input.pointer(), endTurnRect());
    renderer.draw(state, screen, best, world.score(), hover, hoverEnd, now);
  }

  // Leaving the tab pauses a running game rather than letting the Rival play unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Court. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
