import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData, SiblingExplorerBundle } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { InteractiveSVG } from '@/components/svg/InteractiveSVG';
import { BrandingBadge } from '@/components/navigation/BrandingBadge';
import { TopNav } from '@/components/navigation/TopNav';
import { ContactModal } from '@/components/navigation/ContactModal';
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

  const entityConfigs = useMemo(
    () =>
      children.map((child) => ({
        id: child.svgElementId ?? child.slug,
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

  const handleNavigate = (section: 'home' | 'map' | 'location' | 'contact') => {
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
    <div className="relative h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 portrait:scale-[1.3] landscape:scale-[1.15] xl:scale-100">
        {activeView === 'map' && backgroundUrl && (
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {activeView === 'map' && svgUrl && (
          <InteractiveSVG
            svgUrl={svgUrl}
            svgMobileUrl={svgMobileUrl}
            entities={entityConfigs}
            backgroundUrl={backgroundUrl}
            backgroundMobileUrl={backgroundMobileUrl}
          />
        )}
        {activeView === 'map' && !svgUrl && (
          <div className="flex items-center justify-center h-full text-gray-500">
            No hay mapa disponible
          </div>
        )}
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      <BrandingBadge project={project} logos={logos} />

      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        showBack
        onBack={activeView === 'location' ? () => setActiveView('map') : () => navigate(backUrl)}
      />

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
    </div>
  );
}
