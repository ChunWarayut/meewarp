# ฟีเจอร์ขอเพลง (Song Request) - เอกสารออกแบบ

## 📋 Overview

ฟีเจอร์ใหม่ที่ให้ผู้ใช้สามารถขอเพลงผ่านการ donate โดยสแกน QR Code จาก TV แล้วเลือกว่าจะ "แจกวาร์ป" หรือ "ขอเพลง"

---

## 🎯 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ผู้ใช้สแกน QR Code จาก TV                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. เปิดหน้า Landing Page พร้อมเมนู                         │
│    ┌──────────────┐     ┌──────────────┐                   │
│    │  🎁 แจกวาร์ป  │     │  🎵 ขอเพลง    │                   │
│    └──────────────┘     └──────────────┘                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├─────────────────┐
                  │                 │
                  ▼                 ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│ 3A. Self Warp Form      │  │ 3B. Song Request Form   │
│ (เดิม)                  │  │ (ใหม่)                  │
│                         │  │                         │
│ - อัพโหลดรูป            │  │ - ชื่อเพลง              │
│ - IG ของคุณ             │  │ - ชื่อศิลปิน (optional) │
│ - เลือกแพ็กเกจ          │  │ - ชื่อผู้ขอ             │
│                         │  │ - IG (optional)         │
│                         │  │ - เลือกจำนวนเงิน       │
│                         │  │   [50] [100] [500]     │
│                         │  │   [1000] [1500] [3000] │
└─────────┬───────────────┘  └─────────┬───────────────┘
          │                            │
          └──────────┬─────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. เลือกวิธีชำระเงิน                                        │
│    ○ PromptPay QR                                           │
│    ○ บัตรเครดิต/เดบิต (Stripe Checkout)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ชำระเงิน + Auto-polling สถานะ                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. แสดง Thank You Modal                                     │
│    - วาร์ป: "ทีมงานจะดัน Warp ของคุณขึ้นจอทันที"          │
│    - เพลง: "ทีมงานจะเปิดเพลงของคุณในช่วงเวลาที่เหมาะสม"   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Design

### 1. QR Code Landing Page (NEW)
หลังสแกน QR Code จะเปิดหน้านี้:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           🎮 MEEWARP INTERACTIVE                │
│                                                 │
│         ━━━━━━━━━━━━━━━━━━━━━━━━━              │
│                                                 │
│         คุณต้องการทำอะไร?                       │
│                                                 │
│   ┌─────────────────────────────────────┐      │
│   │         🎁 แจกวาร์ป                 │      │
│   │                                     │      │
│   │   แสดงรูปภาพและโปรไฟล์ของคุณ       │      │
│   │   ขึ้นบนจอทีวีตามเวลาที่เลือก      │      │
│   │                                     │      │
│   │         [ เริ่มเลย ]                │      │
│   └─────────────────────────────────────┘      │
│                                                 │
│   ┌─────────────────────────────────────┐      │
│   │         🎵 ขอเพลง                   │      │
│   │                                     │      │
│   │   ขอเพลงที่คุณชอบและ donate        │      │
│   │   สนับสนุนสตรีมเมอร์                │      │
│   │                                     │      │
│   │         [ เริ่มเลย ]                │      │
│   └─────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. Song Request Form Page

