import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import Spinner from '../components/Spinner';
import { resizeImageFile } from '../utils/image';
import ThankYouModal from '../components/customer/ThankYouModal';
import { resolveStoreSlug } from '../utils/storeSlug';
import { usePaymentStatus } from '../hooks/usePaymentStatus';

type WarpOption = {
  id?: string;
  seconds: number;
  label: string;
  price: number;
};

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


type FormState = {
  customerName: string;
  socialLink: string;
  seconds: number;
  price: number;
  customSeconds?: string;
  customerAvatar?: string;
  selfImage?: string;
  selfDisplayName?: string;
  packageId?: string;
  quote: string;
  paymentMethod: 'promptpay' | 'checkout';
  customerEmail: string;
};

const defaultState: FormState = {
  customerName: '',
  socialLink: '',
  quote: '',
  seconds: 30,
  price: 20,
  customSeconds: '',
  customerAvatar: '',
  selfImage: '',
  selfDisplayName: '',
  packageId: '',
  paymentMethod: 'promptpay',
  customerEmail: '',
};

const PENDING_TRANSACTION_STORAGE_KEY = 'selfWarpPendingTransaction';

type CheckoutSessionInfo = {
  url: string;
  sessionId?: string;
};

type PromptPayData = {
  qrImageUrl?: string;
  qrImageUrlSvg?: string;
  expiresAt?: string;
  paymentIntentId?: string;
  referenceNumber?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paidAt?: string;
};

type PendingTransactionSnapshot = {
  transactionId: string;
  checkoutSession?: CheckoutSessionInfo | null;
  promptPay?: PromptPayData | null;
  message?: string;
  status?: string;
  savedAt: number;
};

