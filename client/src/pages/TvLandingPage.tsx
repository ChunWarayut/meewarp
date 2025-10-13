import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { resolveStoreSlug } from '../utils/storeSlug';

type Supporter = {
  customerName: string;
  totalAmount: number;
  customerAvatar?: string | null;
  totalSeconds?: number;
};

type AppSettings = {
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  backgroundImage?: string;
  backgroundImages?: string[];
  backgroundRotationDuration?: number;
  logo?: string;
  promotionImages?: string[];
  promotionDuration?: number;
  promotionEnabled?: boolean;
};

const fallbackSupporters: Supporter[] = [
  {
    customerName: 'รอเปิดวาร์ป',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 2',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 3',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 4',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 5',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 6',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 7',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 8',
    totalAmount: 0,
    customerAvatar: null,
  },
  {
    customerName: 'ยังว่างอันดับ 9',
    totalAmount: 0,
    customerAvatar: null,
  },
];

type DisplayWarp = {
  id: string;
  customerName: string;
  customerAvatar?: string | null;
  socialLink: string;
  quote?: string | null;
  displaySeconds: number;
  productImage?: string | null;
  selfDisplayName?: string | null;
};

const TvLandingPage = () => {
  const { storeSlug: routeSlug } = useParams<{ storeSlug?: string }>();
  const storeSlug = resolveStoreSlug(routeSlug);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selfWarpUrl, setSelfWarpUrl] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentWarp, setCurrentWarp] = useState<DisplayWarp | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [imageColors, setImageColors] = useState<{ primary: string; secondary: string } | null>(null);
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState<number>(0);
  const [isBackgroundTransitioning, setIsBackgroundTransitioning] = useState<boolean>(false);
  const [currentPromotionIndex, setCurrentPromotionIndex] = useState<number>(0);
  const [isPromotionTransitioning, setIsPromotionTransitioning] = useState<boolean>(false);
  const isFetchingWarpRef = useRef(false);
  const currentWarpRef = useRef<DisplayWarp | null>(null);
  const fetchNextWarpRef = useRef<() => void>(() => { });
  const promotionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTransitionTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    currentWarpRef.current = currentWarp;
  }, [currentWarp]);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.publicSettings(storeSlug));
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const data = await response.json();
        if (isMounted) {
          console.log('Settings loaded:', data);
          console.log('Promotion enabled:', data.promotionEnabled);
          console.log('Promotion images:', data.promotionImages);
          console.log('Promotion duration:', data.promotionDuration);
          setSettings(data);
        }
      } catch {
        // silent fallback
      }
    };

    fetchSettings();

    // Set up periodic refresh every 10 seconds to catch settings updates
    const interval = setInterval(() => {
      if (isMounted) {
        fetchSettings();
      }
    }, 10000);

    // Also refresh when the page becomes visible again (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        fetchSettings();
      }
    };

    // Listen for settings updates via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settingsUpdated' && isMounted) {
        console.log('Settings update detected, refreshing...');
        fetchSettings();
        // Clear the flag
        localStorage.removeItem('settingsUpdated');
      }
    };

    // Also listen for custom events (for same-tab updates)
    const handleSettingsUpdate = () => {
      if (isMounted) {
        console.log('Settings update event received, refreshing...');
        fetchSettings();
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [storeSlug]);

  const resolveMediaSource = useCallback((raw?: string | null) => {
    if (!raw) {
      return null;
    }

    if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) {
      return raw;
    }

    const trimmed = raw.trim();
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return `data:image/jpeg;base64,${trimmed}`;
    }

    return raw;
  }, [storeSlug]);

  const extractImageColors = useCallback((imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize image for faster processing
        const size = 50;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Sample colors from the image
        const colors: { r: number; g: number; b: number; count: number }[] = [];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skip very light or very dark pixels
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;

          // Find existing color or add new one
          const existingColor = colors.find(c =>
            Math.abs(c.r - r) < 20 &&
            Math.abs(c.g - g) < 20 &&
            Math.abs(c.b - b) < 20
          );

          if (existingColor) {
            existingColor.r = (existingColor.r * existingColor.count + r) / (existingColor.count + 1);
            existingColor.g = (existingColor.g * existingColor.count + g) / (existingColor.count + 1);
            existingColor.b = (existingColor.b * existingColor.count + b) / (existingColor.count + 1);
            existingColor.count++;
          } else {
            colors.push({ r, g, b, count: 1 });
          }
        }

        // Sort by frequency and get top colors
        colors.sort((a, b) => b.count - a.count);

        if (colors.length > 0) {
          const primary = colors[0];
          const secondary = colors[1] || colors[0];

          const primaryColor = `rgb(${Math.round(primary.r)}, ${Math.round(primary.g)}, ${Math.round(primary.b)})`;
          const secondaryColor = `rgb(${Math.round(secondary.r)}, ${Math.round(secondary.g)}, ${Math.round(secondary.b)})`;

          setImageColors({ primary: primaryColor, secondary: secondaryColor });
        }
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    };

    img.onerror = () => {
      console.error('Error loading image for color extraction');
    };

    img.src = imageUrl;
  }, [storeSlug]);

  const formatSeconds = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (safe % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, []);

  const sanitizeName = useCallback((name: string) => {
    // Remove special characters, keep only Thai characters, English letters, numbers, and basic punctuation
    return name.replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '').trim();
  }, [storeSlug]);

  const fetchNextWarp = useCallback(async () => {
    if (isFetchingWarpRef.current || currentWarpRef.current) {
      return;
    }

    isFetchingWarpRef.current = true;

    try {
      const response = await fetch(API_ENDPOINTS.displayNext(storeSlug), {
        method: 'POST',
      });

      if (response.status === 204) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch next warp');
      }

      const data = await response.json();

      if (data?.id) {
        const displaySeconds = Math.max(1, Number(data.displaySeconds) || 30);

        setCurrentWarp({
          id: data.id,
          customerName: data.customerName || 'Mee Warp',
          customerAvatar: data.customerAvatar || null,
          socialLink: data.socialLink || '',
          quote: data.quote || null,
          displaySeconds,
          productImage: data.metadata?.productImage || null,
          selfDisplayName: data.selfDisplayName || null,
        });
      }
    } catch (error) {
      console.error('Failed to fetch next warp', error);
    } finally {
      isFetchingWarpRef.current = false;
    }
  }, [storeSlug]);

  const completeCurrentWarp = useCallback(async (transactionId: string) => {
    if (!transactionId) {
      setCurrentWarp(null);
      setCountdown(0);
      fetchNextWarpRef.current?.();
      return;
    }

    try {
      await fetch(API_ENDPOINTS.displayComplete(transactionId, storeSlug), {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark warp as displayed', error);
    } finally {
      setCurrentWarp(null);
      setCountdown(0);
      setTimeout(() => {
        fetchNextWarpRef.current?.();
      }, 500);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchNextWarpRef.current = fetchNextWarp;
  }, [fetchNextWarp]);

  useEffect(() => {
    if (!currentWarp) {
      return undefined;
    }

    setCountdown(currentWarp.displaySeconds);

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = setTimeout(() => {
      completeCurrentWarp(currentWarp.id);
    }, currentWarp.displaySeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentWarp, completeCurrentWarp]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }
      eventSource = new EventSource(API_ENDPOINTS.displayStream(storeSlug));

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!currentWarpRef.current && (data?.queueCount > 0 || data?.current)) {
            fetchNextWarpRef.current?.();
          }
        } catch {
          // ignore malformed payloads
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 5000);
      };
    };

    connect();

    fetchNextWarpRef.current?.();

    const poller = setInterval(() => {
      if (!currentWarpRef.current) {
        fetchNextWarpRef.current?.();
      }
    }, 15000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      clearInterval(poller);
    };
  }, [storeSlug]);

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    if (typeof window !== 'undefined') {
      const prefix = storeSlug ? `/${storeSlug}` : '';
      const path = `${prefix}/self-warp/?openExternalBrowser=1`;
      setSelfWarpUrl(`${window.location.origin}${path}`);
    }

    const normaliseSupporters = (list: unknown): Supporter[] => {
      if (!Array.isArray(list)) return [];
      return list
        .map((item) => ({
          customerName: item?.customerName ?? 'Unknown',
          totalAmount: Number(item?.totalAmount ?? 0),
          customerAvatar: item?.customerAvatar ?? null,
          totalSeconds: item?.totalSeconds ? Number(item.totalSeconds) : undefined,
        }))
        .filter((entry) => Number.isFinite(entry.totalAmount))
        .slice(0, 3);
    };

    const fetchInitial = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.topSupporters(storeSlug)}&limit=3`);
        if (!response.ok) {
          throw new Error('Failed to fetch supporters');
        }

        const body = await response.json();
        if (isMounted) {
          const parsed = normaliseSupporters(body?.supporters);
          setSupporters(parsed);
        }
      } catch {
        // fall back silently to seeded supporters
      }
    };

    const setupStream = () => {
      if (typeof window === 'undefined') {
        return;
      }

      eventSource = new EventSource(API_ENDPOINTS.leaderboardStream(storeSlug));

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          const parsed = normaliseSupporters(payload?.supporters);
          setSupporters(parsed);
        } catch {
          // ignore malformed messages
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // attempt to re-establish after delay
        if (isMounted) {
          setTimeout(() => {
            if (!eventSource) {
              setupStream();
            }
          }, 5000);
        }
      };
    };

    fetchInitial();
    setupStream();

    const refreshInterval = setInterval(fetchInitial, 15000);

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      clearInterval(refreshInterval);
    };
  }, [storeSlug]);

  const hasLiveData = supporters.length > 0;
  const supportersToDisplay = hasLiveData ? supporters : fallbackSupporters;
  const warpImage = useMemo(() => {
    if (!currentWarp) {
      return null;
    }

    return (
      resolveMediaSource(currentWarp.productImage) ||
      resolveMediaSource(currentWarp.customerAvatar) ||
      `https://ui-avatars.com/api/?background=1e1b4b&color=fff&name=${encodeURIComponent(
        currentWarp.customerName
      )}`
    );
  }, [currentWarp, resolveMediaSource]);

  const warpAvatar = useMemo(() => {
    if (!currentWarp) {
      return null;
    }

    return (
      resolveMediaSource(currentWarp.customerAvatar) ||
      `https://ui-avatars.com/api/?background=111827&color=fff&name=${encodeURIComponent(
        currentWarp.customerName
      )}`
    );
  }, [currentWarp, resolveMediaSource]);

  const warpSocialQr = useMemo(() => {
    if (!currentWarp?.socialLink) {
      return null;
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(currentWarp.socialLink)}`;
  }, [currentWarp]);

  const warpInitials = useMemo(() => {
    if (!currentWarp) {
      return 'MW';
    }

    const safeName = sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName);
    if (!safeName) {
      return 'MW';
    }

    const parts = safeName.split(' ').filter(Boolean);
    if (parts.length === 0) {
      return 'MW';
    }

    const initials = parts
      .map((segment) => segment[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'MW';
  }, [currentWarp, sanitizeName]);

  const countdownLabel = useMemo(() => formatSeconds(countdown), [countdown, formatSeconds]);
  const totalDurationLabel = useMemo(
    () => (currentWarp ? formatSeconds(currentWarp.displaySeconds) : '00:00'),
    [currentWarp, formatSeconds]
  );

  // Promotion display logic
  useEffect(() => {
    console.log('Promotion check:', {
      promotionEnabled: settings?.promotionEnabled,
      promotionImages: settings?.promotionImages,
      imagesLength: settings?.promotionImages?.length
    });

    if (!settings?.promotionEnabled || !settings?.promotionImages || settings.promotionImages.length === 0) {
      console.log('Promotion not enabled or no images');
      return;
    }

    const duration = settings.promotionDuration || 5000; // Default 5 seconds

    const startPromotionLoop = () => {
      promotionIntervalRef.current = setInterval(() => {
        setIsPromotionTransitioning(true);

        setTimeout(() => {
          setCurrentPromotionIndex((prev) => (prev + 1) % settings.promotionImages.length);
          setIsPromotionTransitioning(false);
        }, 500); // Half of transition duration
      }, duration);
    };

    startPromotionLoop();

    return () => {
      if (promotionIntervalRef.current) {
        clearInterval(promotionIntervalRef.current);
      }
    };
  }, [settings?.promotionEnabled, settings?.promotionImages, settings?.promotionDuration]);

  // Reset promotion index when images change
  useEffect(() => {
    if (settings?.promotionImages) {
      setCurrentPromotionIndex(0);
    }
  }, [settings?.promotionImages]);

  const brandName = settings?.brandName?.trim() || '';
  const tagline = settings?.tagline?.trim() || '';

  const backgroundSources = useMemo(() => {
    const rawList = Array.isArray(settings?.backgroundImages) && settings.backgroundImages.length > 0
      ? settings.backgroundImages
      : settings?.backgroundImage
        ? [settings.backgroundImage]
        : [];
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return rawList
      .map((source) => {
        if (!source) return null;
        let value = source;
        if (typeof source === 'object' && source !== null) {
          value = source.url || source.path || source.src || null;
        }

        if (typeof value !== 'string' || value.length === 0) {
          return null;
        }

        if (value.startsWith('/uploads/')) {
          if (origin) {
            return `${origin}/api${value}`;
          }
          return `/api${value}`;
        }

        return resolveMediaSource(value);
      })
      .filter((value): value is string => Boolean(value));
  }, [settings?.backgroundImages, settings?.backgroundImage, resolveMediaSource]);

  const backgroundSourcesKey = useMemo(() => backgroundSources.join('|'), [backgroundSources]);

  useEffect(() => {
    setCurrentBackgroundIndex(0);
    setIsBackgroundTransitioning(false);
  }, [backgroundSourcesKey]);

  useEffect(() => {
    backgroundTransitionTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    backgroundTransitionTimeoutsRef.current = [];

    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
      backgroundIntervalRef.current = null;
    }

    if (backgroundSources.length <= 1) {
      setIsBackgroundTransitioning(false);
      return undefined;
    }

    const duration = Math.max(3000, Number(settings?.backgroundRotationDuration) || 15000);

    const rotateBackground = () => {
      setIsBackgroundTransitioning(true);
      const changeTimeout = setTimeout(() => {
        setCurrentBackgroundIndex((prev) => (prev + 1) % backgroundSources.length);
        const settleTimeout = setTimeout(() => {
          setIsBackgroundTransitioning(false);
        }, 60);
        backgroundTransitionTimeoutsRef.current.push(settleTimeout);
      }, 350);
      backgroundTransitionTimeoutsRef.current.push(changeTimeout);
    };

    backgroundIntervalRef.current = setInterval(rotateBackground, duration);

    return () => {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
        backgroundIntervalRef.current = null;
      }
      backgroundTransitionTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      backgroundTransitionTimeoutsRef.current = [];
    };
  }, [backgroundSources, settings?.backgroundRotationDuration]);

  const backgroundImage = backgroundSources[currentBackgroundIndex] ?? null;

  useEffect(() => {
    if (!backgroundImage) {
      setImageColors(null);
      return;
    }
    extractImageColors(backgroundImage);
  }, [backgroundImage, extractImageColors]);

  const defaultPrimary = '#6366f1';
  const defaultSecondary = '#f472b6';
  const gradientPrimary = imageColors?.primary || defaultPrimary;
  const gradientSecondary = imageColors?.secondary || defaultSecondary;
  const displayBrandName = brandName || '';
  const displayTagline = tagline || null;
  const promotionEnabled = Boolean(settings?.promotionEnabled);
  const hasPromotionImages = Boolean(settings?.promotionImages && settings.promotionImages.length > 0);
  const showPromotions = promotionEnabled && hasPromotionImages;
  const promotionImageSrc = showPromotions
    ? settings?.promotionImages?.[currentPromotionIndex] ?? null
    : null;
  const verticalLogoSrc = useMemo(() => {
    if (!settings?.logo) {
      return null;
    }
    if (settings.logo.startsWith('/uploads/')) {
      if (typeof window === 'undefined') {
        return settings.logo;
      }
      return `${window.location.origin}/api${settings.logo}`;
    }
    return resolveMediaSource(settings.logo);
  }, [settings?.logo, resolveMediaSource]);

  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1920, height: 1080 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const aspectRatio = useMemo(() => {
    const height = Math.max(viewport.height, 1);
    return viewport.width / height;
  }, [viewport]);

  const layoutVariant = useMemo(() => {
    if (aspectRatio <= 0.8) {
      return 'portrait';
    }
    if (aspectRatio >= 1.9) {
      return 'widescreen';
    }
    return 'standard';
  }, [aspectRatio]);

  const isPortrait = layoutVariant === 'portrait';
  const isWidescreen = layoutVariant === 'widescreen';
  const mainPaddingClass = isPortrait
    ? 'px-5 py-6 sm:px-8 sm:py-10'
    : 'px-6 py-8 lg:px-10 lg:py-10 xl:px-16 xl:py-12';
  const mainMinHeightClass = isPortrait ? 'min-h-[82vh]' : 'min-h-[92vh]';

  const toRgba = (color: string, alpha: number) => {
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((char) => char + char)
          .join('');
      }
      const numeric = parseInt(hex, 16);
      const r = (numeric >> 16) & 255;
      const g = (numeric >> 8) & 255;
      const b = numeric & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  const promotionMinHeight = isPortrait ? '60vh' : '520px';

  const warpOverlay = currentWarp ? (
    <div className="flex absolute inset-0 z-30 justify-center items-center px-3 py-4 pointer-events-none sm:px-6 sm:py-6 lg:px-10">
      <div
        className="pointer-events-auto relative flex w-full h-full max-w-[1180px] flex-col gap-8 rounded-[48px] border border-white/15 bg-slate-950/85 p-6 text-white shadow-[0_55px_180px_rgba(8,12,36,0.78)] backdrop-blur-2xl sm:p-8 lg:flex-row lg:items-stretch lg:gap-10 warp-fade-up"
        style={{ animationDelay: '0.05s' }}
      >
        <div className="flex relative flex-1 justify-center items-center">
          <div className="relative w-full h-full max-w-[560px]">
            <div className="relative overflow-hidden rounded-[44px] bg-gradient-to-br from-rose-500 via-fuchsia-500 to-indigo-500 p-[6px] shadow-[0_60px_180px_rgba(236,72,153,0.35)] warp-frame-glow">
              <div className="relative aspect-[3/4] w-full h-full overflow-hidden rounded-[38px] bg-slate-900/80">
                {warpImage ? (
                  <img src={warpImage} alt={currentWarp.customerName} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex justify-center items-center w-full h-full">
                    <img src="/logo_meewarp.png" alt="MeeWarp" className="max-w-[60%] max-h-[60%] object-contain" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t to-transparent from-slate-950/90 via-slate-950/10" />
                <div className="absolute left-7 top-7 flex items-center gap-4 rounded-full bg-black/35 px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.45)] backdrop-blur-lg">
                  <div className="flex overflow-hidden justify-center items-center w-16 h-16 rounded-full border-2 border-white/60 bg-white/10">
                    {warpAvatar ? (
                      <img src={warpAvatar} alt={currentWarp.customerName} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-lg font-semibold text-white">{warpInitials}</span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/75">Warp Spotlight</span>
                    <span className="text-2xl font-bold leading-tight text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.5)]">
                      {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-7 left-7 flex items-center gap-3 rounded-full bg-white/15 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white shadow-[0_18px_45px_rgba(15,23,42,0.4)] backdrop-blur-lg warp-soft-pulse">
                  <span className="text-white/75">เหลือเวลา</span>
                  <span className="font-mono text-lg tracking-widest text-white">{countdownLabel}</span>
                </div>
                {/* {warpSocialQr ? (
                  <div
                    className="pointer-events-none absolute bottom-6 right-6 flex items-center gap-4 rounded-[32px] border border-white/15 bg-white/12 px-4 py-3 text-left text-white shadow-[0_25px_65px_rgba(15,23,42,0.45)] backdrop-blur-xl warp-fade-up warp-soft-pulse"
                    style={{ animationDelay: '0.4s' }}
                  >
                    <div className="flex overflow-hidden justify-center items-center w-24 h-24 bg-white rounded-2xl">
                      <img src={warpSocialQr} alt="Warp Spotlight QR" className="object-contain w-full h-full" />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">สแกนเพื่อตาม</span>
                      <span className="text-lg font-semibold text-white">
                        {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
                      </span>
                    </div>
                  </div>
                ) : null} */}
              </div>
            </div>

            {warpSocialQr ? (
              <div
                className="flex items-center gap-4 px-5 py-4 rounded-[32px] border border-white/10 bg-white/10 text-left text-white shadow-[0_28px_90px_rgba(15,23,42,0.45)] warp-fade-up"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="flex overflow-hidden justify-center items-center w-20 h-20 bg-white rounded-2xl">
                  <img src={warpSocialQr} alt="Warp Spotlight QR" className="object-contain w-full h-full" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">สแกนเพื่อตาม</p>
                  <p className="mt-2 text-lg font-semibold">
                    {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">เปิดกล้องหรือ IG แล้วสแกน</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex w-full max-w-[420px] flex-col gap-6">
          <div
            className="rounded-[36px] border border-white/10 bg-white/10 p-6 shadow-[0_35px_110px_rgba(12,18,39,0.55)] warp-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-100">Warp Stats</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70">
                Live
              </span>
            </div>
            <div className="grid gap-4 mt-5 sm:grid-cols-2">
              <div
                className="flex flex-col gap-2 px-5 py-4 text-left text-emerald-100 bg-gradient-to-br rounded-3xl border border-emerald-400/30 from-emerald-400/20 to-emerald-500/10 warp-fade-up"
                style={{ animationDelay: '0.35s' }}
              >
                <span className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">เวลาที่เหลือ</span>
                <span className="text-3xl font-bold text-white">{countdownLabel}</span>
              </div>
              <div
                className="flex flex-col gap-2 px-5 py-4 text-left text-indigo-100 bg-gradient-to-br rounded-3xl border border-sky-400/25 from-sky-400/20 to-indigo-500/10 warp-fade-up"
                style={{ animationDelay: '0.45s' }}
              >
                <span className="text-[11px] uppercase tracking-[0.35em] text-indigo-200/80">เวลาที่ซื้อไว้</span>
                <span className="text-2xl font-semibold text-white">{totalDurationLabel}</span>
              </div>
            </div>
          </div>

          {warpSocialQr ? (
            <div
              className="items-center gap-4 px-5 py-4 rounded-[32px] border border-white/10 bg-white/10 text-left text-white shadow-[0_28px_90px_rgba(15,23,42,0.45)] warp-fade-up"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex overflow-hidden justify-center items-center p-5 w-full bg-current rounded-2xl">
                <img src={warpSocialQr} alt="Warp Spotlight QR" className="object-contain w-full h-full" />
              </div>
              <div className="flex-1 mt-2 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70 text-center">สแกนเพื่อตาม</p>
                <p className="text-lg font-semibold">
                  {sanitizeName(currentWarp.customerName || currentWarp.customerName)}
                </p>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">เปิดกล้องหรือ IG แล้วสแกน</p>
              </div>
            </div>
          ) : null}
          <div
            className="flex flex-1 flex-col justify-between rounded-[36px] border border-white/10 bg-slate-900/65 p-6 text-left text-slate-100 shadow-[0_28px_95px_rgba(8,16,32,0.6)] warp-fade-up"
            style={{ animationDelay: '0.6s' }}
          >
            <span className="text-xs uppercase tracking-[0.35em] text-white/60">ข้อความจากผู้สนับสนุน</span>
            <p className="mt-4 text-2xl font-semibold leading-relaxed text-white">
              {currentWarp.quote || 'เพิ่มข้อความจากผู้สนับสนุนเพื่อแสดงบนจอใหญ่'}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const promotionPanel = !showPromotions ? null : (
    <div
      className="relative mx-auto flex h-full w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
      style={{ minHeight: promotionMinHeight, height: '100%' }}
    >
      {showPromotions ? (
        promotionImageSrc ? (
          <img
            src={promotionImageSrc}
            alt={`โปรโมชั่น ${currentPromotionIndex + 1}`}
            className={`h-full w-full object-cover transition-all duration-700 ${isPromotionTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
          />
        ) : (
          <div className="flex flex-col gap-4 justify-center items-center px-6 h-full text-center bg-gradient-to-br from-purple-900/30 to-pink-900/30 text-slate-200">
            <div className="flex justify-center items-center w-16 h-16 text-2xl bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              🎉
            </div>
            <h4 className="text-lg font-semibold text-white lg:text-xl">เพิ่มภาพโปรโมชั่น</h4>
            <p className="text-sm text-slate-300 lg:text-base">อัปโหลดรูปเพื่อขึ้นหน้าจอ</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4 justify-center items-center px-6 py-10 h-full text-center text-slate-200">
          <div className="flex justify-center items-center w-16 h-16 text-2xl text-white rounded-full bg-white/10">
            📺
          </div>
          <h4 className="text-lg font-semibold text-white lg:text-xl">เปิดโปรโมชั่นเพื่อแสดง</h4>
          <p className="text-sm text-slate-300 lg:text-base">เปิดใช้งานในหลังบ้าน (Settings &gt;Warp Packages
            Promotions) เพื่อหมุนภาพบนจอ</p>
        </div>
      )}


      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent pointer-events-none from-slate-950/80 via-slate-950/5">
        <div className="flex gap-4 justify-between items-end px-6 pt-12 pb-6 sm:px-8 lg:px-10">
          <div>
            {displayTagline ? (
              <span className="mb-2 block text-xs uppercase tracking-[0.4em] text-indigo-200 sm:text-sm">
                {displayTagline}
              </span>
            ) : null}
            {/* <h1 className="font-display text-[clamp(48px,6vw,120px)] font-bold uppercase leading-none text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.55)]">
              {displayBrandName}
            </h1> */}
          </div>
          {currentWarp ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/70 px-4 py-3 text-white shadow-[0_20px_40px_rgba(15,23,42,0.4)] backdrop-blur">
              {warpImage ? (
                <img
                  src={warpImage}
                  alt={currentWarp.customerName}
                  className="object-cover w-12 h-12 rounded-xl border border-white/20"
                />
              ) : (
                <div className="flex justify-center items-center w-12 h-12 text-sm font-semibold rounded-xl border border-white/20 bg-white/10">
                  MW
                </div>
              )}
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-200">Warp</span>
                <p className="max-w-[220px] truncate text-base font-semibold sm:text-lg">
                  {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
                </p>
                <span className="font-mono text-sm text-emerald-200">{countdownLabel}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const logoPanel = !showPromotions ? null : (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/10 text-white shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        {verticalLogoSrc ? (
          <img src={verticalLogoSrc} alt={displayBrandName} className="object-cover w-full h-full" />
        ) : (
          <div className="flex flex-col gap-4 justify-center items-center w-full h-full text-center">
            <div className="text-3xl font-black uppercase tracking-[0.4em] text-white">{displayBrandName}</div>
          </div>
        )}
      </div>
    );

  const renderLeaderboard = (variant: 'full' | 'compact') => {
    const previewSupporters = supportersToDisplay.slice(0, 9);

    if (variant === 'compact') {
      return (
        <div className="flex w-full flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-4 text-slate-200 shadow-[0_15px_35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-300">Top Fans</span>
            <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] uppercase text-slate-200">
              {hasLiveData ? 'Live' : 'Standby'}
            </span>
          </div>
          <div className="space-y-3">
            {previewSupporters.map((supporter, index) => {
              const avatarUrl =
                resolveMediaSource(supporter.customerAvatar) ||
                `https://ui-avatars.com/api/?background=312e81&color=fff&name=${encodeURIComponent(
                  supporter.customerName
                )}`;
              const isPlaceholder = supporter.totalAmount <= 0;
              const amountLabel = isPlaceholder ? '—' : currencyFormatter.format(supporter.totalAmount);
              return (
                <div key={`${supporter.customerName}-${index}`} className="flex gap-3 items-center">
                  <div className="relative w-10 h-10">
                    <img
                      src={avatarUrl}
                      alt={supporter.customerName}
                      className="object-cover w-full h-full rounded-full border border-white/20"
                    />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {sanitizeName(supporter.customerName)}
                    </p>
                  </div>
                  <span
                    className={`flex items-center justify-center rounded-lg border px-2 py-1 text-[10px] font-semibold ${isPlaceholder
                      ? 'border-white/10 text-slate-300'
                      : 'text-rose-100 border-rose-400 bg-rose-500/20'
                      }`}
                  >
                    {amountLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col rounded-[32px] border border-white/10 bg-white/5 p-6 text-left shadow-[0_20px_45px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-7">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white lg:text-xl">Top Fans</h3>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-wide text-slate-200">
            {hasLiveData ? 'Live' : 'Standby'}
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {supportersToDisplay.map((supporter, index) => {
            const avatarUrl =
              resolveMediaSource(supporter.customerAvatar) ||
              `https://ui-avatars.com/api/?background=312e81&color=fff&name=${encodeURIComponent(
                supporter.customerName
              )}`;
            const isPlaceholder = supporter.totalAmount <= 0;
            const amountLabel = isPlaceholder ? '—' : currencyFormatter.format(supporter.totalAmount);

            return (
              <li key={supporter.customerName} className="flex gap-3 items-center">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={supporter.customerName}
                    className="object-cover w-12 h-12 rounded-full border border-white/15"
                  />
                  <span className="flex absolute -top-2 -left-2 justify-center items-center w-6 h-6 text-xs font-semibold text-white bg-indigo-500 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{sanitizeName(supporter.customerName)}</p>
                </div>
                <span
                  className={`flex items-center justify-center rounded-lg border px-3 py-1 text-xs font-semibold ${isPlaceholder
                    ? 'border-white/10 text-slate-300'
                    : 'text-rose-100 border-rose-400 bg-rose-500/20'
                    }`}
                >
                  {amountLabel}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderQrPanel = (variant: 'full' | 'compact') => {
    if (variant === 'compact') {
      return (
        <div className="flex w-full flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/30 px-5 py-4 text-slate-200 shadow-[0_15px_35px_rgba(15,23,42,0.35)] backdrop-blur">
          <span className="text-xs uppercase tracking-[0.4em] text-slate-300">Self Warp</span>
          <div className="overflow-hidden p-2 w-full h-80 rounded-2xl border border-white/15 bg-white/80">
            {selfWarpUrl ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(selfWarpUrl)}`}
                alt="สแกนเพื่อแจกวาร์ป"
                className="object-contain w-full h-full"
              />
            ) : null}
          </div>
          <span className="text-xs text-slate-200">สแกนเพื่อจองเวลา</span>
        </div>
      );
    }

    return (
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-center shadow-[0_20px_45px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-7">
        <div className="mx-auto flex h-[320px] w-full max-w-[260px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/90 p-3">
          {selfWarpUrl ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(selfWarpUrl)}`}
              alt="สแกนเพื่อแจกวาร์ป"
              className="object-contain w-full h-full"
            />
          ) : null}
        </div>
        <p className="mt-4 text-base font-semibold text-white">Self Warp</p>
        <p className="mt-1 text-sm text-slate-300">สแกนเพื่อจองเวลา</p>
      </div>
    );
  };

  return (
    <div className="flex overflow-hidden relative w-screen min-h-screen text-slate-100 font-th">
      <div className="absolute inset-0 -z-40" />
      {backgroundImage ? (
        <>
          <div
            key={backgroundImage}
            className={`absolute inset-0 bg-center bg-cover duration-700 -z-30`}
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {/* <div className="absolute inset-0 backdrop-blur -z-20" /> */}
        </>
      ) : null}
      <div
        className="absolute inset-0 opacity-70 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(120% 120% at 15% 20%, ${toRgba(gradientPrimary, 0.38)} 0%, transparent 70%), radial-gradient(120% 120% at 85% 80%, ${toRgba(gradientSecondary, 0.33)} 0%, transparent 72%)`,
        }}
      />
      <div
        className="absolute inset-0 mix-blend-screen pointer-events-none -z-5 opacity-55"
        style={{
          background: `radial-gradient(140% 140% at 50% 120%, ${toRgba(gradientSecondary, 0.24)} 0%, transparent 65%)`,
        }}
      />
      {warpOverlay}
      <main
        className={`flex relative z-10 justify-center items-stretch w-full ${mainPaddingClass} ${mainMinHeightClass}`}
      >
        {isPortrait ? (
          <div className="flex w-full max-w-[900px] flex-col gap-6">
            {promotionPanel}
            {renderLeaderboard('full')}
            {renderQrPanel('full')}
          </div>
        ) : isWidescreen ? (
          <div className="flex w-full max-w-[2100px] items-stretch gap-6 xl:gap-8">
            <aside className="hidden h-full w-[360px] flex-col lg:flex xl:w-[420px]">
              {logoPanel}
            </aside>
            <div className="flex flex-1 h-full">
              {promotionPanel}
            </div>
            <aside className="flex h-full w-full max-w-[420px] flex-col justify-between gap-4 xl:gap-6">
              {renderLeaderboard('compact')}
              {renderQrPanel('compact')}
            </aside>
          </div>
        ) : (
          <div className="flex w-full max-w-[1700px] items-stretch gap-5 xl:gap-6">
            <aside className="hidden h-full w-[300px] flex-col md:flex lg:w-[340px]">
              {logoPanel}
            </aside>
            <div className="flex flex-1 h-full">
              {promotionPanel}
            </div>
            <aside className="flex h-full w-full max-w-[360px] flex-col justify-between gap-4 xl:gap-5">
              {renderLeaderboard('compact')}
              {renderQrPanel('compact')}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default TvLandingPage;
