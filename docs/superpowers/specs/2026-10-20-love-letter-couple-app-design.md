# LoveCapsule — Hộp Thư Kỷ Niệm & Không Gian Tình Yêu Cặp Đôi (Design Specification)

- **Date:** 2026-10-20
- **Status:** Approved
- **Target Platform:** Responsive Web App (Mobile & Desktop, PWA-ready)
- **Primary Tech Stack:** React (Vite) + Node.js (Express) + SQLite (`better-sqlite3`) + WebSocket

---

## 1. Tổng Quan & Mục Tiêu Dự Án (Overview & Goals)

**LoveCapsule** là ứng dụng web lãng mạn dành riêng cho hai người (kết nối duy nhất 1-1). Ứng dụng mang phong cách **Sổ tay kỷ niệm ấm cúng (Cozy Scrapbook & Healing Room)**, là nơi hai bạn trao đổi những phong bì thư niêm phong sáp, lưu giữ ảnh kỷ niệm, cùng chăm sóc cây tình yêu, tích lũy Trái Tim (❤️) và tự động nhắc nhở trao gửi tâm tình vào những dịp lễ, sinh nhật hay ngày kỷ niệm đặc biệt.

### Mục Tiêu Trải Nghiệm Cốt Lõi:
1. **Xoa dịu & Chữa lành (Healing & Comfort):** Người viết chuẩn bị sẵn các bức thư theo cảm xúc (*"Mở khi em buồn"*, *"Mở khi nhớ anh"*...). Người đọc có một nơi chốn bình yên để tìm lại sự an ủi mỗi khi mệt mỏi.
2. **Tương tác Thử thách Ngọt ngào (Playful Unlocks):** Để mở thư, người nhận trải qua câu đố tình yêu (trắc nghiệm hoặc nhập chữ) hoặc dùng Trái Tim (❤️) để mở khóa.
3. **Kinh tế Trái Tim & Nuôi Cây (Heart Economy & Love Plant):** Điểm danh mỗi ngày, tưới chậu cây tình yêu chung, tặng tim cho nhau, đổi vật phẩm trang trí.
4. **Tự động hóa Ngày Đặc Biệt (Automated Milestones):** Tự động nhận diện sự kiện (Sinh nhật, 8/3, 20/10, 19/11, Valentine, Kỷ niệm yêu) để kích hoạt nhắc viết thư theo đúng vai (1 người viết hoặc cả 2 cùng viết) kèm hiệu ứng tương tác độc đáo (thổi nến bánh kem, hoa nở, tuyết rơi...).
5. **Giao diện Đẹp & Thơ Mộng:** Hiệu ứng bóc dấu sáp đỏ (wax seal), ảnh Polaroid kẹp washi tape, sticker vẽ tay và máy phát nhạc lofi êm dịu.

---

## 2. Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

### 2.1 Cấu Trúc Tổng Thể

```
+--------------------------------------------------------------+
|                    Client (React + Vite)                     |
|  - Cozy Scrapbook UI (Pastel Kraft, Polaroid, Wax Seal FX)   |
|  - Lofi Background Music Player                              |
|  - Real-time Heart & Letter Animations                       |
+--------------------------------------------------------------+
                               |  ^
                HTTP REST APIs |  | WebSocket (Live Events)
                               v  |
+--------------------------------------------------------------+
|                 Backend Server (Node.js/Express)             |
|  - Auth & 1-1 Couple Pairing Engine                          |
|  - Letter & Quiz Unlock Logic (Server-side time validation)  |
|  - Heart Economy & Transaction Ledger                        |
|  - Milestone Scheduler & Notification Manager                |
|  - Static Uploads (Polaroid Photos & Audio)                  |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                 Database (SQLite - better-sqlite3)            |
|  - Local, high-performance, private single-file database      |
+--------------------------------------------------------------+
```

