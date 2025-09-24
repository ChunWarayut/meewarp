import { FormEvent, useEffect, useMemo, useState } from 'react';
import Modal from '../Modal';
import { API_ENDPOINTS } from '../../config';
import Spinner from '../Spinner';
import { resizeImageFile } from '../../utils/image';
import ThankYouModal from './ThankYouModal';

type WarpOption = {
  seconds: number;
  label: string;
  price: number;
};

type ProfileOption = {
  code: string;
  name: string;
  imageUrl?: string;
  socialLink?: string;
};

type CustomerWarpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profiles?: ProfileOption[];
  closeLabel?: string;
};

type FormState = {
  profileCode: string;
  customerName: string;
  socialLink: string;
  quote: string;
  seconds: number;
  price: number;
  customSeconds?: string;
  customerAvatar?: string;
  mode: 'profile' | 'self';
  selfImage?: string;
  selfDisplayName?: string;
};

const defaultState: FormState = {
  profileCode: '',
  customerName: '',
  socialLink: '',
  quote: '',
  seconds: 30,
  price: 20,
  customSeconds: '',
  customerAvatar: '',
  mode: 'profile',
  selfImage: '',
  selfDisplayName: '',
};

const warpOptions: WarpOption[] = [
  { seconds: 30, price: 20, label: '30s' },
  { seconds: 60, price: 40, label: '60s' },
  { seconds: 90, price: 60, label: '90s' },
];

const customerEndpoint = () =>
  API_ENDPOINTS.topSupporters.replace('/leaderboard/top-supporters', '/public/transactions');

