import { useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { ExplorerPageData } from '@/types/hierarchy.types';

interface BuildingSplashPageProps {
  data: ExplorerPageData;
  onPlayIntro?: (videoUrl: string, targetPath: string) => void;
}

export function BuildingSplashPage({ data, onPlayIntro }: BuildingSplashPageProps) {
  const navigate = useNavigate();
  const { project, media, children, childrenMedia } = data;

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const backgroundUrl = useMemo(
    () => media.find((m) => m.purpose === 'background' && m.type === 'image')?.url,
    [media]
  );

  const firstChildSlug = children[0]?.slug;

  const introVideoUrl = useMemo(() => {
    if (!project.hasVideoIntro) return null;
    const tourChild = children.find((c) => c.type === 'tour') ?? children[0];
    if (!tourChild) return null;
    const tourMedia = childrenMedia[tourChild.id] ?? [];
    const intro = tourMedia.find((m) => {
      if (m.type !== 'video' || m.purpose !== 'transition') return false;
      const meta = m.metadata as Record<string, unknown>;
      return meta?.from_viewpoint === 'intro';
    });
    return intro?.url ?? null;
  }, [project.hasVideoIntro, children, childrenMedia]);

  const handleEnter = useCallback(() => {
    if (introVideoUrl && firstChildSlug && onPlayIntro) {
      // Delegate video to App level — it persists across route changes
      onPlayIntro(introVideoUrl, `/${firstChildSlug}`);
    } else if (firstChildSlug) {
      navigate(`/${firstChildSlug}`);
    }
  }, [introVideoUrl, firstChildSlug, navigate, onPlayIntro]);

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 w-[90%] max-w-[230px] xl:max-w-[320px] text-center text-white">
          <div className="glass-panel rounded-xl px-4 py-4 xl:px-6 xl:py-6 flex flex-col items-center">
            <h1 className="text-lg xl:text-[26px] font-medium tracking-wide mb-2 xl:mb-4 text-white">
              {project.name}
            </h1>

            {logos.length > 0 && (
              <div className="flex items-center justify-center gap-4 xl:gap-6 mb-3 xl:mb-5">
                {logos.map((logo) => (
                  <img
                    key={logo.id}
                    src={logo.url!}
                    alt={logo.altText || ''}
                    className="h-8 xl:h-12 w-auto"
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleEnter}
              className="w-fit px-6 py-1.5 xl:px-8 xl:py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm xl:text-base rounded-full transition-colors duration-200 outline-none"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
