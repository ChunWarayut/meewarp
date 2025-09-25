import { FormEvent, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type StatisticsResponse = {
  summary: {
    revenue: number;
    warps: number;
    seconds: number;
  };
  timeline: { date: string; revenue: number; warps: number }[];
  gender: { gender: string; revenue: number; warps: number }[];
  ageRanges: { ageRange: string; revenue: number; warps: number }[];
};

const genderOptions = [
  { label: 'ทั้งหมด', value: '' },
  { label: 'ชาย', value: 'male' },
  { label: 'หญิง', value: 'female' },
  { label: 'Non-binary', value: 'nonbinary' },
  { label: 'ไม่ระบุ', value: 'prefer_not_to_say' },
];

const ageOptions = [
  { label: 'ทั้งหมด', value: '' },
  { label: '13-17', value: '13-17' },
  { label: '18-24', value: '18-24' },
  { label: '25-34', value: '25-34' },
  { label: '35-44', value: '35-44' },
  { label: '45+', value: '45+' },
];

const AdminStatistics = () => {
  const { token } = useAuth();
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (query: string) => {
    const response = await fetch(`${API_ENDPOINTS.adminStatistics}${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || 'Failed to load statistics');
    }
    return (await response.json()) as StatisticsResponse;
  };

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('range', range);
      if (gender) params.set('gender', gender);
      if (age) params.set('ageRange', age);
      if (range === 'custom') {
        if (from) params.set('from', from);
        if (to) params.set('to', to);
      }
      const dataset = await fetchStats(`?${params.toString()}`);
      setData(dataset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    load();
  };

  const summaryCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'รายได้รวม',
        value: `${data.summary.revenue.toLocaleString('th-TH')} ฿`,
      },
      {
        label: 'จำนวน Warp',
        value: data.summary.warps.toLocaleString('th-TH'),
      },
      {
        label: 'วินาทีที่ขายได้',
        value: `${data.summary.seconds.toLocaleString('th-TH')} s`,
      },
    ];
  }, [data]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Warp Statistics</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="sm:col-span-1">
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Range</label>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as typeof range)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="day">วันนี้</option>
            <option value="week">7 วันล่าสุด</option>
            <option value="month">เดือนนี้</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {range === 'custom' ? (
          <>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">From</label>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">To</label>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </>
        ) : null}

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Gender</label>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Age Range</label>
          <select
            value={age}
            onChange={(event) => setAge(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            {ageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
          >
            Apply
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-300">Loading statistics…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : data ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Timeline</h2>
            <ul className="mt-4 divide-y divide-white/10 text-sm">
              {data.timeline.map((entry) => (
                <li key={entry.date} className="flex items-center justify-between py-2 text-slate-200">
                  <span>{entry.date}</span>
                  <span>{entry.revenue.toLocaleString('th-TH')} ฿</span>
                  <span>{entry.warps} warp</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">By Gender</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {data.gender.map((row) => (
                  <li key={row.gender || 'unknown'} className="flex items-center justify-between">
                    <span>{row.gender || 'ไม่ระบุ'}</span>
                    <span>{row.revenue.toLocaleString('th-TH')} ฿</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">By Age Range</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {data.ageRanges.map((row) => (
                  <li key={row.ageRange || 'unknown'} className="flex items-center justify-between">
                    <span>{row.ageRange || 'ไม่ระบุ'}</span>
                    <span>{row.revenue.toLocaleString('th-TH')} ฿</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminStatistics;
