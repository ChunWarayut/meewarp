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
};

type FormData = {
  brandName: string;
  tagline?: string;
  primaryColor?: string;
  backgroundImage?: File | null;
  oldBackgroundImage?: string;
  contactEmail?: string;
  contactPhone?: string;
  siteDescription?: string;
  siteKeywords?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
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
    contactEmail: '',
    contactPhone: '',
    siteDescription: '',
    siteKeywords: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
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
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      siteDescription: data.siteDescription || '',
      siteKeywords: data.siteKeywords || '',
      facebookUrl: data.facebookUrl || '',
      instagramUrl: data.instagramUrl || '',
      twitterUrl: data.twitterUrl || '',
      youtubeUrl: data.youtubeUrl || '',
      tiktokUrl: data.tiktokUrl || '',
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
      
      if (formData.backgroundImage) {
        formDataToSend.append('backgroundImage', formData.backgroundImage);
      }
      if (formData.oldBackgroundImage) {
        formDataToSend.append('oldBackgroundImage', formData.oldBackgroundImage);
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

  const updateField = (field: keyof FormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!settings) {
    return <p className="text-sm text-slate-300">Loading settings…</p>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background with theme colors */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#6366f1_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_#f472b6_0%,_transparent_60%)] opacity-80" />
      
      <div className="relative z-10 p-6 space-y-6">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Admin Panel</p>
          <h1 className="mt-2 text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">Site Settings</h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl mx-auto">
            ข้อมูลเหล่านี้จะอัปเดตหน้า Landing Page และจอหลักแบบเรียลไทม์
          </p>
        </header>

      <div className="space-y-8">
        {/* Brand & Visual Identity */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-semibold text-white flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            Brand & Visual Identity
          </h2>
          <div className="grid gap-6 lg:grid-cols-1">
            {/* <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Brand Name</label>
                <input
                  value={formData.brandName}
                  onChange={(event) => updateField('brandName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                  placeholder="ชื่อแบรนด์ของคุณ"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Tagline</label>
                <input
                  value={formData.tagline || ''}
                  onChange={(event) => updateField('tagline', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                  placeholder="คำขวัญหรือสโลแกน"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Primary Color</label>
                <input
                  type="color"
                  value={formData.primaryColor || '#6366F1'}
                  onChange={(event) => updateField('primaryColor', event.target.value)}
                  className="mt-2 h-12 w-24 rounded-lg border border-white/10 bg-slate-900/60"
                />
              </div>
            </div> */}

            <div className="space-y-4">
              <ImageUpload
                value={formData.oldBackgroundImage || ''}
                onChange={(file) => updateField('backgroundImage', file)}
                label="Background Image"
                placeholder="คลิกเพื่อเลือกรูปพื้นหลัง"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-semibold text-white flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(event) => updateField('contactPhone', event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="+66 XX XXX XXXX"
              />
            </div>
          </div>
        </div> */}

        {/* SEO & Site Information */}
        {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-semibold text-white flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="คำอธิบายเว็บไซต์สำหรับ SEO"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Keywords</label>
              <input
                value={formData.siteKeywords || ''}
                onChange={(event) => updateField('siteKeywords', event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="คีย์เวิร์ดสำหรับ SEO (คั่นด้วยจุลภาค)"
              />
            </div>
          </div>
        </div> */}

        {/* Social Media Links */}
        {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-semibold text-white flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Instagram URL</label>
              <input
                type="url"
                value={formData.instagramUrl || ''}
                onChange={(event) => updateField('instagramUrl', event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="https://instagram.com/yourpage"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Twitter URL</label>
              <input
                type="url"
                value={formData.twitterUrl || ''}
                onChange={(event) => updateField('twitterUrl', event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="https://twitter.com/yourpage"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">YouTube URL</label>
              <input
                type="url"
                value={formData.youtubeUrl || ''}
                onChange={(event) => updateField('youtubeUrl', event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="https://youtube.com/yourchannel"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">TikTok URL</label>
              <input
                type="url"
                value={formData.tiktokUrl || ''}
                onChange={(event) => updateField('tiktokUrl', event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                placeholder="https://tiktok.com/@yourpage"
              />
            </div>
          </div>
        </div> */}

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="group relative rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-12 py-4 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-[0_20px_50px_rgba(99,102,241,0.4)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(99,102,241,0.6)] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            disabled={status === 'saving'}
          >
            <div className="flex items-center gap-3">
              {status === 'saving' ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save All Changes</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

        {status !== 'idle' && message ? (
          <div className={`fixed top-4 right-4 z-50 rounded-xl border p-4 shadow-lg backdrop-blur-sm ${
            status === 'error' 
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' 
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
          }`}>
            <div className="flex items-center gap-3">
              {status === 'error' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
