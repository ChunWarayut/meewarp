import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import ThankYouModal from '../components/customer/ThankYouModal';
import { resolveStoreSlug } from '../utils/storeSlug';
import { usePaymentStatus } from '../hooks/usePaymentStatus';

type FormState = {
  songTitle: string;
  artistName: string;
  message: string;
  requesterName: string;
  requesterInstagram: string;
  requesterEmail: string;
  amount: number;
  paymentMethod: 'promptpay' | 'checkout';
};

const defaultState: FormState = {
  songTitle: '',
  artistName: '',
  message: '',
  requesterName: '',
  requesterInstagram: '',
  requesterEmail: '',
  amount: 100,
  paymentMethod: 'promptpay',
};

const amountOptions = [50, 100, 500, 1000, 1500, 3000];

const paymentMethodOptions: Array<{
  id: 'promptpay' | 'checkout';
  label: string;
  description: string;
}> = [
  {
    id: 'promptpay',
    label: 'PromptPay QR',
    description: 'สแกนด้วยแอปธนาคารหรือวอลเล็ตที่รองรับ',
  },
  {
    id: 'checkout',
    label: 'บัตรเครดิต / เดบิต',
    description: 'ชำระผ่านหน้า Stripe Checkout',
  },
];

type CheckoutSessionInfo = {
  url: string;
  sessionId?: string;
};

type PromptPayData = {
  qrImageUrl?: string;
  qrImageUrlSvg?: string;
  expiresAt?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
};

