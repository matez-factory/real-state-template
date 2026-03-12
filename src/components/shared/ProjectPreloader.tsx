import { useEffect, useLayoutEffect, useState } from 'react';

interface Props {
  urls: string[];
  projectName: string;
  projectSlug: string;
  children: React.ReactNode;
}

const CONCURRENCY = 6;
const ASSET_TIMEOUT = 8_000;

function loadAsset(url: string): Promise<void> {
  return Promise.race([
    fetch(url).then(() => {}).catch(() => {}),
    new Promise<void>((r) => setTimeout(r, ASSET_TIMEOUT)),
  ]);
}

export function ProjectPreloader({
  urls,
  projectName,
  projectSlug,
  children,
}: Props) {
  const [phase, setPhase] = useState<'loading' | 'fadeout' | 'done'>('loading');
  const [progress, setProgress] = useState(0);

  // Skip overlay instantly if already cached
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem('preloaded:' + projectSlug)) {
        setPhase('done');
      }
    } catch { /* incognito */ }
  }, [projectSlug]);

  // Load assets when in 'loading' phase
  useEffect(() => {
    if (phase !== 'loading') return;

    if (urls.length === 0) {
      try { sessionStorage.setItem('preloaded:' + projectSlug, '1'); } catch {}
      setPhase('done');
      return;
    }

    let cancelled = false;
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
          try { sessionStorage.setItem('preloaded:' + projectSlug, '1'); } catch {}
          setPhase('fadeout');
          setTimeout(() => setPhase('done'), 400);
        } else {
          next();
        }
      });
    }

    const batch = Math.min(CONCURRENCY, total);
    for (let i = 0; i < batch; i++) next();

    return () => { cancelled = true; };
  }, [phase, urls, projectSlug]);

  return (
    <>
      {children}

      {phase !== 'done' && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-400 ${
            phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <h1 className="mb-4 text-2xl font-bold tracking-wider text-white uppercase">
            {projectName}
          </h1>
          <p className="mb-1 text-sm text-white/60">Cargando la experiencia 3D...</p>
          <p className="mb-6 text-xs text-white/40">Esto puede tardar unos segundos.</p>
          <div className="w-64 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50 tabular-nums">{progress}%</p>
        </div>
      )}
    </>
  );
}
