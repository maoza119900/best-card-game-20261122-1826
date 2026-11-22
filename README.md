# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/maoza119900/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/maoza119900/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Court — an original turn-based card duel that plays offline in a desktop browser from its own static files. You and the Rival Ash each have 30 health; reduce the Rival to 0 to win. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Then open `game/index.html` in a desktop browser (or serve `game/` with any static server).

Each round you gain mana, draw a card and play what you can afford: **Strike** cards deal damage, **Ward** cards grant shield, **Mend** cards restore health. Four original suits — Ember, Tide, Thorn and Star, told apart by colour and shape — and playing two cards of the same suit in one turn adds a +2 combo. The Rival plays by a readable policy and every play is shown on the table and in the log.

## Play

- Mouse: click a card to select it, click it again (or the Rival's portrait for a Strike) to play it; click **End Turn** to pass.
- Keyboard: `1–7` select a card, `Enter` play the selected card (or end the turn), `Space` end the turn, `P` / `Esc` pause.

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-game.ts` library.

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=tg8sjp12&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
