import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData, Layer, SiblingExplorerBundle } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { InteractiveSVG } from '@/components/svg/InteractiveSVG';
import { SiblingNavigator } from '@/components/navigation/SiblingNavigator';
import { TopNav } from '@/components/navigation/TopNav';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';
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

  const { project, currentLayer, children, currentPath, siblings: rawSiblings, media } = activeData;
  // Filter out tour layers from sibling navigation — they're not floors
  const siblings = useMemo(() => rawSiblings.filter((s) => s.type !== 'tour'), [rawSiblings]);
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

            {/* Mobile horizontal floor selector */}
            {showSiblings && currentLayer && (
              <div className="absolute bottom-16 left-0 right-0 z-[55] lg:hidden landscape:bottom-2 flex flex-col items-center">
                <span className="text-[13px] text-white/70 font-light mb-1">{currentLabel}</span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[90vw] px-2 py-1 rounded-[16px] [&::-webkit-scrollbar]:h-0"
                  style={{
                    background: 'rgba(214, 214, 214, 0.45)',
                    backgroundBlendMode: 'luminosity' as const,
                    backdropFilter: 'blur(50px)',
                    WebkitBackdropFilter: 'blur(50px)',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {[...siblings].reverse().map((sibling) => {
                    const isCurrent = sibling.id === (activeLayerId ?? currentLayer?.id);
                    const shortLabel = sibling.label.replace(/^(piso|nivel|planta|n)\s*/i, '');
                    return (
                      <button
                        key={sibling.id}
                        onClick={() => handleSiblingSelect(sibling)}
                        className={`flex-shrink-0 min-w-[36px] h-[36px] rounded-[10px] text-[14px] font-semibold transition-colors outline-none px-2 ${
                          isCurrent
                            ? 'bg-white text-[#484848]'
                            : 'text-[#707070] hover:bg-white/30'
                        }`}
                      >
                        {shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        )}
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        mapLabel="Plantas"
        showBack
        onBack={activeView === 'location' ? () => setActiveView('map') : () => navigate(backUrl)}
      />

      {activeView === 'map' && showSiblings && currentLayer && (
        <SiblingNavigator
          siblings={siblings}
          currentLayerId={activeLayerId ?? currentLayer.id}
          label="Nivel"
          onSelect={handleSiblingSelect}
          projectName={project.name}
          logoUrl={logos[0]?.url ?? undefined}
        />
      )}

      {activeView === 'map' && <SocialButtons project={project} />}

      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
