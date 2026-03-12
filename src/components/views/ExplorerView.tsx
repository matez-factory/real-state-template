import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData, Layer, SiblingExplorerBundle } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { InteractiveSVG } from '@/components/svg/InteractiveSVG';
import { SiblingNavigator } from '@/components/navigation/SiblingNavigator';
import { BrandingBadge } from '@/components/navigation/BrandingBadge';
import { TopNav } from '@/components/navigation/TopNav';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';
import { STATUS_DOT_CLASSES } from '@/lib/constants/status';
import { preloadImage, preloadSvg } from '@/lib/preload';

interface ExplorerViewProps {
  data: ExplorerPageData;
  siblingBundle?: SiblingExplorerBundle;
}

type ActiveView = 'map' | 'location';

export function ExplorerView({ data, siblingBundle }: ExplorerViewProps) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; });

  const [activeLayerId, setActiveLayerId] = useState(data.currentLayer?.id ?? null);
  const [prevDataLayerId, setPrevDataLayerId] = useState(data.currentLayer?.id ?? null);
  const incomingId = data.currentLayer?.id ?? null;
  if (incomingId !== prevDataLayerId) {
    setPrevDataLayerId(incomingId);
    setActiveLayerId(incomingId);
  }
  const [mobileSiblingsOpen, setMobileSiblingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [contactOpen, setContactOpen] = useState(false);
  const mapScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siblingBundle) return;
    for (const d of Object.values(siblingBundle.siblingDataMap)) {
      const svg = d.currentLayer?.svgOverlayUrl ?? d.project.svgOverlayUrl;
      if (svg) fetch(svg);
      const bg = d.media.find((m) => m.purpose === 'background' && m.type === 'image');
      if (bg?.url) { const img = new Image(); img.src = bg.url; }
    }
  }, [siblingBundle]);

  useEffect(() => {
    const el = mapScrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeLayerId]);

  const activeData: ExplorerPageData =
    (siblingBundle && activeLayerId ? siblingBundle.siblingDataMap[activeLayerId] : null) ?? data;

  const { project, currentLayer, children, currentPath, siblings, media } = activeData;
  const basePath = `${currentPath.length > 0 ? '/' + currentPath.join('/') : ''}`;
  const svgUrl = currentLayer?.svgOverlayUrl ?? project.svgOverlayUrl;
  const currentLabel = project.layerLabels[currentLayer?.depth ?? -1] ?? '';
  const showSiblings = siblings.length > 1 && currentLayer != null;
  const backgroundUrl = activeData.media.find((m) => m.purpose === 'background' && m.type === 'image')?.url ?? currentLayer?.backgroundImageUrl;

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const { childrenMedia } = activeData;

  const entityConfigs = useMemo(
    () =>
      children.map((child) => ({
        id: child.svgElementId ?? child.slug,
        label: child.label,
        status: child.status,
        onClick: () => navigateRef.current(`${basePath}/${child.slug}`),
        onHover: () => {
          preloadSvg(child.svgOverlayUrl);
          preloadImage(child.backgroundImageUrl);
          const cm = childrenMedia?.[child.id];
          if (cm) {
            const bg = cm.find((m) => m.purpose === 'background' && m.type === 'image');
            if (bg?.url) preloadImage(bg.url);
          }
        },
      })),
    [children, basePath, childrenMedia]
  );

  const handleSiblingSelect = useCallback((sibling: Layer) => {
    if (sibling.id === activeLayerId) return;
    if (siblingBundle?.siblingDataMap[sibling.id]) {
      setActiveLayerId(sibling.id);
      const path = [...currentPath.slice(0, -1), sibling.slug];
      window.history.replaceState(null, '', `/${path.join('/')}`);
    } else {
      const path = [...currentPath.slice(0, -1), sibling.slug];
      navigate(`/${path.join('/')}`);
    }
    setMobileSiblingsOpen(false);
  }, [activeLayerId, siblingBundle, currentPath, navigate]);

  const homeUrl = getHomeUrl(data);
  const backUrl = project.type === 'building' ? homeUrl : getBackUrl(data);

  const handleNavigate = (section: 'home' | 'map' | 'location' | 'contact') => {
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
      <div className="absolute inset-0">
        {activeView === 'map' && (
          <main className="relative w-full h-full">
            <div
              ref={mapScrollRef}
              className="absolute inset-0 portrait:overflow-x-auto portrait:overflow-y-hidden landscape:overflow-hidden xl:overflow-hidden"
            >
              <div className="relative h-full w-full portrait:w-[170vw] xl:w-full">
                {backgroundUrl && (
                  <img
                    src={backgroundUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {svgUrl ? (
                  <InteractiveSVG
                    svgUrl={svgUrl}
                    entities={entityConfigs}
                    backgroundUrl={backgroundUrl}
                    variant="building"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No hay mapa disponible para este nivel
                  </div>
                )}
              </div>
            </div>

            {showSiblings && (
              <div className="absolute bottom-20 right-4 z-[55] lg:hidden landscape:bottom-4">
                <button
                  onClick={() => setMobileSiblingsOpen((o) => !o)}
                  className="lots-glass px-4 py-2 text-sm text-white/90 hover:text-white rounded-full transition-colors outline-none"
                >
                  {currentLabel}es ↑
                </button>
              </div>
            )}
          </main>
        )}
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      <BrandingBadge project={project} logos={logos} />
      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        mapLabel="Niveles"
        showBack
        onBack={activeView === 'location' ? () => setActiveView('map') : () => navigate(backUrl)}
      />

      {activeView === 'map' && showSiblings && currentLayer && (
        <SiblingNavigator
          siblings={siblings}
          currentLayerId={activeLayerId ?? currentLayer.id}
          label={currentLabel}
          onSelect={handleSiblingSelect}
        />
      )}

      {mobileSiblingsOpen && showSiblings && (
        <div className="lg:hidden fixed inset-0 z-[55] flex flex-col justify-end">
          <div className="flex-1" onClick={() => setMobileSiblingsOpen(false)} />
          <div className="bg-black/70 backdrop-blur-md rounded-t-2xl max-h-[60vh] overflow-y-auto mx-2 mb-16 landscape:mb-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {currentLabel}es
              </span>
              <button
                onClick={() => setMobileSiblingsOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col py-1">
              {[...siblings].reverse().map((sibling) => {
                const isCurrent = sibling.id === (activeLayerId ?? currentLayer?.id);
                return (
                  <button
                    key={sibling.id}
                    onClick={() => handleSiblingSelect(sibling)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors outline-none ${
                      isCurrent
                        ? 'bg-white/15 text-white font-semibold border-l-2 border-sky-400'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_CLASSES[sibling.status]}`} />
                    <span className="truncate">{sibling.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
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
