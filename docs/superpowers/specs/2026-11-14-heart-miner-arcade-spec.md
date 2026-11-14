# Heart Miner Arcade (Đào Tim Cổ Điển) - Specification

## 1. Overview & Goals
**Heart Miner Arcade** is a faithful, retro HTML5 Canvas clone of the legendary classic game *Gold Miner* ("Đào Vàng"), customized for LoveCapsule with a romantic pastel theme and direct integration into the couple's Heart Wallet (`wallet_balance`).

### Key Objectives:
1. **Faithful Classic Gameplay**: Replicate the exact mechanics of Gold Miner: pendulum hook swinging, directional shooting, weight-based reeling speeds, level goals with 60s countdown, dynamite throwing, and an intermission shop between levels.
2. **Love-Themed Custom Assets**: Gold nuggets are transformed into Ruby Hearts, Crystals, and Love Notes; classic boulders/rocks remain as heavy obstacles; cute teddy bears carry gems across the screen.
3. **Heart Economy Risk & Reward**:
   - Entry fee: **-1 ❤️** deducted from user's wallet when starting a game.
   - Stage reward: **+1 ❤️** awarded for every stage passed (e.g. Pass 1 stage = 1 ❤️ [break even], Pass 3 stages = 3 ❤️ [net profit +2 ❤️]).
   - Earnings are credited to the user's real wallet balance upon game completion.
4. **Standalone & Responsive**: Runs at 60 FPS on HTML5 Canvas inside a React modal or full view, supporting keyboard (Desktop: Arrow Down/Space to shoot, Arrow Up/W to throw dynamite) and touch/pointer controls (Mobile: tap to shoot, on-screen dynamite button).
5. **Zero External Audio Dependencies**: Sound effects (win, reel, shoot, ding, boom) are synthesized using the native Web Audio API for instantaneous playback and zero network latency.

---

## 2. Gameplay Mechanics & Physics

### 2.1 Hook & Crane (Pendulum Motion)
- **Origin**: Center-top of the mine canvas $(x_0, y_0) = (W / 2, 60)$.
- **Pendulum Swing**:
  - Angle $\theta(t)$ oscillates between $-75^\circ$ and $+75^\circ$ ($-1.3$ to $+1.3$ radians) at an angular speed of $\approx 1.8 \text{ rad/s}$.
  - State: `IDLE` (swinging).
- **Shooting**:
  - Triggered by: Keyboard `ArrowDown`, `Space`, or screen tap.
  - State: `SHOOTING`.
  - Velocity vector: $\vec{v} = (v_{\text{shoot}} \cdot \sin\theta, v_{\text{shoot}} \cdot \cos\theta)$, where $v_{\text{shoot}} \approx 9 \text{ px/frame}$.
  - Extends rope length $L$ until it either collides with an object or reaches the boundaries of the canvas.
  - If it hits a boundary with nothing caught: state shifts to `RETRACTING` with default empty reel speed ($12 \text{ px/frame}$).
- **Grabbing & Reeling**:
  - Circular collision detection between hook tip $(x_{\text{hook}}, y_{\text{hook}})$ and entity circle $(x_i, y_i, r_i)$.
  - On collision, entity attaches to hook tip; state shifts to `RETRACTING`.
  - **Reel Speed Formula**:
    $$v_{\text{reel}} = \frac{v_{\text{base}}}{\max(1, \text{mass})} \times (\text{hasPowerDrink} ? 2.2 : 1.0)$$
    Where $v_{\text{base}} \approx 10$, and mass varies from $0.8$ (Diamond) to $9.0$ (Large Rock).
- **Dynamite Action**:
  - Triggered by: Keyboard `ArrowUp`, `KeyW`, or clicking the 🧨 button.
  - Can only be thrown while in `RETRACTING` state and holding an entity.
  - Explodes the hooked entity, plays explosion audio/particles, decrements player dynamite count by 1, and restores hook speed to empty reel speed ($12 \text{ px/frame}$).

---

## 3. Underground Objects Catalog