### 2.2 Công Nghệ Lựa Chọn
- **Frontend:** React 18, Vite, Vanilla CSS với hệ thống Design Tokens (Màu be giấy Kraft, Đỏ sáp niêm phong, Hồng pastel), thư viện `canvas-confetti` cho pháo hoa giấy, Web Audio API / Audio element cho âm thanh mở sáp và nhạc lofi.
- **Backend:** Node.js, Express.js, WebSocket (`ws`) cho thông báo tức thì (bắn tim, gửi thư mới, đồng bộ tưới cây).
- **Database:** SQLite với driver `better-sqlite3` đồng bộ, chuẩn ACID, lưu trữ cục bộ bảo mật, dễ dàng sao lưu hoặc di chuyển.
- **Bảo mật:** Mật khẩu băm bằng `bcryptjs`, xác thực phiên bằng JWT Token / Cookie an toàn.

---

## 3. Mô Hình Dữ Liệu Chi Tiết (Database Schema)

### 3.1 Bảng `users` (Người dùng)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | ID định danh |
| `username` | TEXT UNIQUE NOT NULL | Tên đăng nhập |
| `password_hash`| TEXT NOT NULL | Mật khẩu mã hóa |
| `display_name` | TEXT NOT NULL | Biệt danh (ví dụ: "Anh Gấu", "Bé Mèo") |
| `gender` | TEXT CHECK IN ('male', 'female', 'other') | Giới tính (dùng để phân vai ngày lễ) |
| `pronoun` | TEXT NOT NULL | Xưng hô hiển thị ("Anh", "Em", "Chồng", "Vợ"...) |
| `avatar_url` | TEXT | Ảnh đại diện |
| `couple_id` | INTEGER REFERENCES couples(id) | Khóa ngoại tới mối quan hệ 1-1 |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | Ngày tạo |

### 3.2 Bảng `couples` (Cặp đôi 1-1)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | ID định danh cặp đôi |
| `couple_code` | TEXT UNIQUE NOT NULL | Mã uyên ương (ví dụ: `LOVE-7788`) |
| `user1_id` | INTEGER REFERENCES users(id) | Người tạo phòng |
| `user2_id` | INTEGER REFERENCES users(id) | Người ghép đôi (NULL nếu đang chờ) |
| `anniversary_date`| DATE | Ngày chính thức bắt đầu yêu nhau |
| `plant_stage` | INTEGER DEFAULT 1 | Cấp độ cây tình yêu (1 đến 10) |
| `plant_exp` | INTEGER DEFAULT 0 | Điểm kinh nghiệm của cây |
| `last_watered_date`| TEXT | Ngày tưới nước gần nhất (YYYY-MM-DD) |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | Ngày kết đôi |

### 3.3 Bảng `heart_wallets` & `heart_transactions` (Kinh tế Trái Tim)
- **`heart_wallets`:**
  - `user_id` (PK, REFERENCES users(id))
  - `balance` (INTEGER DEFAULT 20) — Tặng sẵn 20 ❤️ khi tạo tài khoản.
- **`heart_transactions`:**
  - `id` (INTEGER PK)
  - `user_id` (INTEGER REFERENCES users(id))
  - `amount` (INTEGER) — Số tim biến động (+5, -10...)
  - `type` (TEXT: `'daily_checkin'`, `'plant_water'`, `'letter_open'`, `'quiz_bypass'`, `'gift_sent'`, `'gift_received'`, `'shop_item'`)
  - `message` (TEXT) — Ghi chú giao dịch
  - `created_at` (DATETIME)

