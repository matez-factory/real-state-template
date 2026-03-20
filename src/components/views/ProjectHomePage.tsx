import { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { Spin360Viewer, type Spin360ViewerRef } from '@/components/video/Spin360Viewer';
import { MobileHint } from '@/components/shared/MobileHint';
import { TopNav } from '@/components/navigation/TopNav';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';

interface ProjectHomePageProps {
  data: ExplorerPageData;
}

type ActiveView = 'tour' | 'location';

/* Glass style — Figma: rgba(128,128,128,0.23), luminosity, blur 50, shadow, NO border */
const glassStyle: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
};

export function ProjectHomePage({ data }: ProjectHomePageProps) {
  const navigate = useNavigate();
  const { project, media, children } = data;

  const spinRef = useRef<Spin360ViewerRef>(null);
  const [activeView, setActiveView] = useState<ActiveView>('tour');
  const [contactOpen, setContactOpen] = useState(false);
  const [currentViewpoint, setCurrentViewpoint] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewpointCount, setViewpointCount] = useState(0);
  const [viewpointIndex, setViewpointIndex] = useState(0);

  const handleTransitionChange = useCallback((transitioning: boolean) => {
    setIsTransitioning(transitioning);
  }, []);

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const spinSvgs = useMemo(() => {
    const svgMedia = media.filter((m) => m.type === 'svg' && m.purpose === 'hotspot');
    const result: Record<string, string> = {};
    for (const m of svgMedia) {
      const viewpoint = (m.metadata as Record<string, unknown>)?.viewpoint as string | undefined;
      if (viewpoint && m.url) {
        result[viewpoint] = m.url;
      }
    }
    return result;
  }, [media]);

  // Track viewpoint count for progress bar
  const viewpointOrder = useMemo(() => {
    return media
      .filter((m) => m.type === 'svg' && m.purpose === 'hotspot')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => (m.metadata as Record<string, unknown>)?.viewpoint as string)
      .filter(Boolean);
  }, [media]);

  const handleViewpointChange = useCallback((id: string) => {
    setCurrentViewpoint(id);
    const idx = viewpointOrder.indexOf(id);
    if (idx >= 0) setViewpointIndex(idx);
    setViewpointCount(viewpointOrder.length);
  }, [viewpointOrder]);

  const mapTarget = useMemo(() => {
    if (children.length > 0) {
      return `/${data.currentPath.join('/')}/${children[0].slug}`;
    }
    const currentId = data.currentLayer?.id;
    const zoneSibling = data.siblings.find((s) => s.id !== currentId);
    if (zoneSibling) {
      return `/${zoneSibling.slug}`;
    }
    return null;
  }, [data.currentPath, children, data.currentLayer, data.siblings]);

  const homeUrl = getHomeUrl(data);
  const backUrl = getBackUrl(data);

  const isHomeLayer = data.currentLayer?.id === data.rootLayers[0]?.id;

  const handleNavigate = (section: 'home' | 'map' | 'location' | 'contact') => {
    if (section === 'home') {
      if (isHomeLayer) {
        setActiveView('tour');
      } else {
        navigate(homeUrl);
      }
    } else if (section === 'map') {
      spinRef.current?.enterBuilding();
    } else if (section === 'location') {
      setActiveView('location');
    }
  };

  const activeSection = activeView === 'location' ? 'location' as const : 'home' as const;

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        {activeView === 'tour' && (
          <Spin360Viewer
            ref={spinRef}
            media={media}
            spinSvgs={spinSvgs}
            hideControls
            enablePanorama
            hideSvgOverlay={false}
            hotspotTowerId="_none"
            hotspotMarkerId="_none"
            projectName={project.name}
            projectLogoUrl={logos[0]?.url ?? undefined}
            accentColor={project.accentColor ?? undefined}
            onViewpointChange={handleViewpointChange}
            onTransitionChange={handleTransitionChange}
            onEnterBuilding={() => {
              if (mapTarget) navigate(mapTarget);
            }}
            renderNavigation={({ onPrev, onNext, isTransitioning: trans }) => {
              if (trans) return null;
              return (
                /* Bottom-center arrows + progress bar
                   Desktop: 44×44 buttons, stroke 4px, gap 21, progress 41/28×3
                   Mobile:  36×36 buttons, stroke 2px, gap 30, progress 40/27×3 */
                <div className="absolute bottom-[45px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-[18px] portrait:bottom-[110px]">
                  <div className="flex items-center gap-[21px] portrait:gap-[30px]">
                    <button
                      onClick={onPrev}
                      className="w-[44px] h-[44px] portrait:w-[36px] portrait:h-[36px] rounded-[100px] flex items-center justify-center text-white hover:text-white transition-colors outline-none"
                      style={glassStyle}
                      aria-label="Anterior"
                    >
                      <svg className="w-[27px] h-[27px] portrait:w-[24px] portrait:h-[24px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" className="[stroke-width:4] portrait:[stroke-width:2]" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }} />
                      </svg>
                    </button>
                    <button
                      onClick={onNext}
                      className="w-[44px] h-[44px] portrait:w-[36px] portrait:h-[36px] rounded-[100px] flex items-center justify-center text-white hover:text-white transition-colors outline-none"
                      style={glassStyle}
                      aria-label="Siguiente"
                    >
                      <svg className="w-[27px] h-[27px] portrait:w-[24px] portrait:h-[24px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" className="[stroke-width:4] portrait:[stroke-width:2]" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }} />
                      </svg>
                    </button>
                  </div>
                  {viewpointCount > 1 && (
                    <div className="flex items-center gap-[4px]">
                      {Array.from({ length: viewpointCount }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-[3px] rounded-full transition-all duration-300 ${
                            i === viewpointIndex
                              ? 'w-[41px] portrait:w-[40px] bg-[#f2f2f2]'
                              : 'w-[28px] portrait:w-[27px] bg-[rgba(234,234,234,0.45)]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      {activeView === 'tour' && (
        <MobileHint
          isTourActive
          isTransitioning={false}
          currentSceneId={currentViewpoint}
          pillMessage="Tocá el edificio para explorar"
        />
      )}

      {!isTransitioning && (
        <>
          <TopNav
            activeSection={activeSection}
            onNavigate={handleNavigate}
            onContactOpen={() => setContactOpen(true)}
            mapLabel="Plantas"
            showBack
            onBack={activeView === 'location'
              ? () => setActiveView('tour')
              : () => navigate(backUrl)
            }
          />

          {/* Social icons — bottom right */}
          {activeView === 'tour' && (project.whatsapp || project.website) && (
            <div className="absolute bottom-[31px] right-[35px] z-30 flex items-center gap-[18px]">
              {project.whatsapp && (
                <a
                  href={`https://wa.me/${project.whatsapp.replace(/[^0-9+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[43px] h-[44px] rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  style={glassStyle}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              )}
              {project.website && (
                <a
                  href={project.website.startsWith('http') ? project.website : `https://${project.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[43px] h-[44px] rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  style={glassStyle}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile portrait: always-visible "Ingresar" card — portal to body to escape all transforms */}
      {activeView === 'tour' && !isTransitioning && mapTarget && createPortal(
        <div
          className="fixed z-[9999] flex flex-col items-center pointer-events-auto landscape:hidden"
          style={{ left: '50%', top: '45%', transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(128, 128, 128, 0.23)',
              backgroundBlendMode: 'luminosity',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="w-[20px] h-[20px] rounded-full bg-white" />
          </div>
          <div
            className="mt-[6px] w-[168px] rounded-[10px] p-[6px]"
            style={{
              background: 'rgba(214, 214, 214, 0.45)',
              backgroundBlendMode: 'luminosity',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="w-full rounded-[8px] bg-white/90 flex flex-col items-center pt-[14px] pb-[10px] px-[10px]">
              {logos[0]?.url && (
                <img src={logos[0].url} alt="" className="w-[25px] h-[26px] object-contain mb-[6px]" />
              )}
              <span className="text-[12px] font-normal text-[#5A5A5A] tracking-[0.08em] mb-[10px]" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                {project.name.toUpperCase()}
              </span>
              <button
                onClick={() => { spinRef.current?.enterBuilding(); }}
                style={project.accentColor ? { backgroundColor: project.accentColor } : undefined}
                className={`w-[103px] h-[32px] rounded-[69px] text-[14px] font-medium flex items-center justify-center gap-1.5 transition-opacity outline-none ${
                  project.accentColor ? 'text-white' : 'bg-[#1A1A1A] text-white'
                }`}
              >
                Ingresar →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
