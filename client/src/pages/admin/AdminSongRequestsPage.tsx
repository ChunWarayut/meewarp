import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';

type SongRequestStatus = 'pending' | 'paid' | 'playing' | 'played' | 'rejected';

type SongRequest = {
  _id: string;
  songTitle: string;
  artistName?: string;
  message?: string;
  requesterName: string;
  requesterInstagram?: string;
  amount: number;
  status: SongRequestStatus;
  priority: number;
  createdAt: string;
  playedAt?: string;
  metadata?: {
    stripePaymentStatus?: string;
    promptpay?: {
      paidAt?: string;
    };
  };
};

const statusColors: Record<SongRequestStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  playing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  played: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const statusLabels: Record<SongRequestStatus, string> = {
  pending: 'รอชำระเงิน',
  paid: 'ชำระแล้ว',
  playing: 'กำลังเล่น',
  played: 'เล่นแล้ว',
  rejected: 'ปฏิเสธ',
};

const AdminSongRequestsPage = () => {
  const { token } = useAuth();
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SongRequestStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSongRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      params.append('limit', '100');

      const baseUrl = API_ENDPOINTS.adminSongRequests(selectedStoreId);
      const response = await fetch(
        `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch song requests');
      }

      const data = await response.json();
      setSongRequests(data.songRequests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStoreId) {
      setSongRequests([]);
      setLoading(false);
      return;
    }
    
    fetchSongRequests();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchSongRequests, 10000);
    return () => clearInterval(interval);
  }, [selectedStatus, selectedStoreId]);

  const handleUpdateStatus = async (requestId: string, newStatus: SongRequestStatus) => {
    try {
      setUpdating(requestId);

      const response = await fetch(
        `${API_ENDPOINTS.adminSongRequests}/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === 'played' && { playedAt: new Date().toISOString() }),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh list
      await fetchSongRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำขอเพลงนี้?')) {
      return;
    }

    try {
      setUpdating(requestId);

      const response = await fetch(
        `${API_ENDPOINTS.adminSongRequests}/${requestId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete song request');
      }

      // Refresh list
      await fetchSongRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setUpdating(null);
    }
  };

  const paidRequests = songRequests.filter((r) => r.status === 'paid');
  const totalRevenue = songRequests
    .filter((r) => ['paid', 'playing', 'played'].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);

  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🎵 Song Requests</h1>
          <p className="mt-1 text-sm text-slate-600">
            จัดการคำขอเพลงและ donate จากผู้ใช้
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">กรุณาเลือกสาขาเพื่อดู Song Requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Song Requests</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">🎵 Song Requests</h1>
        {selectedStore ? (
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-indigo-200">{selectedStore.name}</p>
        ) : null}
        <p className="mt-3 text-sm text-slate-300">
          จัดการคำขอเพลงและ donate จากผู้ใช้
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">คิวรอเล่น</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{paidRequests.length}</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3">
              <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">ทั้งหมด</p>
              <p className="mt-2 text-3xl font-bold text-indigo-900">{songRequests.length}</p>
            </div>
            <div className="rounded-full bg-indigo-100 p-3">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">รายได้รวม</p>
              <p className="mt-2 text-3xl font-bold text-green-900">
                ฿{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">เล่นแล้ว</p>
              <p className="mt-2 text-3xl font-bold text-purple-900">
                {songRequests.filter((r) => r.status === 'played').length}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedStatus === 'all'
                ? 'bg-indigo-500 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
        >
          ทั้งหมด ({songRequests.length})
        </button>
        {(['paid', 'playing', 'played', 'pending', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedStatus === status
                ? 'bg-indigo-500 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {statusLabels[status]} ({songRequests.filter((r) => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Song Requests List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-rose-600">{error}</p>
            <button
              onClick={fetchSongRequests}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              ลองใหม่
            </button>
          </div>
        ) : songRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <svg
              className="mx-auto h-12 w-12 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <p className="mt-2">ไม่มีคำขอเพลง</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {songRequests.map((request) => (
              <div
                key={request._id}
                className="p-6 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Song Info */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full bg-pink-100 p-2">
                        <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-500">
                          {request.songTitle}
                          {request.artistName && (
                            <span className="text-slate-500"> - {request.artistName}</span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Requested by: <span className="font-medium">{request.requesterName}</span>
                          {request.requesterInstagram && (
                            <span className="text-slate-400"> (@{request.requesterInstagram})</span>
                          )}
                        </p>
                        {request.message && (
                          <p className="mt-2 text-sm text-slate-500 italic">
                            "{request.message}"
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Donated: <span className="font-bold text-green-600">฿{request.amount.toLocaleString()}</span>
                          </span>
                          <span>•</span>
                          <span>{new Date(request.createdAt).toLocaleString('th-TH')}</span>
                          {request.playedAt && (
                            <>
                              <span>•</span>
                              <span>เล่นเมื่อ: {new Date(request.playedAt).toLocaleString('th-TH')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        statusColors[request.status]
                      }`}
                    >
                      {statusLabels[request.status]}
                    </span>

                    <div className="flex gap-2">
                      {request.status === 'paid' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(request._id, 'playing')}
                            disabled={updating === request._id}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            กำลังเล่น
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request._id, 'played')}
                            disabled={updating === request._id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            เล่นแล้ว
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request._id, 'rejected')}
                            disabled={updating === request._id}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      {request.status === 'playing' && (
                        <button
                          onClick={() => handleUpdateStatus(request._id, 'played')}
                          disabled={updating === request._id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          เล่นแล้ว
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(request._id)}
                        disabled={updating === request._id}
                        className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSongRequestsPage;