### 3.4 Bảng `letters` (Hòm thư tình yêu)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | ID bức thư |
| `couple_id` | INTEGER NOT NULL | Thuộc cặp đôi nào |
| `sender_id` | INTEGER NOT NULL | Người viết thư |
| `receiver_id` | INTEGER NOT NULL | Người nhận thư |
| `title` | TEXT NOT NULL | Tiêu đề lá thư |
| `mood_tag` | TEXT NOT NULL | Nhãn cảm xúc (`sad`, `miss`, `angry`, `cheer`, `anniversary`, `secret`) |
| `content` | TEXT NOT NULL | Nội dung bức thư (hỗ trợ định dạng dòng, thơ) |
| `paper_style` | TEXT DEFAULT 'kraft' | Mẫu giấy (`kraft`, `pink_pastel`, `caro_grid`, `night_sky`) |
| `photos` | TEXT | Danh sách đường dẫn ảnh đính kèm (JSON Array dạng Polaroid) |
| `stickers` | TEXT | Danh sách sticker trang trí tọa độ x, y (JSON Array) |
| `bgm_track` | TEXT | Tên bản nhạc lofi tự động phát khi mở thư |
| `open_heart_cost`| INTEGER DEFAULT 5 | Phí bóc tem mở thư bằng Trái Tim |
| `time_lock_at` | DATETIME | Hẹn giờ mở (NULL nếu có thể mở ngay) |
| `is_opened` | INTEGER DEFAULT 0 | 0: Chưa mở; 1: Đã mở thành công |
| `opened_at` | DATETIME | Thời điểm mở thư lần đầu tiên |
| `milestone_id` | INTEGER REFERENCES milestones(id) | Gắn với sự kiện đặc biệt nào (nếu có) |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | Ngày viết |

### 3.5 Bảng `letter_quizzes` (Câu đố mở thư)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | ID câu hỏi |
| `letter_id` | INTEGER REFERENCES letters(id) | Thuộc bức thư nào |
| `quiz_type` | TEXT CHECK IN ('text', 'choice') | Nhập chữ hoặc Trắc nghiệm |
| `question` | TEXT NOT NULL | Nội dung câu hỏi kỷ niệm |
| `options` | TEXT | Mảng JSON các lựa chọn nếu là trắc nghiệm (ví dụ: `["Phố cổ", "Hồ Tây", "Rạp phim"]`) |
| `correct_answer`| TEXT NOT NULL | Đáp án chính xác |
| `hint` | TEXT | Gợi ý ngọt ngào |
| `bypass_cost` | INTEGER DEFAULT 15 | Số tim cần trả để vượt ải nếu trả lời sai |

### 3.6 Bảng `milestones` (Các ngày kỷ niệm & sự kiện đặc biệt)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | ID sự kiện |
| `couple_id` | INTEGER NOT NULL | Cặp đôi sở hữu |
| `title` | TEXT NOT NULL | Tên sự kiện (Sinh nhật Em, 8/3, Kỷ niệm 1 năm...) |
| `event_date` | TEXT NOT NULL | Ngày diễn ra (định dạng `MM-DD` cho lặp hàng năm, hoặc `YYYY-MM-DD`) |
| `category` | TEXT | Phân loại (`birthday_user1`, `birthday_user2`, `anniversary`, `women_day`, `men_day`, `valentine`, `custom`) |
| `writer_rule` | TEXT CHECK IN ('user1_only', 'user2_only', 'both') | Ai là người phải viết thư? |
| `interactive_fx`| TEXT | Hiệu ứng tương tác (`candle_blow`, `flower_bloom`, `gift_box`, `galaxy_heart`, `snow_fireplace`) |
| `is_completed` | INTEGER DEFAULT 0 | Đã hoàn thành viết thư dịp này trong năm nay chưa |

---

## 4. Thiết Kế Luồng Trải Nghiệm & Tính Năng (Detailed Workflows)

### 4.1 Đăng Ký & Ghép Đôi 1-1 An Toàn
1. **Người dùng A:** Đăng ký tài khoản (Tên, Tên đăng nhập, Mật khẩu, Giới tính, Cách xưng hô). Nhận mã `LOVE-XXXX`.
2. **Người dùng B:** Đăng ký tài khoản và nhập mã `LOVE-XXXX`.
3. Hệ thống kiểm tra: Nếu mã hợp lệ và chưa có người thứ hai, ghép đôi thành công, chuyển hướng cả 2 vào **Không Gian Tình Yêu**.
4. **Quy tắc an toàn:** Mỗi người chỉ liên kết với 1 người duy nhất. Nếu hủy ghép đôi (cần xác nhận 3 lần), toàn bộ ví tim, cây và thư từ của cặp đôi đó sẽ bị reset về 0.

