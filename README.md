# 💌 LoveCapsule — Không Gian Tình Yêu Của Hai Bạn

Ứng dụng web lãng mạn dành riêng cho hai người kết nối 1-1: Hộp thư cảm xúc *"Open When..."*, con dấu niêm phong sáp, khóa câu đố tình yêu hoặc mở bằng Trái Tim (❤️), hẹn giờ mở thư, góc ảnh Polaroid dán băng washi, khay sticker tùy chỉnh và sự kiện kỷ niệm tự động.

---

## 🚀 Hướng Dẫn Khởi Chạy Ứng Dụng

### 1. Khởi động Máy Chủ Backend (API & WebSocket)
Mở cửa sổ dòng lệnh (Terminal / PowerShell) thứ nhất:
```bash
cd c:\dat2\server
npm start
```
> Máy chủ backend sẽ lắng nghe tại: `http://localhost:4000`

### 2. Khởi động Giao Diện Frontend (React Vite)
Mở cửa sổ dòng lệnh thứ hai:
```bash
cd c:\dat2\client
npm run dev
```
> Truy cập ứng dụng tại: `http://localhost:5173`

---

## 💖 Các Bước Kết Nối Của Hai Bạn

1. **Người thứ nhất (Bạn):**
   - Vào `http://localhost:5173`, bấm **Tạo Tài Khoản**.
   - Nhập tên hiển thị, giới tính, cách xưng hô và tải ảnh đại diện thật.
   - Chọn **"Tôi là người tạo phòng trước"**, nhập ngày bắt đầu yêu nhau.
   - Bạn sẽ nhận được **Mã Uyên Ương** (ví dụ: `LOVE-7788`). Gửi mã này cho người yêu.

2. **Người thứ hai (Người yêu của bạn):**
   - Mở ứng dụng, bấm **Tạo Tài Khoản**.
   - Chọn **"Người yêu đã gửi mã cho tôi"**, nhập mã `LOVE-7788`.
   - Ngay lập tức, hai tài khoản được kết nối vĩnh viễn 1-1 với nhau!

---

## ✨ Các Tính Năng Nổi Bật

- **💌 Hòm Thư "Open When...":** Viết sẵn nhiều bức thư theo cảm xúc (*Mở khi em buồn, Mở khi nhớ anh, Thư kỷ niệm...*).
- **🔒 Thử Thách Câu Đố (Love Quiz):** Người viết có thể chọn tạo câu hỏi trắc nghiệm hoặc nhập chữ tự do. Nếu người kia trả lời sai hoặc quên, có thể dùng Trái Tim để mở khóa.
- **⏳ Hẹn Giờ Mở Thư (Time Capsule):** Hẹn chính xác ngày giờ mới được phép mở thư.
- **🌱 Chậu Cây Tình Yêu:** Cả hai cùng tưới nước mỗi ngày (+5 ❤️ cho mỗi người) để nuôi dưỡng cây lớn dần từ mầm non lên cây trĩu quả tim.
- **📸 Góc Kỷ Niệm Polaroid:** Tải ảnh thật của hai bạn lên, tự động gắn viền ảnh Polaroid, washi tape và viết chú thích ngọt ngào.
- **🎨 Sticker Tùy Chỉnh:** Cho phép tải lên bất kỳ ảnh sticker, icon meme riêng của hai bạn để dán trang trí.
- **🎂 Sự Kiện & Thổi Nến Tương Tác:** Tự động nhận diện sinh nhật, ngày phụ nữ (8/3, 20/10), ngày nam giới (19/11), Valentine để nhắc đúng người viết thư kèm hiệu ứng thổi nến bánh kem sinh nhật độc đáo!
- **🎶 Nhạc Nền Lofi:** Tích hợp máy phát nhạc nhẹ nhàng du dương bằng âm thanh Web Audio êm ái khi đọc thư.
