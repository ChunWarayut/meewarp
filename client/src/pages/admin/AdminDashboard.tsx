import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config';
import AdminForm from '../../components/AdminForm';
import { useAuth } from '../../contexts/AuthContext';

type Overview = {
  totalRevenue: number;
  totalWarps: number;
  totalWarpSeconds: number;
  queueLength: number;
  today: {
    revenue: number;
    warps: number;
  };
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.adminDashboard, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load dashboard');
        }
        const data = (await response.json()) as Overview;
        if (isMounted) {
          setOverview(data);
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

    if (token) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const cards = overview
    ? [
        {
          label: 'รายได้รวม',
          value: `${overview.totalRevenue.toLocaleString('th-TH')} ฿`,
          sub: `วันนี้ ${overview.today.revenue.toLocaleString('th-TH')} ฿`,
        },
        {
          label: 'จำนวน Warp ทั้งหมด',
          value: overview.totalWarps.toLocaleString('th-TH'),
          sub: `วันนี้ ${overview.today.warps.toLocaleString('th-TH')} ครั้ง`,
        },
        {
          label: 'วินาทีที่ขายได้',
          value: `${overview.totalWarpSeconds.toLocaleString('th-TH')} s`,
          sub: 'รวมทุกแพ็คเกจ',
        },
        {
          label: 'คิวที่รอแสดง',
          value: overview.queueLength.toString(),
          sub: 'อัปเดตเรียลไทม์',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background with theme colors */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#6366f1_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_#f472b6_0%,_transparent_60%)] opacity-80" />
      
      <div className="relative z-10 p-6 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Overview</p>
            <h1 className="mt-2 text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/packages"
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Manage Packages
              </div>
            </Link>
          </div>
        </header>

      {loading ? (
        <p className="text-sm text-slate-300">Loading dashboard…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : overview ? (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const gradients = [
              'from-indigo-500 to-purple-600',
              'from-emerald-500 to-teal-600', 
              'from-amber-500 to-orange-600',
              'from-pink-500 to-rose-600'
            ];
            const icons = [
              'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
              'M13 10V3L4 14h7v7l9-11h-7z',
              'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
              'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            ];
            
            return (
              <div key={card.label} className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_30px_70px_rgba(15,23,42,0.6)] hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradients[index]} flex items-center justify-center`}>
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[index]} />
                    </svg>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 font-medium">{card.label}</p>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
                <p className="text-sm text-slate-300">{card.sub}</p>
              </div>
            );
          })}
        </section>
      ) : null}

      </div>
    </div>
  );
};

export default AdminDashboard;
