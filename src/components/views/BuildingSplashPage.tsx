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

  const logoUrl = useMemo(
    () => media.find((m) => m.purpose === 'logo')?.url,
    [media]
  );

  const backgroundUrl = useMemo(
    () => media.find((m) => m.purpose === 'background' && m.type === 'image')?.url,
    [media]
  );

  // If project has 360 tour and there's a tour layer, go there first (it has the hotspot/spin media)
  // Otherwise pick the first non-tour child with content
  const firstChildSlug = useMemo(() => {
    if (project.has360Tour) {
      const tourLayer = children.find((c) => c.type === 'tour');
      if (tourLayer) return tourLayer.slug;
    }
    const nonTour = children.filter((c) => c.type !== 'tour');
    const withMedia = nonTour.find((c) => c.svgOverlayUrl || c.backgroundImageUrl);
    if (withMedia) return withMedia.slug;
    return nonTour[0]?.slug;
  }, [children, project.has360Tour]);

  const introVideoUrl = useMemo(() => {
    if (!project.hasVideoIntro) return null;
    // First check project-level media
    const projectIntro = media.find((m) => m.type === 'video' && m.purpose === 'intro');
    if (projectIntro?.url) return projectIntro.url;
    // Fallback: check tour child's media (legacy: purpose 'transition' with metadata from_viewpoint 'intro')
    const tourChild = children.find((c) => c.type === 'tour') ?? children[0];
    if (!tourChild) return null;
    const tourMedia = childrenMedia[tourChild.id] ?? [];
    const legacy = tourMedia.find((m) => {
      if (m.type !== 'video' || m.purpose !== 'transition') return false;
      const meta = m.metadata as Record<string, unknown>;
      return meta?.from_viewpoint === 'intro';
    });
    return legacy?.url ?? null;
  }, [project.hasVideoIntro, media, children, childrenMedia]);

  const handleEnter = useCallback(() => {
    if (introVideoUrl && firstChildSlug && onPlayIntro) {
      onPlayIntro(introVideoUrl, `/${firstChildSlug}`);
    } else if (firstChildSlug) {
      navigate(`/${firstChildSlug}`);
    }
  }, [introVideoUrl, firstChildSlug, navigate, onPlayIntro]);

  const hasAccent = !!project.accentColor;

  // Location string from project data
  const location = [project.city, project.state].filter(Boolean).join(', ');

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Background image */}
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Content — Portrait: centered at ~40% top. Landscape: left-aligned, bottom 23.3% */}
      <div className="
        absolute z-10 flex flex-col
        portrait:items-center portrait:left-0 portrait:right-0 portrait:top-[38%]
        landscape:left-[clamp(24px,4vw,71px)] landscape:bottom-[23.3%] landscape:items-start
      ">
        {/* Logo — Desktop: 84×89, Mobile: 70×74, small landscape: 60×64 */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt={project.name}
            className="object-contain mb-[8px] portrait:w-[70px] portrait:h-[74px] landscape:w-[clamp(60px,6vw,84px)] landscape:h-auto"
          />
        )}

        {/* Project name — Figma: Poppins 400 48px, line-height 72px, capitalize, #FFFFFF */}
        <h1 className="font-normal text-white leading-[1.5] tracking-[0px] capitalize portrait:text-[36px] landscape:text-[clamp(28px,4vw,48px)]">
          {project.name}
        </h1>

        {/* Location — Figma: Poppins 300 24px, line-height 36px, capitalize, #D5D5D5 */}
        {location && (
          <p className="mt-[15px] font-light text-[#D5D5D5] leading-[1.5] tracking-[0px] capitalize portrait:text-[24px] landscape:text-[clamp(16px,2vw,24px)]">
            {location}
          </p>
        )}

        {/* Enter button — Figma: 340×52, rounded-69, Poppins 500 20px #1A1A1A */}
        <button
          onClick={handleEnter}
          style={hasAccent ? { backgroundColor: project.accentColor, color: '#FFFFFF' } : undefined}
          className={`mt-[18px] h-[52px] rounded-[69px] text-[20px] font-medium leading-[30px] capitalize transition-opacity duration-200 hover:opacity-90 outline-none portrait:w-[217px] landscape:w-[clamp(200px,25vw,340px)] flex items-center justify-center bg-white ${
            hasAccent ? '' : 'text-[#1A1A1A]'
          }`}
        >
          <span>Ingresar</span>
          {/* Figma: ellipse 29.75×28.49 container + arrow 17.5×16.75, stroke 1.5px #1A1A1A */}
          <span className="relative ml-[8px] w-[30px] h-[29px] flex items-center justify-center">
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8.5H14M14 8.5L9 3.5M14 8.5L9 13.5" />
            </svg>
          </span>
        </button>
      </div>

      {/* Social icons — bottom right, desktop only (hidden in portrait) */}
      {(project.whatsapp || project.instagram || project.facebook || project.youtube || project.website) && (
        <div className="absolute bottom-[31px] right-[35px] z-10 items-center gap-[18px] portrait:hidden landscape:flex">
          {project.whatsapp && (
            <SocialIcon href={`https://wa.me/${project.whatsapp.replace(/[^0-9+]/g, '')}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </SocialIcon>
          )}
          {project.instagram && (
            <SocialIcon href={project.instagram}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </SocialIcon>
          )}
          {project.youtube && (
            <SocialIcon href={project.youtube}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </SocialIcon>
          )}
          {project.website && (
            <SocialIcon href={project.website.startsWith('http') ? project.website : `https://${project.website}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </SocialIcon>
          )}
        </div>
      )}
    </div>
  );
}

function SocialIcon({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-[43px] h-[44px] rounded-[100px] flex items-center justify-center text-white/80 hover:text-white transition-colors [&_svg]:w-[24px] [&_svg]:h-[24px]"
      style={{
        background: 'rgba(128, 128, 128, 0.23)',
        backgroundBlendMode: 'luminosity',
        backdropFilter: 'blur(50px)',
        WebkitBackdropFilter: 'blur(50px)',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </a>
  );
}
