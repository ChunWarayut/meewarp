import { useNavigate, useParams } from 'react-router-dom';
import { resolveStoreSlug } from '../utils/storeSlug';

const QrLandingPage = () => {
  const navigate = useNavigate();
  const { storeSlug } = useParams<{ storeSlug?: string }>();
  const resolvedStoreSlug = resolveStoreSlug(storeSlug);
  const basePath = resolvedStoreSlug ? `/${resolvedStoreSlug}` : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-th text-slate-100" style={{ letterSpacing: '-0.02em' }}>
      {/* Background Gradients */}
      <div
        className="pointer-events-none absolute -top-32 inset-x-1/3 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-12 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-pink-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-purple-500/25 blur-3xl"
        aria-hidden
      />

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1
            className="mb-4 text-5xl font-bold drop-shadow-[0_0_35px_rgba(99,102,241,0.45)] sm:text-6xl"
            style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🎮 MEEWARP
          </h1>
          <p className="text-lg text-slate-300 sm:text-xl">
            Interactive Stream Experience
          </p>
        </div>

        {/* Divider */}
        <div className="mb-10 w-32 border-t-2 border-gradient-to-r border-indigo-500/50" />

        {/* Question */}
        <h2 className="mb-10 text-center text-2xl font-semibold text-white sm:text-3xl">
          คุณต้องการทำอะไร?
        </h2>

        {/* Options */}
        <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
          {/* Warp Option */}
          <button
            onClick={() => navigate(`${basePath}/self-warp`)}
            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-8 shadow-[0_30px_90px_rgba(8,12,24,0.65)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400/50 hover:shadow-[0_30px_90px_rgba(99,102,241,0.4)]"
          >
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 p-4 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="h-12 w-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-3 text-2xl font-bold text-white">
                🎁 แจกวาร์ป
              </h3>

              {/* Description */}
              <p className="mb-6 text-sm leading-relaxed text-slate-300">
                แสดงรูปภาพและโปรไฟล์ของคุณ<br />
                ขึ้นบนจอทีวีตามเวลาที่เลือก
              </p>

              {/* CTA */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-indigo-200 transition-colors group-hover:bg-indigo-500/30">
                เริ่มเลย
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>

          {/* Song Request Option */}
          <button
            onClick={() => navigate(`${basePath}/song-request`)}
            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-8 shadow-[0_30px_90px_rgba(8,12,24,0.65)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-pink-400/50 hover:shadow-[0_30px_90px_rgba(236,72,153,0.4)]"
          >
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 p-4 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="h-12 w-12 text-white"
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
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-3 text-2xl font-bold text-white">
                🎵 ขอเพลง
              </h3>

              {/* Description */}
              <p className="mb-6 text-sm leading-relaxed text-slate-300">
                ขอเพลงที่คุณชอบและ donate<br />
                สนับสนุนสตรีมเมอร์
              </p>

              {/* CTA */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-pink-200 transition-colors group-hover:bg-pink-500/30">
                เริ่มเลย
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-rose-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400">
            สแกน QR Code จากหน้าจอสตรีมเพื่อเริ่มต้น
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrLandingPage;

