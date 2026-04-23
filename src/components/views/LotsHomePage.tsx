import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData } from '@/types/hierarchy.types';
import { Spin360Viewer, type Spin360ViewerRef } from '@/components/video/Spin360Viewer';
import { MobileHint } from '@/components/shared/MobileHint';
import { TopNav } from '@/components/navigation/TopNav';
import { ContactModal } from '@/components/navigation/ContactModal';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { LocationView } from '@/components/navigation/LocationView';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { GlassArrows } from '@/components/shared/GlassArrows';

interface LotsHomePageProps {
  data: ExplorerPageData;
  hasSpinMedia?: boolean;
}

type ActiveView = 'tour' | 'location';

export function LotsHomePage({ data, hasSpinMedia = true }: LotsHomePageProps) {
  const navigate = useNavigate();
  const { project, media, children, siblings } = data;

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

  const splashBgUrl = useMemo(
    () => media.find((m) => m.purpose === 'background' && m.type === 'image')?.url,
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

  const spinSvgsMobile = useMemo(() => {
    const svgMedia = media.filter((m) => m.type === 'svg' && m.purpose === 'hotspot_mobile');
    const result: Record<string, string> = {};
    for (const m of svgMedia) {
      const viewpoint = (m.metadata as Record<string, unknown>)?.viewpoint as string | undefined;
      if (viewpoint && m.url) {
        result[viewpoint] = m.url;
      }
    }
    return result;
  }, [media]);

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
    const nextSibling = siblings.find((s) => s.id !== currentId);
    if (nextSibling) {
      return `/${nextSibling.slug}`;
    }
    return null;
  }, [data.currentPath, children, data.currentLayer, siblings]);

  const backUrl = '/';

  const handleNavigate = (section: string) => {
    if (section === 'home') {
      setActiveView('tour');
    } else if (section === 'map') {
      if (mapTarget) {
        navigate(mapTarget);
      } else {
        spinRef.current?.enterBuilding();
      }
    } else if (section === 'location') {
      setActiveView('location');
    }
  };

  const activeSection = activeView === 'location' ? 'location' as const : 'home' as const;

  return (
    <div className="relative h-dvh overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        {activeView === 'tour' && hasSpinMedia && (
          <Spin360Viewer
            ref={spinRef}
            media={media}
            spinSvgs={spinSvgs}
            spinSvgsMobile={spinSvgsMobile}
            hideControls
            enablePanorama
            hideSvgOverlay={false}
            hotspotTowerId={project.hotspotTowerId}
            hotspotMarkerId={project.hotspotMarkerId}
            onViewpointChange={handleViewpointChange}
            onTransitionChange={handleTransitionChange}
            onEnterBuilding={() => {
              if (mapTarget) navigate(mapTarget);
            }}
            renderNavigation={({ onPrev, onNext, isTransitioning: trans }) => {
              if (trans) return null;
              return (
                <GlassArrows
                  onPrev={onPrev}
                  onNext={onNext}
                  count={viewpointCount}
                  activeIndex={viewpointIndex}
                  className="absolute bottom-[clamp(16px,3vh,28px)] left-1/2 -translate-x-1/2 z-30 portrait:bottom-[110px]"
                  small
                />
              );
            }}
          />
        )}
        {activeView === 'tour' && !hasSpinMedia && (
          splashBgUrl ? (
            <img
              src={splashBgUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <p className="text-white/90 text-lg font-medium">Contenido no disponible</p>
                <p className="text-white/60 text-sm mt-2">Cargá el recorrido 360° o la imagen de fondo Inicio desde el panel de administración.</p>
              </div>
            </div>
          )
        )}
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      {activeView === 'tour' && currentViewpoint === viewpointOrder[0] && (
        <MobileHint
          isTourActive
          isTransitioning={false}
          currentSceneId={currentViewpoint}
          pillMessage="Deslizá para ver la imagen completa"
        />
      )}

      <div className={isTransitioning ? 'pointer-events-none' : ''}>
        <TopNav
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onContactOpen={() => setContactOpen(true)}
          mapLabel="Lotes"
          showBack
          onBack={activeView === 'location'
            ? () => setActiveView('tour')
            : () => navigate(backUrl)
          }
          hideMobileNav={false}
          compact
        />
      </div>

      {!isTransitioning && (
        <>
          {activeView === 'tour' && <SocialButtons project={project} />}
        </>
      )}

      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      <Disclaimer project={project} mobileBottomClass="bottom-[170px]" />
    </div>
  );
}
