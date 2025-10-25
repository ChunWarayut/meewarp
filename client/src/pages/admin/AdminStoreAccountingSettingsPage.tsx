import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';

type TaxBracket = {
  minAmount: number;
  maxAmount: number;
  rate: number;
  description: string;
};

type TaxExemptions = {
  personalAllowance: number;
  businessExpenses: number;
  otherDeductions: number;
};

type FormData = {
  taxRate: number;
  taxType: 'flat' | 'progressive' | 'bracket';
  taxBrackets: TaxBracket[];
  businessType: 'individual' | 'company' | 'partnership' | 'franchise';
  taxExemptions: TaxExemptions;
  ownerShareRate: number;
  accountingPeriod: 'monthly' | 'weekly' | 'daily';
  notes: string;
};

const AdminStoreAccountingSettingsPage = () => {
  const { token } = useAuth();
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    taxRate: 0,
    taxType: 'flat',
    taxBrackets: [],
    businessType: 'individual',
    taxExemptions: {
      personalAllowance: 150000,
      businessExpenses: 50,
      otherDeductions: 0,
    },
    ownerShareRate: 10,
    accountingPeriod: 'monthly',
    notes: '',
  });

  const fetchAccountingSettings = async () => {
    if (!selectedStoreId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_ENDPOINTS.adminStoreAccounting}?store=${selectedStoreId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch accounting settings');
      }

      const data = await response.json();
      const settings = data.accountingSettings?.[0];
      
      if (settings) {
        setFormData({
          taxRate: settings.taxRate,
          taxType: settings.taxType || 'flat',
          taxBrackets: settings.taxBrackets || [],
          businessType: settings.businessType || 'individual',
          taxExemptions: settings.taxExemptions || {
            personalAllowance: 150000,
            businessExpenses: 50,
            otherDeductions: 0,
          },
          ownerShareRate: settings.ownerShareRate,
          accountingPeriod: settings.accountingPeriod,
          notes: settings.notes || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingSettings();
  }, [selectedStoreId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStoreId) {
      setError('กรุณาเลือกสาขา');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch(API_ENDPOINTS.adminStoreAccounting, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          store: selectedStoreId,
          taxRate: formData.taxRate,
          taxType: formData.taxType,
          taxBrackets: formData.taxBrackets,
          businessType: formData.businessType,
          taxExemptions: formData.taxExemptions,
          ownerShareRate: formData.ownerShareRate,
          accountingPeriod: formData.accountingPeriod,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save accounting settings');
      }

      await response.json();
      setMessage('บันทึกการตั้งค่าบัญชีเรียบร้อยแล้ว');
      
      // Auto-clear message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate store revenue rate
  const storeRevenueRate = 100 - (formData.taxType === 'flat' ? formData.taxRate : 0) - 3 - formData.ownerShareRate; // 3% is fixed API Gateway fee

  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚙️ ตั้งค่าบัญชีร้าน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ตั้งค่าการหักภาษีและส่วนแบ่งของแต่ละร้าน
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">กรุณาเลือกสาขาเพื่อตั้งค่าบัญชี</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚙️ ตั้งค่าบัญชีร้าน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ตั้งค่าการหักภาษีและส่วนแบ่งของแต่ละร้าน
          </p>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Accounting</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">ตั้งค่าบัญชีร้าน</h1>
        {selectedStore ? (
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-indigo-200">{selectedStore.name}</p>
        ) : null}
        <p className="mt-3 text-sm text-slate-300">
          ตั้งค่าการหักภาษีและส่วนแบ่งของแต่ละร้าน
        </p>
      </header>

      {/* Success/Error Messages */}
      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-200 font-medium">{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-rose-200 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">การตั้งค่าบัญชี</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                ประเภทธุรกิจ
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => updateField('businessType', e.target.value as 'individual' | 'company' | 'partnership' | 'franchise')}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
              >
                <option value="individual">บุคคลธรรมดา</option>
                <option value="company">บริษัท</option>
                <option value="partnership">ห้างหุ้นส่วน</option>
                <option value="franchise">แฟรนไชส์</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">ประเภทธุรกิจสำหรับการคำนวณภาษี</p>
            </div>

            {/* Tax Type */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                ประเภทภาษี
              </label>
              <select
                value={formData.taxType}
                onChange={(e) => updateField('taxType', e.target.value as 'flat' | 'progressive' | 'bracket')}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
              >
                <option value="flat">อัตราเดียว</option>
                <option value="progressive">ขั้นบันได</option>
                <option value="bracket">ช่วงรายได้</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">วิธีการคำนวณภาษี</p>
            </div>

            {/* Tax Rate (for flat rate) */}
            {formData.taxType === 'flat' && (
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  อัตราภาษี (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={(e) => updateField('taxRate', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-slate-500">อัตราภาษีที่ใช้กับรายได้ทั้งหมด</p>
              </div>
            )}

            {/* Owner Share Rate */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                ส่วนแบ่งเว็บระบบ (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.ownerShareRate}
                onChange={(e) => updateField('ownerShareRate', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="10"
              />
              <p className="mt-1 text-xs text-slate-500">ส่วนแบ่งที่เจ้าของระบบจะได้รับ</p>
            </div>

            {/* Accounting Period */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                ระยะเวลาบัญชี
              </label>
              <select
                value={formData.accountingPeriod}
                onChange={(e) => updateField('accountingPeriod', e.target.value as 'monthly' | 'weekly' | 'daily')}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
              >
                <option value="monthly">รายเดือน</option>
                <option value="weekly">รายสัปดาห์</option>
                <option value="daily">รายวัน</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">ระยะเวลาการคำนวณบัญชี</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>
          </div>
        </div>

        {/* Tax Exemptions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">การลดหย่อนภาษี</h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Personal Allowance */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                ค่าลดหย่อนส่วนตัว (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.taxExemptions.personalAllowance}
                onChange={(e) => updateField('taxExemptions', {
                  ...formData.taxExemptions,
                  personalAllowance: Number(e.target.value)
                })}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="150000"
              />
              <p className="mt-1 text-xs text-slate-500">ค่าลดหย่อนส่วนตัว (แนะนำ: 150,000 บาท)</p>
            </div>

            {/* Business Expenses */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                ค่าใช้จ่ายธุรกิจ (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.taxExemptions.businessExpenses}
                onChange={(e) => updateField('taxExemptions', {
                  ...formData.taxExemptions,
                  businessExpenses: Number(e.target.value)
                })}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="50"
              />
              <p className="mt-1 text-xs text-slate-500">เปอร์เซ็นต์ค่าใช้จ่ายธุรกิจ (แนะนำ: 50%)</p>
            </div>

            {/* Other Deductions */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                การลดหย่อนอื่นๆ (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.taxExemptions.otherDeductions}
                onChange={(e) => updateField('taxExemptions', {
                  ...formData.taxExemptions,
                  otherDeductions: Number(e.target.value)
                })}
                className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-slate-500">การลดหย่อนอื่นๆ เช่น ประกันชีวิต</p>
            </div>
          </div>
        </div>

        {/* Rate Summary */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">สรุปอัตราการหัก</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">ภาษี</p>
                  <p className="mt-2 text-3xl font-bold text-yellow-900">{formData.taxRate}%</p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">ค่าธรรมเนียม API</p>
                  <p className="mt-2 text-3xl font-bold text-orange-900">3%</p>
                  <p className="text-xs text-orange-600">(คงที่)</p>
                </div>
                <div className="rounded-full bg-orange-100 p-3">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">ส่วนแบ่งเว็บ</p>
                  <p className="mt-2 text-3xl font-bold text-red-900">{formData.ownerShareRate}%</p>
                </div>
                <div className="rounded-full bg-red-100 p-3">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">ส่วนแบ่งร้าน</p>
                  <p className="mt-2 text-3xl font-bold text-green-900">{storeRevenueRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Rate Check */}
          <div className="mt-4 p-4 rounded-lg border border-white/10 bg-slate-900/30">
            {formData.taxType === 'flat' ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-indigo-200">รวมทั้งหมด:</span>
                  <span className={`text-lg font-bold ${Math.abs(100 - (formData.taxRate + 3 + formData.ownerShareRate + storeRevenueRate)) < 0.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(formData.taxRate + 3 + formData.ownerShareRate + storeRevenueRate).toFixed(1)}%
                  </span>
                </div>
                {Math.abs(100 - (formData.taxRate + 3 + formData.ownerShareRate + storeRevenueRate)) >= 0.1 && (
                  <p className="mt-2 text-sm text-rose-300">⚠️ อัตรารวมต้องเท่ากับ 100%</p>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-indigo-200">รวมทั้งหมด (ไม่รวมภาษี):</span>
                  <span className={`text-lg font-bold ${(3 + formData.ownerShareRate + storeRevenueRate) <= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(3 + formData.ownerShareRate + storeRevenueRate).toFixed(1)}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  ภาษีจะคำนวณแบบ {formData.taxType === 'progressive' ? 'Progressive' : 'Bracket'} ตามรายได้จริง
                </p>
                {(3 + formData.ownerShareRate + storeRevenueRate) > 100 && (
                  <p className="mt-2 text-sm text-rose-300">⚠️ ค่าธรรมเนียม + ส่วนแบ่ง ต้องไม่เกิน 100%</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              saving || 
              (formData.taxType === 'flat' 
                ? Math.abs(100 - (formData.taxRate + 3 + formData.ownerShareRate + storeRevenueRate)) >= 0.1
                : (3 + formData.ownerShareRate + storeRevenueRate) > 100
              )
            }
            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-12 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0_22px_55px_rgba(99,102,241,0.45)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                บันทึกการตั้งค่า
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminStoreAccountingSettingsPage;
