import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';

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

type WeeklySettlement = {
  store: {
    _id: string;
    name: string;
    slug: string;
  };
  accounting: {
    taxRate: number;
    ownerShareRate: number;
    apiGatewayFeeRate: number;
    storeRevenueRate: number;
  };
  settlement: SettlementBreakdown | null;
  week: number;
  year: number;
};

type WeeklySettlementServicePayload = {
  settlement: SettlementBreakdown;
  [key: string]: unknown;
};

type WeeklySettlementApiEntry = Omit<WeeklySettlement, 'settlement'> & {
  settlement?: SettlementBreakdown | WeeklySettlementServicePayload | null;
};

type WeeklySettlementResponse = {
  weeklySettlements: WeeklySettlementApiEntry[];
  week: number;
  year: number;
  total: number;
};

const extractSettlementBreakdown = (
  rawSettlement: WeeklySettlementApiEntry['settlement']
): SettlementBreakdown | null => {
  if (!rawSettlement) {
    return null;
  }

  if ('summary' in rawSettlement) {
    return rawSettlement;
  }

  if ('settlement' in rawSettlement && rawSettlement.settlement) {
    return rawSettlement.settlement;
  }

  return null;
};

const AdminWeeklySettlementPage = () => {
  const { token } = useAuth();
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Get current week number
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  useEffect(() => {
    const week = getCurrentWeek();
    setCurrentWeek(week);
    setSelectedWeek(week);
  }, []);

  const fetchWeeklySettlements = async (week?: number, year?: number) => {
    try {
      setLoading(true);
      setError(null);

      const url = API_ENDPOINTS.adminStoreAccountingWeeklySettlement(
        week || selectedWeek,
        year || selectedYear
      );

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weekly settlements');
      }

      const data: WeeklySettlementResponse = await response.json();
      const normalizedSettlements: WeeklySettlement[] = (data.weeklySettlements || []).map(
        (entry) => ({
          store: entry.store,
          accounting: entry.accounting,
          settlement: extractSettlementBreakdown(entry.settlement),
          week: entry.week,
          year: entry.year,
        })
      );

      setSettlements(normalizedSettlements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySettlements();
  }, [selectedStoreId, selectedWeek, selectedYear]);

  const handleWeekChange = (week: number) => {
    setSelectedWeek(week);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };


  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">สรุปรายสัปดาห์</h1>
          <p className="text-slate-600">กรุณาเลือกสาขาก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Weekly Settlement</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">สรุปรายสัปดาห์</h1>
        {selectedStore ? (
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-indigo-200">{selectedStore.name}</p>
        ) : null}
        <p className="mt-3 text-sm text-slate-300">
          สรุปรายได้และการหักสำหรับสัปดาห์ที่ {selectedWeek} ปี {selectedYear}
        </p>
      </header>

      {/* Week/Year Selector */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white mb-4">เลือกสัปดาห์</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">
              สัปดาห์
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => handleWeekChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  สัปดาห์ที่ {week}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">
              ปี
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchWeeklySettlements()}
              className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
            >
              ดูข้อมูล
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedWeek(currentWeek);
                setSelectedYear(new Date().getFullYear());
              }}
              className="w-full rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(71,85,105,0.35)] transition hover:bg-slate-400"
            >
              สัปดาห์นี้
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-red-400">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="ml-2 text-slate-600">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      )}

      {/* Settlements List */}
      {!loading && !error && (
        <div className="space-y-6">
          {settlements.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 text-slate-400">📊</div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">ไม่มีข้อมูล</h3>
                <p className="text-slate-600">
                  ไม่พบข้อมูลสรุปรายสัปดาห์สำหรับสัปดาห์ที่ {selectedWeek} ปี {selectedYear}
                </p>
              </div>
            </div>
          ) : (
            settlements.map((settlement) => {
              const settlementDetails = settlement.settlement;

              if (!settlementDetails) {
                return (
                  <div key={settlement.store._id} className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {settlement.store.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          สัปดาห์ที่ {settlement.week} ปี {settlement.year}
                        </p>
                      </div>
                      <div className="text-right text-slate-500">
                        <p className="text-sm font-medium">ไม่มีข้อมูล</p>
                        <p className="text-xs">ยังไม่มีการสรุป</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-slate-600">
                      ไม่พบข้อมูลสรุปสำหรับสัปดาห์นี้
                    </div>
                  </div>
                );
              }

              return (
                <div key={settlement.store._id} className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {settlement.store.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        สัปดาห์ที่ {settlement.week} ปี {settlement.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(settlementDetails.summary.storeShare)}
                      </p>
                      <p className="text-sm text-slate-600">ส่วนแบ่งร้าน</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Revenue */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-medium text-blue-600">รายได้รวม</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatCurrency(settlementDetails.summary.grossRevenue)}
                      </p>
                    </div>

                    {/* Tax */}
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-sm font-medium text-yellow-600">
                        ภาษี ({settlementDetails.deductions.tax.rate}%)
                      </p>
                      <p className="text-xl font-bold text-yellow-900">
                        {formatCurrency(settlementDetails.deductions.tax.amount)}
                      </p>
                    </div>

                    {/* API Gateway Fee */}
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <p className="text-sm font-medium text-purple-600">
                        ค่าธรรมเนียม API ({settlementDetails.deductions.apiGatewayFee.rate}%)
                      </p>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(settlementDetails.deductions.apiGatewayFee.amount)}
                      </p>
                    </div>

                    {/* Owner Share */}
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-600">
                        ส่วนแบ่งเว็บ ({settlementDetails.deductions.ownerShare.rate}%)
                      </p>
                      <p className="text-xl font-bold text-red-900">
                        {formatCurrency(settlementDetails.deductions.ownerShare.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">รายได้สุทธิ</p>
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(settlementDetails.summary.netRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">ส่วนแบ่งร้าน</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(settlementDetails.summary.storeShare)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWeeklySettlementPage;
