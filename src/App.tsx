import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import type { RawProjectData } from '@/lib/useProjectData';
import { fetchProject, fetchLayers, fetchMedia, fetchUnitTypes } from '@/lib/api';
import {
  buildExplorerPageData,
  buildSiblingExplorerBundle,
} from '@/lib/data/transform';
import { collectPreloadUrls } from '@/lib/collectPreloadUrls';

import { AdminLogin } from '@/pages/AdminLogin';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { BuildingSplashPage } from '@/components/views/BuildingSplashPage';
import { LotsSplashPage } from '@/components/views/LotsSplashPage';
import { ProjectHomePage } from '@/components/views/ProjectHomePage';
import { LotsHomePage } from '@/components/views/LotsHomePage';
import { LotsExplorerView } from '@/components/views/LotsExplorerView';
import { ExplorerView } from '@/components/views/ExplorerView';
import { UnitPage } from '@/components/views/UnitPage';

const PROJECT_SLUG = import.meta.env.VITE_PROJECT_SLUG || '';
const CONCURRENCY = 6;
const ASSET_TIMEOUT = 8_000;

function loadAsset(url: string): Promise<void> {
  return Promise.race([
    fetch(url).then(() => {}).catch(() => {}),
    new Promise<void>((r) => setTimeout(r, ASSET_TIMEOUT)),
  ]);
}

// ─── Splash route (/) ───────────────────────────────────────

interface SplashRouteProps {
  raw: RawProjectData;
  onPlayIntro?: (videoUrl: string, targetPath: string) => void;
}

function SplashRoute({ raw, onPlayIntro }: SplashRouteProps) {
  const data = useMemo(
    () => buildExplorerPageData(raw.rawProject, raw.rawLayers, raw.rawMedia, [], raw.rawUnitTypes),
    [raw]
  );

  if (data.project.type === 'lots') {
    return <LotsSplashPage data={data} />;
  }
  return <BuildingSplashPage data={data} onPlayIntro={onPlayIntro} />;
}

// ─── Layer route (/*) ───────────────────────────────────────

function LayerRoute({ raw }: { raw: RawProjectData }) {
  const { '*': splat } = useParams();
  const layerSlugs = useMemo(() => (splat || '').split('/').filter(Boolean), [splat]);

  const result = useMemo(() => {
    try {
      const bundle = buildSiblingExplorerBundle(
        raw.rawProject, raw.rawLayers, raw.rawMedia, layerSlugs, raw.rawUnitTypes
      );
      return { bundle, error: null };
    } catch {
      return { bundle: null, error: 'Layer not found' };
    }
  }, [raw, layerSlugs]);

  if (result.error || !result.bundle) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white/60 text-sm">
        No se encontró la capa solicitada
      </div>
    );
  }

  const { bundle } = result;
  const { current } = bundle;

  const hasSpinMedia = current.media.some((m) => m.purpose === 'hotspot');

  if (current.project.type === 'lots' && hasSpinMedia) {
    return <LotsHomePage data={current} />;
  }

  if (current.project.type === 'building' && hasSpinMedia) {
    return <ProjectHomePage data={current} />;
  }

  if (current.children.length === 0 && current.currentLayer && current.project.type === 'lots') {
    const parentSlugs = layerSlugs.slice(0, -1);
    try {
      const zoneBundle = buildSiblingExplorerBundle(
        raw.rawProject, raw.rawLayers, raw.rawMedia, parentSlugs, raw.rawUnitTypes
      );
      return (
        <LotsExplorerView
          data={zoneBundle.current}
          siblingBundle={zoneBundle}
          preSelectedLotSlug={layerSlugs[layerSlugs.length - 1]}
        />
      );
    } catch {
      // fallback
    }
  }

  if (current.project.type === 'lots' && current.children.length > 0) {
    return <LotsExplorerView data={current} siblingBundle={bundle} />;
  }

  if (current.project.type === 'building' && !current.isLeafLevel && current.children.length > 0) {
    return <Navigate to={`/${layerSlugs.join('/')}/${current.children[0].slug}`} replace />;
  }

  if (current.children.length === 0 && current.currentLayer) {
    // Building floors/zones/towers without children → show ExplorerView with sibling navigation
    // so the user can switch to floors that have content (only actual units get UnitPage)
    const layerType = current.currentLayer.type;
    if (current.project.type === 'building' && (layerType === 'floor' || layerType === 'zone' || layerType === 'tower')) {
      return <ExplorerView data={current} siblingBundle={bundle} />;
    }

    let floorBackgroundUrl: string | undefined;
    if (layerSlugs.length > 1) {
      try {
        const parentBundle = buildSiblingExplorerBundle(
          raw.rawProject, raw.rawLayers, raw.rawMedia, layerSlugs.slice(0, -1), raw.rawUnitTypes
        );
        floorBackgroundUrl = parentBundle.current.media.find(
          (m) => m.purpose === 'background' && m.type === 'image'
        )?.url;
      } catch { /* no parent bg */ }
    }
    return <UnitPage data={current} floorBackgroundUrl={floorBackgroundUrl} />;
  }

  return <ExplorerView data={current} siblingBundle={bundle} />;
}

// ─── App ────────────────────────────────────────────────────

