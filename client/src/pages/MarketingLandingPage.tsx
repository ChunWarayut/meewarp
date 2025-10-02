import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const featureHighlights = [
  {
    icon: '🎥',
    title: 'Real-time TV Broadcasting',
    subtitle: 'การออกอากาศแบบเรียลไทม์',
    description:
      'แสดงคิวผู้สนับสนุนบนจอ TV ทันที พร้อมข้อความและเอฟเฟกต์สวยงามสำหรับทุกหน้าจอ',
    benefits: ['ไม่มีดีเลย์', 'Auto-sync', 'Multi-display'],
    accent: 'from-purple-600 via-blue-600 to-cyan-500'
  },
  {
    icon: '💳',
    title: 'Seamless Payment Flow',
    subtitle: 'ระบบชำระเงินไร้รอยต่อ',
    description:
      'รองรับ ChillPay และการบันทึกแบบ Manual เพื่อให้ทีมขายและลูกค้าปิดการขายได้ง่าย',
    benefits: ['ChillPay Integration', 'Manual Override', 'Instant Confirmation'],
    accent: 'from-green-500 via-emerald-500 to-teal-500'
  },
  {
    icon: '📊',
    title: 'Smart Analytics Dashboard',
    subtitle: 'แดชบอร์ดวิเคราะห์ข้อมูลอัจฉริยะ',
    description:
      'ติดตามยอดขาย ผู้สนับสนุนอันดับต้น และสถิติแบบเรียลไทม์ เพื่อการตัดสินใจที่แม่นยำ',
    benefits: ['Real-time Stats', 'Top Supporters', 'Revenue Tracking'],
    accent: 'from-orange-500 via-red-500 to-pink-500'
  }
];

const stats = [
  { number: '500+', label: 'ร้านค้าที่ใช้งาน', icon: '🏪' },
  { number: '+40%', label: 'เพิ่มยอดขายเฉลี่ย', icon: '📈' },
  { number: '15 นาที', label: 'เซ็ตอัพเสร็จ', icon: '⚡' },
  { number: '4.8/5', label: 'ความพึงพอใจ', icon: '⭐' }
];

const clientLogos = [
  { name: 'WarpHouse Studio', type: 'สตูดิโอ' },
  { name: 'Bean Café', type: 'คาเฟ่' },
  { name: 'Ice Production', type: 'โปรดักชัน' },
  { name: 'Mint Events', type: 'อีเวนต์' },
  { name: 'Boss Restaurant', type: 'ร้านอาหาร' },
  { name: 'Joy Live', type: 'ไลฟ์สด' }
];

const caseStudies = [
  {
    business: 'WarpHouse Studio',
    type: 'สตูดิโอถ่ายภาพ',
    result: '+65% ยอดขาย',
    story: 'เพิ่มยอดขายได้ 65% ใน 3 เดือนแรก ด้วยระบบวาร์ปที่ลูกค้าสามารถซื้อได้ง่าย',
    metric: '65%',
    metricLabel: 'เพิ่มยอดขาย',
    icon: '📸'
  },
  {
    business: 'Bean Café & Bistro',
    type: 'คาเฟ่และร้านอาหาร',
    result: '+45% ลูกค้าใหม่',
    story: 'ดึงลูกค้าใหม่ได้มากขึ้น 45% จากระบบแนะนำเพื่อนผ่านวาร์ป',
    metric: '45%',
    metricLabel: 'ลูกค้าใหม่',
    icon: '☕'
  },
  {
    business: 'Ice Production',
    type: 'บ้านการผลิต',
    result: '+80% Engagement',
    story: 'เพิ่ม engagement ในไลฟ์สด 80% ด้วยระบบวาร์ปแบบเรียลไทม์',
    metric: '80%',
    metricLabel: 'เพิ่ม Engagement',
    icon: '🎬'
  }
];