### 4.2 Luồng Viết Thư & Trang Trí
- Người viết nhấn nút **[Viết Thư Mới 💌]**:
  - Chọn danh mục cảm xúc: *"Mở khi buồn"*, *"Mở khi nhớ anh"*, *"Kỷ niệm"*...
  - Soạn nội dung lá thư, chọn màu giấy viết.
  - Tải ảnh lên -> Client tự động render ảnh dạng thẻ **Polaroid** có băng keo dán góc.
  - Chọn sticker vẽ tay để trang trí.
  - Cài đặt điều kiện mở:
    - **Phí mở thư:** Mặc định 5 ❤️ (hoặc tùy chỉnh).
    - **Hẹn giờ mở:** Mở tự do hoặc hẹn chính xác ngày giờ.
    - **Cài câu đố (Quiz):**
      - Kiểu 1: Trắc nghiệm (Nhập câu hỏi, 3-4 đáp án, chọn 1 đáp án đúng).
      - Kiểu 2: Nhập chữ (Nhập câu hỏi, đáp án đúng, gợi ý).
      - Cài đặt số tim chuộc thư nếu trả lời sai (ví dụ 15 ❤️).
- Nhấn **[Niêm Phong Sáp & Gửi Đi]** -> Hiệu ứng đổ sáp đỏ và đóng dấu con dấu tình yêu.

### 4.3 Luồng Mở Thư Của Người Nhận
1. Người nhận thấy phong bì thư trong hòm thư với dấu niêm phong sáp đỏ.
2. Bấm vào phong bì:
   - **Kiểm tra thời gian (Time Lock):** Nếu chưa tới hạn hẹn giờ, hiển thị đồng hồ đếm ngược và thông điệp: *"Lá thư này được hẹn giờ mở vào [Thời gian], hãy kiên nhẫn chờ đợi nhé ⏳"*.
   - **Kiểm tra phí Trái Tim mở thư:** Người đọc phải có đủ số tim quy định (ví dụ 5 ❤️). Bấm xác nhận trừ tim.
   - **Kiểm tra câu đố (Quiz):**
     - Hiện bảng câu hỏi trắc nghiệm hoặc ô nhập chữ.
     - Hệ thống kiểm tra đáp án: Chuẩn hóa chữ thường, xóa khoảng trắng thừa, loại bỏ dấu tiếng Việt khi so sánh câu trả lời tự do (đảm bảo không bị bắt lỗi gõ chữ).
     - **Nếu đúng:** Con dấu sáp nứt vỡ với âm thanh lách tách, lá thư mở bung ra với hiệu ứng pháo hoa giấy confetti và trái tim bay lượn! Nhạc lofi du dương tự động phát.
     - **Nếu sai:** Thông báo đáng yêu *"Chưa đúng rồi nè 😜"* và hiện lựa chọn: Thử lại hoặc Bấm nút *"Năn nỉ xin mở bằng [X] ❤️"* để mở ngay lập tức.
3. **Lưu trữ:** Sau khi mở lần đầu, lá thư vĩnh viễn chuyển sang trạng thái "Đã mở", nằm trong mục *Kỷ Niệm*, đọc lại bất kỳ lúc nào mà không cần trừ tim hay giải đố lại.

### 4.4 Hệ Thống Tương Tác & Kinh Tế Trái Tim (❤️)
- **Điểm danh hằng ngày:** +5 ❤️/ngày khi đăng nhập.
- **Tưới cây tình yêu:** Mỗi người tưới 1 lần/ngày -> +5 ❤️ cho bản thân và +10 kinh nghiệm cho cây. Cây lớn theo 10 cấp độ (Mầm -> Cây nhỏ -> Cây ra lá -> Ra hoa -> Cây trĩu quả tim).
- **Tặng tim:** Nút "Chuyển tim cho người yêu" kèm lời nhắn ngọt ngào.
- **Bắn tim tức thì (Love Spark):** Nút trái tim ở góc màn hình, bấm liên tục để bắn đàn tim sang màn hình đối phương qua WebSocket.

