import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData, SiblingExplorerBundle } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { InteractiveSVG } from '@/components/svg/InteractiveSVG';
import { TopNav } from '@/components/navigation/TopNav';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { ContactModal } from '@/components/navigation/ContactModal';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { LocationView } from '@/components/navigation/LocationView';
import { LotFichaOverlay } from '@/components/lots/LotFichaOverlay';
import { preloadImage } from '@/lib/preload';

interface LotsExplorerViewProps {
  data: ExplorerPageData;
  siblingBundle?: SiblingExplorerBundle;
  preSelectedLotSlug?: string;
}

type ActiveView = 'map' | 'location';

export function LotsExplorerView({
  data,
  preSelectedLotSlug,
}: LotsExplorerViewProps) {
  const navigate = useNavigate();
  const { project, children, media, childrenMedia } = data;

  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [contactOpen, setContactOpen] = useState(false);
  const mapScrollRef = useRef<HTMLDivElement>(null);
  const [mapScale, setMapScale] = useState(1);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);

  const preSelectedLot = useMemo(
    () =>
      preSelectedLotSlug
        ? children.find((c) => c.slug === preSelectedLotSlug) ?? null
        : null,
    [children, preSelectedLotSlug]
  );

  const [selectedLotId, setSelectedLotId] = useState<string | null>(
    preSelectedLot?.id ?? null
  );
  const [fichaClosing, setFichaClosing] = useState(false);

  const selectedLot = useMemo(
    () => children.find((c) => c.id === selectedLotId) ?? null,
    [children, selectedLotId]
  );

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const svgUrl = data.currentLayer?.svgOverlayUrl ?? project.svgOverlayUrl;
  const svgMobileUrl = data.currentLayer?.svgOverlayMobileUrl;
  const backgroundUrl =
    media.find((m) => m.purpose === 'background' && m.type === 'image')?.url ??
    data.currentLayer?.backgroundImageUrl;
  const backgroundMobileUrl =
    media.find((m) => m.purpose === 'background_mobile' && m.type === 'image')?.url ??
    data.currentLayer?.backgroundImageMobileUrl;

  // Center scroll on mount
  useEffect(() => {
    const el = mapScrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Zoom with ctrl+wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setMapScale((s) => Math.min(1.5, Math.max(1, s - e.deltaY * 0.002)));
  }, []);

  // Pinch to zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartScale.current = mapScale;
    }
  }, [mapScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current != null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      setMapScale(Math.min(1.5, Math.max(1, pinchStartScale.current * ratio)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStartDist.current = null;
  }, []);

  const entityConfigs = useMemo(
    () =>
      children.map((child) => ({
        id: child.svgElementId ?? child.slug,
        groupId: child.groupElementId,
        label: child.label,
        status: child.status,
        onClick: () => {
          setSelectedLotId(child.id);
          history.pushState(
            null,
            '',
            `/${data.currentPath.join('/')}/${child.slug}`
          );
        },
        onHover: () => {
          const cm = childrenMedia[child.id];
          if (cm) {
            for (const m of cm) {
              if (m.type === 'image' && m.url) preloadImage(m.url);
            }
          }
        },
      })),
    [children, data.currentPath, childrenMedia]
  );

  const handleCloseFicha = useCallback(() => {
    setFichaClosing(true);
    setTimeout(() => {
      setSelectedLotId(null);
      setFichaClosing(false);
      history.pushState(
        null,
        '',
        `/${data.currentPath.join('/')}`
      );
    }, 300);
  }, [data.currentPath]);

  const homeUrl = getHomeUrl(data);
  const backUrl = getBackUrl(data);

  const handleNavigate = (section: string) => {
    if (selectedLotId) {
      setSelectedLotId(null);
      history.pushState(null, '', `/${data.currentPath.join('/')}`);
    }
    if (section === 'home') {
      navigate(homeUrl);
    } else if (section === 'map') {
      setActiveView('map');
    } else if (section === 'location') {
      setActiveView('location');
    }
  };

  const activeSection = activeView === 'location' ? 'location' as const : 'map' as const;

  return (
    <div className="relative h-dvh overflow-hidden bg-black">
      <div className="absolute inset-0">
        {activeView === 'map' && (
          <main
            className="relative w-full h-full"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={mapScrollRef}
              className={`absolute inset-0 landscape:overflow-hidden xl:overflow-hidden ${backgroundMobileUrl ? 'portrait:overflow-hidden' : 'portrait:overflow-x-auto portrait:overflow-y-hidden'}`}
            >
              <div
                className={`relative h-full w-full xl:w-full origin-center transition-transform duration-150 ${backgroundMobileUrl ? '' : 'portrait:w-[170vw]'}`}
                style={mapScale !== 1 ? { transform: `scale(${mapScale})` } : undefined}
              >
                {backgroundUrl && (
                  <img
                    src={backgroundUrl}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover ${backgroundMobileUrl ? 'portrait:max-xl:hidden' : ''}`}
                  />
                )}
                {backgroundMobileUrl && (
                  <img
                    src={backgroundMobileUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover hidden portrait:max-xl:block"
                  />
                )}
                {svgUrl ? (
                  <InteractiveSVG
                    svgUrl={svgUrl}
                    svgMobileUrl={svgMobileUrl}
                    entities={entityConfigs}
                    backgroundUrl={undefined}
                    backgroundMobileUrl={undefined}
                    variant="lots"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No hay mapa disponible
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        mapLabel="Lotes"
        showBack
        onBack={activeView === 'location' ? () => setActiveView('map') : () => navigate(backUrl)}
        compact
      />

      {activeView === 'map' && <SocialButtons project={project} />}

      {selectedLot && (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${fichaClosing ? 'opacity-0' : 'opacity-100'}`}>
          <LotFichaOverlay
            lot={selectedLot}
            media={childrenMedia[selectedLot.id] ?? []}
            project={project}
            logos={logos}
            onClose={handleCloseFicha}
            onNavigate={handleNavigate}
            onContactOpen={() => setContactOpen(true)}
          />
        </div>
      )}

      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      <Disclaimer project={project} />
    </div>
  );
}
