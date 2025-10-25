import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';

type StoreAccounting = {
  _id: string;
  store: {
    _id: string;
    name: string;
    slug: string;
  };
  taxRate: number;
  ownerShareRate: number;
  apiGatewayFeeRate: number;
  storeRevenueRate: number;
  accountingPeriod: 'monthly' | 'weekly' | 'daily';
  isActive: boolean;
  notes?: string;
  lastSettlement?: {
    date: string;
    totalRevenue: number;
    taxAmount: number;
    apiGatewayFee: number;
    ownerShare: number;
    storeRevenue: number;
  };
  createdAt: string;
  updatedAt: string;
};

type RevenueBreakdown = {
  warpTransactions: {
    count: number;
    amount: number;
  };
  songRequests: {
    count: number;
    amount: number;
  };
  total: number;
};

type RevenueTransactions = {
  warp: number;
  song: number;
  total: number;
};

type SettlementBreakdown = {
  totalRevenue: number;
  deductions: {
    tax: { rate: number; amount: number };
    apiGatewayFee: { rate: number; amount: number };
    ownerShare: { rate: number; amount: number };
  };
  netAmounts: {
    storeRevenue: { rate: number; amount: number };
    ownerShare: { rate: number; amount: number };
  };
  summary: {
    grossRevenue: number;
    totalDeductions: number;
    netRevenue: number;
    storeShare: number;
    ownerShare: number;
  };
};

type RevenueWrapper = {
  revenue?: RevenueBreakdown | null;
  transactions?: RevenueTransactions | null;
};

type SettlementApiResponse = {
  storeId: string;
  period: {
    startDate: string;
    endDate: string;
    type: string;
  };
  revenue?: RevenueBreakdown | RevenueWrapper | null;
  settlement?: SettlementBreakdown | null;
};

type SettlementData = {
  storeId: string;
  period: {
    startDate: string;
    endDate: string;
    type: string;
  };
  revenue: RevenueBreakdown;
  transactions: RevenueTransactions;
  settlement: SettlementBreakdown;
};

const isRevenueWrapper = (
  revenue: RevenueBreakdown | RevenueWrapper | null | undefined
): revenue is RevenueWrapper => {
  return Boolean(revenue && typeof revenue === 'object' && 'revenue' in revenue);
};

const normalizeRevenueBreakdown = (breakdown?: RevenueBreakdown | null): RevenueBreakdown => {
  const warpCount = breakdown?.warpTransactions?.count ?? 0;
  const warpAmount = breakdown?.warpTransactions?.amount ?? 0;
  const songCount = breakdown?.songRequests?.count ?? 0;
  const songAmount = breakdown?.songRequests?.amount ?? 0;
  const totalAmount = breakdown?.total ?? warpAmount + songAmount;

  return {
    warpTransactions: { count: warpCount, amount: warpAmount },
    songRequests: { count: songCount, amount: songAmount },
    total: totalAmount,
  };
};

const normalizeRevenueTransactions = (
  transactions: RevenueTransactions | null | undefined,
  fallback: RevenueBreakdown
): RevenueTransactions => {
  const warp = transactions?.warp ?? fallback.warpTransactions.count;
  const song = transactions?.song ?? fallback.songRequests.count;
  const total = transactions?.total ?? warp + song;

  return { warp, song, total };
};

const normalizeSettlementResponse = (
  payload: SettlementApiResponse | null
): SettlementData | null => {
  if (!payload || !payload.settlement) {
    return null;
  }

  const revenueSection = payload.revenue;
  const revenueWrapper = isRevenueWrapper(revenueSection) ? revenueSection : null;
  const normalizedRevenue = normalizeRevenueBreakdown(
    revenueWrapper?.revenue ?? (revenueWrapper ? null : (revenueSection as RevenueBreakdown | null))
  );
  const normalizedTransactions = normalizeRevenueTransactions(
    revenueWrapper?.transactions,
    normalizedRevenue
  );

  return {
    storeId: payload.storeId,
    period: payload.period,
    revenue: normalizedRevenue,
    transactions: normalizedTransactions,
    settlement: payload.settlement,
  };
};

