# Smart Classroom IoT Dashboard

Frontend React application cho hệ thống Smart Classroom IoT - Dự án môn học DADN.

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Kiến trúc](#kiến-trúc)
- [Cài đặt](#cài-đặt)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Testing](#testing)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API Documentation](#api-documentation)
- [Feed Mapping](#feed-mapping)

## 🎯 Giới thiệu

Smart Classroom IoT Dashboard là giao diện người dùng cho hệ thống giám sát và điều khiển phòng học thông minh. Ứng dụng được xây dựng với React + TypeScript + Vite.


## ✨ Tính năng

### 1. Dashboard Realtime
- Hiển thị dữ liệu cảm biến realtime (nhiệt độ, độ ẩm, ánh sáng)
- Cập nhật tự động < 1s khi có dữ liệu mới
- Hỗ trợ WebSocket và fallback REST polling

### 2. Điều khiển thiết bị
- Bật/tắt đèn
- Điều chỉnh tốc độ quạt (0-3)
- Hiển thị ACK timestamp sau mỗi lệnh
- Xử lý trạng thái loading và error

### 3. Điều khiển giọng nói
- Thu âm giọng nói qua Web Speech API
- Hiển thị transcript với độ tin cậy
- Highlight keywords được nhận diện
- Yêu cầu xác nhận trước khi thực thi

### 4. Biểu đồ lịch sử
- Time-series charts cho temp/humi/lux
- Chọn khoảng thời gian (1h, 6h, 24h, 7d)
- Hiển thị xu hướng dữ liệu

### 5. Lịch sử hoạt động
- Bảng logs với filters
- Phân loại theo nguồn (manual/auto/voice)
- Xuất CSV

### 6. Dark Mode & Accessibility
- Toggle dark/light theme
- Keyboard navigation
- ARIA labels
- High contrast support

## 🏗️ Kiến trúc

```
Sensor Node (Yolo:Bit) 
    ↓ Serial
IoT Gateway (Python)
    ↓ MQTT/REST
Server (Adafruit IO / OhStem / Custom)
    ↓ WebSocket/REST
Frontend (React - Ứng dụng này)
```

### Feed Naming (từ tài liệu)
- `bbc-temp`: Nhiệt độ (°C)
- `bbc-humi`: Độ ẩm (%)
- `bbc-lux`: Ánh sáng (lux)
- `device-status`: Trạng thái thiết bị

## 🚀 Cài đặt

### Yêu cầu
- Node.js >= 18.x
- npm >= 9.x

### Các bước cài đặt

```bash
# Clone repository
cd smart-classroom-fe

# Cài đặt dependencies
npm install

# Copy file env example
copy .env.example .env

# Cấu hình .env với thông tin server của bạn
```

### Cấu hình .env

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_AIO_USERNAME=your_username
VITE_AIO_KEY=your_key
```

## 🏃 Chạy ứng dụng

### Development

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`

### Build Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests (Cypress)

```bash
npm run cypress:open
```

## 📁 Cấu trúc thư mục

```
smart-classroom-fe/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, Register forms
│   │   ├── dashboard/      # SensorCard, DeviceControl, VoiceControl
│   │   ├── charts/         # Chart components
│   │   ├── history/        # History table
│   │   └── common/         # Shared components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks (useRealtimeFeed, useVoiceControl)
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── utils/              # Helpers, constants
│   └── assets/             # Static assets
├── public/
│   └── mocks/              # Mock JSON data
├── docs/                   # Documentation
├── tests/                  # Test files
└── README.md
```

## 📚 API Documentation

Xem [docs/api.md](./docs/api.md) để biết chi tiết về API endpoints.

## 🗺️ Feed Mapping

Xem [docs/feed-map.md](./docs/feed-map.md) để biết mapping giữa feed names và UI components.

## 🎨 Design Guidelines

Xem [docs/design-guidelines.md](./docs/design-guidelines.md) để biết về color palette, spacing, và UI patterns.

## ♿ Accessibility

- Tất cả interactive elements có ARIA labels
- Keyboard navigation: Tab, Enter, Escape
- Focus indicators rõ ràng
- Screen reader friendly
- High contrast mode support

## 🔧 Troubleshooting

### WebSocket không kết nối được
- Kiểm tra `VITE_WS_URL` trong `.env`
- Ứng dụng sẽ tự động fallback sang REST polling

### Voice control không hoạt động
- Chỉ hỗ trợ trên Chrome, Edge, Safari
- Cần HTTPS hoặc localhost
- Kiểm tra quyền microphone trong browser

### Build lỗi
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install
```

## 👥 Contributors

- **thzii** - Frontend Developer
- **Giảng viên hướng dẫn** - HUỲNH LONG TÔN, ĐHBK

## 📞 Contact

Nếu có vấn đề, vui lòng tạo issue trên repository hoặc liên hệ qua email.
