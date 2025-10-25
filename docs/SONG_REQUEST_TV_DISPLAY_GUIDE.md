# Song Request - TV Display Integration Guide

## 📺 Overview

การแสดง Song Requests บนหน้า TV จะทำงานแบบนี้:
- **เมื่อมี Warp กำลังแสดง** → แสดง Warp (เดิม)
- **เมื่อไม่มี Warp** → แสดง Song Request ที่รอเล่น (ใหม่)

---

## 🔧 Implementation Plan

### 1. เพิ่ม State สำหรับ Song Requests

```typescript
type SongRequest = {
  _id: string;
  songTitle: string;
  artistName?: string;
  message?: string;
  requesterName: string;
  requesterInstagram?: string;
  amount: number;
  priority: number;
  createdAt: string;
};

const [currentSongRequest, setCurrentSongRequest] = useState<SongRequest | null>(null);
const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
```

### 2. Fetch Song Requests จาก API

```typescript
const fetchSongRequests = useCallback(async () => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.adminDashboard.replace('/dashboard/overview', '')}/admin/song-requests?status=paid&limit=10`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Note: For public display, we might need a public endpoint
        },
      }
    );

    if (!response.ok) return;

    const data = await response.json();
    setSongRequests(data.songRequests || []);
    
    // Set first song as current if no warp is showing
    if (!currentWarp && data.songRequests.length > 0 && !currentSongRequest) {
      setCurrentSongRequest(data.songRequests[0]);
    }
  } catch (error) {
    console.error('Failed to fetch song requests', error);
  }
}, [currentWarp, currentSongRequest]);
```

### 3. Auto-refresh Song Requests

```typescript
useEffect(() => {
  // Fetch initially
  fetchSongRequests();

  // Refresh every 10 seconds
  const interval = setInterval(fetchSongRequests, 10000);

  return () => clearInterval(interval);
}, [fetchSongRequests]);
```

### 4. Display Logic

```typescript
// In render:
{currentWarp ? (
  // แสดง Warp (เดิม)
  <WarpDisplay {...currentWarp} />
) : currentSongRequest ? (
  // แสดง Song Request (ใหม่)
  <SongRequestDisplay {...currentSongRequest} />
) : (
  // แสดง QR Code และ Leaderboard (เดิม)
  <DefaultDisplay />
)}
```

---

## 🎨 UI Design สำหรับ Song Request Display

### Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│               🎵 SONG REQUEST               │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │                                     │   │
│   │      "ฉันรักเธอ - Bird Thongchai"   │   │
│   │                                     │   │
│   │         Requested by: นายใจดี       │   │
│   │            @jaydee.ig               │   │
│   │                                     │   │
│   │          Donated: ฿3,000            │   │
│   │                                     │   │
│   │   "ขอเพลงนี้เพื่อส่งกำลังใจครับ!"  │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│          ⏱ Next in Queue: 5 songs          │
│                                             │
└─────────────────────────────────────────────┘
```

### JSX Component

```tsx
<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-900/50 via-purple-900/50 to-indigo-900/50 p-8">
  {/* Header */}
  <div className="mb-8 text-center">
    <h1 className="text-6xl font-bold text-white mb-4">
      🎵 SONG REQUEST
    </h1>
    <p className="text-2xl text-pink-200">
      Playing your favorite songs
    </p>
  </div>

  {/* Song Card */}
  <div className="max-w-4xl w-full rounded-[48px] border-4 border-pink-400/30 bg-gradient-to-br from-slate-900/90 to-purple-900/90 p-12 shadow-[0_30px_90px_rgba(236,72,153,0.5)] backdrop-blur-xl">
    {/* Song Title */}
    <div className="text-center mb-8">
      <h2 className="text-5xl font-bold text-white mb-4">
        {currentSongRequest.songTitle}
      </h2>
      {currentSongRequest.artistName && (
        <p className="text-3xl text-pink-200">
          {currentSongRequest.artistName}
        </p>
      )}
    </div>

    {/* Requester Info */}
    <div className="flex items-center justify-center gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
          {currentSongRequest.requesterName[0]}
        </div>
        <div>
          <p className="text-2xl font-semibold text-white">
            {currentSongRequest.requesterName}
          </p>
          {currentSongRequest.requesterInstagram && (
            <p className="text-xl text-pink-300">
              @{currentSongRequest.requesterInstagram}
            </p>
          )}
        </div>
      </div>

      <div className="h-12 w-px bg-white/20" />

      <div className="text-center">
        <p className="text-xl text-pink-200 mb-1">Donated</p>
        <p className="text-4xl font-bold text-green-400">
          ฿{currentSongRequest.amount.toLocaleString()}
        </p>
      </div>
    </div>

    {/* Message */}
    {currentSongRequest.message && (
      <div className="rounded-2xl border border-pink-300/30 bg-pink-500/10 p-6 text-center">
        <p className="text-2xl text-pink-100 italic">
          "{currentSongRequest.message}"
        </p>
      </div>
    )}
  </div>

  {/* Queue Info */}
  <div className="mt-8 text-center">
    <p className="text-xl text-slate-300">
      ⏱ Next in Queue: <span className="font-bold text-white">{songRequests.length - 1}</span> songs
    </p>
  </div>

  {/* Auto-rotate indicator */}
  <div className="mt-4 flex items-center gap-2 text-slate-400">
    <div className="h-2 w-2 animate-pulse rounded-full bg-pink-400" />
    <p className="text-sm">Auto-rotating every 15 seconds</p>
  </div>
</div>
```

