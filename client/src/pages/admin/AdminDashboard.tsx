import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';
import { buildAuthHeaders } from '../../utils/http';

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
  const { selectedStoreId, selectedStore, locked, loadingStores } = useStoreContext();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.adminDashboard, {
          headers: {
            ...buildAuthHeaders(token, selectedStoreId ?? undefined),
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

    if (token && selectedStoreId) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [token, selectedStoreId]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const shareLinks = useMemo(() => {
    if (!selectedStore?.slug) {
      return [];
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const slugPath = `/${selectedStore.slug}`;
    const makeLink = (path: string) => `${baseUrl}${path}`;

    return [
      {
        key: 'self-warp',
        label: 'หน้าซื้อ Warp (Self Warp)',
        description: 'ใช้สำหรับให้ลูกค้ากรอกข้อมูลและชำระเงินเอง',
        url: makeLink(`${slugPath}/self-warp`),
        badge: 'Self Warp',
      },
      {
        key: 'tv',
        label: 'หน้าจอแสดงผล TV',
        description: 'เปิดบนหน้างานเพื่อแสดงคิว Warp แบบเรียลไทม์',
        url: makeLink(`${slugPath}/tv`),
        badge: 'TV',
      },
      {
        key: 'self-warp-external',
        label: 'Self Warp (เปิดบนมือถือ)',
        description: 'ลิงก์พร้อมพารามิเตอร์เปิดเบราว์เซอร์ภายนอกอัตโนมัติ',
        url: makeLink(`${slugPath}/self-warp?openExternalBrowser=1`),
        badge: 'Mobile',
      },
    ];
  }, [selectedStore?.slug]);

  const handleCopyLink = useCallback((key: string, link: string) => {
    if (!link) {
      return;
    }

    const fallbackCopy = () => {
      if (typeof document === 'undefined') return;
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy via execCommand', err);
      } finally {
        document.body.removeChild(textarea);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }

    setCopiedKey(key);
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopiedKey(null);
      copyTimeoutRef.current = null;
    }, 2000);
  }, []);

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

  if (!locked && !selectedStoreId) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-300">เลือกสาขาก่อนเพื่อดูข้อมูลภาพรวม</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden relative min-h-screen text-slate-100 font-th">
      {/* <div
        className="absolute -top-40 inset-x-1/2 w-80 h-80 rounded-full blur-3xl -translate-x-1/2 pointer-events-none bg-indigo-500/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-28 top-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-purple-500/25 blur-3xl"
        aria-hidden
      /> */}

      <div className="relative z-10 px-6 py-10 sm:px-8 sm:py-12">
        <header className="flex flex-wrap gap-6 justify-between items-start">
          <div>
            <p className="font-en text-xs uppercase tracking-[0.5em] text-indigo-300">Dashboard</p>
            <h1
              lang="th"
              className="mt-2 text-4xl font-semibold text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.45)] sm:text-5xl"
            >
              ภาพรวมระบบ
            </h1>
            {selectedStore ? (
              <p lang="th" className="mt-1 text-xs uppercase tracking-[0.4em] text-indigo-200">
                {selectedStore.name}
              </p>
            ) : null}
            <p lang="th" className="mt-2 max-w-xl text-sm text-slate-300">
              ตัวเลขอัปเดตเรียลไทม์จากฝั่งลูกค้าและคิว Warp
            </p>
          </div>
          <Link
            to="/admin/packages"
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-100 shadow-[0_18px_45px_rgba(8,12,24,0.45)] transition hover:border-white/35 hover:bg-white/10 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Manage Packages
          </Link>
        </header>

        {selectedStore?.slug ? (
          <section className="mt-10 space-y-4">
            <div className="flex gap-3 justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Shareable Links</p>
                <p className="mt-1 text-sm text-slate-300">คัดลอกลิงก์สำคัญของสาขานี้เพื่อส่งให้ลูกค้าหรือทีมงาน</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shareLinks.map((item) => (
                <article
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_55px_rgba(8,12,24,0.45)] backdrop-blur-xl"
                >
                  <div className="flex gap-3 justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-indigo-200">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-3 break-all rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-200">
                    {item.url}
                  </p>
                  <button
                    type="button"
                    className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                      copiedKey === item.key
                        ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                        : 'border-white/15 bg-white/5 text-slate-100 hover:border-white/35 hover:bg-white/10'
                    }`}
                    onClick={() => handleCopyLink(item.key, item.url)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 17l-2 2a2 2 0 01-2-2V7a2 2 0 012-2h6m4 4h4m0 0v10a2 2 0 01-2 2h-8a2 2 0 01-2-2v-4m12-6l-6-6-6 6"
                      />
                    </svg>
                    {copiedKey === item.key ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10 space-y-8">
          {loading || loadingStores ? (
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
                  'from-pink-500 to-rose-600',
                ];
                const icons = [
                  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
                  'M13 10V3L4 14h7v7l9-11h-7z',
                  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                ];

                return (
                  <article
                    key={card.label}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_65px_rgba(8,12,24,0.55)] backdrop-blur-xl transition hover:scale-[1.03] hover:shadow-[0_30px_80px_rgba(8,12,24,0.7)]"
                  >
                    <div className="flex gap-3 items-center mb-4">
                      <span className={`flex justify-center items-center w-11 h-11 bg-gradient-to-br rounded-xl ${gradients[index]}`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[index]} />
                        </svg>
                      </span>
                      <p lang="th" className="text-xs uppercase tracking-[0.35em] text-indigo-200">
                        {card.label}
                      </p>
                    </div>
                    <p className="text-3xl font-semibold text-white sm:text-[34px]">{card.value}</p>
                    <p lang="th" className="mt-2 text-sm text-slate-300">
                      {card.sub}
                    </p>
                  </article>
                );
              })}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