const testimonials = [
  {
    text: 'MEEWARP ช่วยให้ทีมเราทำงานได้ลื่นไหลมาก ลูกค้าเห็นผลทันที ไม่มีปัญหาเรื่องดีเลย์',
    author: 'คุณบีม',
    role: 'WarpHouse Studio',
    avatar: '👨‍💼'
  },
  {
    text: 'Dashboard สวยมาก ใช้งานง่าย การทำ PayLink แค่คลิกเดียวเสร็จ ปิดการขายในไลฟ์ได้เร็วกว่าเดิม',
    author: 'คุณมิ้นท์',
    role: 'Production Lead',
    avatar: '👩‍💻'
  },
  {
    text: 'เริ่มใช้แล้วเห็นผลทันที ไม่ต้องลงทุนอะไร ระบบเสถียร ทีมซัพพอร์ตดีมาก แนะนำเลย',
    author: 'คุณไอซ์',
    role: 'Studio Owner',
    avatar: '👨‍🎨'
  }
];

const steps = [
  {
    step: '01',
    title: 'สร้างแพ็กเกจ',
    description: 'ตั้งค่าแพ็กเกจ Warp พร้อมราคาและระยะเวลาที่ต้องการ',
    icon: '⚙️',
    time: '2 นาที'
  },
  {
    step: '02',
    title: 'แชร์ลิงก์',
    description: 'ลูกค้าสามารถสั่งซื้อและชำระเงินผ่าน ChillPay ได้ทันที',
    icon: '🔗',
    time: '30 วินาที'
  },
  {
    step: '03',
    title: 'แสดงผลอัตโนมัติ',
    description: 'ระบบอัปเดตหน้าจอ TV และสถิติแบบเรียลไทม์โดยอัตโนมัติ',
    icon: '📺',
    time: 'ทันที'
  }
];

const plans = [
  {
    name: 'Starter',
    subtitle: 'สำหรับร้านเริ่มต้น',
    price: '50%',
    originalPrice: '',
    period: 'ตามยอดขาย',
    yearlyPrice: '',
    description: 'เหมาะสำหรับร้านค้าขนาดเล็ก',
    features: [
      'ไม่มีค่าตั้งต้น - เริ่มได้เลย',
      'ระบบวาร์ปครบชุด',
      'รายงานยอดขายรายวัน',
      'ChillPay Integration',
      'การสำรองข้อมูลอัตโนมัติ',
      'Support ผ่านแชท'
    ],
    highlight: 'เริ่มต้นฟรี',
    cta: 'เริ่มใช้งานเลย',
    popular: false,
    savings: ''
  },
  {
    name: 'Professional',
    subtitle: 'สำหรับธุรกิจที่เติบโต',
    price: '30%',
    originalPrice: '',
    period: 'ตามยอดขาย',
    yearlyPrice: '',
    description: 'แพ็กเกจยอดนิยมของร้านค้าไทย',
    features: [
      'ทุกอย่างใน Starter',
      'หักเปอร์เซ็นต์ต่ำกว่า 20%',
      'ระบบวิเคราะห์ลูกค้าแบบลึก',
      'การตลาดอัตโนมัติ',
      'รายงานแบบเรียลไทม์',
      'Custom branding',
      'Priority Support 24/7',
      'Training 1:1 ฟรี'
    ],
    highlight: 'ยอดนิยม #1',
    cta: 'เริ่มใช้งานเลย',
    popular: true,
    savings: 'ประหยัด 20%'
  },
  {
    name: 'Enterprise',
    subtitle: 'สำหรับเครือข่ายร้านค้า',
    price: '20%',
    originalPrice: '',
    period: 'ตามยอดขาย',
    yearlyPrice: '',
    description: 'สำหรับธุรกิจขนาดใหญ่',
    features: [
      'ทุกอย่างใน Professional',
      'หักเปอร์เซ็นต์ต่ำสุด 30%',
      'ไม่จำกัดจุดขาย',
      'Multi-location management',
      'API Access แบบเต็ม',
      'White-label solution',
      'Dedicated Account Manager',
      'SLA 99.9% uptime',
      'Custom integrations ฟรี'
    ],
    highlight: 'ค่าใช้จ่ายต่ำสุด',
    cta: 'ปรึกษาฟรี',
    popular: false,
    savings: 'ประหยัด 30%'
  }
];