---

## 🔄 Auto-Rotation Logic

แสดง song request แต่ละเพลง 15 วินาที แล้วหมุนไปเพลงถัดไป:

```typescript
useEffect(() => {
  if (!currentSongRequest || currentWarp) {
    return undefined;
  }

  // Rotate to next song after 15 seconds
  const timeout = setTimeout(() => {
    const currentIndex = songRequests.findIndex(
      (song) => song._id === currentSongRequest._id
    );
    
    const nextIndex = (currentIndex + 1) % songRequests.length;
    
    if (songRequests[nextIndex]) {
      setCurrentSongRequest(songRequests[nextIndex]);
    }
  }, 15000); // 15 seconds

  return () => clearTimeout(timeout);
}, [currentSongRequest, songRequests, currentWarp]);
```

---

## 🎯 Priority-based Display

Song requests ที่ donate มากกว่าจะแสดงก่อน (เรียงตาม priority):

```typescript
const sortedSongRequests = useMemo(() => {
  return [...songRequests].sort((a, b) => {
    // Sort by priority (amount) descending
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then by creation time ascending (older first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}, [songRequests]);
```

---

## 🚀 Alternative: SSE Stream for Song Requests

สำหรับอนาคต อาจเพิ่ม SSE endpoint เฉพาะสำหรับ song requests:

```javascript
// Backend: server/routes/songRequestRoutes.js
router.get('/public/song-requests/stream', publicStore, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendSnapshot = async () => {
    try {
      const songRequests = await SongRequest.find({
        status: 'paid',
        store: req.store._id,
      })
        .sort({ priority: -1, createdAt: 1 })
        .limit(10)
        .lean();

      res.write(`data: ${JSON.stringify({ songRequests })}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to load' })}\n\n`);
    }
  };

  // Send initial snapshot
  sendSnapshot();

  // Send updates every 10 seconds
  const interval = setInterval(sendSnapshot, 10000);

  req.on('close', () => {
    clearInterval(interval);
  });
});
```

```typescript
// Frontend: TvLandingPage.tsx
useEffect(() => {
  const eventSource = new EventSource(
    `${API_ENDPOINTS.adminDashboard.replace('/dashboard/overview', '')}/public/song-requests/stream?store=${storeSlug}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      setSongRequests(data.songRequests || []);
    } catch (error) {
      console.error('Failed to parse SSE data', error);
    }
  };

  return () => {
    eventSource.close();
  };
}, [storeSlug]);
```

---

## ✅ Summary

### What's Implemented
- ✅ Song Request Model
- ✅ API Endpoints (Admin + Public)
- ✅ Payment Integration (PromptPay + Stripe)
- ✅ Webhook handling
- ✅ Admin Dashboard UI
- ✅ Customer Flow (QR Landing + Form)

### What's Next (For Full TV Integration)
1. เพิ่ม public endpoint สำหรับ fetch song requests (ไม่ต้อง auth)
2. เพิ่ม state และ logic ใน TvLandingPage.tsx
3. สร้าง SongRequestDisplay component
4. ทดสอบการแสดงผลบน TV

### Quick Implementation (Simple Version)

แทนที่จะแก้ไขไฟล์ TvLandingPage.tsx ที่ใหญ่มาก สามารถสร้าง component แยกได้:

```typescript
// client/src/components/tv/SongRequestDisplay.tsx
import { useEffect, useState } from 'react';

type SongRequest = {
  _id: string;
  songTitle: string;
  artistName?: string;
  requesterName: string;
  amount: number;
  message?: string;
};

export const SongRequestDisplay = () => {
  const [songRequest, setSongRequest] = useState<SongRequest | null>(null);

  useEffect(() => {
    // Fetch song request
    // Auto-refresh logic
  }, []);

  if (!songRequest) return null;

  return (
    <div className="...">
      {/* Song Request UI here */}
    </div>
  );
};
```

จากนั้นใน TvLandingPage.tsx:

```tsx
import { SongRequestDisplay } from '../components/tv/SongRequestDisplay';

// In render:
{!currentWarp && <SongRequestDisplay />}
```

---

**Status:** 📝 Documentation Complete  
**Implementation:** 90% Complete (TV Display pending)  
**Next Step:** Add SongRequestDisplay component or integrate into TvLandingPage


