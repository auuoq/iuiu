# LoveCapsule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng ứng dụng web cặp đôi LoveCapsule cho 2 người: Hòm thư cảm xúc "Open When...", mở khóa bằng câu đố hoặc Trái Tim (❤️), hẹn giờ mở thư, tích lũy tim, bảng ảnh kỷ niệm Polaroid, sticker tùy chỉnh và sự kiện tự động theo các ngày đặc biệt.

**Architecture:** Kiến trúc Client-Server hoàn chỉnh. Backend dùng Node.js + Express + SQLite (`better-sqlite3`) lưu trữ cục bộ bảo mật, kèm WebSocket server cho tương tác thời gian thực (bắn tim, thông báo thư). Frontend dùng React (Vite) với hệ thống Design System mang phong cách *Cozy Scrapbook & Healing Room* (giấy kraft, ảnh polaroid, con dấu sáp đỏ wax seal, nhạc lofi).

**Tech Stack:** React 18, Vite, Node.js, Express, SQLite (`better-sqlite3`), `ws`, `bcryptjs`, `jsonwebtoken`, `canvas-confetti`.

**Spec:** [`docs/superpowers/specs/2026-10-20-love-letter-couple-app-design.md`](file:///c:/dat2/docs/superpowers/specs/2026-10-20-love-letter-couple-app-design.md)

## Global Constraints

- Backend chạy trên Node.js v24+, cổng mặc định 4000.
- Frontend chạy trên Vite React, cổng mặc định 5173.
- Cơ sở dữ liệu SQLite lưu tại `server/data/lovecapsule.db`.
- Không sử dụng icon AI clipart sến súa; sử dụng icon SVG tối giản (stroke clean) kết hợp ảnh chụp thật và khay sticker do người dùng tự tải lên.
- Xác thực 1-1 chặt chẽ: một người chỉ thuộc về 1 `couple_id`.
- Kiểm tra thời gian hẹn giờ thư (`time_lock_at`) tuyệt đối trên máy chủ theo giờ UTC, chống gian lận đổi giờ thiết bị.

## Review Focus

- Người dùng nhập đáp án câu đố có khoảng trắng thừa, viết hoa, hoặc gõ tiếng Việt có/không dấu -> Hệ thống chuẩn hóa thông minh để chấp nhận đáp án đúng ý.
- Người nhận mở thư khi số dư Trái Tim không đủ -> Hệ thống từ chối mở và hướng dẫn các cách kiếm tim.
- Thư có hẹn giờ trong tương lai (`time_lock_at`) -> Người nhận không thể mở được dù có đủ tim hay giải đố đúng.
- Khi người thứ hai nhập mã ghép đôi không tồn tại hoặc đã ghép với người khác -> Báo lỗi thân thiện.
- Sau khi thư được mở thành công lần đầu -> Các lần đọc lại tiếp theo hoàn toàn miễn phí và không cần giải đố lại.

---

### Task 1: Scaffolding Dự Án & Database Schema SQLite

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `server/src/db.js`
- Test: `server/tests/db.test.js`

**Interfaces:**
- Produces: `getDb(): Database` kết nối và tự động khởi tạo các bảng: `users`, `couples`, `heart_wallets`, `heart_transactions`, `letters`, `letter_quizzes`, `milestones`.

- [ ] **Step 1: Viết test khởi tạo Database schema**

```javascript
// server/tests/db.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../src/db.js';

describe('Database Schema', () => {
  it('should initialize all required tables without error', () => {
    const db = initDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    expect(tables).toContain('users');
    expect(tables).toContain('couples');
    expect(tables).toContain('heart_wallets');
    expect(tables).toContain('heart_transactions');
    expect(tables).toContain('letters');
    expect(tables).toContain('letter_quizzes');
    expect(tables).toContain('milestones');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm test` trong thư mục `server`
Expected: FAIL (module chưa tồn tại)

- [ ] **Step 3: Cài đặt dependencies và tạo schema SQLite trong `server/src/db.js`**

Cài đặt `better-sqlite3`, `dotenv` và viết DDL tạo toàn bộ 7 bảng theo đúng đặc tả spec.

- [ ] **Step 4: Chạy test để xác nhận test vượt qua**

Run: `npm test` trong thư mục `server`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "feat(server): initialize SQLite database schema and connection"
```

---

### Task 2: Xác Thực Tài Khoản & Cơ Chế Ghép Đôi 1-1

**Files:**
- Create: `server/src/services/authService.js`
- Create: `server/src/routes/authRoutes.js`
- Test: `server/tests/auth.test.js`

**Interfaces:**
- Produces: 
  - `registerUser({ username, password, display_name, gender, pronoun }): { user, token }`
  - `loginUser({ username, password }): { user, token }`
  - `createCouple(userId, anniversaryDate): { couple, couple_code }`
  - `joinCouple(userId, coupleCode): { couple }`

- [ ] **Step 1: Viết test cho Đăng ký, Đăng nhập và Ghép đôi 1-1**

```javascript
// server/tests/auth.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { registerUser, createCouple, joinCouple } from '../src/services/authService.js';

describe('Auth & Pairing Service', () => {
  beforeEach(() => { initDb(':memory:'); });

  it('allows user1 to create couple code and user2 to pair', () => {
    const u1 = registerUser({ username: 'huy', password: '123', display_name: 'Huy', gender: 'male', pronoun: 'Anh' });
    const u2 = registerUser({ username: 'lan', password: '123', display_name: 'Lan', gender: 'female', pronoun: 'Em' });
    
    const { couple_code } = createCouple(u1.user.id, '2025-10-25');
    expect(couple_code).toMatch(/^LOVE-[A-Z0-9]{4}$/);

    const paired = joinCouple(u2.user.id, couple_code);
    expect(paired.user1_id).toBe(u1.user.id);
    expect(paired.user2_id).toBe(u2.user.id);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npx vitest run server/tests/auth.test.js`
Expected: FAIL

- [ ] **Step 3: Triển khai `authService.js` với `bcryptjs`, JWT và logic kiểm tra 1-1**

Khóa vĩnh viễn không cho phép user đã ghép đôi tham gia mã khác. Tặng 20 ❤️ khởi tạo trong ví `heart_wallets`.

- [ ] **Step 4: Chạy test để xác nhận test vượt qua**

Run: `npx vitest run server/tests/auth.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/authService.js server/tests/auth.test.js
git commit -m "feat(auth): implement user registration, login, and 1-1 couple pairing"
```

---

### Task 3: Kinh Tế Trái Tim (❤️) & Tưới Cây Tình Yêu

**Files:**
- Create: `server/src/services/heartService.js`
- Create: `server/src/routes/heartRoutes.js`
- Test: `server/tests/heart.test.js`

**Interfaces:**
- Produces:
  - `dailyCheckIn(userId): { balance, added: 5 }`
  - `waterPlant(userId, coupleId): { balance, added: 5, plant_stage, plant_exp }`
  - `sendGiftHearts(senderId, receiverId, amount, message): { senderBalance }`
  - `deductHearts(userId, amount, type, message): { newBalance }`

- [ ] **Step 1: Viết test cho ví Trái Tim và tưới cây**

```javascript
// server/tests/heart.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { dailyCheckIn, waterPlant, sendGiftHearts, getBalance } from '../src/services/heartService.js';

describe('Heart & Plant Service', () => {
  beforeEach(() => { initDb(':memory:'); });

  it('awards hearts on daily checkin and allows gifting between partners', () => {
    // initial balance: 20
    const checkin = dailyCheckIn(1);
    expect(checkin.balance).toBe(25);

    sendGiftHearts(1, 2, 10, 'Yêu em!');
    expect(getBalance(1)).toBe(15);
    expect(getBalance(2)).toBe(30);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run server/tests/heart.test.js`
Expected: FAIL

- [ ] **Step 3: Triển khai `heartService.js` và logic thăng cấp cây tình yêu (stage 1-10)**

- [ ] **Step 4: Chạy test để xác nhận vượt qua**

Run: `npx vitest run server/tests/heart.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/heartService.js server/tests/heart.test.js
git commit -m "feat(heart): implement wallet, daily check-in, plant watering, and heart gifting"
```

---

### Task 4: Hòm Thư, Khóa Câu Đố (Quiz) & Hẹn Giờ (Time Capsule)

**Files:**
- Create: `server/src/services/letterService.js`
- Create: `server/src/utils/quizNormalizer.js`
- Create: `server/src/routes/letterRoutes.js`
- Test: `server/tests/letter.test.js`

**Interfaces:**
- Produces:
  - `createLetter({ couple_id, sender_id, receiver_id, title, mood_tag, content, paper_style, photos, stickers, open_heart_cost, time_lock_at, quiz }): Letter`
  - `normalizeAnswer(str): string`
  - `verifyQuizOrBypass(letterId, userId, { answer, useBypass }): { success, isOpened }`
  - `getLetterDetail(letterId, userId): LetterDetail`

- [ ] **Step 1: Viết test cho việc chuẩn hóa đáp án và mở khóa thư**

```javascript
// server/tests/letter.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeAnswer } from '../src/utils/quizNormalizer.js';

describe('Quiz Normalizer', () => {
  it('normalizes Vietnamese accents and whitespace', () => {
    expect(normalizeAnswer('  Hồ Tây  ')).toBe('ho tay');
    expect(normalizeAnswer('Đà Nẵng ')).toBe('da nang');
    expect(normalizeAnswer('phố CỔ')).toBe('pho co');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run server/tests/letter.test.js`
Expected: FAIL

- [ ] **Step 3: Triển khai `quizNormalizer.js` và `letterService.js`**

Kiểm tra chặt chẽ:
1. `time_lock_at` phải nhỏ hơn hoặc bằng thời gian hiện tại của server mới cho phép mở.
2. Trừ phí `open_heart_cost` khi mở thư.
3. Nếu trả lời câu đố sai và `useBypass: true`, trừ thêm `bypass_cost` từ ví tim.
4. Đánh dấu `is_opened = 1` và `opened_at = now()`.

- [ ] **Step 4: Chạy test để xác nhận vượt qua**

Run: `npx vitest run server/tests/letter.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/letterService.js server/src/utils/quizNormalizer.js server/tests/letter.test.js
git commit -m "feat(letters): implement letter creation, quiz normalization, time lock, and bypass logic"
```

---

### Task 5: Quản Lý Ngày Kỷ Niệm & Tự Động Kích Hoạt Viết Thư

**Files:**
- Create: `server/src/services/milestoneService.js`
- Create: `server/src/routes/milestoneRoutes.js`
- Test: `server/tests/milestone.test.js`

**Interfaces:**
- Produces:
  - `initDefaultMilestones(coupleId, user1, user2): void`
  - `checkUpcomingMilestones(coupleId, targetDate): { activeMilestones, daysTogether }`
  - `addCustomMilestone(coupleId, data): Milestone`

- [ ] **Step 1: Viết test phân loại người viết thư theo ngày lễ (Sinh nhật, 8/3, 20/10, 19/11...)**

```javascript
// server/tests/milestone.test.js
import { describe, it, expect } from 'vitest';
import { getExpectedWriter } from '../src/services/milestoneService.js';

describe('Milestone Event Assignment', () => {
  it('correctly assigns 1-way writing for gender-based holidays', () => {
    const user1 = { id: 1, gender: 'male' };
    const user2 = { id: 2, gender: 'female' };
    
    expect(getExpectedWriter('women_day', user1, user2)).toBe(1); // Bạn nam viết
    expect(getExpectedWriter('men_day', user1, user2)).toBe(2);   // Bạn nữ viết
    expect(getExpectedWriter('anniversary', user1, user2)).toBe('both'); // Cả 2 cùng viết
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run server/tests/milestone.test.js`
Expected: FAIL

- [ ] **Step 3: Triển khai `milestoneService.js` với ma trận ngày lễ và hiệu ứng tương ứng**

- [ ] **Step 4: Chạy test để xác nhận vượt qua**

Run: `npx vitest run server/tests/milestone.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/milestoneService.js server/tests/milestone.test.js
git commit -m "feat(milestones): implement automatic anniversary detection and writer assignment"
```

---

### Task 6: WebSocket Real-time Hub & File Upload Server

**Files:**
- Create: `server/src/websocket.js`
- Create: `server/src/server.js`
- Test: `server/tests/server.test.js`

**Interfaces:**
- Produces:
  - WebSocket broadcaster: `broadcastToCouple(coupleId, eventType, payload)`
  - Static endpoint: `/uploads/*` lưu trữ ảnh chụp thật và custom sticker.
  - REST API Server hoàn chỉnh cổng 4000.

- [ ] **Step 1: Viết integration test khởi động server và kết nối WebSocket**

- [ ] **Step 2: Triển khai WebSocket handler cho sự kiện `poke` (bắn tim) và `new_letter`**

- [ ] **Step 3: Chạy test để xác nhận server phản hồi HTTP và WebSocket hoạt động**

- [ ] **Step 4: Commit**

```bash
git add server/src/websocket.js server/src/server.js server/tests/server.test.js
git commit -m "feat(server): setup Express server, file uploads, and real-time WebSocket hub"
```

---

### Task 7: Khởi Tạo Client React (Vite) & Cozy Scrapbook Design System

**Files:**
- Create: `client/package.json`
- Create: `client/src/index.css`
- Create: `client/src/theme/tokens.js`
- Create: `client/src/components/AudioPlayer.jsx`

- [ ] **Step 1: Khởi tạo project React với Vite và CSS Design System**

Thiết lập biến màu (giấy Kraft be `#fdfaf6`, sáp đỏ `#b83b3b`, hồng ấm `#e06d7e`, viền washi tape), font chữ mộc mạc và responsive layout.

- [ ] **Step 2: Triển khai component `AudioPlayer.jsx` phát nhạc lofi êm dịu có nút bật/tắt âm thanh**

- [ ] **Step 3: Kiểm tra hiển thị theme bằng build thử nghiệm**

Run: `npm run build` trong thư mục `client`
Expected: Build thành công không có lỗi CSS hay bundling.

- [ ] **Step 4: Commit**

```bash
git add client/
git commit -m "feat(client): scaffold React app with Cozy Scrapbook design tokens and audio player"
```

---

### Task 8: Giao Diện Đăng Ký, Ghép Đôi & Thanh Thông Tin Đôi (Couple Bar)

**Files:**
- Create: `client/src/components/AuthModal.jsx`
- Create: `client/src/components/PairingModal.jsx`
- Create: `client/src/components/CoupleTopBar.jsx`
- Create: `client/src/api/client.js`

- [ ] **Step 1: Tạo API client hỗ trợ JWT và WebSocket listener**

- [ ] **Step 2: Triển khai màn hình Đăng ký / Đăng nhập với lựa chọn Giới tính & Xưng hô**

- [ ] **Step 3: Triển khai giao diện Ghép đôi hiển thị Mã Uyên Ương dạng thiệp mời**

- [ ] **Step 4: Triển khai `CoupleTopBar.jsx` hiển thị 2 ảnh đại diện thật lồng nhau, bộ đếm ngày yêu và nút Bắn Tim**

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AuthModal.jsx client/src/components/PairingModal.jsx client/src/components/CoupleTopBar.jsx client/src/api/client.js
git commit -m "feat(client): implement auth, couple pairing modal, and couple header bar"
```

---

### Task 9: Giao Diện Hòm Thư, Soạn Thư & Mở Khóa Thử Thách

**Files:**
- Create: `client/src/components/LetterList.jsx`
- Create: `client/src/components/LetterWriterModal.jsx`
- Create: `client/src/components/LetterUnlockModal.jsx`
- Create: `client/src/components/LetterReaderModal.jsx`

- [ ] **Step 1: Triển khai `LetterList.jsx` hiển thị phong bì có dấu sáp đỏ phân theo nhãn cảm xúc ("Mở khi buồn", "Hẹn giờ", "Đã mở")**

- [ ] **Step 2: Triển khai `LetterWriterModal.jsx` cho phép chọn màu giấy, kẹp ảnh polaroid, dán sticker và cài đặt câu đố / tim / hẹn giờ**

- [ ] **Step 3: Triển khai `LetterUnlockModal.jsx` với giao diện câu đố trắc nghiệm/nhập chữ, nút chuộc bằng Tim và hiệu ứng vỡ dấu sáp đỏ kèm `canvas-confetti`**

- [ ] **Step 4: Triển khai `LetterReaderModal.jsx` hiển thị bức thư đã mở với ảnh polaroid và tùy chọn đọc lại bất kỳ lúc nào**

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Letter*.jsx
git commit -m "feat(client): implement letter listing, writer, unlock challenge, and reading modal"
```

---

### Task 10: Bảng Kỷ Niệm Polaroid & Khay Sticker Tùy Chỉnh

**Files:**
- Create: `client/src/components/ScrapbookBoard.jsx`
- Create: `client/src/components/StickerDrawer.jsx`

- [ ] **Step 1: Triển khai `ScrapbookBoard.jsx` hỗ trợ tải ảnh thật lên, tự động gắn viền Polaroid và băng keo washi tape**

- [ ] **Step 2: Triển khai `StickerDrawer.jsx` cho phép kéo thả sticker lên bảng hoặc tải thêm file sticker / ảnh meme riêng của hai bạn**

- [ ] **Step 3: Lưu vị trí các ảnh và sticker lên server để cả 2 người cùng nhìn thấy góc kỷ niệm giống nhau**

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ScrapbookBoard.jsx client/src/components/StickerDrawer.jsx
git commit -m "feat(client): implement polaroid scrapbook board and custom sticker drawer"
```

---

### Task 11: Sự Kiện Ngày Đặc Biệt & Hiệu Ứng Thổi Nến Bánh Sinh Nhật

**Files:**
- Create: `client/src/components/MilestoneBanner.jsx`
- Create: `client/src/components/CandleBlowModal.jsx`
- Create: `client/src/components/LovePlantWidget.jsx`

- [ ] **Step 1: Triển khai `MilestoneBanner.jsx` hiển thị thông báo ngày đặc biệt (Sinh nhật, 8/3, Kỷ niệm) và nút viết thư theo đúng phân vai**

- [ ] **Step 2: Triển khai `CandleBlowModal.jsx` với bánh kem sinh nhật tương tác: bấm giữ để "Thổi nến" 🎂, nến tắt toả khói nhẹ, pháo hoa giấy nổ bung để nhận thư sinh nhật**

- [ ] **Step 3: Triển khai `LovePlantWidget.jsx` chậu cây tình yêu đung đưa, có nút tưới nước mỗi ngày tích tim và điểm kinh nghiệm**

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Milestone*.jsx client/src/components/CandleBlowModal.jsx client/src/components/LovePlantWidget.jsx
git commit -m "feat(client): implement interactive birthday candle blowing, milestones, and love plant"
```

---

### Task 12: Tích Hợp Toàn Diện, Kiểm Thử End-to-End & Tối Ưu Hóa

**Files:**
- Modify: `client/src/App.jsx`
- Create: `tests/e2e_flow.test.js`

- [ ] **Step 1: Ghép nối toàn bộ luồng vào `App.jsx`**

- [ ] **Step 2: Chạy kiểm thử End-to-End mô phỏng hành trình của 2 người dùng (User A và User B):**
  1. User A đăng ký -> nhận mã `LOVE-XXXX`.
  2. User B đăng ký -> nhập mã kết đôi thành công.
  3. Cả hai tưới cây tình yêu -> số dư Trái Tim tăng lên.
  4. User A viết lá thư "Mở khi em buồn" cài câu đố kỷ niệm và phí 5 ❤️.
  5. User B vào mở thư -> giải đố đúng -> dấu sáp vỡ ra, pháo hoa nổ và thư mở thành công.
  6. Thử nghiệm tính năng bắn tim real-time giữa 2 tài khoản.

- [ ] **Step 3: Kiểm tra giao diện thực tế trên trình duyệt, đảm bảo responsive mượt mà trên cả điện thoại và máy tính**

- [ ] **Step 4: Commit và hoàn thiện tài liệu hướng dẫn chạy**

```bash
git add client/src/App.jsx tests/
git commit -m "feat: complete end-to-end integration and couple experience verification"
```
