# Song Request Feature - Progress Tracker

## ✅ Completed (Backend - Phase 1)

### 1. UX/UI Design ✅
- [x] สร้างเอกสารออกแบบครบถ้วนใน `SONG_REQUEST_FEATURE_DESIGN.md`
- [x] User Flow diagram
- [x] UI/UX wireframes (mockups)
- [x] Database schema design

### 2. Backend Implementation ✅
- [x] สร้าง `SongRequest` model ใน `/server/models/SongRequest.js`
  - Song information (title, artist, message)
  - Requester information (name, Instagram, email)
  - Payment data (amount, status, payment method)
  - Stripe/PromptPay metadata
  - Activity log
- [x] สร้าง API Routes ใน `/server/routes/songRequestRoutes.js`
  - `POST /api/v1/public/song-requests` - สร้าง song request ใหม่
  - `POST /api/v1/public/song-requests/check-status` - ตรวจสอบสถานะ
  - `GET /api/v1/public/song-requests/:id` - ดึงข้อมูล request
  - `GET /api/v1/admin/song-requests` - ดึงรายการทั้งหมด (admin)
  - `PATCH /api/v1/admin/song-requests/:id` - อัพเดทสถานะ (admin)
  - `DELETE /api/v1/admin/song-requests/:id` - ลบ request (admin)
- [x] เพิ่ม routes เข้า `/server/index.js`
- [x] อัพเดท Webhook Handler ใน `/server/routes/transactionRoutes.js`
  - รองรับ `checkout.session.completed` สำหรับ song requests
  - รองรับ `payment_intent.succeeded` สำหรับ PromptPay
  - แยก logic ระหว่าง warp transactions และ song requests

### 3. Payment Integration ✅
- [x] Stripe Checkout สำหรับบัตรเครดิต/เดบิต
- [x] PromptPay QR Code payment
- [x] Auto-update status เมื่อชำระเงินสำเร็จ (via webhook)
- [x] Activity logging สำหรับทุก action

---

## 🔄 In Progress (Frontend - Phase 2)

### 4. QR Landing Page (Menu Selection)
- [ ] สร้างหน้า `QrLandingPage.tsx`
- [ ] ปุ่มเลือก "แจกวาร์ป" หรือ "ขอเพลง"
- [ ] Routing logic
- [ ] Responsive design

### 5. Song Request Form Page
- [ ] สร้างหน้า `SongRequestPage.tsx`
- [ ] ฟอร์มกรอกข้อมูลเพลง
  - ชื่อเพลง (required)
  - ชื่อศิลปิน (optional)
  - ข้อความ (optional)
- [ ] ฟอร์มข้อมูลผู้ขอ
  - ชื่อที่จะแสดง (required)
  - Instagram (optional)
- [ ] ปุ่มเลือกจำนวนเงิน: 50, 100, 500, 1000, 1500, 3000
- [ ] เลือกวิธีชำระเงิน (PromptPay/Stripe)
- [ ] Integration กับ API
- [ ] Auto-polling payment status (เหมือน PromptPayPage)
- [ ] Thank You Modal เมื่อสำเร็จ

---

## ⏳ Pending (Frontend - Phase 3 & 4)

### 6. Admin Dashboard Integration
- [ ] สร้าง `SongRequestQueue.tsx` component
- [ ] แสดงรายการ song requests ที่รอเล่น
- [ ] Filter by status (paid, playing, played, rejected)
- [ ] Sort by priority (amount)
- [ ] ปุ่ม "Mark as Played" / "Reject"
- [ ] แสดง activity log

### 7. TV Display Integration
- [ ] เพิ่ม Song Request display mode ใน `TvLandingPage.tsx`
- [ ] แสดงเพลงที่ถูกขอ (เมื่อไม่มี warp)
- [ ] Animation/transition
- [ ] SSE stream สำหรับ song queue
- [ ] Priority-based queue (เพลงที่ donate มากกว่าขึ้นก่อน)

---

## 📊 Statistics

| Category | Tasks | Completed | Progress |
|----------|-------|-----------|----------|
| Design | 4 | 4 | 100% ✅ |
| Backend | 4 | 4 | 100% ✅ |
| Frontend - Customer | 2 | 0 | 0% 🔄 |
| Frontend - Admin | 1 | 0 | 0% ⏳ |
| Frontend - TV | 1 | 0 | 0% ⏳ |
| **Total** | **12** | **8** | **67%** |

---

## 🚀 Next Steps

### Priority 1: QR Landing Page (1 day)
**Goal:** ให้ผู้ใช้เลือกระหว่าง "แจกวาร์ป" หรือ "ขอเพลง" หลังสแกน QR

**Tasks:**
1. สร้างไฟล์ `client/src/pages/QrLandingPage.tsx`
2. ออกแบบ UI ให้สวยงามและใช้งานง่าย
3. เพิ่ม routing:
   - `/[store]/start` → QR Landing Page
   - `/[store]/self-warp` → Self Warp Page (เดิม)
   - `/[store]/song-request` → Song Request Page (ใหม่)
4. อัพเดท QR Code บน TV ให้ชี้ไปที่ `/start` แทน `/self-warp`

### Priority 2: Song Request Form (2 days)
**Goal:** ให้ผู้ใช้กรอกข้อมูลและชำระเงินเพื่อขอเพลง

**Tasks:**
1. สร้างไฟล์ `client/src/pages/SongRequestPage.tsx`
2. สร้าง form components
3. เพิ่มปุ่มเลือกจำนวนเงิน (50-3000 บาท)
4. Integration กับ backend API
5. เพิ่ม auto-polling mechanism (คัดลอกจาก PromptPayPage)
6. ทดสอบ end-to-end

### Priority 3: Admin Dashboard (1 day)
**Goal:** ให้ admin จัดการ song request queue

**Tasks:**
1. สร้าง `SongRequestQueue.tsx` component
2. เพิ่มหน้าใหม่ใน Admin Dashboard
3. แสดงรายการเพลง + filter/sort
4. ปุ่ม actions (mark as played, reject)

### Priority 4: TV Display (1 day)
**Goal:** แสดง song requests บนหน้า TV

**Tasks:**
1. แก้ไข `TvLandingPage.tsx`
2. เพิ่ม logic แสดง song request
3. ออกแบบ UI สำหรับแสดงเพลง
4. เพิ่ม SSE stream

---

## 📝 Notes

### Backend API Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.meewarp.com/api/v1
```

### API Endpoints Ready to Use
```javascript
// Customer
POST /api/v1/public/song-requests
POST /api/v1/public/song-requests/check-status
GET  /api/v1/public/song-requests/:id

// Admin
GET    /api/v1/admin/song-requests
PATCH  /api/v1/admin/song-requests/:id
DELETE /api/v1/admin/song-requests/:id
```

### Payment Methods Supported
- ✅ Stripe Checkout (Credit/Debit Card)
- ✅ PromptPay QR Code

### Webhook Events Handled
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ Auto-update status to `paid`

---

**Last Updated:** 2025-10-25  
**Current Phase:** Frontend Development (Phase 2)  
**Estimated Completion:** 4-5 days remaining