| Entity Type | Visual | Value ($) | Mass (Weight) | Radius | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Small Ruby Heart** | ❤️ Small Pink/Red Heart | $50 | 1.2 (Fast) | 16px | Easy pickup, quick cash |
| **Medium Ruby Heart** | 💖 Sparkling Heart | $100 | 2.5 (Medium) | 24px | Good balance |
| **Giant Royal Heart** | 💝 Giant Golden-Border Heart | $250 | 5.0 (Heavy) | 36px | High value |
| **Heart of the Ocean** | 👑 Colossal Majestic Heart | $500 | 7.5 (Very Heavy) | 48px | Huge payday |
| **Pink Love Diamond** | 💎 Brilliant Cut Pink Diamond | $600 (or $780 w/ Polish) | 0.8 (Super Fast) | 14px | Most desirable item |
| **Small Stone** | 🪨 Small Grey Rock | $11 | 4.5 (Slow) | 18px | Nuisance |
| **Large Boulder** | 🪨 Massive Heavy Boulder | $20 | 9.0 (Extremely Slow) | 34px | Prime target for dynamite |
| **Mystery Love Bag** | 🎁 Gift Bag with `?` | Random | Random ($0.8 - 6.0$) | 22px | $50 - $800, or free Dynamite, or Power Drink |
| **Little Bear with Gem** | 🧸 Walking Bear holding Heart | $200 | 2.0 (Fast) | 22px | Walks horizontally at $1.5 \text{ px/frame}$ |

---

## 4. Levels & Progression

Each level runs for **60 seconds**.
- **Level 1**: Goal **$650**. Ample hearts, few small rocks.
- **Level 2**: Goal **$1,500**. Introduces diamonds and a couple of large rocks.
- **Level 3**: Goal **$2,800**. Introduces wandering bears and mystery bags.
- **Level 4**: Goal **$4,200**. Mixed hazards, high-value prizes shielded by rocks.
- **Level 5+**: Goal formula: $\text{Previous Goal} + 1,600$. Procedurally placed hearts and obstacles.

If current cash $\ge$ Goal when timer reaches 0 $\rightarrow$ **Level Cleared** $\rightarrow$ Navigate to **Intermission Shop**.
If current cash $<$ Goal when timer reaches 0 $\rightarrow$ **Game Over** $\rightarrow$ Show Summary & claim earned Hearts.

---

## 5. Intermission Shop (Cửa Hàng Giữa Màn)

Between levels, player visits the Shopkeeper to spend in-game Cash ($) on consumable boosters:
1. 🧨 **Thuốc Nổ (Dynamite)**: Cost **$150**. Maximum capacity: 3.
2. 🥤 **Nước Tăng Lực Tình Yêu (Power Drink)**: Cost **$200**. Increases reeling speed by 2.2x for the next level.
3. 🍀 **Cỏ 4 Lá May Mắn (Lucky Clover)**: Cost **$100**. Mystery bags are guaranteed to yield $400 - $800 or items.
4. 💎 **Sách Đánh Bóng Pha Lê (Heart Polish Book)**: Cost **$180**. Increases Diamond/Crystal value by +30% in the next level.

---

## 6. Heart Economy (Ví Tim) Backend Integration

### 6.1 Database Schema
No schema migration required; `users.wallet_balance` and `transactions` tables already exist and support heart ledgering.

### 6.2 REST Endpoints in `server/src/routes/minigameRoutes.js`:
1. `POST /api/minigame/start`:
   - Checks `user.wallet_balance >= 1`.
   - Deducts 1 ❤️: creates transaction type `heart_spend`, note `🎮 Tham gia Đào Tim Cổ Điển`.
   - Returns `{ ok: true, sessionId: string, newBalance: number }`.
2. `POST /api/minigame/complete`:
   - Payload: `{ sessionId: string, levelsCompleted: number }`.
   - Validates that `levelsCompleted >= 0`.
   - If `levelsCompleted > 0`:
     - Adds `levelsCompleted` ❤️ to `wallet_balance`.
     - Creates transaction type `heart_reward`, note `🏆 Thưởng vượt ${levelsCompleted} màn Đào Tim Cổ Điển`.
   - Returns `{ ok: true, heartsAwarded: number, newBalance: number }`.

---

## 7. Frontend Component Architecture
- `client/src/components/HeartMinerModal.jsx`: Main modal container with Header controls, Score/Goal/Timer HUD, Canvas viewport, and Shop overlay.
- `client/src/utils/minerAudio.js`: Pure Web Audio API sound generator for reel, ting, boom, win, lose.
- Integrated into `client/src/App.jsx` via a dedicated `🎮 Đào Tim` button in the header nav and on-page launcher.

---

## 8. Verification & Acceptance Criteria
- Starting a game deducts 1 Heart and launches Level 1.
- Hook swings accurately; fires upon Space/Down Arrow/tap.
- Pull speed realistically scales with weight; dynamite blows up held object.
- Reaching target score opens the Intermission Shop; purchased items work in Level 2.
- Ending game grants 1 Heart per completed level into the user's wallet.
- All server tests pass, client builds cleanly.
