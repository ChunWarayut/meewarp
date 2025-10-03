import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type StoreReport = {
  storeId: string | null;
  storeName: string;
  slug: string | null;
  revenue: number;
  warps: number;
  seconds: number;
  lastTransactionAt?: string;
};

type SuperReportResponse = {
  total: {
    revenue: number;
    warps: number;
    seconds: number;
  };
  stores: StoreReport[];
};

const AdminSuperReport = () => {
  const { token } = useAuth();
  const [report, setReport] = useState<SuperReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_ENDPOINTS.adminSuperReport, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to load super admin report');
        }

        const data = (await response.json()) as SuperReportResponse;
        if (isMounted) {
          setReport(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unexpected error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Super Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Multi-Store Overview</h1>
        <p className="mt-1 text-sm text-slate-300">ภาพรวมรายได้และจำนวน Warp ของทุกสาขา</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-300">Loading overview…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : report ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'รายได้รวมทั้งหมด', value: `${report.total.revenue.toLocaleString('th-TH')} ฿` },
              { label: 'จำนวน Warp ทั้งหมด', value: report.total.warps.toLocaleString('th-TH') },
              { label: 'วินาทีที่ขายได้รวม', value: `${report.total.seconds.toLocaleString('th-TH')} s` },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
            <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Store</th>
                  <th className="px-4 py-3 text-left font-semibold">Revenue</th>
                  <th className="px-4 py-3 text-left font-semibold">Warps</th>
                  <th className="px-4 py-3 text-left font-semibold">Seconds</th>
                  <th className="px-4 py-3 text-left font-semibold">Last Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {report.stores.map((store) => (
                  <tr key={store.storeId ?? store.storeName}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{store.storeName}</div>
                      {store.slug ? (
                        <div className="text-xs text-slate-300">Slug: {store.slug}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{store.revenue.toLocaleString('th-TH')} ฿</td>
                    <td className="px-4 py-3 text-slate-200">{store.warps.toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3 text-slate-200">{store.seconds.toLocaleString('th-TH')} s</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {store.lastTransactionAt ? new Date(store.lastTransactionAt).toLocaleString('th-TH') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        <p className="text-sm text-slate-300">ยังไม่มีข้อมูลสำหรับรายงาน</p>
      )}
    </div>
  );
};

export default AdminSuperReport;