export default function App() {
  const navigate = useNavigate();
  const [data, setData] = useState<RawProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'fadeout' | 'done'>('loading');
  const [progress, setProgress] = useState(0);
  const [projectName, setProjectName] = useState(PROJECT_SLUG.toUpperCase());
  const [splashBgReady, setSplashBgReady] = useState<string | null>(null);

  // Intro video overlay state — lives at App level so it persists across route changes
  const [introVideo, setIntroVideo] = useState<{ url: string; targetPath: string } | null>(null);
  const [introFading, setIntroFading] = useState(false);
  const introTargetRef = useRef<string>('');

  const handlePlayIntro = useCallback((videoUrl: string, targetPath: string) => {
    introTargetRef.current = targetPath;
    setIntroVideo({ url: videoUrl, targetPath });
  }, []);

  const handleIntroPlaying = useCallback(() => {
    // Video started playing — navigate underneath so the new page mounts behind the video
    if (introTargetRef.current) {
      navigate(introTargetRef.current);
    }
  }, [navigate]);

  const handleIntroEnded = useCallback(() => {
    // Video ended — fade it out to reveal the page underneath
    setIntroFading(true);
    setTimeout(() => {
      setIntroVideo(null);
      setIntroFading(false);
    }, 500);
  }, []);

  // Skip preloader if already cached in this session
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem('preloaded:' + PROJECT_SLUG)) {
        setPhase('done');
      }
    } catch { /* incognito */ }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        // Phase 1: Fetch data from API
        const rawProject = await fetchProject();
        if (cancelled) return;
        setProjectName(rawProject.name);

        const [rawLayers, rawMedia, rawUnitTypes] = await Promise.all([
          fetchLayers(rawProject.id),
          fetchMedia(rawProject.id),
          fetchUnitTypes(rawProject.id),
        ]);
        if (cancelled) return;

        const projectData: RawProjectData = { rawProject, rawLayers, rawMedia, rawUnitTypes };
        setData(projectData);

        // Apply accent color as CSS variable
        if (rawProject.accent_color) {
          document.documentElement.style.setProperty('--accent-color', rawProject.accent_color);
        }

        // Phase 2: Preload assets (only if not already cached)
        const alreadyCached = (() => {
          try { return !!sessionStorage.getItem('preloaded:' + PROJECT_SLUG); } catch { return false; }
        })();

        if (alreadyCached) {
          setPhase('done');
          return;
        }

        // Prioritize splash background — load it first and show it behind preloader
        const splashBgUrl = rawMedia.find(
          (m) => !m.layer_id && !m.unit_type_id && m.purpose === 'background' && m.type === 'image'
        )?.url;
        if (splashBgUrl) {
          // Load via Image so browser actually decodes and caches the pixels
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = splashBgUrl;
            setTimeout(resolve, ASSET_TIMEOUT);
          });
          if (cancelled) return;
          setSplashBgReady(splashBgUrl);
        }

        const urls = collectPreloadUrls(rawLayers, rawMedia);
        if (urls.length === 0) {
          try { sessionStorage.setItem('preloaded:' + PROJECT_SLUG, '1'); } catch {}
          setPhase('fadeout');
          setTimeout(() => { if (!cancelled) setPhase('done'); }, 400);
          return;
        }

        // Preload with concurrency pool
        let completed = 0;
        let idx = 0;
        const total = urls.length;

        function next() {
          if (cancelled || idx >= total) return;
          const url = urls[idx++];
          loadAsset(url).finally(() => {
            if (cancelled) return;
            completed++;
            setProgress(Math.ceil((completed / total) * 100));
            if (completed >= total) {
              try { sessionStorage.setItem('preloaded:' + PROJECT_SLUG, '1'); } catch {}
              setPhase('fadeout');
              setTimeout(() => { if (!cancelled) setPhase('done'); }, 400);
            } else {
              next();
            }
          });
        }

        const batch = Math.min(CONCURRENCY, total);
        for (let i = 0; i < batch; i++) next();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error loading project');
          setPhase('done');
        }
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Error state
  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white/60 text-sm">
        {error}
      </div>
    );
  }

  // Root-level background image
  const bgUrl = data?.rawMedia.find(
    (m) => !m.layer_id && !m.unit_type_id && m.purpose === 'background' && m.type === 'image'
  )?.url;

  return (
    <>
      {bgUrl && (
        <img
          src={bgUrl}
          alt=""
          aria-hidden
          className="fixed inset-0 w-full h-full object-cover blur-sm brightness-50 -z-10 pointer-events-none"
        />
      )}

      {/* Routes */}
      <Routes>
        {/* Admin — no project data needed */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Public — only render once data is loaded */}
        {data && (
          <>
            <Route path="/" element={<SplashRoute raw={data} onPlayIntro={handlePlayIntro} />} />
            <Route path="/*" element={<LayerRoute raw={data} />} />
          </>
        )}
      </Routes>

      {/* Intro video overlay — persists across route changes for seamless transition */}
      {introVideo && (
        <video
          src={introVideo.url}
          autoPlay
          muted
          playsInline
          onPlaying={handleIntroPlaying}
          onEnded={handleIntroEnded}
          className={`fixed inset-0 z-[90] w-full h-full object-cover transition-opacity duration-500 ${
            introFading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Preloader overlay — covers everything until assets are cached */}
      {phase !== 'done' && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-400 ${
            phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Splash background visible behind preloader text */}
          {splashBgReady ? (
            <img
              src={splashBgReady}
              alt=""
              className="absolute inset-0 w-full h-full object-cover brightness-[0.3]"
            />
          ) : (
            <div className="absolute inset-0 bg-black" />
          )}
          <h1 className="relative z-10 mb-4 text-2xl font-bold tracking-wider text-white uppercase">
            {projectName}
          </h1>
          <p className="relative z-10 mb-1 text-sm text-white/60">Cargando la experiencia 3D...</p>
          <p className="relative z-10 mb-6 text-xs text-white/40">Esto puede tardar unos segundos.</p>
          <div className="relative z-10 w-64 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="relative z-10 mt-2 text-xs text-white/50 tabular-nums">{progress}%</p>
        </div>
      )}
    </>
  );
}
