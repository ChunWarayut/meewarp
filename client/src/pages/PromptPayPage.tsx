import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { resolveStoreSlug } from '../utils/storeSlug';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import ThankYouModal from '../components/customer/ThankYouModal';

type PromptPayData = {
  qrImageUrl?: string;
  qrImageUrlSvg?: string;
  amount: number;
  expiresAt?: string;
  referenceCode?: string;
};

const PromptPayPage = () => {
  const navigate = useNavigate();
  const { storeSlug } = useParams<{ storeSlug?: string }>();
  const [searchParams] = useSearchParams();
  const resolvedStoreSlug = resolveStoreSlug(storeSlug);
  const homeLink = resolvedStoreSlug ? `/${resolvedStoreSlug}` : '/';
  
  const [promptPayData, setPromptPayData] = useState<PromptPayData | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const { checkPaymentStatus } = usePaymentStatus();

  useEffect(() => {
    // ดึงข้อมูลจาก URL parameters
    const transactionIdParam = searchParams.get('transactionId');
    const promptPayParam = searchParams.get('promptPay');
    
    if (transactionIdParam) {
      setTransactionId(transactionIdParam);
    }
    
    if (promptPayParam) {
      try {
        const promptPayData = JSON.parse(decodeURIComponent(promptPayParam));
        setPromptPayData(promptPayData);
        setStatus('success');
        setMessage(promptPayData.expiresAt
          ? `สแกน QR PromptPay ก่อน ${new Date(promptPayData.expiresAt).toLocaleString('th-TH')}`
          : 'สแกน QR PromptPay เพื่อชำระเงิน');
      } catch (error) {
        console.error('Error parsing promptPay data:', error);
        setStatus('error');
        setMessage('ไม่สามารถโหลดข้อมูล PromptPay ได้');
      }
    }
  }, [searchParams]);

  const handleCheckStatus = async () => {
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
        setShowThankYouModal(true);
        return;
      }

      // ถ้ายังไม่ชำระเงิน แสดงสถานะปัจจุบัน
      setStatus('success');
      setMessage(result.message || `สถานะปัจจุบัน: ${result.status}`);
      
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (!promptPayData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">ไม่พบข้อมูล PromptPay</h1>
          <button
            onClick={() => navigate(homeLink)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">สแกน QR PromptPay เพื่อชำระเงิน</h1>
          <p className="text-slate-300">กรุณาสแกน QR Code ด้วยแอปธนาคารหรือวอลเล็ตที่รองรับ PromptPay</p>
        </div>

        {/* PromptPay QR Card */}
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.2)]">
            <p className="font-en text-xs uppercase tracking-[0.4em] text-emerald-200 text-center mb-4">PromptPay QR</p>
            
            <p className="text-xs text-emerald-100/90 text-center mb-6">
              สแกนโค้ดด้วยแอปธนาคารหรือวอลเล็ตที่รองรับ PromptPay เพื่อชำระเงินให้เสร็จสิ้น
            </p>
            
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
                  จำนวนเงิน: ฿{promptPayData.amount.toLocaleString('th-TH')}
                </p>
                {promptPayData.expiresAt && (
                  <p className="text-xs text-emerald-200/80 mt-1">
                    หมดอายุ: {new Date(promptPayData.expiresAt).toLocaleString('th-TH')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-emerald-100/80">
                หลังชำระเงินแล้ว ระบบจะอัปเดตสถานะให้อัตโนมัติ หรือกดปุ่ม ตรวจสอบสถานะด้วยตัวเองได้
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {status !== 'idle' && message && (
          <div className="max-w-md mx-auto mt-6">
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'success'
                  ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-300/60 bg-rose-500/10 text-rose-200'
              }`}
            >
              {message}
            </div>
          </div>
        )}

        {/* Check Status Button */}
        {transactionId && (
          <div className="max-w-md mx-auto mt-6">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={isCheckingStatus}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-indigo-300/50 bg-indigo-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingStatus ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-transparent" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                'ตรวจสอบสถานะการชำระ'
              )}
            </button>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="max-w-md mx-auto mt-4">
          <button
            onClick={() => navigate(homeLink)}
            className="w-full px-4 py-2 text-sm text-slate-300 hover:text-white transition"
          >
            ← กลับหน้าหลัก
          </button>
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

export default PromptPayPage;
