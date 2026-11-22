// Drawing only: the world's state and the current screen in, pixels out. The 1280x720 table
// is scaled to fit the window and centred, the margin filled with the backdrop colour. Flat
// shapes and canvas text for the table, the cards and the panels.
import {
  BACK, CARD, FIELD, FONT, MANA_MAX, PALETTE, START_HP, SUITS, backCardRect, endTurnRect, handCardRect,
  handTop, playerPortrait, rivalPortrait, stageRect,
} from './config.js';
import { cardText } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 150, line: 34, bottom: 76 };

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${weight ?? ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ?? ''} ${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  /** One suit's glyph, drawn in `color`, centred at (cx, cy) with radius `r`. */
  function glyph(suit, cx, cy, r, color) {
    context.fillStyle = color;
    context.strokeStyle = color;
    if (suit === 'flame') {
      context.beginPath();
      context.moveTo(cx, cy - r);
      context.bezierCurveTo(cx + r * 0.9, cy - r * 0.2, cx + r * 0.7, cy + r * 0.7, cx, cy + r * 0.8);
      context.bezierCurveTo(cx - r * 0.7, cy + r * 0.7, cx - r * 0.9, cy - r * 0.2, cx, cy - r);
      context.fill();
      context.fillStyle = '#ffd97a';
      context.beginPath();
      context.moveTo(cx, cy - r * 0.2);
      context.bezierCurveTo(cx + r * 0.45, cy + r * 0.3, cx + r * 0.3, cy + r * 0.65, cx, cy + r * 0.7);
      context.bezierCurveTo(cx - r * 0.3, cy + r * 0.65, cx - r * 0.45, cy + r * 0.3, cx, cy - r * 0.2);
      context.fill();
    } else if (suit === 'wave') {
      context.lineWidth = Math.max(2, r * 0.22);
      context.lineCap = 'round';
      for (let row = -1; row <= 1; row += 1) {
        context.beginPath();
        context.moveTo(cx - r, cy + row * r * 0.55);
        context.quadraticCurveTo(cx - r * 0.5, cy + row * r * 0.55 - r * 0.5, cx, cy + row * r * 0.55);
        context.quadraticCurveTo(cx + r * 0.5, cy + row * r * 0.55 + r * 0.5, cx + r, cy + row * r * 0.55);
        context.stroke();
      }
    } else if (suit === 'leaf') {
      context.beginPath();
      context.moveTo(cx, cy - r);
      context.quadraticCurveTo(cx + r, cy - r * 0.4, cx + r * 0.55, cy + r * 0.6);
      context.quadraticCurveTo(cx, cy + r, cx - r * 0.55, cy + r * 0.6);
      context.quadraticCurveTo(cx - r, cy - r * 0.4, cx, cy - r);
      context.fill();
      context.strokeStyle = '#d8f3c8';
      context.lineWidth = Math.max(1.5, r * 0.12);
      context.beginPath();
      context.moveTo(cx, cy - r * 0.7);
      context.lineTo(cx, cy + r * 0.7);
      context.stroke();
    } else {
      // star: five points, outer radius r, inner radius r * 0.45.
      context.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle) * rad;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.fill();
    }
  }

  function drawCardFace(card, rect, lifted) {
    const suit = SUITS[card.suit];
    const x = rect.x;
    const y = rect.y - (lifted ? CARD.lift : 0);
    roundRect(context, x, y, rect.width, rect.height, 10);
    context.fillStyle = PALETTE.cardFace;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = suit.color;
    context.stroke();
    // Suit band across the top.
    context.fillStyle = suit.color;
    context.fillRect(x + 2, y + 2, rect.width - 4, 8);
    // Cost: a filled circle, top left.
    context.beginPath();
    context.arc(x + 20, y + 30, 14, 0, Math.PI * 2);
    context.fillStyle = '#2b3a55';
    context.fill();
    context.fillStyle = '#ffffff';
    text(String(card.cost), x + 20, y + 36, 20, '#ffffff', 'center', 'bold');
    // Suit glyph, top right.
    glyph(suit.glyph, x + rect.width - 22, y + 30, 13, suit.color);
    // The big value in the middle.
    text(String(card.value + (card.comboBonus || 0)), x + rect.width / 2, y + 92, 46, PALETTE.cardInk, 'center', 'bold');
    // Kind and suit under the value.
    text(cardText(card), x + rect.width / 2, y + 118, 15, suit.dark, 'center');
    text(SUITS[card.suit].name, x + rect.width / 2, y + 136, 12, PALETTE.muted, 'center');
    // Name along the bottom.
    text(card.name, x + rect.width / 2, y + rect.height - 10, 14, PALETTE.cardInk, 'center', 'bold');
  }

  function drawCardBack(rect) {
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 8);
    context.fillStyle = PALETTE.cardBack;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = PALETTE.cardBackEdge;
    context.stroke();
    roundRect(context, rect.x + 7, rect.y + 7, rect.width - 14, rect.height - 14, 5);
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 1.5;
    context.stroke();
    glyph('flame', rect.x + rect.width / 2, rect.y + rect.height / 2, 16, PALETTE.gold);
  }

  function drawHpBar(x, y, width, hp, shield, label) {
    text(label, x, y - 8, 15, PALETTE.muted, 'left', 'bold');
    context.fillStyle = PALETTE.hpBack;
    roundRect(context, x, y, width, 20, 6);
    context.fill();
    const fill = Math.max(0, (hp / START_HP) * width);
    if (fill > 0) {
      context.fillStyle = PALETTE.hp;
      roundRect(context, x, y, fill, 20, 6);
      context.fill();
    }
    text(`${hp} / ${START_HP}`, x + width + 10, y + 16, 17, PALETTE.text, 'left', 'bold');
    if (shield > 0) {
      context.fillStyle = PALETTE.shield;
      context.beginPath();
      context.arc(x + width + 96, y + 10, 12, 0, Math.PI * 2);
      context.fill();
      text(`+${shield}`, x + width + 96, y + 16, 15, '#12303f', 'center', 'bold');
    }
  }

  function drawPortrait(circle, label, color) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = PALETTE.gold;
    context.stroke();
    text(label.slice(0, 1), circle.x, circle.y + 16, 40, '#ffffff', 'center', 'bold');
    text(label, circle.x, circle.y + circle.r + 22, 15, PALETTE.text, 'center', 'bold');
  }

  function drawMana(mana, maxMana) {
    const size = 15;
    const gap = 8;
    const total = MANA_MAX * (size * 2 + gap) - gap;
    let x = (FIELD.width - total) / 2;
    const y = handTop() - 34;
    text('Mana', x - 58, y + 12, 16, PALETTE.muted, 'left', 'bold');
    for (let i = 0; i < MANA_MAX; i += 1) {
      context.beginPath();
      context.arc(x + size, y, size, 0, Math.PI * 2);
      if (i < maxMana) {
        context.fillStyle = i < mana ? PALETTE.mana : PALETTE.manaBack;
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = i < mana ? '#bfe6ff' : PALETTE.manaBack;
        context.stroke();
      } else {
        context.strokeStyle = '#334155';
        context.lineWidth = 1.5;
        context.stroke();
      }
      x += size * 2 + gap;
    }
    text(`${mana} / ${maxMana}`, x + 12, y + 6, 16, PALETTE.text, 'left', 'bold');
  }

  function drawTable(state) {
    // Felt with a gold rail.
    context.fillStyle = PALETTE.feltDark;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.felt;
    roundRect(context, 24, 24, FIELD.width - 48, FIELD.height - 48, 28);
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = PALETTE.goldDark;
    context.stroke();
    context.strokeStyle = PALETTE.feltLine;
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(FIELD.width / 2, FIELD.height / 2, 430, 210, 0, 0, Math.PI * 2);
    context.stroke();
  }

  function drawRival(state) {
    const rival = state.rival;
    for (let i = 0; i < rival.hand.length; i += 1) drawCardBack(backCardRect(i, rival.hand.length));
    drawPortrait(rivalPortrait(), 'Ash', '#5b3a8c');
    drawHpBar(168, 132, 250, rival.hp, rival.shield, 'RIVAL · ASH');
    text(`Deck ${rival.deck.length}   Discard ${rival.discard.length}`, 168, 172, 14, PALETTE.muted, 'left');
  }

  function drawPlayer(state, hover, selected) {
    const player = state.player;
    for (let i = 0; i < player.hand.length; i += 1) {
      const rect = handCardRect(i, player.hand.length);
      const card = player.hand[i];
      const isSelected = selected === i;
      const isHover = hover === i;
      const affordable = card.cost <= state.mana;
      const lifted = isSelected || isHover;
      drawCardFace({ ...card, comboBonus: 0 }, rect, lifted);
      if (!affordable) {
        context.fillStyle = 'rgba(16, 19, 26, 0.45)';
        roundRect(context, rect.x, rect.y - (lifted ? CARD.lift : 0), rect.width, rect.height, 10);
        context.fill();
      }
      if (isSelected) {
        context.lineWidth = 4;
        context.strokeStyle = PALETTE.gold;
        roundRect(context, rect.x - 2, rect.y - CARD.lift - 2, rect.width + 4, rect.height + 4, 12);
        context.stroke();
      } else if (isHover) {
        context.lineWidth = 2;
        context.strokeStyle = '#ffffff';
        roundRect(context, rect.x - 1, rect.y - CARD.lift - 1, rect.width + 2, rect.height + 2, 11);
        context.stroke();
      }
    }
    drawPortrait(playerPortrait(), 'You', '#2a7a4b');
    drawHpBar(156, 452, 250, player.hp, player.shield, 'YOU');
    text(`Deck ${player.deck.length}   Discard ${player.discard.length}`, 156, 492, 14, PALETTE.muted, 'left');
    drawMana(state.mana, state.maxMana);
  }

  function drawCentre(state, screen) {
    // The last played card, face up in the middle of the table.
    if (state.lastPlayed) {
      const rect = stageRect();
      const who = state.lastPlayed.by === 'you' ? 'You played' : 'Rival played';
      text(who, rect.x + rect.width / 2, rect.y - 12, 14, PALETTE.muted, 'center', 'bold');
      const bonus = state.lastPlayed.combo > 0 ? state.lastPlayed.combo : 0;
      drawCardFace({ ...state.lastPlayed.card, comboBonus: bonus }, rect, false);
      if (state.lastPlayed.combo > 0) {
        text(`COMBO +${state.lastPlayed.combo}`, rect.x + rect.width / 2, rect.y + rect.height + 22, 15, PALETTE.gold, 'center', 'bold');
      }
    }
    // The log, bottom left of the centre.
    const lines = state.log;
    context.fillStyle = PALETTE.logBack;
    roundRect(context, 40, 268, 470, 26 + lines.length * 22, 10);
    context.fill();
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], 56, 292 + i * 22, 14, PALETTE.text, 'left');
    }
    // Round and score, top centre.
    text(`ROUND ${state.round}`, FIELD.width / 2, 52, 20, PALETTE.text, 'center', 'bold');
  }

  function drawEndTurn(state, hoverEnd) {
    const rect = endTurnRect();
    const enabled = state.phase === 'player';
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 12);
    context.fillStyle = !enabled ? '#3a4356' : hoverEnd ? PALETTE.endTurnHover : PALETTE.endTurn;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = PALETTE.gold;
    context.stroke();
    text(state.phase === 'ai' ? 'Rival…' : 'End Turn', rect.x + rect.width / 2, rect.y + 37, 22, '#ffffff', 'center', 'bold');
  }

  function drawHudTop(state, score) {
    text(`SCORE ${score}`, FIELD.width - 40, 52, 20, PALETTE.gold, 'right', 'bold');
  }

  function drawPanel(title, lines, prompt, titleColor) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(10, 12, 18, 0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(context, x, y, PANEL.width, height, 16);
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = PALETTE.panelEdge;
    context.stroke();
    text(title, FIELD.width / 2, y + 82, 52, titleColor ?? PALETTE.text, 'center', 'bold');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.gold, 'center');
  }

  /** Ember motes drifting over the title screen, placed by a fixed seed and the clock. */
  function drawEmbers(now) {
    for (let i = 0; i < 42; i += 1) {
      const seed = i * 137.5;
      const x = (seed * 7.3) % FIELD.width;
      const speed = 12 + (i % 5) * 6;
      const y = FIELD.height - (((now / 1000) * speed + seed) % (FIELD.height + 40)) + 20;
      const r = 1.5 + (i % 3);
      context.fillStyle = i % 3 === 0 ? 'rgba(242, 201, 76, 0.7)' : 'rgba(229, 83, 75, 0.55)';
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }
  }

  const TITLE_LINES = [
    'A duel of cinder cards. Reduce the Rival to 0 health.',
    'Each round: gain mana, draw a card, play what you can afford.',
    'Same suit twice in a turn: +2 combo.  1-7 select, Enter play, Space end turn.',
    '',
  ];

  function draw(state, screen, best, score, hover, hoverEnd, now) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawTable(state);
    if (screen === SCREEN_TITLE) {
      drawEmbers(now);
      TITLE_LINES[3] = `Best score: ${best}`;
      drawPanel('EMBER COURT', TITLE_LINES, 'Press Enter or click to begin', PALETTE.gold);
      return;
    }
    drawRival(state);
    drawCentre(state, screen);
    drawPlayer(state, hover, state.selected);
    drawEndTurn(state, hoverEnd);
    drawHudTop(state, score);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The Rival waits for you.'], 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      if (state.winner === 'you') {
        drawPanel('VICTORY!', [`Score ${score}  ·  Best ${Math.max(best, score)}`, `Damage dealt ${state.damageDealt}  ·  Rounds ${state.round}`, 'The Rival falls. The court is yours.'], 'Press Enter or click to play again', PALETTE.gold);
      } else {
        drawPanel('DEFEAT', [`Score ${score}  ·  Best ${best}`, `Damage dealt ${state.damageDealt}  ·  Rounds ${state.round}`, 'Ash takes the court this time.'], 'Press Enter or click to try again', PALETTE.danger);
      }
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