const faqData = [
  {
    question: 'สามารถเริ่มใช้งาน MEEWARP ได้ยังไง?',
    answer: 'สมัครสมาชิกผ่านเว็บไซต์ ตั้งค่าร้านค้าในระบบ และเริ่มขายวาร์ปได้ทันที ใช้เวลาติดตั้งเพียง 15 นาที ไม่ต้องติดตั้งอุปกรณ์เพิ่มเติม'
  },
  {
    question: 'ยกเลิกการใช้งานได้หรือไม่?',
    answer: 'ยกเลิกได้ทุกเมื่อ ไม่มีสัญญาผูกมัด ข้อมูลของคุณจะถูกเก็บไว้ 30 วันหลังยกเลิก เพื่อให้คุณสามารถกลับมาใช้งานได้'
  },
  {
    question: 'ระบบรองรับการชำระเงินแบบไหน?',
    answer: 'รองรับ ChillPay (บัตรเครดิต, QR Code, โอนธนาคาร) และระบบบันทึกการชำระแบบ Manual สำหรับการขายแบบออฟไลน์'
  },
  {
    question: 'หากมีปัญหาการใช้งานติดต่อได้ยังไง?',
    answer: 'ทีมซัพพอร์ตพร้อมช่วยเหลือ 24/7 ผ่าน Line @MEEWARP หรือ Email: support@MEEWARP.com รับประกันตอบกลับภายใน 30 นาที'
  },
  {
    question: 'ข้อมูลของร้านค้าปลอดภัยหรือไม่?',
    answer: 'ข้อมูลทั้งหมดเข้ารหัส SSL และสำรองข้อมูลทุกชั่วโมง เซิร์ฟเวอร์ตั้งอยู่ในประเทศไทย มีระบบรักษาความปลอดภัยระดับธนาคาร'
  },
  {
    question: 'มีการอบรมการใช้งานหรือไม่?',
    answer: 'มีคู่มือการใช้งานภาษาไทยครบถ้วน พร้อมวิดีโอสอนใช้งาน และทีมงานพร้อม Training แบบ 1:1 ฟรีสำหรับแพ็กเกจ Professional ขึ้นไป'
  },
  {
    question: 'ระบบคิดค่าบริการอย่างไร?',
    answer: 'คิดแค่เปอร์เซ็นต์ตามยอดขายจริงเท่านั้น! ไม่มีค่าตั้งต้น ไม่มีค่ารายเดือน หากไม่มียอดขาย ไม่เสียเงินแม้แต่บาทเดียว ยิ่งขายได้มาก ยิ่งคุ้มค่า'
  }
];

const contactInfo = {
  email: 'warayut.tae@gmail.com',
  line: 'chun_warayut',
  phone: '091-813-6426',
  support: 'warayut.tae@gmail.com',
  address: 'อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ ชั้น 12 ถนนรัชดาภิเษก กรุงเทพมหานคร 10400'
};

const MarketingLandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featureHighlights.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectFeature = (index: number) => {
    setActiveFeature(index);
  };

  const { icon, title, subtitle, description, benefits, accent } = featureHighlights[activeFeature];

  return (
    <div className="min-h-screen text-white bg-slate-950 font-th">
      <header className="sticky top-0 z-40 border-b backdrop-blur border-white/10 bg-slate-950/80">
        <nav className="flex justify-between items-center px-4 mx-auto max-w-7xl h-16 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold tracking-tight text-cyan-400 sm:text-2xl">
            MEEWARP
          </Link>

          <div className="hidden gap-8 items-center lg:flex">
            <a href="#features" className="text-sm font-medium transition-colors text-slate-200 hover:text-cyan-400 font-en">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors text-slate-200 hover:text-cyan-400 font-en">
              How it works
            </a>
            <a href="#pricing" className="text-sm font-medium transition-colors text-slate-200 hover:text-cyan-400 font-en">
              Pricing
            </a>
            <Link to="/tv" className="text-sm font-medium transition-colors text-slate-200 hover:text-cyan-400 font-en">
              TV demo
            </Link>
          </div>

          <div className="hidden gap-3 items-center lg:flex">
            <Link
              to="/admin/login"
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors border-white/20 text-slate-200 hover:border-cyan-400 font-en"
            >
              Login
            </Link>
            <Link
              to="/self-warp"
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg transition-all hover:from-cyan-400 hover:to-blue-500"
            >
              ลองใช้ฟรี
            </Link>
          </div>

          <button
            type="button"
            className="flex justify-center items-center w-10 h-10 rounded-lg border transition-colors border-white/10 hover:border-cyan-400 lg:hidden"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {showMobileMenu && (
          <div className="border-t border-white/10 bg-slate-950/95 lg:hidden">
            <div className="px-4 py-4 space-y-1">
              <a
                href="#features"
                className="block px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-200 hover:bg-white/10"
                onClick={() => setShowMobileMenu(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-200 hover:bg-white/10"
                onClick={() => setShowMobileMenu(false)}
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-200 hover:bg-white/10"
                onClick={() => setShowMobileMenu(false)}
              >
                Pricing
              </a>
              <Link
                to="/tv"
                className="block px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-200 hover:bg-white/10"
                onClick={() => setShowMobileMenu(false)}
              >
                TV demo
              </Link>
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Link
                  to="/admin/login"
                  className="flex-1 px-3 py-2 text-sm font-medium text-center rounded-md border border-white/20 text-slate-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  to="/self-warp"
                  className="flex-1 px-3 py-2 text-sm font-semibold text-center bg-gradient-to-r from-cyan-500 to-blue-600 rounded-md transition-all hover:from-cyan-400 hover:to-blue-500"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ลองใช้ฟรี
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pb-24 space-y-24">
        <section className="overflow-hidden relative pt-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl" />

          <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="space-y-8">
                <div className="inline-flex gap-2 items-center px-4 py-2 text-xs font-semibold rounded-full border border-cyan-500/30 bg-slate-900/60 text-slate-200 sm:text-sm font-th">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  💼 ระบบแจกวาร์ปสำหรับธุรกิจไทย
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl font-th">
                    เพิ่มยอดขาย <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">+40%</span> ด้วยระบบวาร์ปมืออาชีพ
                  </h1>
                  <p className="max-w-2xl text-base text-slate-300 sm:text-lg font-th">
                    ระบบแจกวาร์ปที่ร้านค้าไทยกว่า <span className="font-semibold text-cyan-400">500+ แห่ง</span> ใช้สร้างรายได้พิเศษ
                    <span className="font-semibold text-emerald-400"> เริ่มขายได้ทันที</span> ไม่มีค่าตั้งต้น ไม่มีค่ารายเดือน คิดแค่เปอร์เซ็นต์ตามยอดขายจริง
                  </p>
                  <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex gap-2 items-center text-sm font-semibold text-emerald-300 font-th">
                      <span className="flex justify-center items-center w-6 h-6 text-emerald-400 rounded-full bg-emerald-500/20">💰</span>
                      เพิ่มรายได้เฉลี่ย 300%
                    </div>
                    <div className="flex gap-2 items-center text-sm font-semibold text-cyan-300 font-th">
                      <span className="flex justify-center items-center w-6 h-6 text-cyan-400 rounded-full bg-cyan-500/20">📈</span>
                      ไม่ขาย ไม่เสียเงิน
                    </div>
                    <div className="flex gap-2 items-center text-sm font-semibold text-purple-300 font-th">
                      <span className="flex justify-center items-center w-6 h-6 text-purple-400 rounded-full bg-purple-500/20">⚡</span>
                      Setup ใน 15 นาที
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/self-warp"
                    className="px-8 py-3 text-base font-semibold text-center bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-full transition-all hover:from-emerald-400 hover:to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30"
                  >
                    💰 เริ่มสร้างรายได้วันนี้ (ฟรี 30 วัน)
                  </Link>
                  <Link
                    to="/tv"
                    className="px-8 py-3 text-base font-semibold text-center rounded-full border transition-all border-white/20 text-slate-100 hover:border-cyan-400 hover:bg-white/5 font-th"
                  >
                    📊 ดูผลลัพธ์จริงจากลูกค้า
                  </Link>
                </div>

                <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                  <div className="flex gap-4 items-start">
                    <div className="flex justify-center items-center w-12 h-12 text-2xl rounded-full bg-emerald-500/20">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-300">รับประกันผลลัพธ์</h3>
                      <p className="mt-1 text-sm text-slate-300">
                        หากไม่เพิ่มยอดขายภายใน 30 วัน <span className="font-semibold text-emerald-400">ยกเลิกได้ทันที</span> พร้อมบริการปรึกษาฟรีตลอดอายุการใช้งาน
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          ไม่มีค่าติดตั้ง
                        </span>
                        <span className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          ไม่มีสัญญาผูกมัด
                        </span>
                        <span className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                          Support 24/7
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="p-4 text-center rounded-xl border border-white/10 bg-slate-900/70">
                      <div className="text-2xl">{stat.icon}</div>
                      <div className="text-lg font-semibold text-cyan-300 sm:text-xl">{stat.number}</div>
                      <div className="text-xs text-slate-400 sm:text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-x-4 inset-y-6 bg-gradient-to-br rounded-3xl blur-2xl from-cyan-500/20 via-blue-500/10 to-purple-500/20" />
                <div className="overflow-hidden relative p-8 rounded-3xl border shadow-2xl border-white/10 bg-slate-900/80">
                  <div className="flex gap-4 items-start">
                    <div className="flex justify-center items-center w-14 h-14 text-3xl bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cyan-300">ฟีเจอร์ไฮไลต์</p>
                      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
                      <p className="text-sm text-slate-400">{subtitle}</p>
                    </div>
                  </div>

                  <p className="mt-6 text-sm text-slate-300 sm:text-base">{description}</p>

                  <ul className="mt-6 space-y-3">
                    {benefits.map((item) => (
                      <li key={item} className="flex gap-3 items-center text-sm text-slate-200">
                        <span className="flex justify-center items-center w-8 h-8 text-lg bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center px-6 py-4 mt-8 rounded-2xl border border-white/10 bg-slate-900/80">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">อัปเดตทุก 6 วินาที</p>
                      <p className="text-xs text-slate-400">หมุนไฮไลต์โดยอัตโนมัติ หรือเลือกด้วยตัวเอง</p>
                    </div>
                    <div className="flex gap-2">
                      {featureHighlights.map((feature, index) => (
                        <button
                          key={feature.title}
                          type="button"
                          className={`h-2.5 w-8 rounded-full transition-all ${
                            index === activeFeature ? 'bg-cyan-400' : 'bg-white/15 hover:bg-white/30'
                          }`}
                          onClick={() => handleSelectFeature(index)}
                          aria-label={`เลือกฟีเจอร์ ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-medium tracking-wide uppercase text-slate-400">
                ร้านค้าและธุรกิจที่ไว้วางใจ MEEWARP
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8 sm:grid-cols-3 lg:grid-cols-6">
                {clientLogos.map((client) => (
                  <div
                    key={client.name}
                    className="p-5 text-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-300"
                  >
                    <div className="text-lg font-semibold">{client.name}</div>
                    <p className="mt-1 text-xs text-slate-500">{client.type}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-slate-900/60">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                เหตุผลที่ธุรกิจไทยเลือก MEEWARP
              </h2>
              <p className="mt-4 text-base text-slate-300 sm:text-lg">
                ทุกฟีเจอร์ถูกออกแบบมาเพื่อทำให้การออกอากาศและการขายของคุณเป็นเรื่องง่าย
              </p>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] lg:gap-16">
              <div className="space-y-4">
                {featureHighlights.map((feature, index) => (
                  <button
                    key={feature.title}
                    type="button"
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all ${
                      index === activeFeature
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-white/10 bg-slate-900/60 hover:border-cyan-400/60'
                    }`}
                    onClick={() => handleSelectFeature(index)}
                  >
                    <div className="flex gap-4 items-start">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{feature.subtitle}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="overflow-hidden relative p-8 rounded-3xl border border-white/10 bg-slate-950/70">
                <div className={`absolute top-16 -right-20 w-56 h-56 bg-gradient-to-br rounded-full opacity-20 blur-3xl ${accent}`} />
                <div className="relative">
                  <h3 className="text-2xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-base text-slate-300">{description}</p>

                  <div className="grid gap-4 mt-6 sm:grid-cols-2">
                    {benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex gap-3 items-center px-4 py-3 text-sm rounded-2xl border border-white/10 bg-slate-900/60 text-slate-200"
                      >
                        <span className="flex justify-center items-center w-9 h-9 text-lg bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full">
                          ✓
                        </span>
                        {benefit}
                      </div>
                    ))}
                  </div>

                  <div className="p-6 mt-8 rounded-2xl border border-white/10 bg-slate-900/70">
                    <p className="text-sm font-semibold text-cyan-300">เหมาะสำหรับ</p>
                    <p className="mt-2 text-sm text-slate-300">
                      สตูดิโอไลฟ์ ทีมขายออนไลน์ และธุรกิจที่ต้องการความเสถียรในการออกอากาศแบบเรียลไทม์
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                เรื่องราวความสำเร็จจากลูกค้าจริง
              </h2>
              <p className="mt-4 text-base text-slate-300 sm:text-lg">
                ธุรกิจไทยเติบโตอย่างต่อเนื่องด้วยระบบวาร์ป MEEWARP
              </p>
            </div>

            <div className="grid gap-8 mt-12 lg:grid-cols-3">
              {caseStudies.map((item) => (
                <div
                  key={item.business}
                  className="p-6 rounded-2xl border transition-transform border-white/10 bg-slate-900/60 hover:-translate-y-1 hover:border-cyan-400"
                >
                  <div className="flex gap-4 items-center">
                    <div className="flex justify-center items-center w-12 h-12 text-2xl bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.business}</h3>
                      <p className="text-sm text-cyan-300">{item.type}</p>
                    </div>
                  </div>

                  <div className="mt-6 text-4xl font-black text-cyan-300">{item.metric}</div>
                  <div className="text-sm font-semibold text-emerald-400">{item.metricLabel}</div>
                  <p className="mt-4 text-sm text-slate-300">{item.story}</p>

                  <p className="mt-6 text-xs text-slate-500">ใช้งาน MEEWARP ต่อเนื่อง 6+ เดือน</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">เริ่มต้นได้ใน 3 ขั้นตอน</h2>
              <p className="mt-3 text-base text-slate-300 sm:text-lg">ง่าย เร็ว และมีประสิทธิภาพ</p>
            </div>

            <div className="grid gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.step}
                  className="p-6 rounded-2xl border transition-shadow border-white/10 bg-slate-900/60 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-black text-cyan-300">{step.step}</span>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{step.description}</p>
                  <p className="mt-4 text-xs font-semibold text-emerald-400">พร้อมใช้งานใน {step.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 items-center text-center">
              <span className="px-4 py-1 text-sm font-semibold text-cyan-300 rounded-full border border-cyan-500/30 bg-cyan-500/10 font-en">
                Testimonials
              </span>
              <h2 className="text-3xl font-bold sm:text-4xl">ทำไมธุรกิจกว่า 500+ แบรนด์เลือก MEEWARP</h2>
            </div>

            <div className="grid gap-8 mt-12 md:grid-cols-3">
              {testimonials.map((item) => (
                <div key={item.author} className="p-6 rounded-2xl border border-white/10 bg-slate-900/60">
                  <div className="flex gap-3 items-center">
                    <span className="text-3xl">{item.avatar}</span>
                    <div>
                      <p className="font-semibold text-white">{item.author}</p>
                      <p className="text-sm text-slate-400">{item.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm italic text-slate-300">“{item.text}”</p>
                  <div className="flex gap-1 mt-4 text-yellow-400">
                    {[...Array(5)].map((_, index) => (
                      <span key={index}>⭐</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-slate-900/60">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">แพ็กเกจที่โปร่งใสและยืดหยุ่น</h2>
              <p className="mt-4 text-base text-slate-300 sm:text-lg">
                <span className="font-semibold text-emerald-400">ไม่มีค่าตั้งต้น ไม่มีค่ารายเดือน</span> คิดเปอร์เซ็นต์ตามยอดขายจริงเท่านั้น ยิ่งขายได้มาก ยิ่งคุ้มค่า
              </p>
              <div className="inline-flex gap-2 items-center px-6 py-2 mt-6 text-sm font-semibold text-emerald-300 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                💰 ขายได้เท่าไหร่ จ่ายเท่านั้น - ไม่ขาย ไม่เสียเงิน
              </div>
            </div>

            <div className="grid gap-6 mt-12 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl border p-6 transition-transform hover:-translate-y-1 ${
                    plan.popular
                      ? 'border-cyan-400 bg-slate-950/80 shadow-xl shadow-cyan-500/20'
                      : 'border-white/10 bg-slate-900/60'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 px-5 py-1 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full -translate-x-1/2">
                      ⭐ {plan.highlight}
                    </div>
                  )}

                  {plan.savings && (
                    <div className="absolute -top-2 -right-2 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-red-500 to-orange-500 rounded-full">
                      ประหยัด {plan.savings}
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{plan.subtitle}</p>
                    <div className="flex gap-2 justify-center items-center mt-4">
                      <span className="text-3xl font-black text-cyan-300">{plan.price}</span>
                    </div>
                    <p className="text-sm text-slate-400">{plan.period}</p>
                    {plan.savings && (
                      <p className="mt-1 text-xs text-emerald-400">{plan.savings}</p>
                    )}
                    <p className="mt-4 text-sm text-slate-300">{plan.description}</p>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 items-start">
                        <span className="mt-0.5 text-emerald-400">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/self-warp"
                    className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <p className="mt-4 text-xs text-slate-500">⚡ เริ่มใช้งานภายใน 5 นาที</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="px-4 mx-auto max-w-4xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">คำถามที่พบบ่อย</h2>
              <p className="mt-4 text-base text-slate-300 sm:text-lg">
                ข้อมูลที่คุณต้องการทราบเกี่ยวกับ MEEWARP
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl border transition-colors border-white/10 bg-slate-900/60 hover:border-cyan-400/60"
                >
                  <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="p-8 mt-12 text-center rounded-2xl border border-cyan-400/30 bg-slate-900/80">
              <h3 className="text-xl font-bold text-white">ยังมีคำถามอื่นๆ?</h3>
              <p className="mt-2 text-sm text-slate-300">
                ทีมงานพร้อมตอบคำถามและให้คำปรึกษาฟรี
              </p>
              <div className="flex flex-col gap-4 items-center mt-6 sm:flex-row sm:justify-center">
                <a
                  href={`mailto:${contactInfo.support}`}
                  className="inline-flex gap-2 items-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg transition-all hover:from-cyan-400 hover:to-blue-500"
                >
                  📧 ส่งอีเมล
                </a>
                <a
                  href={`https://line.me/R/ti/p/${contactInfo.line}`}
                  className="inline-flex gap-2 items-center px-6 py-3 font-semibold rounded-lg border transition-colors border-white/20 text-slate-100 hover:border-cyan-400"
                >
                  💬 แชท Line
                </a>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="inline-flex gap-2 items-center px-6 py-3 font-semibold rounded-lg border transition-colors border-white/20 text-slate-100 hover:border-cyan-400"
                >
                  📞 โทรสอบถาม
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-900/60">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold text-white">ติดต่อเรา</h2>
                <p className="mt-4 text-base text-slate-300">
                  ทีมงาน MEEWARP พร้อมให้บริการและสนับสนุนคุณในทุกขั้นตอน
                </p>

                <div className="mt-8 space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl">
                      📧
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">อีเมล</h3>
                      <p className="text-sm text-slate-300">สำหรับข้อสงสัยทั่วไป</p>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                      🛠️
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">ซัพพอร์ต</h3>
                      <p className="text-sm text-slate-300">ช่วยเหลือด้านเทคนิค 24/7</p>
                      <a
                        href={`mailto:${contactInfo.support}`}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        {contactInfo.support}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                      💬
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Line Official</h3>
                      <p className="text-sm text-slate-300">แชทสดกับทีมงาน</p>
                      <a
                        href={`https://line.me/R/ti/p/${contactInfo.line}`}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        {contactInfo.line}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl">
                      📞
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">โทรศัพท์</h3>
                      <p className="text-sm text-slate-300">จันทร์-ศุกร์ 9:00-18:00</p>
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-white/10 bg-slate-950/70">
                <h3 className="text-xl font-bold text-white">บริษัท MEEWARP</h3>
                <div className="mt-6 space-y-4 text-sm text-slate-300">
                  <div>
                    <p className="font-semibold text-white">ที่อยู่สำนักงาน</p>
                    <p className="mt-1">{contactInfo.address}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-white">เวลาทำการ</p>
                    <p className="mt-1">จันทร์ - ศุกร์: 9:00 - 18:00 น.</p>
                    <p>เสาร์ - อาทิตย์: ซัพพอร์ตออนไลน์เท่านั้น</p>
                  </div>

                  <div>
                    <p className="font-semibold text-white">การรับประกัน</p>
                    <p className="mt-1">✅ Uptime 99.9%</p>
                    <p>✅ ตอบกลับภายใน 30 นาที</p>
                    <p>✅ ยกเลิกได้ทันที หากไม่พอใจใน 30 วันแรก</p>
                  </div>

                  <div className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                    <p className="font-semibold text-cyan-300">🎯 มีคำถามเฉพาะธุรกิจ?</p>
                    <p className="mt-1 text-xs">
                      นัดหมายปรึกษากับทีม Business Consultant ฟรี
                    </p>
                    <Link
                      to="/self-warp"
                      className="inline-block px-4 py-2 mt-3 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg transition-all hover:from-cyan-400 hover:to-blue-500"
                    >
                      นัดหมายเลย
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden relative py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="relative px-6 mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold sm:text-5xl">
              พร้อมที่จะ <span className="text-cyan-300">เปลี่ยนแปลง</span> ธุรกิจของคุณหรือยัง?
            </h2>
            <p className="mt-4 text-base text-slate-200 sm:text-lg">
              เริ่มต้นฟรี 30 วัน ไม่มีค่าธรรมเนียมการติดตั้ง และยกเลิกได้ทุกเมื่อ
            </p>

            <div className="flex flex-col gap-4 justify-center items-center mt-10 sm:flex-row">
              <Link
                to="/self-warp"
                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all hover:from-cyan-400 hover:to-blue-500"
              >
                🚀 เริ่มใช้งานฟรีเลย
              </Link>
              <a
                href="mailto:hello@MEEWARP.com"
                className="px-8 py-4 text-lg font-semibold rounded-full border transition-colors border-white/20 text-slate-100 hover:border-cyan-400"
              >
                📞 นัดปรึกษากับทีม
              </a>
            </div>

            <div className="flex flex-wrap gap-6 justify-center items-center mt-8 text-xs text-slate-300 sm:text-sm">
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Setup ใน 15 นาที
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                Support 24/7
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                ไม่มีสัญญาผูกมัด
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/10 bg-slate-950/90">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link to="/" className="text-2xl font-bold text-cyan-400">
                MEEWARP
              </Link>
              <p className="mt-4 max-w-md text-sm text-slate-400">
                แพลตฟอร์มจัดการคิว Warp แบบเรียลไทม์ที่ทำให้ธุรกิจของคุณเติบโตอย่างยั่งยืน พร้อมระบบที่เสถียรและใช้งานง่าย
              </p>
              <div className="flex gap-4 mt-4 text-sm text-slate-400">
                <a href="#" className="transition-colors hover:text-cyan-400">
                  Facebook
                </a>
                <a href="#" className="transition-colors hover:text-cyan-400">
                  Twitter
                </a>
                <a href="#" className="transition-colors hover:text-cyan-400">
                  Instagram
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Product</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#features" className="transition-colors hover:text-cyan-400">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="transition-colors hover:text-cyan-400">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/tv" className="transition-colors hover:text-cyan-400">
                    TV Demo
                  </Link>
                </li>
                <li>
                  <Link to="/self-warp" className="transition-colors hover:text-cyan-400">
                    Try Free
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>
                  <a href="mailto:hello@MEEWARP.com" className="transition-colors hover:text-cyan-400">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-cyan-400">
                    Documentation
                  </a>
                </li>
                <li>
                  <Link to="/admin/login" className="transition-colors hover:text-cyan-400">
                    Admin Login
                  </Link>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-cyan-400">
                    Status Page
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-between items-center pt-8 mt-12 text-sm border-t border-white/10 text-slate-500 md:flex-row">
            <span>© {new Date().getFullYear()} MEEWARP. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-cyan-400">
                Privacy Policy
              </a>
              <a href="#" className="transition-colors hover:text-cyan-400">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed right-6 bottom-6 z-50">
        <Link
          to="/self-warp"
          className="flex gap-3 items-center px-6 py-4 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-xl transition-transform shadow-cyan-500/30 hover:-translate-y-1 hover:shadow-cyan-500/50"
        >
          <span className="text-xl">🎯</span>
          <span className="hidden sm:inline">ลองใช้ฟรี</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default MarketingLandingPage;