const SelfWarpPage = () => {
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
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [options, setOptions] = useState<WarpOption[]>([]);
  const { checkPaymentStatus } = usePaymentStatus();

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleInstagramChange = (rawValue: string) => {
    const trimmed = rawValue.replace(/\s+/g, '');
    const withoutAt = (trimmed.startsWith('@') ? trimmed.slice(1) : trimmed).toLowerCase();
    const social = withoutAt ? `https://www.instagram.com/${withoutAt}` : '';

    setForm((prev) => ({
      ...prev,
      customerName: rawValue,
      socialLink: social,
    }));
  };

  const persistPendingTransaction = (snapshot: PendingTransactionSnapshot) => {
    try {
      localStorage.setItem(PENDING_TRANSACTION_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore storage write failures
    }
  };

  const clearPendingTransaction = () => {
    try {
      localStorage.removeItem(PENDING_TRANSACTION_STORAGE_KEY);
    } catch {
      // ignore storage removal failures
    }
  };

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.publicPackages(resolvedStoreSlug));
        if (!response.ok) {
          throw new Error('Failed to load packages');
        }
        const body = await response.json();
        if (Array.isArray(body?.packages)) {
          const mapped: WarpOption[] = body.packages.map((pkg: { _id: string; seconds: number; price: number; name: string }) => ({
            id: pkg._id,
            seconds: pkg.seconds,
            price: pkg.price,
            label: `${pkg.name} (${pkg.seconds}s)`,
          }));
          setOptions(mapped);
          if (mapped.length > 0) {
            setForm((prev) => ({
              ...prev,
              packageId: mapped[0].id,
              seconds: mapped[0].seconds,
              price: mapped[0].price,
            }));
          }
        }
      } catch {
        const fallback: WarpOption[] = [
          { seconds: 30, price: 199, label: '30 วินาที' },
          { seconds: 60, price: 349, label: '60 วินาที' },
          { seconds: 90, price: 499, label: '90 วินาที' },
        ];
        setOptions(fallback);
        setForm((prev) => ({
          ...prev,
          packageId: undefined,
          seconds: fallback[0].seconds,
          price: fallback[0].price,
        }));
      }
    };

    loadPackages();
  }, [resolvedStoreSlug]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_TRANSACTION_STORAGE_KEY);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as PendingTransactionSnapshot | null;
      if (!snapshot || !snapshot.transactionId) {
        clearPendingTransaction();
        return;
      }
      if (Date.now() - snapshot.savedAt > 5 * 60 * 1000) {
        clearPendingTransaction();
        return;
      }
      setTransactionId(snapshot.transactionId);
      setCheckoutSession(snapshot.checkoutSession ?? null);
      setPromptPayData(snapshot.promptPay ?? null);
      setStatus('success');
      setMessage(snapshot.message || 'Warp ถูกบันทึกแล้ว กำลังรอตรวจสอบการชำระเงิน');
    } catch {
      clearPendingTransaction();
    }
  }, []);

  const handleSelectWarpOption = (option: WarpOption) => {
    setForm((prev) => ({
      ...prev,
      packageId: option.id,
      seconds: option.seconds,
      price: option.price,
      customSeconds: '',
    }));
  };

  const priceLabel = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(form.price);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    setFieldErrors({});
    setShowThankYouModal(false);
    setCheckoutSession(null);
    setPromptPayData(null);

    const errors: Record<string, string> = {};

    if (!form.selfImage) {
      errors.profileCode = 'กรุณาอัปโหลดรูปภาพของคุณ';
    }

    if (!form.customerName.trim()) {
      errors.customerName = 'กรุณากรอก IG ของคุณ';
    }
    if (!form.socialLink.trim()) {
      errors.socialLink = 'กรุณาระบุลิงก์ Instagram';
    }
    if (options.some((option) => option.id) && !form.packageId) {
      errors.packageId = 'กรุณาเลือกแพ็กเกจ';
    }
    if (!form.seconds || form.seconds < 10) {
      errors.seconds = 'เวลาต้องมากกว่า 10 วินาที';
    }
    if (!form.customerEmail.trim()) {
      form.customerEmail = 'warayut2555@gmail.com';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus('error');
      setMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const referenceCode = `SELF-${Date.now()}`;
      const avatarDataUri = form.selfImage
        ? `data:image/jpeg;base64,${form.selfImage}`
        : form.customerAvatar;

      const payload = {
        code: referenceCode,
        customerName: form.customerName,
        customerAvatar: avatarDataUri,
        socialLink: form.socialLink,
        quote: form.quote,
        displaySeconds: form.seconds,
        amount: form.price,
        packageId: form.packageId || undefined,
        paymentMethod: form.paymentMethod,
        metadata: {
          source: 'self-warp-page',
          productImage: form.selfImage ? `data:image/jpeg;base64,${form.selfImage}` : undefined,
          productDescription: `${form.selfDisplayName || form.customerName} | ${form.socialLink}`,
          paymentLimit: 0,
          expiresInMinutes: 120,
          packageName: options.find(opt => opt.id === form.packageId)?.label || `${form.seconds} วินาที`,
          selfDisplayName: form.selfDisplayName,
          paymentMethod: form.paymentMethod,
          customerEmail: form.customerEmail,
        },
        customerEmail: form.customerEmail,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(API_ENDPOINTS.publicTransactions(resolvedStoreSlug), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'ไม่สามารถบันทึก Warp ได้');
      }

      const data = await response.json();

      const transactionIdValue = data?.id || referenceCode;
      const checkoutUrl: string | undefined = data?.checkoutUrl;
      const sessionId: string | undefined = data?.stripeSessionId;
      const newStatus: string | undefined = data?.status;
      const promptPay = (data?.promptPay as PromptPayData | null) ?? null;

      setTransactionId(transactionIdValue);
      setPromptPayData(promptPay);

      if (promptPay) {
        // Redirect ไปหน้า PromptPayPage
        const promptPayData = encodeURIComponent(JSON.stringify(promptPay));
        const promptPayUrl = `${window.location.pathname.replace('/self-warp', '/promptpay')}?transactionId=${transactionIdValue}&promptPay=${promptPayData}`;
        window.location.href = promptPayUrl;
        return;
      }

      if (checkoutUrl) {
        const sessionInfo: CheckoutSessionInfo = { url: checkoutUrl, sessionId };
        const pendingMessage = 'เปิดหน้าชำระเงิน Stripe ให้เรียบร้อยแล้ว หากยังไม่เปิดให้คลิกปุ่มด้านล่าง';

        setCheckoutSession(sessionInfo);
        setStatus('success');
        setMessage(pendingMessage);
        persistPendingTransaction({
          transactionId: transactionIdValue,
          checkoutSession: sessionInfo,
          promptPay: null,
          message: pendingMessage,
          status: newStatus || 'pending',
          savedAt: Date.now(),
        });

        window.location.href = checkoutUrl;
        return;
      }

      const successMessage =
        newStatus === 'paid'
          ? 'Warp ของคุณถูกบันทึกและชำระเงินเรียบร้อยแล้ว!'
          : 'Warp ถูกบันทึกแล้ว กรุณาชำระเงินผ่าน Stripe เพื่อให้ทีมงานดำเนินการต่อ';

      setCheckoutSession(null);
      setPromptPayData(null);
      setStatus('success');
      setMessage(successMessage);

      if (newStatus === 'paid') {
        clearPendingTransaction();
        setShowThankYouModal(true);
      } else {
        persistPendingTransaction({
          transactionId: transactionIdValue,
          checkoutSession: null,
          promptPay: null,
          message: successMessage,
          status: newStatus || 'pending',
          savedAt: Date.now(),
        });
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="overflow-hidden relative min-h-screen bg-slate-950 text-slate-100 font-th" style={{ letterSpacing: '-0.02em' }}>
      <div
        className="absolute -top-32 inset-x-1/3 w-72 h-72 rounded-full blur-3xl pointer-events-none bg-indigo-500/30"
        aria-hidden
      />
      <div
        className="absolute -left-12 top-1/2 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 pointer-events-none bg-pink-500/20"
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
            <h1
              lang="th"
              className="mt-2 text-4xl font-semibold text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.45)] sm:text-5xl"
            >
              สร้าง Warp
            </h1>
            <p lang="th" className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              กรอกข้อมูลและอัปโหลดรูปเพื่อให้ทีมงานแสดงวาร์ปของคุณบนจอ พร้อมลิงก์ชำระเงินแบบ Realtime
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_90px_rgba(8,12,24,0.65)] backdrop-blur-xl sm:p-10">
          <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
            {/* Step 1 */}
            <section>
              <h3 className="font-en text-xs uppercase tracking-[0.45em] text-indigo-300 sm:text-sm">Step 1</h3>

              <div className="grid gap-4 mt-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
                <div>
                  <label
                    lang="th"
                    className="block text-base font-semibold text-white sm:text-lg uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    ชื่อที่จะโชว์ขึ้นจอ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={form.selfDisplayName}
                    onChange={(event) => handleChange('selfDisplayName', event.target.value)}
                    placeholder="ชื่อที่จะขึ้นจอ"
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 sm:mt-3"
                    style={{ letterSpacing: '-0.02em' }}
                  />
                  {fieldErrors.selfDisplayName ? (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.selfDisplayName}</p>
                  ) : null}
                </div>

                {/* Additional Info */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg uppercase tracking-[0.35em] text-indigo-200"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      IG ของคุณ (จำเป็น)
                    </label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(event) => handleInstagramChange(event.target.value)}
                      placeholder="ตัวอย่าง: meewarp.official"
                      required
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                    {fieldErrors.customerName ? (
                      <p className="mt-1 text-xs text-rose-300">{fieldErrors.customerName}</p>
                    ) : null}
                  </div>
                  <div className='hidden'>
                    <label
                      lang="th"
                      className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ลิงก์ Social
                    </label>
                    <input
                      type="url"
                      value={form.socialLink}
                      placeholder="ตัวอย่าง: https://www.instagram.com/meewarp.official"
                      required
                      readOnly
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-900/40 px-4 py-3 text-sm text-white opacity-80 shadow-[0_12px_30px_rgba(8,12,24,0.35)] focus:outline-none"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                    {fieldErrors.socialLink ? (
                      <p className="mt-1 text-xs text-rose-300">{fieldErrors.socialLink}</p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      lang="th"
                      className="block text-base font-semibold text-white sm:text-lg uppercase tracking-[0.35em] text-indigo-200"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      อีเมลสำหรับส่งสลิป (ถ้ามี)
                    </label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(event) => handleChange('customerEmail', event.target.value)}
                      placeholder="ตัวอย่าง: yourname@mee-warp.com"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                      style={{ letterSpacing: '-0.02em' }}
                    />
                    {fieldErrors.customerEmail ? (
                      <p className="mt-1 text-xs text-rose-300">{fieldErrors.customerEmail}</p>
                    ) : null}
                  </div>
                </section>

                {/* Quote Section */}
                <section>
                  <label
                    lang="th"
                    className="block text-base font-semibold text-white sm:text-lg uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    คำคม / ข้อความ (ถ้ามี)
                  </label>
                  <textarea
                    value={form.quote}
                    onChange={(event) => handleChange('quote', event.target.value)}
                    placeholder="ใส่คำคมหรือข้อความที่อยากให้แสดงบนจอ..."
                    maxLength={200}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                    style={{ letterSpacing: '-0.02em' }}
                  />
                  <div className="flex justify-between mt-1">
                    <p lang="th" className="text-xs text-slate-400">
                      คำคมนี้จะแสดงบนจอพร้อมกับวาร์ปของคุณ 
                    </p>
                    <p className="text-xs font-en text-slate-400">{form.quote.length}/200</p>
                  </div>
                  {fieldErrors.quote ? (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.quote}</p>
                  ) : null}
                </section>

                <div>
                  <label
                    lang="th"
                    className="block text-base font-semibold text-white sm:text-lg uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    อัปโหลดรูปของคุณ (จำเป็น)
                  </label>
                  <div className="mt-2 rounded-2xl border border-dashed border-indigo-300/30 bg-slate-950/60 p-4 text-center shadow-[0_20px_45px_rgba(8,12,24,0.5)] transition hover:border-indigo-300/60 sm:mt-3 sm:p-6">
                    <input
                      id="warp-self-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          handleChange('selfImage', '');
                          return;
                        }
                        setStatus('loading');
                        try {
                          const base64 = await resizeImageFile(file, { maxSize: 720, quality: 0.82 });
                          handleChange('selfImage', base64);
                          setStatus('idle');
                        } catch {
                          setStatus('error');
                          setMessage('อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง');
                        }
                      }}
                    />
                    <label
                      htmlFor="warp-self-upload"
                      className="flex flex-col gap-2 items-center px-4 py-3 mx-auto w-full max-w-xs text-sm font-medium text-indigo-100 rounded-xl border transition cursor-pointer border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-300/70 hover:bg-indigo-500/20 sm:gap-3 sm:px-6 sm:py-4"
                    >
                      <span className="font-en rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1 text-xs uppercase tracking-[0.35em] text-indigo-100 sm:px-4 sm:py-2">
                        Upload
                      </span>
                      <span lang="th" className="text-xs text-slate-200">
                        กดเพื่อเลือกไฟล์ (รองรับ png, jpg)
                      </span>
                    </label>
                    {form.selfImage ? (
                      <div className="relative mx-auto mt-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/5 shadow-[0_10px_30px_rgba(15,23,42,0.45)] sm:mt-4 sm:h-32 sm:w-32 sm:rounded-2xl">
                        <img
                          src={`data:image/jpeg;base64,${form.selfImage}`}
                          alt="preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : null}
                  </div>
                  {fieldErrors.profileCode ? (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.profileCode}</p>
                  ) : null}
                </div>

              </div>
            </section>

            {/* Step 2 */}
            <section>
              <h3 className="font-en text-xs uppercase tracking-[0.45em] text-pink-300 sm:text-sm">Step 2</h3>
              <p lang="th" className="mt-2 text-sm font-semibold text-white">เลือกเวลาที่จะแสดงขึ้นจอ</p>

              <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-6 sm:gap-4">
                {options.map((option) => {
                  const isActive = form.packageId ? form.packageId === option.id : form.seconds === option.seconds;
                  return (
                    <button
                      type="button"
                      key={`${option.id ?? option.seconds}`}
                      onClick={() => handleSelectWarpOption(option)}
                      className={`group rounded-2xl border px-3 py-3 text-center shadow-[0_18px_45px_rgba(8,12,24,0.45)] transition sm:px-6 sm:py-4 ${isActive
                        ? 'border-pink-400/80 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/80 hover:border-pink-300/60 hover:bg-pink-500/10 hover:text-white'
                        }`}
                    >
                      <p className="text-sm font-semibold text-white sm:text-lg">{option.label}</p>
                      <p lang="th" className="mt-1 text-xs text-slate-300 sm:text-sm">
                        {new Intl.NumberFormat('th-TH').format(option.price)} บาท
                      </p>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.packageId ? (
                <p className="mt-2 text-xs text-rose-300">{fieldErrors.packageId}</p>
              ) : null}
            </section>

            {/* Step 3 */}
            <section>
              <h3 className="font-en text-xs uppercase tracking-[0.45em] text-teal-300 sm:text-sm">Step 3</h3>
              <p lang="th" className="mt-2 text-sm font-semibold text-white">เลือกช่องทางการชำระเงิน</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {paymentMethodOptions.map((option) => {
                  const isSelected = form.paymentMethod === option.id;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => handleChange('paymentMethod', option.id)}
                      className={`flex flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left shadow-[0_18px_45px_rgba(8,12,24,0.4)] transition sm:px-5 sm:py-4 ${isSelected
                          ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-emerald-300/60 hover:bg-emerald-500/10 hover:text-white'
                        }`}
                    >
                      <span className="text-sm font-semibold text-white sm:text-base">{option.label}</span>
                      <span className="text-xs text-slate-200/90">{option.description}</span>
                      {option.id === 'promptpay' ? (
                        <span className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-emerald-100">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" /> แนะนำ
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Price Summary */}
            <section className="rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 shadow-[0_18px_45px_rgba(8,12,24,0.5)] sm:rounded-3xl sm:p-6">
              <div className="flex justify-between items-center">
                <p lang="th" className="text-base font-semibold text-white sm:text-lg">
                  รวมทั้งสิ้น
                </p>
                <p className="text-xl font-bold tracking-wide text-indigo-200 font-en sm:text-2xl">{priceLabel}</p>
              </div>
            </section>

            {/* Status Message */}
            {status !== 'idle' && message ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm sm:rounded-2xl sm:px-6 sm:py-4 ${status === 'success'
                  ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-300/60 bg-rose-500/10 text-rose-200'
                  }`}
              >
                {message}
              </div>
            ) : null}

            {promptPayData?.qrImageUrl ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.2)] sm:rounded-3xl sm:p-6">
                <p className="font-en text-xs uppercase tracking-[0.4em] text-emerald-200">PromptPay QR</p>
                <p lang="th" className="mt-2 text-xs text-emerald-100/90">
                  สแกนโค้ดด้วยแอปธนาคารหรือวอลเล็ตที่รองรับ PromptPay เพื่อชำระเงินให้เสร็จสิ้น
                </p>
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex items-center justify-center rounded-2xl border border-emerald-200/40 bg-white p-3">
                    <img
                      src={promptPayData.qrImageUrl || promptPayData.qrImageUrlSvg || ''}
                      alt="PromptPay QR Code"
                      className="h-44 w-44 object-contain"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 text-xs text-emerald-100/80">
                    {promptPayData.amount ? (
                      <p>
                        จำนวนเงิน:{' '}
                        <span className="font-semibold text-emerald-50">
                          {new Intl.NumberFormat('th-TH', {
                            style: 'currency',
                            currency: promptPayData.currency || 'THB',
                            maximumFractionDigits: 0,
                          }).format(promptPayData.amount)}
                        </span>
                      </p>
                    ) : null}
                    {promptPayData.referenceNumber ? (
                      <p>
                        Reference:{' '}
                        <span className="font-mono tracking-widest text-emerald-50">
                          {promptPayData.referenceNumber}
                        </span>
                      </p>
                    ) : null}
                    {promptPayData.expiresAt ? (
                      <p>
                        หมดอายุ:{' '}
                        <span className="font-semibold text-emerald-50">
                          {new Date(promptPayData.expiresAt).toLocaleString('th-TH')}
                        </span>
                      </p>
                    ) : null}
                    <p className="text-[11px] text-emerald-100/70">
                      หลังชำระเงินแล้ว ระบบจะอัปเดตสถานะให้อัตโนมัติ หรือกดปุ่มตรวจสอบสถานะด้วยตัวเองได้
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {checkoutSession ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = checkoutSession.url;
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-950 shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition hover:scale-[1.01] sm:px-6"
                >
                  <span lang="th">ไปหน้าชำระเงิน</span>
                  {checkoutSession.sessionId ? (
                    <span className="font-en rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] tracking-widest text-emerald-100">
                      Session: {checkoutSession.sessionId}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {transactionId ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!transactionId) return;
                    setIsCheckingStatus(true);
                    setMessage('กำลังตรวจสอบสถานะการชำระเงิน...');

                    try {
                      const result = await checkPaymentStatus(transactionId, resolvedStoreSlug);

                      if (!result.success) {
                        throw new Error(result.message || 'ตรวจสอบสถานะไม่สำเร็จ');
                      }

                      if (result.isAlreadyPaid || result.status === 'paid') {
                        setStatus('success');
                        setMessage('ชำระเงินเรียบร้อยแล้ว! ทีมงานจะดัน Warp ของคุณขึ้นจอทันที');
                        setCheckoutSession(null);
                        setPromptPayData(null);
                        setTransactionId(null); // รีเซ็ต transaction ID เพื่อป้องกันการตรวจสอบซ้ำ
                        clearPendingTransaction();
                        setShowThankYouModal(true);
                      } else {
                        // ถ้ายังไม่ชำระเงิน แสดงสถานะปัจจุบัน
                        const followupMessage = result.message || `สถานะปัจจุบัน: ${result.status}`;
                        setStatus('success');
                        setMessage(followupMessage);
                        persistPendingTransaction({
                          transactionId,
                          checkoutSession,
                          promptPay: promptPayData,
                          message: followupMessage,
                          status: result.status || 'pending',
                          savedAt: Date.now(),
                        });
                      }
                    } catch (error) {
                      setStatus('error');
                      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
                    } finally {
                      setIsCheckingStatus(false);
                    }
                  }}
                  disabled={isCheckingStatus}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-300/50 bg-indigo-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
                >
                  {isCheckingStatus ? (
                    <>
                      <Spinner /> กำลังตรวจสอบ...
                    </>
                  ) : (
                    'ตรวจสอบสถานะการชำระ'
                  )}
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    clearPendingTransaction();
                    navigate(homeLink);
                  }}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:px-6"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0_22px_55px_rgba(99,102,241,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:px-8"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {status === 'loading' ? (
                    <span className="flex gap-2 justify-center items-center">
                      <Spinner /> กำลังบันทึก…
                    </span>
                  ) : (
                    'ยืนยัน Warp'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ThankYouModal
        isOpen={showThankYouModal}
        onClose={() => {
          clearPendingTransaction();
          setShowThankYouModal(false);
        }}
      />
    </div>
  );
};

export default SelfWarpPage;
