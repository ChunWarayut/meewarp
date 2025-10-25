import { useEffect, useState, useRef } from 'react';
import { API_ENDPOINTS } from '../../config';

type SongRequest = {
  id: string;
  songTitle: string;
  artistName?: string;
  customerName?: string;
  message?: string;
  amount: number;
  status: string;
  paidAt?: string;
};

type Props = {
  storeSlug?: string | null;
  show: boolean;
};

const DISPLAY_DURATION = 10000; // 10 seconds per song
const AUTO_HIDE_AFTER_MS = 60000; // หายอัตโนมัติหลังชำระเงิน 60 วินาที

export const SongRequestDisplay = ({ storeSlug, show }: Props) => {
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!show) return;

    const fetchSongRequests = async () => {
      try {
        const url = `${API_ENDPOINTS.publicTransactions(storeSlug).replace('/transactions', '/song-requests-paid')}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.songRequests?.length > 0) {
          // Filter เฉพาะ song requests ที่ยังไม่เกิน 60 วินาที
          const now = new Date().getTime();
          const filteredRequests = data.songRequests.filter((sr: SongRequest) => {
            if (!sr.paidAt) return true; // ถ้าไม่มี paidAt ให้แสดง
            
            const paidTime = new Date(sr.paidAt).getTime();
            const elapsedMs = now - paidTime;
            
            // แสดงเฉพาะที่ยังไม่เกิน 60 วินาที
            return elapsedMs < AUTO_HIDE_AFTER_MS;
          });

          setSongRequests(filteredRequests);
        } else {
          setSongRequests([]);
        }
      } catch (error) {
        console.error('Failed to fetch song requests:', error);
      }
    };

    fetchSongRequests();
    const interval = setInterval(fetchSongRequests, 5000); // Check ทุก 5 วินาที

    return () => clearInterval(interval);
  }, [storeSlug, show]);

  useEffect(() => {
    if (songRequests.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % songRequests.length);
    }, DISPLAY_DURATION);

    return () => clearInterval(interval);
  }, [songRequests.length]);

  if (!show || songRequests.length === 0) {
    return null;
  }

  const currentSong = songRequests[currentIndex];

  return (
    // bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-slate-900/95
    <div className="absolute inset-0 flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-block px-6 py-2 bg-pink-500 backdrop-blur-sm border border-pink-400/30 rounded-full">
            <span className="text-2xl font-semibold text-pink-200">🎵 ขอเพลง</span>
          </div>
          {/* <p className="text-lg text-slate-300">รอสตรีมเมอร์เปิดเพลง...</p> */}
        </div>

        {/* Song Info */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-10 border border-white/10 shadow-2xl">
          {/* Customer Name - แสดงที่ด้านบน */}
          {currentSong.customerName && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <svg className="w-7 h-7 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-2xl text-pink-300 font-semibold">
                {currentSong.customerName}
              </span>
              <span className="text-xl text-slate-400">ขอเพลง</span>
            </div>
          )}

          <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            {currentSong.songTitle}
          </h2>
          {currentSong.artistName && (
            <p className="text-3xl text-slate-300 mb-6">
              {currentSong.artistName}
            </p>
          )}

          {currentSong.message && (
            <div className="mt-8 mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-2xl text-slate-200 italic">
                "{currentSong.message}"
              </p>
            </div>
          )}

          {/* Amount */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <span className="text-2xl text-emerald-300 font-bold">
              ฿{currentSong.amount.toLocaleString('th-TH')}
            </span>
          </div>
        </div>

        {/* Queue Info */}
        {songRequests.length > 1 && (
          <div className="flex items-center justify-center gap-3">
            <span className="text-slate-400">คิวที่</span>
            <span className="text-white font-bold text-xl">
              {currentIndex + 1} / {songRequests.length}
            </span>
            <div className="flex gap-2 ml-4">
              {songRequests.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'bg-pink-400 w-8' 
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

