import { type FormEvent, useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';

type AppSettings = {
  brandName: string;
  tagline?: string;
  primaryColor?: string;
  logo?: string;
  backgroundImage?: string;
  socialLinks?: Record<string, string>;
  contactEmail?: string;
  contactPhone?: string;
  siteDescription?: string;
  siteKeywords?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  promotionImages?: string[];
  promotionDuration?: number;
  promotionEnabled?: boolean;
};

type FormData = {
  brandName: string;
  tagline?: string;
  primaryColor?: string;
  backgroundImage?: File | null;
  oldBackgroundImage?: string;
  logoFile?: File | null;
  logoExistingPath?: string;
  oldLogo?: string;
  logoRemoved?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  siteDescription?: string;
  siteKeywords?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  promotionImages?: string[];
  promotionDuration?: number;
  promotionEnabled?: boolean;
};

const AdminSettingsPage = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [formData, setFormData] = useState<FormData>({
    brandName: '',
    tagline: '',
    primaryColor: '#6366F1',
    backgroundImage: null,
    oldBackgroundImage: '',
    logoFile: null,
    logoExistingPath: '',
    oldLogo: '',
    logoRemoved: false,
    contactEmail: '',
    contactPhone: '',
    siteDescription: '',
    siteKeywords: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
    promotionImages: [],
    promotionDuration: 5000,
    promotionEnabled: false,
  });
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error' | 'success'>('idle');

  const load = useCallback(async () => {
    if (!token) return;
    const response = await fetch(API_ENDPOINTS.adminSettings, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to load settings');
    }
    const data = (await response.json()) as AppSettings;
    setSettings(data);
    setFormData({
      brandName: data.brandName || '',
      tagline: data.tagline || '',
      primaryColor: data.primaryColor || '#6366F1',
      backgroundImage: null,
      oldBackgroundImage: data.backgroundImage || '',
      logoFile: null,
      logoExistingPath: data.logo || '',
      oldLogo: data.logo || '',
      logoRemoved: false,
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      siteDescription: data.siteDescription || '',
      siteKeywords: data.siteKeywords || '',
      facebookUrl: data.facebookUrl || '',
      instagramUrl: data.instagramUrl || '',
      twitterUrl: data.twitterUrl || '',
      youtubeUrl: data.youtubeUrl || '',
      tiktokUrl: data.tiktokUrl || '',
      promotionImages: data.promotionImages || [],
      promotionDuration: data.promotionDuration || 5000,
      promotionEnabled: data.promotionEnabled || false,
    });
  }, [token]);

  useEffect(() => {
    load().catch((error) => {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unexpected error');
    });
  }, [load]);

  const validateForm = () => {
    // All fields are optional, no validation required
    return true;
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (!token) return;

    if (!validateForm()) {
      return;
    }

    try {
      setStatus('saving');
      setMessage('');
      
      const formDataToSend = new FormData();
      formDataToSend.append('brandName', formData.brandName);
      formDataToSend.append('tagline', formData.tagline || '');
      formDataToSend.append('primaryColor', formData.primaryColor || '#6366F1');
      formDataToSend.append('contactEmail', formData.contactEmail || '');
      formDataToSend.append('contactPhone', formData.contactPhone || '');
      formDataToSend.append('siteDescription', formData.siteDescription || '');
      formDataToSend.append('siteKeywords', formData.siteKeywords || '');
      formDataToSend.append('facebookUrl', formData.facebookUrl || '');
      formDataToSend.append('instagramUrl', formData.instagramUrl || '');
      formDataToSend.append('twitterUrl', formData.twitterUrl || '');
      formDataToSend.append('youtubeUrl', formData.youtubeUrl || '');
      formDataToSend.append('tiktokUrl', formData.tiktokUrl || '');
      formDataToSend.append('promotionDuration', formData.promotionDuration?.toString() || '5000');
      formDataToSend.append('promotionEnabled', formData.promotionEnabled?.toString() || 'false');
      formDataToSend.append('logoRemoved', formData.logoRemoved ? 'true' : 'false');
      formDataToSend.append('oldLogo', formData.oldLogo || '');
      
      if (formData.backgroundImage) {
        formDataToSend.append('backgroundImage', formData.backgroundImage);
      }
      if (formData.oldBackgroundImage) {
        formDataToSend.append('oldBackgroundImage', formData.oldBackgroundImage);
      }

      if (formData.logoFile) {
        formDataToSend.append('logo', formData.logoFile);
      }

      // Handle promotion images
      if (formData.promotionImages && formData.promotionImages.length > 0) {
        // For now, we'll send the image URLs as strings
        // In a real implementation, you'd need to handle file uploads properly
        formDataToSend.append('promotionImages', JSON.stringify(formData.promotionImages));
      }

      const response = await fetch(API_ENDPOINTS.adminSettings, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Failed to update settings');
      }
      
      const data = await response.json();
      setSettings(data);
      setFormData(prev => ({
        ...prev,
        oldBackgroundImage: data.backgroundImage || '',
        backgroundImage: null,
        logoFile: null,
        logoExistingPath: data.logo || '',
        oldLogo: data.logo || '',
        logoRemoved: false,
      }));
      setStatus('success');
      setMessage('อัปเดตการตั้งค่าเรียบร้อยแล้ว');
      
      // Notify other tabs/pages that settings have been updated
      localStorage.setItem('settingsUpdated', Date.now().toString());
      
      // Also dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  const updateField = (field: keyof FormData, value: string | File | null | boolean | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File | null) => {
    setFormData((prev) => {
      if (file) {
        return {
          ...prev,
          logoFile: file,
          logoRemoved: false,
        };
      }

      return {
        ...prev,
        logoFile: null,
        logoRemoved: true,
        logoExistingPath: '',
        oldLogo: prev.oldLogo || prev.logoExistingPath || '',
      };
    });
  };

  if (!settings) {
    return <p className="text-sm font-th text-slate-300">Loading settings…</p>;
  }

  return (
    <div className="overflow-hidden relative min-h-screen text-slate-100 font-th">
      {/* <div
        className="absolute -top-48 inset-x-1/2 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 pointer-events-none bg-indigo-500/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-purple-500/25 blur-3xl"
        aria-hidden
      /> */}

      <div className="relative z-10 px-6 py-10 mx-auto max-w-5xl sm:px-8 sm:py-12">
        <header className="text-center">
          <p className="font-en text-xs uppercase tracking-[0.5em] text-indigo-300">Admin Panel</p>
          <h1
            lang="th"
            className="mt-2 text-4xl font-semibold text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.45)] sm:text-5xl"
          >
            ตั้งค่าหน้าไซต์
          </h1>
          <p lang="th" className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
            ข้อมูลเหล่านี้จะอัปเดตหน้า Landing Page และจอหลักแบบเรียลไทม์
          </p>
        </header>
        <div className="mt-10 space-y-10">
        {/* Brand & Visual Identity */}
        <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_90px_rgba(8,12,24,0.6)] backdrop-blur-xl">
          <header className="flex gap-3 items-center mb-6">
            <span className="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </span>
            <div>
              <p className="font-en text-[11px] uppercase tracking-[0.45em] text-indigo-300">Visuals</p>
              <h2 lang="th" className="text-lg font-semibold text-white">ภาพรวมแบรนด์และพื้นหลัง</h2>
            </div>
          </header>

          <div className="space-y-4">
            {/* <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Brand Name</label>
                <input
                  value={formData.brandName}
                  onChange={(event) => updateField('brandName', event.target.value)}
                  className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                  placeholder="ชื่อแบรนด์ของคุณ"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Tagline</label>
                <input
                  value={formData.tagline || ''}
                  onChange={(event) => updateField('tagline', event.target.value)}
                  className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                  placeholder="คำขวัญหรือสโลแกน"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Primary Color</label>
                <input
                  type="color"
                  value={formData.primaryColor || '#6366F1'}
                  onChange={(event) => updateField('primaryColor', event.target.value)}
                  className="mt-2 w-24 h-12 rounded-lg border border-white/10 bg-slate-900/60"
                />
              </div>
            </div> */}

            <div className="space-y-4">
              <div className="space-y-2">
                <ImageUpload
                  value={formData.logoExistingPath || ''}
                  onChange={handleLogoChange}
                  label="Vertical Logo"
                  placeholder="อัปโหลดโลโก้แนวตั้งสำหรับจอ TV"
                />
                <p className="text-xs text-slate-400">
                  แนะนำขนาดอัตราส่วน 9:16 (เช่น 1080x1920) เพื่อให้โลโก้เต็มคอลัมน์ด้านซ้ายของจอ TV
                </p>
              </div>

              <div className="space-y-2">
                <ImageUpload
                  value={formData.oldBackgroundImage || ''}
                  onChange={(file) => updateField('backgroundImage', file)}
                  label="Background Image"
                  placeholder="คลิกเพื่อเลือกรูปพื้นหลัง"
                />
                <p className="text-xs text-slate-400">แนะนำอัตราส่วน 16:9 (เช่น 1920x1080) สำหรับพื้นหลังจอ TV</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="flex gap-3 items-center mb-6 text-xl font-semibold text-white">
            <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            Contact Information
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(event) => updateField('contactEmail', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(event) => updateField('contactPhone', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="+66 XX XXX XXXX"
              />
            </div>
          </div>
        </div> */}

        {/* SEO & Site Information */}
        {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="flex gap-3 items-center mb-6 text-xl font-semibold text-white">
            <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            SEO & Site Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Site Description</label>
              <textarea
                value={formData.siteDescription || ''}
                onChange={(event) => updateField('siteDescription', event.target.value)}
                rows={3}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="คำอธิบายเว็บไซต์สำหรับ SEO"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Keywords</label>
              <input
                value={formData.siteKeywords || ''}
                onChange={(event) => updateField('siteKeywords', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="คีย์เวิร์ดสำหรับ SEO (คั่นด้วยจุลภาค)"
              />
            </div>
          </div>
        </div> */}

        {/* Social Media Links */}
        {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="flex gap-3 items-center mb-6 text-xl font-semibold text-white">
            <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Social Media Links
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Facebook URL</label>
              <input
                type="url"
                value={formData.facebookUrl || ''}
                onChange={(event) => updateField('facebookUrl', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Instagram URL</label>
              <input
                type="url"
                value={formData.instagramUrl || ''}
                onChange={(event) => updateField('instagramUrl', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="https://instagram.com/yourpage"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Twitter URL</label>
              <input
                type="url"
                value={formData.twitterUrl || ''}
                onChange={(event) => updateField('twitterUrl', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="https://twitter.com/yourpage"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">YouTube URL</label>
              <input
                type="url"
                value={formData.youtubeUrl || ''}
                onChange={(event) => updateField('youtubeUrl', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="https://youtube.com/yourchannel"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">TikTok URL</label>
              <input
                type="url"
                value={formData.tiktokUrl || ''}
                onChange={(event) => updateField('tiktokUrl', event.target.value)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="https://tiktok.com/@yourpage"
              />
            </div>
          </div>
        </div> */}

        {/* Promotion Settings */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="mb-6 text-lg font-semibold text-white">การตั้งค่าโปรโมชั่น</h3>
          
          <div className="space-y-6">
            {/* Promotion Enable Toggle */}
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium text-white">เปิดใช้งานโปรโมชั่น</label>
                <p className="mt-1 text-xs text-slate-400">แสดงภาพโปรโมชั่นบนหน้าจอ TV</p>
              </div>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.promotionEnabled || false}
                  onChange={(event) => updateField('promotionEnabled', event.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            {/* Promotion Duration */}
            <div>
              <label className="text-sm font-medium text-white">ระยะเวลาแสดงภาพ (วินาที)</label>
              <p className="mt-1 text-xs text-slate-400">กำหนดเวลาที่แต่ละภาพจะแสดง (3-30 วินาที)</p>
              <input
                type="number"
                min="3"
                max="30"
                value={Math.round((formData.promotionDuration || 5000) / 1000)}
                onChange={(event) => updateField('promotionDuration', parseInt(event.target.value) * 1000)}
                className="px-3 py-2 mt-2 w-full text-sm text-white rounded-lg border border-white/10 bg-slate-900/60 focus:border-indigo-400 focus:outline-none"
                placeholder="5"
              />
            </div>

            {/* Promotion Images */}
            <div>
              <label className="text-sm font-medium text-white">ภาพโปรโมชั่น</label>
              <p className="mt-1 text-xs text-slate-400">
                อัปโหลดภาพโปรโมชั่นที่จะแสดงแบบวนลูป (แนะนำอัตราส่วน 16:9 เช่น 1920x1080 หรือ 1280x720 เพื่อให้เต็มพื้นที่)
              </p>
              
              {/* Upload Button */}
              <div className="mt-3">
                <label className="cursor-pointer">
                  <div className="flex gap-2 justify-center items-center p-4 rounded-lg border-2 border-dashed transition-colors border-white/20 bg-slate-900/30 hover:border-indigo-400 hover:bg-slate-900/50">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-slate-300">เพิ่มภาพโปรโมชั่น</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      const newImages = [...(formData.promotionImages || []), ...files.map(file => URL.createObjectURL(file))];
                      updateField('promotionImages', newImages);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="mt-3 space-y-3">
                {formData.promotionImages?.map((image, index) => (
                  <div key={index} className="flex gap-3 items-center p-3 rounded-lg border border-white/10 bg-slate-900/30">
                    <img
                      src={image.startsWith('/uploads/') ? `${window.location.origin}/api${image}` : image}
                      alt={`โปรโมชั่น ${index + 1}`}
                      className="object-cover w-16 h-16 rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">ภาพโปรโมชั่น {index + 1}</p>
                      <p className="text-xs text-slate-400">{image}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = formData.promotionImages?.filter((_, i) => i !== index) || [];
                        updateField('promotionImages', newImages);
                      }}
                      className="p-2 text-rose-400 transition-colors hover:text-rose-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {(!formData.promotionImages || formData.promotionImages.length === 0) && (
                  <div className="py-8 text-center text-slate-400">
                    <svg className="mx-auto mb-2 w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">ยังไม่มีภาพโปรโมชั่น</p>
                    <p className="mt-1 text-xs">เพิ่มภาพโปรโมชั่นเพื่อแสดงบนหน้าจอ TV</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-12 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0_22px_55px_rgba(99,102,241,0.45)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            disabled={status === 'saving'}
          >
            {status === 'saving' ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent" />
                <span className="font-en">Saving…</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span lang="th">บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </div>

        {status !== 'idle' && message ? (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_45px_rgba(8,12,24,0.45)] backdrop-blur-xl ${
              status === 'error'
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {status === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span lang="th" className="font-medium">{message}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