const AdminStoreAccountingPage = () => {
  const { token } = useAuth();
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [accountingSettings, setAccountingSettings] = useState<StoreAccounting | null>(null);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last' | 'year'>('current');

  const fetchAccountingData = async () => {
    if (!selectedStoreId) {
      setAccountingSettings(null);
      setSettlementData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch accounting settings
      const settingsResponse = await fetch(
        `${API_ENDPOINTS.adminStoreAccounting}?store=${selectedStoreId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch accounting settings');
      }

      const settingsData = await settingsResponse.json();
      setAccountingSettings(settingsData.accountingSettings?.[0] || null);

      // Fetch settlement data
      const settlementResponse = await fetch(
        API_ENDPOINTS.adminStoreAccountingSettlement(selectedStoreId, selectedPeriod),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!settlementResponse.ok) {
        throw new Error('Failed to fetch settlement data');
      }

      const settlementPayload: SettlementApiResponse = await settlementResponse.json();
      setSettlementData(normalizeSettlementResponse(settlementPayload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, [selectedStoreId, selectedPeriod]);

  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💰 บัญชีสรุปร้าน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ดูรายได้และการหักภาษีของแต่ละร้าน
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">กรุณาเลือกสาขาเพื่อดูบัญชีสรุป</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💰 บัญชีสรุปร้าน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ดูรายได้และการหักภาษีของแต่ละร้าน
          </p>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💰 บัญชีสรุปร้าน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ดูรายได้และการหักภาษีของแต่ละร้าน
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-12 text-center">
          <p className="text-rose-600">{error}</p>
          <button
            onClick={fetchAccountingData}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Store Accounting</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">💰 บัญชีสรุปร้าน</h1>
        {selectedStore ? (
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-indigo-200">{selectedStore.name}</p>
        ) : null}
        <p className="mt-3 text-sm text-slate-300">
          ดูรายได้และการหักภาษีของแต่ละร้าน
        </p>
      </header>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['current', 'last', 'year'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedPeriod === period
                ? 'bg-indigo-500 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {period === 'current' ? 'เดือนนี้' : period === 'last' ? 'เดือนที่แล้ว' : 'ปีนี้'}
          </button>
        ))}
      </div>

      {/* Accounting Settings */}
      {accountingSettings && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">การตั้งค่าบัญชี</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">ภาษี</p>
              <p className="text-2xl font-bold text-slate-900">{accountingSettings.taxRate}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">ค่าธรรมเนียม API</p>
              <p className="text-2xl font-bold text-slate-900">{accountingSettings.apiGatewayFeeRate}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">ส่วนแบ่งเว็บ</p>
              <p className="text-2xl font-bold text-slate-900">{accountingSettings.ownerShareRate}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">ส่วนแบ่งร้าน</p>
              <p className="text-2xl font-bold text-slate-900">{accountingSettings.storeRevenueRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Data */}
      {settlementData && (
        <div className="space-y-6">
          {/* Revenue Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">สรุปรายได้</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-600">รายได้รวม</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ฿{settlementData.settlement.summary.grossRevenue.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-600">Warp Transactions</p>
                <p className="text-2xl font-bold text-blue-900">
                  ฿{settlementData.revenue.warpTransactions.amount.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">{settlementData.revenue.warpTransactions.count} รายการ</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-medium text-purple-600">Song Requests</p>
                <p className="text-2xl font-bold text-purple-900">
                  ฿{settlementData.revenue.songRequests.amount.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600">{settlementData.revenue.songRequests.count} รายการ</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">รวมรายการ</p>
                <p className="text-2xl font-bold text-slate-900">
                  {settlementData.transactions.total}
                </p>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">การหัก</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-medium text-yellow-600">ภาษี ({settlementData.settlement.deductions.tax.rate}%)</p>
                <p className="text-2xl font-bold text-yellow-900">
                  ฿{settlementData.settlement.deductions.tax.amount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-600">ค่าธรรมเนียม API ({settlementData.settlement.deductions.apiGatewayFee.rate}%)</p>
                <p className="text-2xl font-bold text-orange-900">
                  ฿{settlementData.settlement.deductions.apiGatewayFee.amount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-600">ส่วนแบ่งเว็บ ({settlementData.settlement.deductions.ownerShare.rate}%)</p>
                <p className="text-2xl font-bold text-red-900">
                  ฿{settlementData.settlement.deductions.ownerShare.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Net Amounts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">รายได้สุทธิ</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-600">ส่วนแบ่งร้าน ({settlementData.settlement.netAmounts.storeRevenue.rate}%)</p>
                <p className="text-3xl font-bold text-green-900">
                  ฿{settlementData.settlement.netAmounts.storeRevenue.amount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-600">ส่วนแบ่งเว็บ ({settlementData.settlement.netAmounts.ownerShare.rate}%)</p>
                <p className="text-3xl font-bold text-indigo-900">
                  ฿{settlementData.settlement.netAmounts.ownerShare.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">สรุป</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">รายได้รวม</span>
                <span className="font-semibold text-slate-900">฿{settlementData.settlement.summary.grossRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">หักภาษี</span>
                <span className="font-semibold text-slate-900">-฿{settlementData.settlement.deductions.tax.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">หักค่าธรรมเนียม API</span>
                <span className="font-semibold text-slate-900">-฿{settlementData.settlement.deductions.apiGatewayFee.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">หักส่วนแบ่งเว็บ</span>
                <span className="font-semibold text-slate-900">-฿{settlementData.settlement.deductions.ownerShare.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-slate-50 rounded-lg px-4">
                <span className="text-lg font-semibold text-slate-900">ส่วนแบ่งร้าน</span>
                <span className="text-xl font-bold text-green-600">฿{settlementData.settlement.netAmounts.storeRevenue.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data */}
      {!accountingSettings && !settlementData && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500">ยังไม่มีการตั้งค่าบัญชีสำหรับร้านนี้</p>
        </div>
      )}
    </div>
  );
};

export default AdminStoreAccountingPage;
