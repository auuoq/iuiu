# Heart Miner Arcade (Đào Tim Cổ Điển) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, faithful HTML5 Canvas clone of classic *Gold Miner* ("Đào Vàng") with a romantic Heart theme, level goals, 60s timer, intermission shop (dynamite, power drink, clover), and a real Heart Wallet risk/reward system (-1 ❤️ to play, +1 ❤️ per level passed).

**Architecture:** Pure HTML5 Canvas physics engine running in React with requestAnimationFrame at 60 FPS, Web Audio API sound synthesis (zero external audio files), coupled with an Express backend minigame transaction API managing user heart deductions and rewards.

**Tech Stack:** React 18, HTML5 Canvas, Web Audio API, Lucide React, Express.js, SQLite3 / Better-SQLite3, Vitest.

**Spec:** [Heart Miner Spec](file:///c:/dat2/docs/superpowers/specs/2026-11-14-heart-miner-arcade-spec.md)

## Global Constraints
- Faithful gameplay: Hook swings -75° to +75°, Space/Down shoots, Up/W throws dynamite.
- Exact physics: Reeling speed depends inversely on item weight; Power Drink multiplies reel speed by 2.2x.
- Heart risk/reward: Deducts 1 ❤️ to enter; passing stage $N$ awards $N$ ❤️ (net profit $N - 1$ ❤️).
- Zero external audio dependencies: All sound effects synthesized with Web Audio API.
- Responsive controls: Both desktop keyboard and mobile touch buttons.

## Review Focus
1. Wallet insufficient balance (< 1 ❤️): API returns 400 error, UI blocks game entry with helpful prompt.
2. Hook boundary handling: Hook reaching edge of canvas without hitting anything reverses back smoothly.
3. Dynamite trigger safety: Throwing dynamite only consumes a bomb if an object is currently hooked.
4. Level progression state: Level timer resets to 60s; in-game cash carries over; goals scale up.
5. Heart reward validation: Server verifies non-negative levels completed and credits wallet accurately.

---

### Task 1: Backend Minigame API & Tests
**Files:**
- Create: `server/src/routes/minigameRoutes.js`
- Modify: `server/src/server.js:40-70`
- Modify: `client/src/api/client.js:150-180`
- Test: `server/tests/minigame.test.js`

- [ ] **Step 1.1: Write failing test in `server/tests/minigame.test.js`**
  - Test `/api/minigame/start`: rejects if balance < 1; deducts 1 ❤️ and returns new balance if balance >= 1.
  - Test `/api/minigame/complete`: awards `levelsCompleted` ❤️ to wallet balance and logs transaction.
- [ ] **Step 1.2: Run test to confirm it fails**
  - Command: `npm --prefix server test tests/minigame.test.js`
- [ ] **Step 1.3: Implement `server/src/routes/minigameRoutes.js` and mount in `server/src/server.js`**
  - Add routes `POST /api/minigame/start` and `POST /api/minigame/complete`.
  - Add client API helpers in `client/src/api/client.js`.
- [ ] **Step 1.4: Re-run test to verify passing**
  - Command: `npm --prefix server test tests/minigame.test.js`
- [ ] **Step 1.5: Commit Task 1**
  - Git commit: `feat(api): add minigame start and complete endpoints for heart wallet transactions`

---

### Task 2: Web Audio Synthesizer for Retro Game SFX
**Files:**
- Create: `client/src/utils/minerAudio.js`

- [ ] **Step 2.1: Implement audio synthesis utility**
  - `playShoot()`: Crisp whoosh sound using filtered white noise or swept pitch oscillator.
  - `playCatch()`: Cheerful high "ting" chime using sine wave (880Hz -> 1760Hz).
  - `playReelTick()`: Gentle rhythmic click/rattle for reeling.
  - `playExplosion()`: Low rumble frequency explosion with decay for dynamite.
  - `playLevelPass()`: Retro 4-note victory fanfare.
  - `playGameOver()`: Melancholy descend tone.
- [ ] **Step 2.2: Verify audio module syntax and clean exports**
  - Command: `npm --prefix client run build`
- [ ] **Step 2.3: Commit Task 2**
  - Git commit: `feat(audio): create Web Audio API sound synthesizer for heart miner`

---

### Task 3: Heart Miner Canvas Game Engine
**Files:**
- Create: `client/src/components/HeartMinerCanvas.jsx`

- [ ] **Step 3.1: Build Canvas Engine Component**
  - State variables: Hook position, angle $\theta$, state (`IDLE`, `SHOOTING`, `RETRACTING`), entities list, particles list.
  - Entity types:
    - Ruby Hearts: Small ($50), Medium ($100), Giant ($250), King ($500).
    - Love Diamond ($600).
    - Mystery Bag ($50 - $800, or items).
    - Teddy Bear running across screen with Heart.
    - Rocks (Small $11, Large $20).
  - Physics: Hook launch vector, AABB / circular collision detection, weight-based retraction speed formula.
  - Dynamite throwing: Instantly vaporizes caught entity and resets hook to empty retraction speed.
  - Touch & Keyboard input listeners (Space/Down to shoot, Up/W or button for dynamite).
- [ ] **Step 3.2: Verify Canvas render and build**
  - Command: `npm --prefix client run build`
- [ ] **Step 3.3: Commit Task 3**
  - Git commit: `feat(game): implement 60fps canvas engine for heart miner with collision physics`

---

### Task 4: Intermission Shop & Level Progression Modal
**Files:**
- Create: `client/src/components/HeartMinerModal.jsx`

- [ ] **Step 4.1: Build Modal Container & Game Loop UI**
  - Top HUD: Current Cash $, Target Goal $, Timer (60s countdown), Level, Total Hearts Earned, Dynamite inventory counter.
  - Game Over screen with summary of score, stages passed, and final ❤️ reward collected.
  - Intermission Shop screen:
    - Displayed when Level Cleared.
    - Sells 🧨 Dynamite ($150), 🥤 Power Drink ($200), 🍀 Lucky Clover ($100), 💎 Polish Book ($180).
    - "Tiếp Tục Màn Sau" button to start next level with purchased buffs.
- [ ] **Step 4.2: Connect Heart Wallet transaction on Start and Complete**
  - On open/start: Deduct 1 ❤️ via `api.startMinigame()`.
  - On game over or exit: Settle reward via `api.completeMinigame()` and update app wallet balance.
- [ ] **Step 4.3: Verify client build**
  - Command: `npm --prefix client run build`
- [ ] **Step 4.4: Commit Task 4**
  - Git commit: `feat(modal): create HeartMinerModal with intermission shop and level progression`

---

### Task 5: App Integration & Full Verification
**Files:**
- Modify: `client/src/App.jsx:130-170, 310-380`
- Run: `npm --prefix server test`
- Run: `npm --prefix client run build`

- [ ] **Step 5.1: Add `🎮 Đào Tim Cổ Điển` launch button in Header**
  - Place next to Music Player in `client/src/App.jsx`.
  - Wire modal trigger `showHeartMinerModal` with wallet balance syncing.
- [ ] **Step 5.2: Execute full verification test suite**
  - Run `npm --prefix server test`
  - Run `npm --prefix client run build`
- [ ] **Step 5.3: Commit Task 5**
  - Git commit: `feat(app): integrate Heart Miner arcade into main navigation and verify end-to-end`