const CustomerWarpModal = ({ isOpen, onClose, profiles = [], closeLabel }: CustomerWarpModalProps) => {
  const [form, setForm] = useState<FormState>(defaultState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentLink, setPaymentLink] = useState<{ url: string; reference?: string } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      mode: 'self',
      profileCode: '',
    }));
  }, [isOpen]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectProfile = (profile: ProfileOption) => {
    setForm((prev) => ({
      ...prev,
      profileCode: profile.code,
      socialLink: profile.socialLink || prev.socialLink,
      mode: 'profile',
    }));
  };

  const handleSelectWarpOption = (option: WarpOption) => {
    setForm((prev) => ({
      ...prev,
      seconds: option.seconds,
      price: option.price,
      customSeconds: '',
    }));
  };

  const calculatePrice = (seconds: number) => {
    const bucket = Math.max(1, Math.ceil(seconds / 30));
    return bucket * 20;
  };

  const handleCustomSeconds = (value: string) => {
    const seconds = Number.parseInt(value, 10);
    const price = Number.isNaN(seconds) ? form.price : calculatePrice(seconds);

    setForm((prev) => ({
      ...prev,
      customSeconds: value,
      seconds: Number.isNaN(seconds) ? prev.seconds : seconds,
      price,
    }));
  };

  const resetState = () => {
    setForm(defaultState);
    setStatus('idle');
    setMessage('');
    setFieldErrors({});
    setPaymentLink(null);
    setTransactionId(null);
    setIsCheckingStatus(false);
    setShowThankYouModal(false);
  };

  const handleExit = () => {
    resetState();
    onClose();
  };

  const priceLabel = useMemo(() => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(form.price);
  }, [form.price]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    setFieldErrors({});
    setShowThankYouModal(false);

    const errors: Record<string, string> = {};
    if (form.mode === 'profile' && !form.profileCode) {
      errors.profileCode = 'กรุณาเลือกคนที่จะโดน Warp';
    }

    if (form.mode === 'self' && !form.selfImage) {
      errors.profileCode = 'กรุณาอัปโหลดรูปภาพของคุณ';
    }

    if (form.mode === 'self' && !form.selfDisplayName?.trim()) {
      errors.selfDisplayName = 'กรุณากรอกชื่อที่จะโชว์บนจอ';
    }
    if (!form.customerName.trim()) {
      errors.customerName = 'กรุณากรอกชื่อหรือชื่อเล่น';
    }
    if (!form.socialLink.trim()) {
      errors.socialLink = 'กรุณาระบุลิงก์ social';
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
      const referenceCode = form.mode === 'self' ? `SELF-${Date.now()}` : form.profileCode;

      const payload = {
        code: referenceCode,
        customerName: form.customerName,
        customerAvatar: form.customerAvatar,
        socialLink: form.socialLink,
        quote: form.quote,
        displaySeconds: form.seconds,
        amount: form.price,
        metadata: {
          source: 'landing-modal',
          productImage: form.selfImage,
          productDescription:
            form.mode === 'self'
              ? `${form.selfDisplayName || form.customerName} | ${form.socialLink}`
              : form.socialLink,
          paymentLimit: form.mode === 'self' ? 0 : undefined,
          expiresInMinutes: form.mode === 'self' ? 120 : undefined,
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(customerEndpoint(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'ไม่สามารถบันทึก Warp ได้');
      }

      const data = await response.json();

      setTransactionId(data?.id || null);

      const linkUrl = data?.paymentUrl;
      const reference = data?.paymentReference;
      const newStatus = data?.status || 'success';

      if (linkUrl) {
        setPaymentLink({ url: linkUrl, reference });
        try {
          window.open(linkUrl, '_blank', 'noopener');
        } catch (err) {
          // ignore popup block
        }
      }

      setStatus('success');
      setMessage(
        linkUrl
          ? 'สร้าง PayLink สำเร็จ! กรุณาชำระเงินในหน้าต่างใหม่ หากไม่ได้เปิดให้คลิกปุ่มด้านล่าง'
          : newStatus === 'paid'
              ? 'Warp ของคุณถูกบันทึกแล้ว!'
              : 'Warp ถูกบันทึกแล้ว กำลังรอตรวจสอบการชำระเงิน'
      );

      if (!linkUrl && newStatus === 'paid') {
        setShowThankYouModal(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleExit} title="สร้าง Warp" closeLabel={closeLabel}>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section>
            <h3 className="text-sm uppercase tracking-[0.4em] text-indigo-300">Step 1</h3>
            <p className="mt-2 text-lg font-semibold text-white">แจกวาร์ปตัวเอง</p>
            <div className="mt-4 space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-6 shadow-[0_30px_80px_rgba(14,23,42,0.6)]">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.4em] text-indigo-300">ชื่อที่จะโชว์</label>
                  <input
                    type="text"
                    value={form.selfDisplayName}
                    onChange={(event) => handleChange('selfDisplayName', event.target.value)}
                    placeholder="ชื่อที่จะขึ้นจอ"
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/30"
                  />
                  {fieldErrors.selfDisplayName ? (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.selfDisplayName}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.4em] text-indigo-300">อัปโหลดรูปของคุณ</label>
                  <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-dashed border-indigo-300/30 bg-slate-950/60 p-4 text-center transition hover:border-indigo-300/60">
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
                        } catch (err) {
                          setStatus('error');
                          setMessage('อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง');
                        }
                      }}
                    />
                    <label
                      htmlFor="warp-self-upload"
                      className="mx-auto flex w-full max-w-xs cursor-pointer flex-col items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20"
                    >
                      <span className="rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-100">
                        Upload
                      </span>
                      <span className="text-xs text-slate-200">กดเพื่อเลือกไฟล์ (รองรับ png, jpg)</span>
                    </label>
                    {form.selfImage ? (
                      <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-[0_10px_30px_rgba(15,23,42,0.45)]">
                        <img
                          src={`data:image/jpeg;base64,${form.selfImage}`}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400"></p>
                    )}
                  </div>
                </div>
              </div>
              {fieldErrors.profileCode ? (
                <p className="text-xs text-rose-300">{fieldErrors.profileCode}</p>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="text-sm uppercase tracking-[0.4em] text-pink-300">Step 2</h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {warpOptions.map((option) => {
                const isActive = form.seconds === option.seconds && form.customSeconds === '';
                return (
                  <button
                    type="button"
                    key={option.seconds}
                    onClick={() => handleSelectWarpOption(option)}
                    className={`rounded-2xl border px-4 py-3 text-left ${
                      isActive ? 'border-pink-400 bg-pink-500/15' : 'border-white/10 bg-white/5'
                    } transition hover:border-pink-300/60 hover:bg-pink-500/10`}
                  >
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="text-xs text-slate-300">{new Intl.NumberFormat('th-TH').format(option.price)} บาท</p>
                  </button>
                );
              })}
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <label className="text-xs uppercase tracking-[0.3em] text-white">กำหนดเอง</label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={form.customSeconds}
                  onChange={(event) => handleCustomSeconds(event.target.value)}
                  placeholder="วินาที"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200/30"
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-300">ชื่อของคุณ</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(event) => handleChange('customerName', event.target.value)}
                placeholder="ชื่อเล่น / นามแฝง"
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/30"
              />
              {fieldErrors.customerName ? (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.customerName}</p>
              ) : null}
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-300">ลิงก์ Social</label>
              <input
                type="url"
                value={form.socialLink}
                onChange={(event) => handleChange('socialLink', event.target.value)}
                placeholder="https://instagram.com/..."
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/30"
              />
              {fieldErrors.socialLink ? (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.socialLink}</p>
              ) : null}
            </div>
          </section>

          <section>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-300">คำคม / ข้อความ</label>
            <textarea
              value={form.quote}
              onChange={(event) => handleChange('quote', event.target.value)}
              placeholder="ใส่คำคมหรือข้อความที่อยากให้แสดงบนจอ..."
              maxLength={200}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/30 resize-none"
            />
            <div className="mt-1 flex justify-between">
              <p className="text-xs text-slate-400">คำคมนี้จะแสดงบนจอพร้อมกับวาร์ปของคุณ</p>
              <p className="text-xs text-slate-400">{form.quote.length}/200</p>
            </div>
            {fieldErrors.quote ? (
              <p className="mt-1 text-xs text-rose-300">{fieldErrors.quote}</p>
            ) : null}
          </section>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-300">ลิงก์ Avatar</label>
              <input
                type="url"
                value={form.customerAvatar}
                onChange={(event) => handleChange('customerAvatar', event.target.value)}
                placeholder="อัปโหลดรูปโปรไฟล์ (ไม่บังคับ)"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/30"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-300">เวลาที่จะโชว์ (วินาที)</label>
              <input
                type="number"
                min={10}
                value={form.seconds}
                onChange={(event) => handleChange('seconds', Number.parseInt(event.target.value, 10) || 30)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/30"
              />
              {fieldErrors.seconds ? (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.seconds}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white">รวมทั้งสิ้น</p>
              <p className="text-lg font-semibold text-indigo-300">{priceLabel}</p>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              * ราคาใช้สำหรับจำลองประสบการณ์ ยังไม่ผูกกับ Payment Gateway จริง
            </p>
          </section>

        {status !== 'idle' && message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status === 'success'
                ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-300/60 bg-rose-500/10 text-rose-200'
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="flex flex-col items-end gap-3">
          {paymentLink ? (
            <button
              type="button"
              onClick={() => window.open(paymentLink.url, '_blank', 'noopener')}
              className="flex items-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100 hover:bg-emerald-500/30"
            >
              เปิดหน้าชำระเงินอีกครั้ง
              {paymentLink.reference ? (
                <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] tracking-widest">
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
                  const response = await fetch('/api/v1/public/transactions/check-status', {
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
                    setShowThankYouModal(true);
                  } else {
                    setStatus('success');
                    setMessage(
                      body?.note
                        ? `${body.note} (สถานะ: ${body?.chillpayStatus || 'กำลังตรวจสอบ'})`
                        : `สถานะปัจจุบัน: ${body?.chillpayStatus || 'กำลังตรวจสอบ'}`
                    );
                  }
                } catch (error) {
                  setStatus('error');
                  setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
                } finally {
                  setIsCheckingStatus(false);
                }
              }}
              disabled={isCheckingStatus}
              className="rounded-xl border border-indigo-300/40 bg-indigo-500/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingStatus ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะการชำระ'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleExit}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_60px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <Spinner /> กำลังบันทึก…
              </span>
            ) : (
              'ยืนยัน Warp'
            )}
          </button>
        </div>
        </form>
      </Modal>
      <ThankYouModal isOpen={showThankYouModal} onClose={() => setShowThankYouModal(false)} />
    </>
  );
};

export default CustomerWarpModal;
