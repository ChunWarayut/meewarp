import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveStoreSlug } from '../utils/storeSlug';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type DemoMessage = {
  id: string;
  author: string;
  text: string;
  tone: 'song' | 'shout' | 'tip';
};

type FloatingOrb = {
  size: number;
  color: string;
  blur: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

const heroBadges = ['ใช้จริง', 'รองรับ PromptPay', 'การันตีคอนเทนต์ของร้านคุณ'];

const heroSparkles = [
  { icon: '⚡️', label: 'เซ็ตอัพใน 15 นาที' },
  { icon: '🪟', label: 'Glassmorphism Dashboard' },
  { icon: '📡', label: 'Realtime TV Visualizer' }
];

const heroSparkleDots = [
  { top: '6%', left: '12%', size: 14, delay: '0s', icon: '✦' },
  { top: '18%', right: '8%', size: 11, delay: '1.8s', icon: '✧' },
  { top: '32%', left: '4%', size: 10, delay: '2.4s', icon: '❖' },
  { top: '42%', right: '18%', size: 12, delay: '3.2s', icon: '✺' },
  { top: '12%', left: '45%', size: 9, delay: '0.9s', icon: '✶' },
  { top: '48%', left: '25%', size: 11, delay: '2.9s', icon: '✷' }
];

const trustLogos = ['MongkolBar Pak Chong'];

const painPoints = [
  {
    title: 'ลูกค้าอยากมีส่วนร่วม แต่ไม่มีช่องให้จอย',
    detail: 'ทุกโต๊ะอยากขึ้นจอ อยากส่ง shoutout แต่ต้องพึ่งพนักงานตลอดคืน'
  },
  {
    title: 'พนักงานรับคำขอเพลงไม่ทัน โต๊ะรอคิวยาว',
    detail: 'ดีเจถูกขอเพลงทางปาก พนักงานต้องถือโพยเดินทั่วร้าน'
  },
  {
    title: 'โปรโมชันบนจอไม่ดึงดูด ไม่มีคนแชร์ต่อ',
    detail: 'จอแสดงแค่สไลด์นิ่ง ไม่สร้างยอดซื้อหรือคอนเทนต์'
  }
];

const valueFeatures = [
  {
    title: 'Song Request + Tip',
    summary: 'ขอเพลงแล้วขึ้นจอ ขอบคุณผู้ให้ทิปแบบเท่ๆ',
    icon: 'song'
  },
  {
    title: 'Shoutout Screen',
    summary: 'พิมพ์จีบ/แซว/ฉลอง ขึ้นจอได้',
    icon: 'shout'
  },
  {
    title: 'Celebrate Table',
    summary: 'เอฟเฟกต์ไฟ+เสียง ฉลองวันเกิด/เปิดบิลโต๊ะ ปรับธีมได้',
    icon: 'celebrate'
  },
  {
    title: 'Photo Booth',
    summary: 'ถ่าย-ใส่กรอบธีม-ขึ้นจอ-โหลดได้ ปล่อย QR อัตโนมัติ',
    icon: 'photo'
  },
  {
    title: 'Table Score',
    summary: 'แข่งความคึกของแต่ละโต๊ะ ดันยอดซื้อและยอดแชร์',
    icon: 'score'
  },
  {
    title: 'Staff Call',
    summary: 'เรียกน้ำแข็ง/รีฟิล/เช็คบิล เด้งถึงมือถือทีมงานแบบ push',
    icon: 'staff'
  }
];

const roiMetrics = [
  { value: '+72%', label: 'แชร์สตอรี่เพิ่มเฉลี่ย', detail: 'ลูกค้าชอบขึ้นจอจึงแชร์ทันที' },
  { value: '-35%', label: 'เวลารอพนักงานลดลง', detail: 'ปุ่ม Staff Call ตอบกลับเร็ว' },
  { value: '+฿1,800', label: 'ทิปต่อคืนโดยเฉลี่ย', detail: 'ดีเจเห็นชื่อผู้ให้ทิปบนจอแบบไฮป์' }
];

const howItWorksSteps = [
  { step: '1', title: 'สแกน QR บนโต๊ะ', detail: 'ไม่ต้องโหลดแอป รองรับ iOS / Android' },
  { step: '2', title: 'เลือกระบบ', detail: 'ขอเพลง ชูโต๊ะ ถ่ายภาพ หรือเรียกสตาฟ' },
  { step: '3', title: 'ขึ้นจอ/เด้งถึงสตาฟ', detail: 'ข้อความอนุมัติก่อนโชว์ ปลอดภัยมั่นใจ' }
];

const pricingPlans = [
  {
    tier: 'FREE',
    price: '0฿',
    description: 'แจกวาร์ป + ข้อความ (จำกัด)',
    bullets: ['เริ่มใช้งานฟรี', 'ข้อความขึ้นจอวันละ 20 ครั้ง', 'สถิติกลางคืนแบบย่อ'],
    accent: 'from-slate-900/90 via-slate-900 to-black'
  },
  {
    tier: 'PRO',
    price: '1,999฿/เดือน',
    description: 'ขอเพลง + Shoutout + อนุมัติข้อความ',
    bullets: ['Song Request + Tip', 'อนุมัติ/บล็อกคำ', 'พรีเซ็ตแคมเปญหน้าจอ'],
    accent: 'from-[#f472b6] via-[#9b6bff] to-[#4c1d95]',
    highlight: 'ยอดนิยม'
  },
  {
    tier: 'CLUB',
    price: '4,999฿/เดือน',
    description: 'Photo Booth + ฉลองโต๊ะ + Score Table',
    bullets: ['Celebrate Effect', 'Photo Booth Auto + QR', 'Table Scoreboard + Ranking'],
    accent: 'from-[#67e8f9] via-[#22d3ee] to-[#0ea5e9]'
  },
  {
    tier: 'CHAIN',
    price: 'Custom',
    description: 'Multi-branch + Brand Custom + SLA',
    bullets: ['Multi-branch Dashboard', 'Custom Branding + API', 'SLA 99.9% + Success Manager'],
    accent: 'from-[#34d399] via-[#10b981] to-[#0f766e]'
  }
];

const neonTickerItems = [
  { icon: '🎧', text: 'DJ Tip Overlay + ชื่อผู้ให้ทิป' },
  { icon: '🎉', text: 'Celebrate Table Effect' },
  { icon: '📸', text: 'Photo Booth Auto + QR Download' },
  { icon: '🏆', text: 'โต๊ะแข่งขัน + Score Table' },
  { icon: '📱', text: 'Staff Call เด้งถึงมือถือ' }
];

const caseStudies = [
  {
    venue: 'Tropic Rooftop',
    quote: '“ดีเจไม่ต้องตะโกนแล้ว ลูกค้าส่งคำขอเพลงเองได้ ยอดทิปโตเป็นสองเท่า”',
    owner: 'คุณพิม Owner',
    metric: '+82% ความคึกโต๊ะ'
  },
  {
    venue: 'Warehouse 39',
    quote: '“MeeWarp ทำให้ทุกโต๊ะกลายเป็นครีเอเตอร์ ปิดดีลโต๊ะพรีเมียมได้ทันที”',
    owner: 'คุณเคน ผู้จัดอีเวนต์',
    metric: '+46% ยอดแชร์สตอรี่'
  }
];

const faqs = [
  {
    question: 'ต้องมีจอไหม?',
    answer: 'จอไหนก็ได้ที่ต่อ HDMI / โปรเจกเตอร์ หรือเปิดเต็มหน้าจอผ่าน Browser ที่บูธดีเจ'
  },
  {
    question: 'เน็ตหลุดทำยังไง?',
    answer: 'มีโหมดออฟไลน์ชั่วคราว เก็บคิวไว้และ sync ทันทีเมื่อเน็ตกลับมา'
  },
  {
    question: 'PDPA ปลอดภัยไหม?',
    answer: 'มีโหมดอนุมัติก่อนโชว์ ซ่อนชื่อ หรือให้ลูกค้าให้ consent ก่อนขึ้นจอ'
  }
];

const floatingOrbs: FloatingOrb[] = [
  { size: 380, top: '-10%', left: '-6%', color: 'rgba(244,114,182,0.28)', blur: 180 },
  { size: 260, top: '10%', right: '-8%', color: 'rgba(79,209,255,0.25)', blur: 160 },
  { size: 220, top: '35%', left: '55%', color: 'rgba(148,187,255,0.2)', blur: 150 },
  { size: 320, bottom: '-15%', right: '8%', color: 'rgba(79,209,255,0.3)', blur: 210 },
  { size: 280, bottom: '-6%', left: '-5%', color: 'rgba(244,114,182,0.22)', blur: 190 },
  { size: 240, bottom: '12%', left: '32%', color: 'rgba(155,107,255,0.2)', blur: 150 }
];

const initialDemoMessages: DemoMessage[] = [
  { id: 'demo-1', author: 'โต๊ะ B2', text: '“Happy Birthday โต๊ะ 7 🎂”', tone: 'shout' },
  { id: 'demo-2', author: 'DJ Tip', text: 'Tip 200฿ สำหรับเพลง Thunderstruck ⚡️', tone: 'tip' },
  { id: 'demo-3', author: 'โต๊ะ C1', text: 'ขอเพลง PINK VENOM เวอร์ชัน Remix!', tone: 'song' }
];

const autoDemoMessages: Omit<DemoMessage, 'id'>[] = [
  { author: 'โต๊ะ VIP', text: 'ปุ่มเรียกน้ำแข็งหน่อยครับ 🧊', tone: 'shout' },
  { author: 'DJ Tip', text: 'Tip 500฿ พร้อมข้อความ “คืนนี้เอามันส์สุด”', tone: 'tip' },
  { author: 'โต๊ะ A5', text: 'ขอเพลง Groove Jet + laser effect', tone: 'song' },
  { author: 'Staff Alert', text: 'โต๊ะ 4 กำลังเช็คบิล', tone: 'shout' }
];

const lineUrl = 'https://lin.ee/lWUNQeY';
const liveDemoAnchor = '#live-demo';
const callPhone = '+66912345678';
const whatsappUrl = 'https://wa.me/66912345678';
const quoteUrl = 'https://lin.ee/lWUNQeY';
const lineQrPlaceholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="16" fill="white"/><rect x="16" y="16" width="20" height="20" fill="#050505"/><rect x="84" y="16" width="20" height="20" fill="#050505"/><rect x="16" y="84" width="20" height="20" fill="#050505"/><rect x="52" y="52" width="16" height="16" fill="#050505"/><rect x="68" y="68" width="12" height="12" fill="#050505"/><rect x="40" y="72" width="10" height="10" fill="#050505"/><rect x="88" y="48" width="12" height="12" fill="#050505"/><rect x="32" y="36" width="12" height="12" fill="#050505"/></svg>`
  );

const toneClasses: Record<DemoMessage['tone'], string> = {
  song: 'from-[#9b6bff]/40 to-[#4fd1ff]/25 text-white',
  shout: 'from-white/15 to-white/5 text-fuchsia-100',
  tip: 'from-amber-400/20 to-pink-400/30 text-amber-100'
};

const iconStroke = 'stroke-current stroke-[1.6] stroke-linecap-round stroke-linejoin-round';

const featureIcon = (type: string) => {
  switch (type) {
    case 'song':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path className={iconStroke} d="M9 19a3 3 0 1 1 0-6c.74 0 1.42.27 1.94.72V5.5l9-3v4.3" />
          <path className={iconStroke} d="M15 17a3 3 0 1 0 6 0c0-1.66-1.34-3-3-3-.74 0-1.42.27-1.94.72V9" />
        </svg>
      );
    case 'shout':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path className={iconStroke} d="M4 9v6l6 3V6z" />
          <path className={iconStroke} d="M20 8v8" />
          <path className={iconStroke} d="m12 6 8-3v18l-8-3" />
        </svg>
      );
    case 'celebrate':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path className={iconStroke} d="M12 2v4" />
          <path className={iconStroke} d="M5 11a7 7 0 0 1 14 0v10H5z" />
          <path className={iconStroke} d="M8 7h8" />
        </svg>
      );
    case 'photo':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <rect className={iconStroke} x="3" y="6" width="18" height="14" rx="3" />
          <path className={iconStroke} d="m3 15 4.5-4.5L14 17" />
          <circle className={iconStroke} cx="17" cy="10" r="2" />
        </svg>
      );
    case 'score':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path className={iconStroke} d="M5 5v14" />
          <path className={iconStroke} d="M12 10v9" />
          <path className={iconStroke} d="M19 3v16" />
          <path className={iconStroke} d="M3 19h18" />
        </svg>
      );
    case 'staff':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path className={iconStroke} d="M8 3h8l2 4h-12z" />
          <path className={iconStroke} d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path className={iconStroke} d="M10 12h4" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <circle className={iconStroke} cx="12" cy="12" r="9" />
        </svg>
      );
  }
};

const trackEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return;
  const enriched = { event: eventName, ...payload };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(enriched);
  window.gtag?.('event', eventName, payload);
  try {
    window.fbq?.('trackCustom', eventName, payload);
  } catch (error) {
    // ignore fbq availability errors
  }
};

const eqBars = Array.from({ length: 9 }, (_, index) => index);

const duplicatedTicker = [...neonTickerItems, ...neonTickerItems];

const MarketingLandingPage = () => {
  const { storeSlug: routeSlug } = useParams<{ storeSlug?: string }>();
  const storeSlug = resolveStoreSlug(routeSlug);
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>(initialDemoMessages);
  const [demoInput, setDemoInput] = useState('');
  const autoIndexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoMessages((prev) => {
        const preset = autoDemoMessages[autoIndexRef.current % autoDemoMessages.length];
        autoIndexRef.current = autoIndexRef.current + 1;
        const nextMessage: DemoMessage = {
          ...preset,
          id: `auto-${Date.now()}`
        };
        return [nextMessage, ...prev].slice(0, 6);
      });
    }, 5200);

    return () => clearInterval(interval);
  }, []);

  const handleDemoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!demoInput.trim()) return;

    const text = demoInput.trim();
    const newMessage: DemoMessage = {
      id: `user-${Date.now()}`,
      author: 'คุณ',
      text,
      tone: 'shout'
    };

    setDemoMessages((prev) => [newMessage, ...prev].slice(0, 6));
    setDemoInput('');
    trackEvent('demo_simulator_sent', { length: text.length, storeSlug });
  };

  const handleLineCta = (location: string) => {
    trackEvent('cta_demo_clicked', { location, storeSlug });
  };

  const handlePricingCta = (plan: string) => {
    trackEvent('pricing_started_checkout', { plan, storeSlug });
  };

  const handleCallNow = (location: string) => {
    trackEvent('call_now_clicked', { location, storeSlug });
  };

  return (
    <div className="warp-bg relative min-h-screen overflow-hidden text-white font-th">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(300deg, rgba(79,209,255,0.06) 1px, transparent 1px)',
            backgroundSize: '140px 140px'
          }}
        />
        {floatingOrbs.map((orb, index) => (
          <span
            key={`orb-${index}`}
            className="neon-orb"
            style={{
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left,
              right: orb.right,
              bottom: orb.bottom,
              background: orb.color,
              filter: `blur(${orb.blur}px)`
            }}
          />
        ))}
        <div className="absolute inset-x-[-20%] bottom-[-25%] h-[520px] bg-gradient-to-t from-[#050505] via-[#12091c] to-transparent opacity-70 blur-[80px]" />
        <div className="absolute inset-x-[-10%] bottom-[5%] h-[360px] bg-gradient-to-r from-[#4fd1ff]/25 via-transparent to-[#f472b6]/25 opacity-80 blur-[90px]" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#9b6bff]/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24">
        <header className="relative pt-10" id="hero">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {heroSparkleDots.map((sparkle, index) => (
              <span
                key={`hero-sparkle-${index}`}
                className="sparkle-star"
                style={{
                  top: sparkle.top,
                  left: sparkle.left,
                  right: sparkle.right,
                  fontSize: sparkle.size,
                  animationDelay: sparkle.delay
                }}
              >
                {sparkle.icon}
              </span>
            ))}
            <div className="absolute left-1/2 top-4 h-48 w-48 -translate-x-1/2 rounded-full border border-white/20 opacity-40 blur-3xl" />
            <div className="absolute -left-10 top-24 h-px w-64 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          <nav className="relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <img src="/favicon_meewarp.png" alt="MeeWarp" className="h-10 w-10 rounded-xl bg-black/40 p-1" />
              <div className="text-xl font-semibold tracking-wide font-en">MeeWarp</div>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300 font-en">
              <a href="#pain" className="transition hover:text-white">
                Pain → Promise
              </a>
              <a href="#live-demo" className="transition hover:text-white">
                Live Demo
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#pricing" className="transition hover:text-white">
                Pricing
              </a>
              <a href="#contact" className="transition hover:text-white">
                Contact
              </a>
            </div>
            <a
              href={lineUrl}
              onClick={() => handleLineCta('nav')}
              className="inline-flex items-center justify-center rounded-[14px] border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#9b6bff]"
              target="_blank"
              rel="noreferrer"
            >
              นัดเดโมด่วน
            </a>
            <div className="pointer-events-none absolute -bottom-4 left-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </nav>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-3">
                {heroBadges.map((badge) => (
                  <span
                    key={badge}
                    className="group relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100"
                  >
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#f472b6] to-[#4fd1ff]" />
                    {badge}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/15 to-transparent opacity-0 blur-lg transition group-hover:opacity-100" />
                  </span>
                ))}
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-[#9b6bff]/30 to-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#4fd1ff] font-en">
                  ✦ MeeWarp HYPERLIVE ✦
                </div>
                <h1 className="text-4xl font-black leading-[1.02] text-white sm:text-5xl">
                  ปลุกบรรยากาศทั้งร้านใน 15 นาที —
                  <span className="ml-2 inline-block rounded-full bg-gradient-to-r from-[#f472b6] via-[#9b6bff] to-[#4fd1ff] px-3 py-1 text-base font-semibold text-black">
                    ขอเพลง / ขึ้นจอ / ฉลองโต๊ะ
                  </span>
                </h1>
                <p className="text-lg text-slate-200">
                  แพลตฟอร์ม Engagement สำหรับผับ/บาร์: ขอเพลง+ทิปดีเจ, ข้อความขึ้นจอ, Photo Booth, โต๊ะแข่งขัน — ติดตั้งง่าย ใช้ได้คืนนี้
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href={lineUrl}
                  onClick={() => handleLineCta('hero-primary')}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex min-w-[200px] items-center justify-center rounded-[20px] bg-gradient-to-r from-[#fb7185] via-[#9b6bff] to-[#4fd1ff] px-6 py-4 text-base font-semibold text-black shadow-[0_18px_60px_rgba(155,107,255,0.45)] transition hover:translate-y-0.5"
                >
                  นัดเดโม 15 นาที (LINE)
                  <span className="ml-2 text-xl group-hover:translate-x-1 transition">↗</span>
                </a>
                <a
                  href={liveDemoAnchor}
                  className="inline-flex min-w-[180px] items-center justify-center rounded-[20px] border border-white/20 px-6 py-4 text-base font-semibold text-white transition hover:border-[#4fd1ff] hover:bg-white/5"
                >
                  ลองเดโมสดตอนนี้
                </a>
              </div>

              <div className="glow-panel rounded-[26px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur">
                <p className="text-sm font-semibold text-[#4fd1ff]">MeeWarp ทำให้ ‘ความคึก’ กลายเป็นยอดซื้อ</p>
                <p className="mt-2 text-sm text-slate-300">
                  ลูกค้าส่งโมเมนต์ขึ้นจอแบบเรียลไทม์ พนักงานไม่ต้องวิ่งทั้งคืน และทุกคำขอบนจอกลายเป็นคอนเทนต์ของร้านคุณ
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                  {heroSparkles.map((item) => (
                    <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
                      {item.icon}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">ใช้จริงโดย</p>
                <div className="rounded-[20px] border border-white/10 bg-black/30 p-4">
                  <div className="flex gap-3">
                    {trustLogos.map((logo) => (
                      <span key={logo} className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        {logo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative" id="live-demo">
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-r from-[#9b6bff]/40 to-[#4fd1ff]/40 blur-3xl opacity-70" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#151515]/90 to-[#050505]/95 p-6 shadow-[0_35px_140px_rgba(0,0,0,0.75)]">
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(79,209,255,0.3), transparent 55%), radial-gradient(circle at 80% 0%, rgba(244,114,182,0.25), transparent 50%)'
                  }}
                />
                <div className="relative mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-en">Live Demo / Simulator</p>
                    <p className="text-base font-semibold text-white">กล่องจำลองหน้าจอร้าน</p>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300 font-en">Realtime</span>
                </div>
                <div className="relative space-y-3">
                  {demoMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r px-4 py-3 text-sm shadow transition ${toneClasses[message.tone]}`}
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-white/70">{message.author}</div>
                      <p className="mt-1 text-base font-semibold">{message.text}</p>
                      <span className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rotate-45 rounded-full border border-white/20 opacity-30" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <div className="hidden h-20 flex-1 items-end gap-1 text-white/30 sm:flex">
                    {eqBars.map((bar) => (
                      <span
                        key={bar}
                        className="eq-bar w-2 rounded-full bg-gradient-to-t from-white/10 to-[#9b6bff]"
                        style={{
                          height: `${28 + (bar % 3) * 14}px`,
                          animation: `eqPulse ${1.2 + bar * 0.08}s ease-in-out infinite`,
                          transformOrigin: 'bottom'
                        }}
                      />
                    ))}
                  </div>
                  <form onSubmit={handleDemoSubmit} className="flex flex-1 flex-col gap-3 sm:flex-none sm:flex-row">
                    <input
                      type="text"
                      value={demoInput}
                      onChange={(event) => setDemoInput(event.target.value)}
                      placeholder="ลองส่ง Shoutout หรือขอเพลง..."
                      className="flex-1 rounded-[14px] border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#9b6bff] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-[14px] bg-gradient-to-r from-[#9b6bff] to-[#4fd1ff] px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-[#9b6bff]/30"
                    >
                      ขึ้นจอ
                    </button>
                  </form>
                </div>
                <p className="mt-3 text-xs text-slate-500">ปุ่มนี้จำลองกับหน้าจอจริงได้ทันที — track event: demo_simulator_sent</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-14">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-r from-[#4fd1ff]/20 via-transparent to-[#9b6bff]/20 px-6 py-3 shimmer-card">
            <div className="neon-ticker flex gap-8 text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
              {duplicatedTicker.map((item, index) => (
                <span key={`${item.text}-${index}`} className="flex items-center gap-2 text-xs text-slate-100">
                  {item.icon}
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        <main className="mt-24 space-y-24">
          <section id="pain" className="relative grid gap-8 rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur lg:grid-cols-[1fr_0.9fr]">
            <div className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-r from-transparent via-[#9b6bff]/15 to-transparent blur-3xl" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff]">Pain → Promise</p>
              <h2 className="mt-3 text-3xl font-bold">ปัญหาที่ร้านเจอทุกคืน</h2>
              <div className="mt-8 space-y-5">
                {painPoints.map((pain) => (
                  <div key={pain.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                      }}
                    />
                    <p className="relative text-base font-semibold text-white">{pain.title}</p>
                    <p className="relative mt-1 text-sm text-slate-400">{pain.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative glow-panel rounded-[24px] border border-[#9b6bff]/40 bg-gradient-to-b from-[#1a1a1a] to-[#050505] p-8 shadow-[0_30px_80px_rgba(155,107,255,0.25)]">
              <div className="absolute -right-6 top-10 h-32 w-32 rounded-full bg-[#9b6bff]/30 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9b6bff]">Promise</p>
              <p className="mt-4 text-2xl font-bold leading-snug text-white">
                MeeWarp ทำให้ ‘ความคึก’ กลายเป็นยอดซื้อ และกลายเป็นคอนเทนต์ของร้านคุณ
              </p>
              <p className="mt-4 text-sm text-slate-300">
                ทุกโต๊ะมีช่องให้ขึ้นจอเอง สั่งเอฟเฟกต์ และทิปดีเจแบบเรียลไทม์ ร้านได้ข้อมูลและยอดขายเพิ่มในคืนเดียว
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-1">Auto Approve</span>
                <span className="rounded-full border border-white/10 px-3 py-1">เชื่อม PromptPay</span>
                <span className="rounded-full border border-white/10 px-3 py-1">สถิติเรียลไทม์</span>
              </div>
              <a
                href={lineUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleLineCta('pain-section')}
                className="mt-8 inline-flex w-full items-center justify-center rounded-[16px] bg-gradient-to-r from-[#9b6bff] to-[#4fd1ff] px-6 py-3 text-base font-semibold text-black"
              >
                นัดเดโม 15 นาที (LINE)
              </a>
            </div>
          </section>

          <section id="features" className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff] font-en">Value Features</p>
                <h2 className="mt-3 text-3xl font-bold text-white">ฟีเจอร์เพื่อธุรกิจ (ไม่ขายเทคนิค)</h2>
                <p className="text-sm text-slate-400">ทุกปุ่มคือรายได้ใหม่ของร้าน — ไม่ต้องลงทุนฮาร์ดแวร์เพิ่ม</p>
              </div>
              <a
                href={lineUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleLineCta('features-ribbon')}
                className="inline-flex items-center justify-center rounded-[14px] border border-white/15 px-5 py-3 text-sm font-semibold text-white"
              >
                นัดเดโม / ดูวิดีโอ 90 วิ
              </a>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {valueFeatures.map((feature, index) => (
                <div key={feature.title} className="group shimmer-card relative overflow-hidden rounded-[22px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                    style={{
                      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.12), transparent), radial-gradient(circle at ${20 + (index % 3) * 30}% 0%, rgba(155,107,255,0.35), transparent)`
                    }}
                  />
                  <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-black/40 text-white">
                    {featureIcon(feature.icon)}
                  </div>
                  <h3 className="relative text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="relative mt-2 text-sm text-slate-300">{feature.summary}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 to-black/40 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff]">ผลลัพธ์เป็นตัวเลข</p>
                <h2 className="mt-3 text-3xl font-bold">พิสูจน์แล้วในพิลอต 3 สถานที่ (2025)</h2>
                <p className="text-sm text-slate-400">ทุกตัวเลขมาจากคืนจริง — ไม่ใช่เดโมในห้องประชุม</p>
              </div>
              <a
                href={lineUrl}
                onClick={() => handleLineCta('roi-strip')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-[14px] bg-gradient-to-r from-[#9b6bff] to-[#4fd1ff] px-6 py-3 text-sm font-semibold text-black"
              >
                ขอรีพอร์ตเต็ม
              </a>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {roiMetrics.map((metric) => (
                <div key={metric.label} className="shimmer-card relative overflow-hidden rounded-[20px] border border-white/10 bg-black/30 p-6">
                  <div className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(79,209,255,0.15), transparent)'
                    }}
                  />
                  <p className="relative text-3xl font-black text-white">{metric.value}</p>
                  <p className="relative mt-1 text-sm text-slate-300">{metric.label}</p>
                  <p className="relative mt-2 text-xs text-slate-500">{metric.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">*ข้อมูลจากพิลอต 3 สถานที่ (Q1/2025)</p>
          </section>

          <section className="relative glow-panel rounded-[28px] border border-white/10 bg-white/5 p-8" id="how">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <span className="sparkle-star" style={{ top: '12%', left: '8%', fontSize: 10, animationDelay: '0.4s' }}>✷</span>
              <span className="sparkle-star" style={{ bottom: '10%', right: '12%', fontSize: 13, animationDelay: '1.6s' }}>✦</span>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff] font-en">How it works</p>
            <h2 className="mt-3 text-3xl font-bold">3 ขั้นตอน เริ่มคืนนี้</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {howItWorksSteps.map((step, index) => (
                <div key={step.step} className="relative rounded-[20px] border border-white/10 bg-black/40 p-6">
                  {index < howItWorksSteps.length - 1 && (
                    <span className="absolute right-0 top-1/2 hidden h-px w-24 translate-x-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent md:block" />
                  )}
                  <span className="text-sm font-semibold text-slate-400">ขั้นตอน {step.step}</span>
                  <h3 className="mt-2 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="pricing" className="space-y-8">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff] font-en">Pricing</p>
              <h2 className="text-3xl font-bold text-white">เริ่มใช้งานฟรี — อัปเกรดเมื่อพร้อม</h2>
              <p className="text-sm text-slate-400">ปุ่ม Quote จะเปิด LINE ให้ปิดดีลทันที</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-4">
              {pricingPlans.map((plan) => (
                <div key={plan.tier} className={`shimmer-card relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${plan.accent} p-6 shadow-[0_25px_90px_rgba(0,0,0,0.55)]`}>
                  <div className="absolute inset-0 opacity-35"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18), transparent)'
                    }}
                  />
                  <div className="relative flex items-center justify-between">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">{plan.tier}</p>
                    {plan.highlight && (
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">{plan.highlight}</span>
                    )}
                  </div>
                  <p className="relative mt-4 text-2xl font-bold text-white">{plan.price}</p>
                  <p className="relative text-sm text-white/80">{plan.description}</p>
                  <ul className="relative mt-5 space-y-2 text-sm text-white/90">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-6 space-y-3">
                    <a
                      href={lineUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleLineCta(`pricing-${plan.tier}`)}
                      className="inline-flex w-full items-center justify-center rounded-[14px] border border-white/60 px-4 py-2 text-sm font-semibold text-white"
                    >
                      นัดเดโม (LINE)
                    </a>
                    <a
                      href={quoteUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handlePricingCta(plan.tier)}
                      className="inline-flex w-full items-center justify-center rounded-[14px] bg-black/40 px-4 py-2 text-sm font-semibold text-white"
                    >
                      ขอใบเสนอราคา
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-white/5 p-6">
              <div>
                <p className="text-base font-semibold text-white">ต้องการใบเสนอราคา PDF?</p>
                <p className="text-sm text-slate-400">กดปุ่มด้านขวาแล้วเราส่งผ่าน LINE / WhatsApp ทันที</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={lineUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => handlePricingCta('quote-line')}
                  className="inline-flex items-center justify-center rounded-[14px] bg-gradient-to-r from-[#9b6bff] to-[#4fd1ff] px-5 py-3 text-sm font-semibold text-black"
                >
                  ขอใบเสนอราคา (LINE)
                </a>
              </div>
            </div>
          </section>

          <section className="relative glow-panel rounded-[28px] border border-white/10 bg-black/40 p-8">
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff] font-en">Case Studies</p>
              <h2 className="text-3xl font-bold">ภาพจริง + คำคมเจ้าของร้าน</h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {caseStudies.map((study) => (
                <div key={study.venue} className="group shimmer-card relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="absolute inset-0 opacity-40"
                    style={{ backgroundImage: 'radial-gradient(circle at top, rgba(244,114,182,0.2), transparent)' }}
                  />
                  <div className="relative h-40 rounded-[18px] border border-white/10 bg-gradient-to-br from-white/10 to-black/40" aria-label="case study image" />
                  <p className="relative mt-4 text-sm text-[#4fd1ff]">{study.metric}</p>
                  <p className="relative mt-2 text-lg font-semibold text-white">{study.quote}</p>
                  <p className="relative mt-3 text-sm text-slate-400">{study.owner} • {study.venue}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative glow-panel rounded-[28px] border border-white/10 bg-white/5 p-8" id="faq">
            <p className="text-xs uppercase tracking-[0.3em] text-[#4fd1ff] font-en">FAQs</p>
            <h2 className="mt-3 text-3xl font-bold">ตอบข้อโต้แย้งทันที</h2>
            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="group shimmer-card rounded-[18px] border border-white/10 bg-black/40 p-5">
                  <summary className="cursor-pointer text-lg font-semibold text-white">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm text-slate-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="contact" className="relative glow-panel rounded-[32px] border border-[#7f6bff]/40 bg-gradient-to-br from-[#090910]/95 via-[#12051b]/90 to-[#050505]/95 p-8">
            <div className="absolute inset-0 opacity-60"
              style={{
                borderRadius: 'inherit',
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, rgba(244,114,182,0.25), transparent 60%), radial-gradient(circle at 80% 0%, rgba(79,209,255,0.3), transparent 65%), linear-gradient(120deg, rgba(255,255,255,0.08) 0%, transparent 45%)'
              }}
            />
            <div className="pointer-events-none absolute inset-0 -z-10">
              <span className="sparkle-star" style={{ top: '18%', left: '18%', fontSize: 12, animationDelay: '0.2s' }}>✶</span>
              <span className="sparkle-star" style={{ bottom: '12%', right: '16%', fontSize: 11, animationDelay: '1.1s' }}>✧</span>
            </div>
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.4em] text-[#4fd1ff] font-en">Final CTA</p>
              <h2 className="mt-4 text-3xl font-bold text-white">คืนนี้ทำให้ร้านคุณดังขึ้นและขายดีขึ้น — เริ่มใน 15 นาที</h2>
              <p className="mt-2 text-sm text-slate-200">ปุ่มด้านล่างคือช่องทางเร็วที่สุด</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <a
                  href={lineUrl}
                  onClick={() => handleLineCta('final-hero')}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex items-center justify-center rounded-[20px] bg-gradient-to-r from-[#f472b6] via-[#9b6bff] to-[#4fd1ff] px-6 py-5 text-center text-lg font-semibold text-black shadow-[0_18px_55px_rgba(155,107,255,0.45)]"
                >
                  <span className="font-en text-sm uppercase tracking-[0.3em] text-black/70">Line</span>
                  <span className="ml-2">นัดเดโม 15 นาที (LINE)</span>
                </a>
                <a
                  href={`tel:${callPhone}`}
                  onClick={() => handleCallNow('final-call')}
                  className="flex items-center justify-center rounded-[20px] border border-white/25 bg-black/30 px-6 py-5 text-center text-lg font-semibold text-white shadow-inner shadow-black/30"
                >
                  โทรคุยทันที
                </a>
              </div>
              <div className="mt-4 text-sm text-slate-300">
                หรือส่งอีเมลเร็วที่ <a href="mailto:sales@meewarp.com" className="text-[#4fd1ff]">sales@meewarp.com</a>
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="shimmer-card fixed bottom-6 right-6 hidden flex-col items-center gap-2 rounded-[20px] border border-white/10 bg-black/70 p-3 shadow-lg shadow-[#9b6bff]/30 md:flex">
        <img src={lineQrPlaceholder} alt="MeeWarp LINE OA" className="h-28 w-28 rounded-[14px] border border-white/10" />
        <p className="text-xs text-center text-slate-300">สแกนคุย LINE OA</p>
      </div>
    </div>
  );
};

export default MarketingLandingPage;