const SongRequestPage = () => {
  const navigate = useNavigate();
  const { storeSlug } = useParams<{ storeSlug?: string }>();
  const resolvedStoreSlug = resolveStoreSlug(storeSlug);
  const homeLink = resolvedStoreSlug ? `/${resolvedStoreSlug}` : '/';

  const [form, setForm] = useState<FormState>(defaultState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionInfo | null>(null);
  const [promptPayData, setPromptPayData] = useState<PromptPayData | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const { checkPaymentStatus } = usePaymentStatus();

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleInstagramChange = (rawValue: string) => {
    const trimmed = rawValue.replace(/\s+/g, '');
    const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    setForm((prev) => ({
      ...prev,
      requesterInstagram: withoutAt,
    }));
  };

  // Auto-polling payment status every 3 seconds
  useEffect(() => {
    if (!requestId || !promptPayData || isPaid || isCheckingStatus) {
      return undefined;
    }

    const pollPaymentStatus = async () => {
      try {
        // Use song request check-status endpoint
        const endpoint = API_ENDPOINTS.publicTransactions(resolvedStoreSlug).replace('/transactions', '/song-requests/check-status');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId }),
        });

        const result = await response.json();

        if (result.success && (result.isAlreadyPaid || result.status === 'paid' || result.status === 'playing' || result.status === 'played')) {
          setStatus('success');
          setMessage('ชำระเงินเรียบร้อยแล้ว! ทีมงานจะเปิดเพลงของคุณในช่วงเวลาที่เหมาะสม');
          setIsPaid(true);
          setPromptPayData(null);
          setCheckoutSession(null);
          setShowThankYouModal(true);
        }
      } catch (error) {
        console.error('Auto-poll error:', error);
      }
    };

    // Poll immediately
    pollPaymentStatus();

    // Then poll every 3 seconds
    const intervalId = setInterval(pollPaymentStatus, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [requestId, promptPayData, isPaid, isCheckingStatus, resolvedStoreSlug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    setFieldErrors({});
    setShowThankYouModal(false);
    setCheckoutSession(null);
    setPromptPayData(null);

    const errors: Record<string, string> = {};

    if (!form.songTitle.trim()) {
      errors.songTitle = 'กรุณากรอกชื่อเพลง';
    }
    if (!form.requesterName.trim()) {
      errors.requesterName = 'กรุณากรอกชื่อของคุณ';
    }
    if (!form.amount || form.amount < 50) {
      errors.amount = 'จำนวนเงินต้องมากกว่า 50 บาท';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus('error');
      setMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const payload = {
        songTitle: form.songTitle.trim(),
        artistName: form.artistName.trim() || undefined,
        message: form.message.trim() || undefined,
        requesterName: form.requesterName.trim(),
        requesterInstagram: form.requesterInstagram.trim() || undefined,
        requesterEmail: form.requesterEmail.trim() || 'noreply@meewarp.com',
        amount: form.amount,
        paymentMethod: form.paymentMethod,
      };

      const response = await fetch(API_ENDPOINTS.publicTransactions(resolvedStoreSlug).replace('/transactions', '/song-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'ไม่สามารถส่งคำขอเพลงได้');
      }

      const data = await response.json();
      const songRequestId = data?.id;
      const checkoutUrl: string | undefined = data?.checkoutUrl;
      const promptPay = (data?.promptPay as PromptPayData | null) ?? null;

      setRequestId(songRequestId);
      setPromptPayData(promptPay);

      if (promptPay) {
        // Show PromptPay QR in same page
        setStatus('success');
        setMessage('สแกน QR Code ด้านล่างเพื่อชำระเงิน');
      } else if (checkoutUrl) {
        // Redirect to Stripe Checkout
        setCheckoutSession({ url: checkoutUrl });
        setStatus('success');
        setMessage('กำลังเปิดหน้าชำระเงิน Stripe...');
        window.location.href = checkoutUrl;
      } else {
        setStatus('success');
        setMessage('ส่งคำขอเพลงเรียบร้อยแล้ว!');
        setShowThankYouModal(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  const priceLabel = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(form.amount);

  return (
    <div className="overflow-hidden relative min-h-screen bg-slate-950 text-slate-100 font-th" style={{ letterSpacing: '-0.02em' }}>
      {/* Background Gradients */}
      <div
        className="absolute -top-32 inset-x-1/3 w-72 h-72 rounded-full blur-3xl pointer-events-none bg-pink-500/30"
        aria-hidden
      />
      <div
        className="absolute -left-12 top-1/2 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 pointer-events-none bg-rose-500/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-purple-500/25 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 px-4 py-10 mx-auto max-w-4xl sm:px-6 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate(resolvedStoreSlug ? `/${resolvedStoreSlug}/start` : '/start')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-4"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              กลับ
            </button>
            <h1
              lang="th"
              className="mt-2 text-4xl font-semibold drop-shadow-[0_0_35px_rgba(236,72,153,0.45)] sm:text-5xl"
              style={{ 
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🎵 ขอเพลง
            </h1>
            <p lang="th" className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              ขอเพลงที่คุณชอบและ donate สนับสนุนสตรีมเมอร์
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_90px_rgba(8,12,24,0.65)] backdrop-blur-xl sm:p-10">
          {!promptPayData && !isPaid ? (
            <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
              {/* Step 1: Song Information */}
              <section>
                <h3 className="font-en text-xs uppercase tracking-[0.45em] text-pink-300 sm:text-sm">Step 1: ข้อมูลเพลง</h3>

                <div className="grid gap-4 mt-4 sm:mt-6">
                  {/* Song Title */}
                  <div>
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ชื่อเพลง (จำเป็น) *
                    </label>
                    <input
                      type="text"
                      value={form.songTitle}
                      onChange={(event) => handleChange('songTitle', event.target.value)}
                      placeholder="เช่น: ฉันรักเธอ"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-pink-400/70 focus:outline-none focus:ring-2 focus:ring-pink-400/20 sm:mt-3"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                    {fieldErrors.songTitle ? (
                      <p className="mt-1 text-xs text-rose-300">{fieldErrors.songTitle}</p>
                    ) : null}
                  </div>

                  {/* Artist Name */}
                  <div>
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ชื่อศิลปิน (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={form.artistName}
                      onChange={(event) => handleChange('artistName', event.target.value)}
                      placeholder="เช่น: Bird Thongchai"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-pink-400/70 focus:outline-none focus:ring-2 focus:ring-pink-400/20 sm:mt-3"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ข้อความถึงสตรีมเมอร์ (ถ้ามี)
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(event) => handleChange('message', event.target.value)}
                      placeholder="เช่น: ขอเพลงนี้เพื่อส่งกำลังใจ..."
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-pink-400/70 focus:outline-none focus:ring-2 focus:ring-pink-400/20 sm:mt-3"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Step 2: Requester Information */}
              <section>
                <h3 className="font-en text-xs uppercase tracking-[0.45em] text-pink-300 sm:text-sm">Step 2: ข้อมูลผู้ขอ</h3>

                <div className="grid gap-4 mt-4 sm:mt-6 lg:grid-cols-2">
                  {/* Requester Name */}
                  <div>
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ชื่อที่จะแสดง (จำเป็น) *
                    </label>
                    <input
                      type="text"
                      value={form.requesterName}
                      onChange={(event) => handleChange('requesterName', event.target.value)}
                      placeholder="เช่น: นายใจดี"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-pink-400/70 focus:outline-none focus:ring-2 focus:ring-pink-400/20 sm:mt-3"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                    {fieldErrors.requesterName ? (
                      <p className="mt-1 text-xs text-rose-300">{fieldErrors.requesterName}</p>
                    ) : null}
                  </div>

                  {/* Instagram */}
                  <div>
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      Instagram (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={form.requesterInstagram}
                      onChange={(event) => handleInstagramChange(event.target.value)}
                      placeholder="@username"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-pink-400/70 focus:outline-none focus:ring-2 focus:ring-pink-400/20 sm:mt-3"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Step 3: Amount Selection */}
              <section>
                <h3 className="font-en text-xs uppercase tracking-[0.45em] text-pink-300 sm:text-sm mb-4 sm:mb-6">
                  Step 3: เลือกจำนวนเงิน Donate
                </h3>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {amountOptions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleChange('amount', amount)}
                      className={`rounded-2xl border px-4 py-4 text-center transition hover:scale-105 ${
                        form.amount === amount
                          ? 'border-pink-400/70 bg-pink-500/20 text-pink-100'
                          : 'border-white/15 bg-slate-950/40 text-slate-300 hover:border-pink-400/30'
                      }`}
                    >
                      <div className="text-lg font-bold sm:text-xl">
                        ฿{amount.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Step 4: Payment Method */}
              <section>
                <h3 className="font-en text-xs uppercase tracking-[0.45em] text-pink-300 sm:text-sm mb-4 sm:mb-6">
                  Step 4: วิธีชำระเงิน
                </h3>

                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {paymentMethodOptions.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleChange('paymentMethod', method.id)}
                      className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-pink-400/50 ${
                        form.paymentMethod === method.id
                          ? 'border-pink-400/70 bg-pink-500/10'
                          : 'border-white/15 bg-slate-950/40'
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition ${
                          form.paymentMethod === method.id
                            ? 'border-pink-400 bg-pink-400'
                            : 'border-slate-500 bg-transparent group-hover:border-pink-300'
                        }`}
                      >
                        {form.paymentMethod === method.id && (
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{method.label}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{method.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Status Message */}
              {status !== 'idle' && message && !promptPayData && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    status === 'success'
                      ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-200'
                      : status === 'error'
                      ? 'border-rose-300/60 bg-rose-500/10 text-rose-200'
                      : 'border-indigo-300/60 bg-indigo-500/10 text-indigo-200'
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-pink-300/50 bg-gradient-to-r from-pink-500/20 to-rose-500/20 px-6 py-4 text-base font-semibold uppercase tracking-[0.35em] text-pink-100 transition hover:border-pink-200/70 hover:from-pink-500/30 hover:to-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-200 border-t-transparent" />
                    กำลังประมวลผล...
                  </>
                ) : (
                  <>
                    ส่งคำขอและชำระเงิน {priceLabel}
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : promptPayData && !isPaid ? (
            /* PromptPay QR Display */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  สแกน QR PromptPay เพื่อชำระเงิน
                </h2>
                <p className="text-slate-300">
                  กรุณาสแกน QR Code ด้วยแอปธนาคารหรือวอลเล็ตที่รองรับ PromptPay
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.2)]">
                <p className="font-en text-xs uppercase tracking-[0.4em] text-emerald-200 text-center mb-4">PromptPay QR</p>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center rounded-2xl border border-emerald-200/40 bg-white p-4">
                    <img
                      src={promptPayData.qrImageUrl || promptPayData.qrImageUrlSvg || ''}
                      alt="PromptPay QR Code"
                      className="h-48 w-48 object-contain"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-100">
                      จำนวนเงิน: ฿{form.amount.toLocaleString('th-TH')}
                    </p>
                    {promptPayData.expiresAt && (
                      <p className="text-xs text-emerald-200/80 mt-1">
                        หมดอายุ: {new Date(promptPayData.expiresAt).toLocaleString('th-TH')}
                      </p>
                    )}
                  </div>
                </div>

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
              </div>

              {status !== 'idle' && message && (
                <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 text-center">
                  {message}
                </div>
              )}
            </div>
          ) : isPaid ? (
            /* Success Message */
            <div className="text-center py-8">
              <div className="mb-6">
                <svg
                  className="mx-auto h-20 w-20 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-emerald-100 mb-3">
                ขอบคุณที่ใช้บริการ!
              </h2>

              <p className="text-emerald-200 mb-2">
                การชำระเงินของคุณเสร็จสมบูรณ์แล้ว
              </p>

              <p className="text-sm text-emerald-300/80 mb-6">
                ทีมงานจะเปิดเพลงของคุณในช่วงเวลาที่เหมาะสม
              </p>

              <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/5 px-4 py-3 max-w-md mx-auto">
                <p className="text-lg font-bold text-emerald-100">
                  {form.songTitle}
                  {form.artistName && ` - ${form.artistName}`}
                </p>
                <p className="text-sm text-emerald-200 mt-1">
                  Requested by: {form.requesterName}
                </p>
                <p className="text-lg font-bold text-emerald-100 mt-2">
                  Donated: ฿{form.amount.toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Thank You Modal */}
      <ThankYouModal
        isOpen={showThankYouModal}
        onClose={() => {
          setShowThankYouModal(false);
          navigate(homeLink);
        }}
      />
    </div>
  );
};

export default SongRequestPage;