### 4.5 Quản Lý Ngày Kỷ Niệm & Hiệu Ứng Tương Tác Đặc Biệt
- Hệ thống tự động tính ngày yêu nhau dựa trên `anniversary_date`.
- Danh mục sự kiện tự động theo lịch:
  1. **Sinh nhật Người Yêu:** Nhắc người còn lại viết thư trước 2 ngày. Đến ngày sinh nhật: Hiệu ứng **Bánh Kem Thổi Nến (Candle Blow)** — bấm giữ ngọn nến để thổi tắt, pháo hoa nổ bung, mở thư sinh nhật.
  2. **Ngày Phụ Nữ (8/3 & 20/10):** Nhắc bạn trai viết thư gửi bạn gái. Hiệu ứng **Bó Hoa Tulip Nở Rộ**.
  3. **Ngày Nam Giới (19/11):** Nhắc bạn gái viết thư gửi bạn trai. Hiệu ứng **Mở Nơ Hộp Quà Bí Ẩn**.
  4. **Kỷ Niệm Ngày Yêu (100 ngày, 1 năm...):** Cả 2 cùng viết thư. Khi cả hai viết xong, cả hai cùng mở đồng thời với hiệu ứng **Dải Ngân Hà Kỷ Niệm**.
  5. **Valentine (14/02):** Cả hai cùng viết. Hiệu ứng **Hộp Sô-cô-la Trái Tim**.
  6. **Valentine Trắng (14/03):** 1 chiều đáp lễ. Hiệu ứng **Kẹo Marshmallow**.
  7. **Giáng Sinh (25/12) & Năm Mới:** Cả hai cùng viết. Hiệu ứng **Tuyết Rơi & Lò Sưởi Ấm Cúng**.
  8. **Sự kiện Tùy Chỉnh (Custom Milestones):** Tự tạo ngày riêng (Ngày thi cử, Ngày phỏng vấn, Ngày đi chơi đầu tiên).

---

## 5. Xử Lý Lỗi & Trường Hợp Biên (Error Handling & Edge Cases)

1. **Gian lận thời gian hệ thống:** Toàn bộ việc kiểm tra mở thư theo thời gian (`time_lock_at`) được xác thực trên Server dựa trên đồng hồ UTC của máy chủ, người dùng không thể đổi giờ điện thoại/máy tính để mở sớm.
2. **Số dư Trái Tim không đủ:** Khi số dư tim không đủ để mở thư hoặc chuộc câu đố, hệ thống hiện popup dễ thương: *"Bạn không đủ tim rồi! Hãy tưới cây, điểm danh hoặc năn nỉ người yêu tặng tim nhé 🥺"*.
3. **Mất kết nối mạng:** Client lưu bản nháp thư (Draft) vào `localStorage`. Khi đang viết dở mà mất mạng hoặc vô tình tắt tab, nội dung bức thư không bị mất.
4. **Xử lý tiếng Việt linh hoạt:** Hàm so sánh đáp án tự do sẽ chuẩn hóa:
   - Chuyển chữ thường, xóa dấu câu và khoảng trắng thừa.
   - Hỗ trợ so khớp mờ (Fuzzy matching hoặc cả dạng không dấu) để chấp nhận câu trả lời đúng ý.

---

## 6. Chiến Lược Kiểm Thử (Testing & Verification)

1. **Unit Tests (Kiểm thử logic):**
   - Hàm chuẩn hóa và so sánh câu đố (`normalizeAnswer`).
   - Logic cộng/trừ Trái Tim và kiểm tra số dư.
   - Logic tính toán số ngày yêu và phát hiện sự kiện kỷ niệm đến hạn.
2. **API Integration Tests:**
   - Đăng ký tài khoản và luồng ghép đôi 1-1 bằng mã uyên ương.
   - Tạo thư, cài đặt khóa câu đố và hẹn giờ.
   - Thử mở thư trước hạn hẹn giờ (kỳ vọng: lỗi 403 Forbidden).
   - Thử giải đố đúng và giải đố sai kèm trừ tim (kỳ vọng: thành công và số dư cập nhật chuẩn).
3. **End-to-End & UI Verification:**
   - Sử dụng trình duyệt kiểm tra thực tế: Giao diện phong bì thư, hiệu ứng bóc sáp, ảnh polaroid, máy phát nhạc lofi, giao diện bánh sinh nhật thổi nến.
