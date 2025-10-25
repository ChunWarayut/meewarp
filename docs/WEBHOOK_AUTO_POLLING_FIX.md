# การแก้ไขปัญหา Webhook ไม่ Trigger หน้า Payment

## ปัญหาที่พบ

หลังจากผู้ใช้สแกน QR PromptPay และชำระเงินสำเร็จ:
- ✅ Webhook จาก Stripe ทำงานปกติ (อัพเดทฐานข้อมูลให้ status เป็น `paid`)
- ❌ แต่หน้า QR Payment ไม่อัพเดทสถานะอัตโนมัติ
- ❌ ผู้ใช้ต้องกดปุ่ม "ตรวจสอบสถานะการชำระเงิน" ด้วยตัวเอง

## สาเหตุ

ระบบมี webhook endpoint และ real-time updates ผ่าน Server-Sent Events (SSE) แต่:
- SSE ใช้สำหรับหน้า TV display (`/api/v1/display/stream`) และ leaderboard เท่านั้น
- หน้า payment ไม่มี SSE stream หรือ auto-polling mechanism
- ต้องรอให้ผู้ใช้กดปุ่มตรวจสอบด้วยตนเอง

## การแก้ไข

### 1. เพิ่ม Auto-Polling ใน `PromptPayPage.tsx`

เพิ่ม useEffect ที่ตรวจสอบสถานะการชำระเงินอัตโนมัติทุกๆ **3 วินาที**:

```typescript
// Auto-polling payment status every 3 seconds
useEffect(() => {
  if (!transactionId || isPaid || isCheckingStatus) {
    return undefined;
  }

  const pollPaymentStatus = async () => {
    try {
      const result = await checkPaymentStatus(transactionId, resolvedStoreSlug || 'default');
      
      if (result.success && (result.isAlreadyPaid || result.status === 'paid' || result.status === 'displayed')) {
        setStatus('success');
        setMessage('ชำระเงินเรียบร้อยแล้ว! ทีมงานจะดัน Warp ของคุณขึ้นจอทันที');
        setIsPaid(true);
        setShowThankYouModal(true);
      }
    } catch (error) {
      console.error('Auto-poll error:', error);
    }
  };

  // Poll immediately on mount
  pollPaymentStatus();

  // Then poll every 3 seconds
  const intervalId = setInterval(pollPaymentStatus, 3000);

  return () => {
    clearInterval(intervalId);
  };
}, [transactionId, isPaid, isCheckingStatus, resolvedStoreSlug, checkPaymentStatus]);
```

**คุณสมบัติ:**
- ✅ Polling ทันทีที่หน้าโหลด
- ✅ Polling ทุกๆ 3 วินาที
- ✅ หยุด polling เมื่อชำระเงินสำเร็จ
- ✅ หยุด polling เมื่อ component unmount
- ✅ ป้องกัน polling ซ้ำซ้อนเมื่อกำลังตรวจสอบอยู่แล้ว

### 2. เพิ่ม Visual Indicator

แสดง indicator ให้ผู้ใช้ทราบว่าระบบกำลังตรวจสอบอัตโนมัติ:

```tsx
<div className="mt-6 text-center">
  <div className="flex items-center justify-center gap-2 mb-2">
    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
    <p className="text-xs text-emerald-100/90 font-medium">
      กำลังตรวจสอบสถานะอัตโนมัติ...
    </p>
  </div>
  <p className="text-xs text-emerald-100/60">
    หลังชำระเงินแล้ว ระบบจะแจ้งเตือนให้ทันที
  </p>
</div>
```

### 3. เพิ่ม Auto-Polling ใน `CustomerWarpModal.tsx`

เพิ่ม auto-polling mechanism เช่นเดียวกันใน modal:

```typescript
// Auto-polling payment status every 3 seconds
useEffect(() => {
  if (!transactionId || !promptPayData || isPaid || isCheckingStatus || !isOpen) {
    return undefined;
  }

  const pollPaymentStatus = async () => {
    try {
      const result = await checkPaymentStatus(transactionId, resolvedStoreSlug || 'default');
      
      if (result.success && (result.isAlreadyPaid || result.status === 'paid' || result.status === 'displayed')) {
        setStatus('success');
        setMessage('ชำระเงินเรียบร้อยแล้ว! ทีมงานจะดัน Warp ของคุณขึ้นจอทันที');
        setIsPaid(true);
        setCheckoutSession(null);
        setPromptPayData(null);
        setTransactionId(null);
        setShowThankYouModal(true);
      }
    } catch (error) {
      console.error('Auto-poll error:', error);
    }
  };

  // Poll immediately on mount
  pollPaymentStatus();

  // Then poll every 3 seconds
  const intervalId = setInterval(pollPaymentStatus, 3000);

  return () => {
    clearInterval(intervalId);
  };
}, [transactionId, promptPayData, isPaid, isCheckingStatus, isOpen, resolvedStoreSlug, checkPaymentStatus]);
```

## ไฟล์ที่แก้ไข

1. ✅ `/client/src/pages/PromptPayPage.tsx`
   - เพิ่ม auto-polling useEffect
   - เพิ่ม visual indicator สำหรับ auto-checking
   - เพิ่ม state `pollingCount`

2. ✅ `/client/src/components/customer/CustomerWarpModal.tsx`
   - เพิ่ม auto-polling useEffect
   - เพิ่ม visual indicator
   - เพิ่ม state `isPaid`

3. ℹ️ `/client/src/pages/SelfWarpPage.tsx`
   - ไม่ต้องแก้ไข (มีการ redirect ไปหน้า PromptPayPage อยู่แล้ว)

## ผลลัพธ์

### ก่อนแก้ไข
- ❌ ผู้ใช้ต้องกดปุ่ม "ตรวจสอบสถานะการชำระเงิน" ด้วยตนเอง
- ❌ ไม่มีการแจ้งเตือนอัตโนมัติ
- ❌ UX ไม่ดี ต้องรอให้ผู้ใช้กระทำเอง

### หลังแก้ไข
- ✅ ระบบตรวจสอบสถานะอัตโนมัติทุกๆ 3 วินาที
- ✅ แจ้งเตือนผู้ใช้ทันทีที่ชำระเงินสำเร็จ
- ✅ แสดง Thank You Modal อัตโนมัติ
- ✅ มี visual indicator บอกว่ากำลังตรวจสอบอยู่
- ✅ UX ดีขึ้นมาก ไม่ต้องให้ผู้ใช้ทำอะไรเพิ่ม

## การทดสอบ

1. เปิดหน้า Self Warp Page
2. กรอกข้อมูลและเลือก "PromptPay QR"
3. Submit form → จะ redirect ไปหน้า PromptPayPage
4. สังเกต visual indicator "กำลังตรวจสอบสถานะอัตโนมัติ..."
5. สแกน QR Code และชำระเงิน
6. **ภายใน 3 วินาที** หน้าจะอัพเดทเป็น "ชำระเงินเรียบร้อยแล้ว!" และแสดง Thank You Modal

## Performance Considerations

### Polling Interval: 3 วินาที

**เหตุผล:**
- ⚡ ไวพอที่จะให้ UX ดี (ผู้ใช้ไม่ต้องรอนาน)
- 💰 ไม่เปลือง server resources มากเกินไป
- 🔋 ไม่เปลือง battery บนมือถือ

**API Calls:**
- ทุก 3 วินาที = 20 requests/นาที
- ถ้าผู้ใช้ 100 คน = 2,000 requests/นาที
- เป็น lightweight endpoint (read-only) จาก MongoDB

**Alternative Solutions (สำหรับอนาคต):**
1. **WebSocket** - real-time two-way communication
2. **Server-Sent Events (SSE)** - เพิ่ม payment stream endpoint
3. **Exponential Backoff** - เริ่มที่ 3s แล้วค่อยๆ เพิ่มเป็น 5s, 10s, 15s

## Notes

- Auto-polling จะหยุดทันทีที่ได้ผล `paid`, `displayed`, หรือ `isAlreadyPaid`
- Error handling มีอยู่แล้ว (console.error) แต่ไม่แสดงต่อผู้ใช้เพื่อไม่ให้รบกวน UX
- Polling จะหยุดเมื่อ component unmount (cleanup function)
- Modal polling จะหยุดเมื่อปิด modal (`!isOpen`)

## Date
2025-10-25

