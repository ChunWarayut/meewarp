# meeWarp

Cross-stack setup for the Warp distribution system, featuring an Express/MongoDB backend and a Vite + React (TS) frontend.

## Prerequisites
- Node.js 18+
- npm 9+
- Local MongoDB instance (or MongoDB Atlas connection string)

## Environment Setup

### Server (`/server`)
1. Copy the example env file:
   ```bash
   cp server/.env.example server/.env
   ```
2. Adjust the values as needed:
   - `SERVER_PORT` – port Express should listen on (defaults to 5000).
   - `MONGODB_URI` – Mongo connection string.
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – credentials required for the admin login endpoint.
   - `ADMIN_JWT_SECRET` – signing secret for issued JWTs.
   - `RATE_LIMIT_*` and `LOGIN_RATE_LIMIT_*` – knobs for request throttling.

### Client (`/client`)
1. Copy the example env file:
   ```bash
   cp client/.env.example client/.env
   ```
2. Update `VITE_API_BASE_URL` if the frontend should call a non-proxied API base (defaults to `/api`).

## Installation & Scripts

### Backend
```bash
cd server
npm install
npm run start
```
The server reads config from `server/.env` and, by default, connects to `mongodb://localhost:27017/meewarp`.

### Frontend
```bash
cd client
npm install
npm run dev
```
The dev server proxies `/api` to `http://localhost:5000` (configurable in `vite.config.ts`).
- `/admin` สำหรับสร้างโปรไฟล์และออก PayLink, `/admin/activity` แสดง Warp activity log แบบเรียลไทม์

## Structure Overview
```
client/      Vite React application (TS, Tailwind, React Router)
server/      Express API with Mongoose models and admin routes
```

## Testing

### Backend
```bash
cd server
npm test
```

> Uses Jest + Supertest with an in-memory MongoDB instance. Ensure your environment permits spawning child processes/listening on ephemeral ports.

### Frontend
```bash
cd client
npm run test:run
```

Vitest with Testing Library covers the admin form interactions. `npm run test` stays in watch mode for local development.

### Continuous Integration
GitHub Actions workflow at `.github/workflows/ci.yml` installs dependencies for both packages and executes the test suites on every push/PR.

## Realtime Leaderboard & Display Queue
- `GET /api/v1/leaderboard/top-supporters` returns the latest top supporters (aggregated by amount).
- `GET /api/v1/leaderboard/stream` exposes a Server-Sent Events stream; every transaction update pushes the refreshed leaderboard.
- `POST /api/v1/transactions` (admin auth required) registers a warp transaction; เมื่อเปิด Stripe ระบบจะออก Checkout Session พร้อมลิงก์ชำระเงินแล้วตั้งสถานะเป็น `pending`
- `GET /api/v1/transactions/activity-log` (admin auth) ให้ทีมงานดึง last activities ของ Warp transactions (เช่น created/updated)
- `POST /api/v1/transactions/:id/check-status` (admin auth) ซิงค์สถานะกับ Stripe PaymentIntent/Checkout เพื่ออัปเดตการชำระเงินล่าสุด
- `POST /api/v1/public/transactions/check-status` (public) ให้ลูกค้ากดตรวจสอบสถานะด้วย transactionId (อ่านอย่างเดียว, อัปเดต Stripe status ให้อัตโนมัติ)
- `GET /api/v1/display/stream` เปิด Server-Sent Events สำหรับหน้าจอหลัก ใช้จับ queue / warp กำลังแสดงผลแบบเรียลไทม์
- `POST /api/v1/public/display/next` ล็อก transaction ที่จ่ายแล้ว (`status: paid`) และอัปเดตเป็น `displaying` โดยคืนข้อมูลให้จอหลักนำไปเรนเดอร์ตามเวลาที่ซื้อมา
- `POST /api/v1/public/display/:id/complete` (public) ให้จอหลักแจ้งว่า Warp แสดงผลครบเวลาแล้ว ระบบจะบันทึกสถานะเป็น `displayed`

## Stripe Integration
- ตั้งค่า `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, และ `STRIPE_CANCEL_URL` ใน `server/.env`
- URL สำเร็จ/ยกเลิกสามารถใช้ placeholder `{CHECKOUT_SESSION_ID}` เพื่อให้ Stripe สอดแทรกค่า session อัตโนมัติ
- หากยังไม่กำหนดค่า Stripe ระบบจะถือว่าการชำระเงินสำเร็จทันที (โหมดจำลอง) เพื่อสะดวกต่อการเดโม/ทดสอบ
- Webhook endpoint อยู่ที่ `/api/v1/payments/webhook` อย่าลืมตั้งค่า secret ให้ตรงกับ Stripe Dashboard
- ปุ่มเช็กสถานะทั้งฝั่งผู้ดูแลและลูกค้าเรียก Stripe เพื่อตรวจสอบสถานะล่าสุดของการชำระเงินและอัปเดตธุรกรรมในระบบ
- รองรับ PromptPay โดยส่ง `paymentMethod: "promptpay"` มายัง endpoint สร้างธุรกรรม ระบบจะสร้าง QR code ผ่าน Stripe PaymentIntent แล้วคืนรายละเอียดกลับให้

## Customer Warp Modal (Demo)
- หน้า Landing (`/`) สรุปคุณค่าระบบ meeWarp พร้อมทางลัดไปยังโหมดต่าง ๆ
- TV landing page (`/tv`) แสดง QR Code ให้ลูกค้าสแกนเพื่อไปยังหน้า `/self-warp` บนมือถือ
- โมดัลจะเรียก `POST /api/v1/transactions` โดยดึง Bearer token แอดมินจาก Auth context (ล็อกอินใน `/admin` ก่อน)
- หากตั้งค่า Stripe แล้ว โมดัลจะเปิดหน้า Checkout ทันที; กรณีไม่ได้ตั้งค่า ระบบจะถือว่าชำระเงินเสร็จเพื่อใช้เดโม
- ลูกค้าสามารถเลือกชำระผ่าน PromptPay ได้ ระบบจะแสดง QR code พร้อมเวลาหมดอายุให้สแกน
- โมดัลมี validation และ spinner แสดงสถานะ พร้อมข้อความบอกข้อผิดพลาด (ดู `client/src/components/customer/CustomerWarpModal.tsx`)
- ลูกค้ากรอกข้อมูลและอัปโหลดรูปเอง ไม่มีขั้นตอนล็อกอินภายนอก (ดู `client/src/pages/SelfWarpPage.tsx`)

## Deployment Notes
- Set the server-side admin secrets (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`) via your hosting provider's secret manager.
- For production builds, ensure `VITE_API_BASE_URL` points to the deployed API origin.
