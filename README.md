# 📸 PhotoBooth App

Ứng dụng Photobooth hiện đại được xây dựng bằng Next.js với đầy đủ các tính năng chụp ảnh, bộ lọc, tạo collage và GIF.

## ✨ Tính năng

### 📷 Chụp ảnh
- Hiển thị live camera feed từ webcam
- Countdown 3-2-1 trước khi chụp với hiệu ứng animation
- Flash effect khi chụp ảnh
- Preview và lưu ảnh ngay lập tức

### 🎨 Bộ lọc màu
- **Gốc** - Không filter
- **Đen trắng** - Grayscale filter
- **Sepia** - Hiệu ứng cổ điển
- **Vintage** - Phong cách retro
- **Ấm** - Tăng tông màu ấm
- **Lạnh** - Tăng tông màu lạnh
- **Sáng** - Tăng độ sáng
- **Tương phản** - Tăng độ tương phản

### 🖼️ Collage
Ghép nhiều ảnh thành một collage với các layout:
- 2×2 (4 ảnh)
- 3×3 (9 ảnh)
- 2×3 (6 ảnh)
- 1×4 (4 ảnh)

### 🎬 GIF
- Tạo GIF động từ nhiều ảnh
- Tùy chỉnh tốc độ animation (0.1s - 2s giữa các frame)
- Preview và tải về dưới dạng .gif

### 🖼️ Thư viện ảnh
- Xem tất cả ảnh đã chụp
- Tải ảnh về máy
- Xóa ảnh không muốn
- Hiển thị thông tin ảnh (thời gian, filter)

## 🚀 Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Mở trình duyệt tại
http://localhost:3000
```

## 🛠️ Công nghệ sử dụng

- **Next.js 16** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations mượt mà
- **react-webcam** - Truy cập webcam
- **gifshot** - Tạo GIF

## 📱 Hướng dẫn sử dụng

### Chụp ảnh đơn
1. Chọn tab **"📷 Chụp ảnh"**
2. Chọn bộ lọc mong muốn từ thanh filter
3. Click vào nút chụp ảnh (nút tròn lớn màu trắng)
4. Đợi countdown 3-2-1
5. Ảnh sẽ xuất hiện trong thư viện bên phải

### Tạo Collage
1. Chụp ít nhất 1 ảnh trước
2. Chọn tab **"🖼️ Collage"**
3. Chọn layout mong muốn (2×2, 3×3, etc.)
4. Click chọn các ảnh theo thứ tự (số thứ tự sẽ hiện ở góc ảnh)
5. Click **"✨ Tạo Collage"**
6. Preview và tải về

### Tạo GIF
1. Chụp ít nhất 2 ảnh trước
2. Chọn tab **"🎬 GIF"**
3. Điều chỉnh tốc độ animation bằng thanh slider
4. Click chọn các ảnh theo thứ tự muốn hiển thị
5. Click **"🎬 Tạo GIF"**
6. Preview và tải về

## 🎨 Giao diện

Giao diện được thiết kế lấy cảm hứng từ macOS Photobooth với:
- Gradient background đẹp mắt
- Animations mượt mà với Framer Motion
- Responsive design, hoạt động tốt trên mọi kích thước màn hình
- Glass morphism effect
- Smooth transitions giữa các mode

## ⚙️ Yêu cầu

- Node.js 18+ 
- Webcam (để sử dụng tính năng chụp ảnh)
- Trình duyệt hỗ trợ WebRTC (Chrome, Firefox, Edge, Safari)

## 📝 Ghi chú

- Ảnh được lưu trong memory (không persistent), sẽ mất khi refresh trang
- Để lưu ảnh vĩnh viễn, hãy tải về máy
- Cho phép trình duyệt truy cập webcam khi được yêu cầu
- GIF có thể mất vài giây để xử lý tùy thuộc vào số lượng ảnh

## 🔐 Quyền riêng tư

- Ứng dụng hoàn toàn chạy trên client-side
- Không có ảnh nào được upload lên server
- Tất cả xử lý ảnh diễn ra trong trình duyệt của bạn
- An toàn và bảo mật hoàn toàn

---

**Enjoy taking photos! 📸✨**
