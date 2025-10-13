import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import Spinner from '../components/Spinner';
import { resizeImageFile } from '../utils/image';
import ThankYouModal from '../components/customer/ThankYouModal';
import { resolveStoreSlug } from '../utils/storeSlug';

type WarpOption = {
  id?: string;
  seconds: number;
  label: string;
  price: number;
};


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
};

const PENDING_TRANSACTION_STORAGE_KEY = 'selfWarpPendingTransaction';

type PendingTransactionSnapshot = {
  transactionId: string;
  paymentLink?: { url: string; reference?: string } | null;
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
  const [paymentLink, setPaymentLink] = useState<{ url: string; reference?: string } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [options, setOptions] = useState<WarpOption[]>([]);

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
      setPaymentLink(snapshot.paymentLink ?? null);
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
        packageId: form.packageId,
        metadata: {
          source: 'self-warp-page',
          productImage: form.selfImage ? `data:image/jpeg;base64,${form.selfImage}` : undefined,
          productDescription: `${form.selfDisplayName || form.customerName} | ${form.socialLink}`,
          paymentLimit: 0,
          expiresInMinutes: 120,
          packageName: options.find(opt => opt.id === form.packageId)?.label || `${form.seconds} วินาที`,
          selfDisplayName: form.selfDisplayName,
        },
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
      const providerMessage =
        data?.providerMessage ||
        'ขออภัย ท่านไม่สามารถใช้ลิงก์นี้ในการชำระเงินได้ เนื่องจากลิงก์ยังไม่ถึงกำหนดเวลาใช้งาน กรุณาติดต่อร้านค้า [ บริษัท มี พร้อมท์ เทคโนโลยี จํากัด, Contact: 0885941049 ]';
      setTransactionId(transactionIdValue);

      const linkUrl = data?.paymentUrl;
      const reference = data?.paymentReference;
      const newStatus = data?.status || 'success';

      if (newStatus === 'waiting') {
        setPaymentLink(null);
        setStatus('error');
        setMessage(providerMessage);
        persistPendingTransaction({
          transactionId: transactionIdValue,
          paymentLink: null,
          message: providerMessage,
          status: newStatus,
          savedAt: Date.now(),
        });
        return;
      }

      if (linkUrl) {
        const pendingMessage = 'สร้าง PayLink สำเร็จ! กรุณาชำระเงินในหน้าต่างใหม่ หากไม่ได้เปิดให้คลิกปุ่มด้านล่าง';
        persistPendingTransaction({
          transactionId: transactionIdValue,
          paymentLink: { url: linkUrl, reference },
          message: pendingMessage,
          status: newStatus,
          savedAt: Date.now(),
        });
        setPaymentLink({ url: linkUrl, reference });
        setStatus('success');
        setMessage(pendingMessage);
        window.location.href = linkUrl;
        return;
      }

      const successMessage =
        newStatus === 'paid'
          ? 'Warp ของคุณถูกบันทึกแล้ว!'
          : 'Warp ถูกบันทึกแล้ว กำลังรอตรวจสอบการชำระเงิน';

      setStatus('success');
      setMessage(successMessage);

      if (newStatus === 'paid') {
        setPaymentLink(null);
        clearPendingTransaction();
        setShowThankYouModal(true);
      } else {
        persistPendingTransaction({
          transactionId: transactionIdValue,
          paymentLink: null,
          message: successMessage,
          status: newStatus,
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
            <p className="font-en text-xs uppercase tracking-[0.5em] text-indigo-300">Self Warp</p>
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
              <p lang="th" className="mt-2 text-base font-semibold text-white sm:text-lg">
                แจกวาร์ปตัวเอง
              </p>

              <div className="grid gap-4 mt-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
                <div>
                  <label
                    lang="th"
                    className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    ชื่อที่จะโชว์
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

                <div>
                  <label
                    lang="th"
                    className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    อัปโหลดรูปของคุณ
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

            {/* Additional Info */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <div>
                <label
                  lang="th"
                  className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  IG ของคุณ
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
              <div>
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
            </section>

            {/* Quote Section */}
            <section>
              <label
                lang="th"
                className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                style={{ letterSpacing: '-0.02em' }}
              >
                คำคม / ข้อความ
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {paymentLink ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = paymentLink.url;
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-950 shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition hover:scale-[1.01] sm:px-6"
                >
                  <span lang="th">ไปหน้าชำระเงิน</span>
                  {paymentLink.reference ? (
                    <span className="font-en rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] tracking-widest text-emerald-100">
                      Ref: {paymentLink.reference}
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
                      const response = await fetch(API_ENDPOINTS.publicTransactionStatus(resolvedStoreSlug), {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ transactionId }),
                      });

                      const body = await response.json();

                      if (!response.ok) {
                        throw new Error(body?.message || 'ตรวจสอบสถานะไม่สำเร็จ');
                      }

                      if (body?.status === 'paid') {
                        setStatus('success');
                        setMessage('ชำระเงินเรียบร้อยแล้ว! ทีมงานจะดัน Warp ของคุณขึ้นจอทันที');
                        setPaymentLink(null);
                        clearPendingTransaction();
                        setShowThankYouModal(true);
                      } else {
                        const followupMessage = body?.note
                          ? `${body.note} (สถานะ: ${body?.chillpayStatus || 'กำลังตรวจสอบ'})`
                          : `สถานะปัจจุบัน: ${body?.chillpayStatus || 'กำลังตรวจสอบ'}`;
                        setStatus('success');
                        setMessage(followupMessage);
                        persistPendingTransaction({
                          transactionId,
                          paymentLink,
                          message: followupMessage,
                          status: body?.status || 'pending',
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