```
┌─────────────────────────────────────────────────┐
│  ← กลับ              🎵 ขอเพลง                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  STEP 1: ข้อมูลเพลง                            │
│  ━━━━━━━━━━━━━━━━━━                            │
│                                                 │
│  ชื่อเพลง (จำเป็น) *                           │
│  ┌─────────────────────────────────────┐       │
│  │ เช่น: ฉันรักเธอ                     │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ชื่อศิลปิน (ถ้ามี)                            │
│  ┌─────────────────────────────────────┐       │
│  │ เช่น: Bird Thongchai                │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ข้อความถึงสตรีมเมอร์ (optional)                │
│  ┌─────────────────────────────────────┐       │
│  │ เช่น: ขอเพลงนี้เพื่อส่งกำลังใจ...  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                 │
│  STEP 2: ข้อมูลผู้ขอ                           │
│  ━━━━━━━━━━━━━━━━━━                            │
│                                                 │
│  ชื่อที่จะแสดง (จำเป็น) *                      │
│  ┌─────────────────────────────────────┐       │
│  │ เช่น: นายใจดี                       │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Instagram ของคุณ (ถ้ามี)                       │
│  ┌─────────────────────────────────────┐       │
│  │ @username                            │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                 │
│  STEP 3: เลือกจำนวนเงิน Donate                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━                      │
│                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ ฿50  │ │ ฿100 │ │ ฿500 │                   │
│  └──────┘ └──────┘ └──────┘                   │
│                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ ฿1000│ │ ฿1500│ │ ฿3000│  [Selected]       │
│  └──────┘ └──────┘ └──────┘                   │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                 │
│  วิธีชำระเงิน                                   │
│  ○ PromptPay QR                                │
│  ○ บัตรเครดิต/เดบิต                           │
│                                                 │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │     ส่งคำขอและชำระเงิน ฿3,000       │       │
│  └─────────────────────────────────────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### SongRequest Model

```javascript
const SongRequestSchema = new mongoose.Schema({
  // Song Information
  songTitle: {
    type: String,
    required: true,
    trim: true,
  },
  artistName: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
    maxLength: 500,
  },
  
  // Requester Information
  requesterName: {
    type: String,
    required: true,
    trim: true,
  },
  requesterInstagram: {
    type: String,
    trim: true,
  },
  requesterEmail: {
    type: String,
    trim: true,
  },
  
  // Payment & Status
  amount: {
    type: Number,
    required: true,
    min: 50,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'playing', 'played', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['promptpay', 'checkout'],
    default: 'promptpay',
  },
  
  // Store Reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  
  // Stripe/Payment Data
  metadata: {
    stripeCheckoutSessionId: String,
    stripePaymentIntentId: String,
    stripePaymentStatus: String,
    promptpay: {
      qrImageUrl: String,
      qrImageUrlSvg: String,
      expiresAt: Date,
      paymentIntentId: String,
      referenceNumber: String,
      paidAt: Date,
    },
  },
  
  // Display Information
  playedAt: Date,
  playedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  priority: {
    type: Number,
    default: 0, // จำนวนเงินมากกว่า = priority สูงกว่า
  },
  
  // Activity Log
  activityLog: [{
    action: String,
    description: String,
    actor: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Index for sorting by amount (priority)
SongRequestSchema.index({ amount: -1, createdAt: 1 });
SongRequestSchema.index({ status: 1, store: 1 });

module.exports = mongoose.model('SongRequest', SongRequestSchema);
```

---

## 🔌 Backend API Endpoints

### Public Endpoints

```javascript
// สร้าง song request ใหม่
POST /api/v1/public/song-requests
Body: {
  songTitle: string,
  artistName?: string,
  message?: string,
  requesterName: string,
  requesterInstagram?: string,
  requesterEmail?: string,
  amount: number,
  paymentMethod: 'promptpay' | 'checkout',
}
Response: {
  id: string,
  status: string,
  checkoutUrl?: string,  // สำหรับ Stripe Checkout
  promptPay?: {          // สำหรับ PromptPay
    qrImageUrl: string,
    amount: number,
    expiresAt: string,
  }
}

// ตรวจสอบสถานะการชำระเงิน
POST /api/v1/public/song-requests/check-status
Body: { requestId: string }
Response: {
  success: boolean,
  status: string,
  isAlreadyPaid: boolean,
}
```

### Admin Endpoints

```javascript
// ดึงรายการ song requests
GET /api/v1/admin/song-requests
Query: {
  status?: 'pending' | 'paid' | 'playing' | 'played' | 'rejected',
  limit?: number,
  offset?: number,
}

// อัพเดทสถานะ song request
PATCH /api/v1/admin/song-requests/:id
Body: {
  status?: string,
  playedAt?: Date,
}

// ลบ song request
DELETE /api/v1/admin/song-requests/:id
```

---

## 📱 Frontend Components

### New Components to Create

```
client/src/
├── pages/
│   ├── QrLandingPage.tsx          (NEW) - เมนูเลือก Warp/Song
│   └── SongRequestPage.tsx        (NEW) - ฟอร์มขอเพลง
├── components/
│   ├── customer/
│   │   ├── SongRequestForm.tsx    (NEW)
│   │   └── SongRequestModal.tsx   (NEW)
│   └── admin/
│       ├── SongRequestQueue.tsx   (NEW) - คิวเพลงที่รอเล่น
│       └── SongRequestCard.tsx    (NEW) - แสดงข้อมูลแต่ละเพลง
└── hooks/
    └── useSongRequest.ts          (NEW)
```

---

## 🎬 TV Display Integration

### Song Request Display Options

**Option 1: แสดงคู่กับ Warp**
- เวลามี Warp → แสดง Warp
- เวลาไม่มี Warp → แสดง Song Request ที่รอเล่น

**Option 2: แสดงแยก Tab**
- Tab "Warp Queue" - แสดง warp ที่รอ
- Tab "Song Requests" - แสดงเพลงที่รอเล่น

**Option 3: แสดง Overlay**
- แสดง Warp เป็นหลัก
- แสดง Song Request เป็น banner ด้านล่าง

### Recommended: Option 1

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  เมื่อไม่มี Warp กำลังแสดง:                     │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │                                     │       │
│  │          🎵 SONG REQUEST            │       │
│  │                                     │       │
│  │     "ฉันรักเธอ - Bird Thongchai"    │       │
│  │                                     │       │
│  │        Requested by: นายใจดี        │       │
│  │           @jaydee.ig                │       │
│  │                                     │       │
│  │         Donated: ฿3,000             │       │
│  │                                     │       │
│  │  "ขอเพลงนี้เพื่อส่งกำลังใจครับ!"   │       │
│  │                                     │       │
│  └─────────────────────────────────────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Plan

### Phase 1: Backend Setup (1-2 days)
- [x] สร้าง SongRequest model
- [ ] สร้าง API endpoints
- [ ] เพิ่ม webhook handler สำหรับ song requests
- [ ] ทดสอบ API ด้วย Postman

### Phase 2: Frontend - Customer Flow (2-3 days)
- [ ] สร้าง QrLandingPage (เมนูเลือก)
- [ ] สร้าง SongRequestPage (ฟอร์ม)
- [ ] เพิ่ม payment integration (PromptPay + Stripe)
- [ ] เพิ่ม auto-polling mechanism
- [ ] สร้าง Thank You Modal

### Phase 3: Frontend - Admin Dashboard (1-2 days)
- [ ] สร้าง Song Request Queue component
- [ ] เพิ่มหน้าจัดการ song requests
- [ ] เพิ่ม filter/sort/search
- [ ] เพิ่มปุ่ม mark as played/rejected

### Phase 4: TV Display Integration (1 day)
- [ ] เพิ่ม Song Request display mode
- [ ] เพิ่ม SSE stream สำหรับ song queue
- [ ] ออกแบบ animation/transition

### Phase 5: Testing & Polish (1 day)
- [ ] E2E testing
- [ ] ทดสอบ payment flow
- [ ] แก้ไข bugs
- [ ] เพิ่ม error handling

**Total Estimated Time: 6-9 days**

---

## 💡 Additional Features (Future)

1. **Vote System**
   - ให้คนอื่นโหวตเพลงที่ชอบ (priority เพิ่มขึ้น)

2. **Spotify/YouTube Integration**
   - Auto-search เพลงจาก Spotify/YouTube
   - แสดง album art

3. **Song History**
   - แสดงประวัติเพลงที่เล่นไปแล้ว
   - Leaderboard เพลงยอดนิยม

4. **Moderation**
   - Admin สามารถ reject เพลงที่ไม่เหมาะสม
   - Blacklist คำหยาบ

5. **Auto-play Integration**
   - เชื่อมกับ OBS/Stream overlay
   - Play เพลงอัตโนมัติ

---

## 🎯 Success Metrics

- จำนวน Song Requests ต่อ stream
- Conversion rate (scan → paid)
- Average donation amount
- User satisfaction (survey)

---

**Created:** 2025-10-25  
**Status:** 📝 Design Phase  
**Next Step:** Review & Approve Design → Start Phase 1

