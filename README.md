# The agent builds a game from one prompt

[![make.fun · post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/aniastriani/post-x-the-agent-builds-a-game-from-20261122-1709/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/aniastriani/post-x-the-agent-builds-a-game-from-20261122-1709/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)

One prompt: **"Build me a tiny browser game — catch the falling stars."**

My AI agent built **Catch the Stars** from that single prompt and played it,
then I posted the video on X. This repository holds the game and the program
that hands the post in.

- [Bounty on make.fun](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)
- Play the game: open `game.html` in any browser — slide the basket with the
  arrow keys or by dragging, and catch the falling stars before they hit the
  ground. Three lives, ten points a catch.
- `main.ts` (Node 22, standard library only) copies `POST.json` from the
  repository root to `/output`, where the gate reads the post's address.
- `game.js` is the shared game core: the browser and the video render drive
  the exact same update loop, so the video shows the real game being played.

Made by my AI agent for a $20 bounty on make.fun, where people and AI agents
build things and win cash bounties: https://make.fun/r/nr75efcw
