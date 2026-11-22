// Keyboard and pointer input. Number keys queue a hand selection, Enter confirms, Space ends
// the turn, P or Escape pauses; clicks queue logical table points and the pointer position is
// kept for hover, so the loop can hit-test cards, the Rival portrait and the End Turn button.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_END = 2;
export const ACTION_PAUSE = 4;

const CONFIRM = new Set(['Enter']);
const END = new Set(['Space']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(target) {
  let actions = 0;
  const selects = [];
  const clicks = [];
  let pointer = null;

  /** Client pixels to logical table coordinates, matching the renderer's letterbox. */
  function toLogical(clientX, clientY) {
    const rect = target.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const x = (clientX - rect.left - (rect.width - FIELD.width * scale) / 2) / scale;
    const y = (clientY - rect.top - (rect.height - FIELD.height * scale) / 2) / scale;
    return { x, y };
  }

  window.addEventListener('keydown', (event) => {
    if (event.code.startsWith('Digit')) {
      const n = Number(event.code.slice(5));
      if (n >= 1 && n <= 7 && !event.repeat) selects.push(n - 1);
      else return;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (END.has(event.code)) {
      if (!event.repeat) actions |= ACTION_END;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  target.addEventListener('pointerdown', (event) => {
    clicks.push(toLogical(event.clientX, event.clientY));
  });
  target.addEventListener('pointermove', (event) => {
    pointer = toLogical(event.clientX, event.clientY);
  });
  target.addEventListener('pointerleave', () => {
    pointer = null;
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Hand indices queued by the number keys since the last call. */
    takeSelects() {
      return selects.splice(0, selects.length);
    },
    /** Click points queued since the last call, in logical table coordinates. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** The pointer's logical position, or null when it is off the table. */
    pointer() {
      return pointer;
    },
  };
}
