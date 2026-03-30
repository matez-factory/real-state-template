import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData, Layer, SiblingExplorerBundle } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { InteractiveSVG } from '@/components/svg/InteractiveSVG';
import { SiblingNavigator } from '@/components/navigation/SiblingNavigator';
import { TopNav, MobileTabIcon } from '@/components/navigation/TopNav';
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
  const [mapScale, setMapScale] = useState(1);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);

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

  // Reset zoom on floor change
  useEffect(() => { setMapScale(1); }, [activeLayerId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setMapScale((s) => Math.min(1.5, Math.max(1, s - e.deltaY * 0.002)));
  }, []);

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

  const activeData: ExplorerPageData =
    (siblingBundle && activeLayerId ? siblingBundle.siblingDataMap[activeLayerId] : null) ?? data;

  const { project, currentLayer, children, currentPath, siblings: rawSiblings, media } = activeData;
  // Filter out tour layers from sibling navigation — they're not floors
  const siblings = useMemo(() => rawSiblings.filter((s) => s.type !== 'tour'), [rawSiblings]);
  const basePath = `${currentPath.length > 0 ? '/' + currentPath.join('/') : ''}`;
  const svgUrl = currentLayer?.svgOverlayUrl ?? project.svgOverlayUrl;
  const svgMobileUrl = currentLayer?.svgOverlayMobileUrl;
  const showSiblings = siblings.length > 1 && currentLayer != null;
  const backgroundUrl = activeData.media.find((m) => m.purpose === 'background' && m.type === 'image')?.url ?? currentLayer?.backgroundImageUrl;
  const backgroundMobileUrl = activeData.media.find((m) => m.purpose === 'background_mobile' && m.type === 'image')?.url ?? currentLayer?.backgroundImageMobileUrl;

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

  const handleNavigate = (section: string) => {
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
          <main
            className="relative w-full h-full"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={mapScrollRef}
              className="absolute inset-0 portrait:overflow-x-auto portrait:overflow-y-hidden landscape:overflow-hidden xl:overflow-hidden"
            >
              <div
                className="relative h-full w-full portrait:w-[170vw] xl:w-full origin-center transition-transform duration-150"
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
                    backgroundUrl={backgroundUrl}
                    backgroundMobileUrl={backgroundMobileUrl}
                    variant="building"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No hay mapa disponible para este nivel
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
        mapLabel="Plantas"
        showBack
        onBack={activeView === 'location' ? () => setActiveView('map') : () => navigate(backUrl)}
        hideMobileNav={showSiblings && activeView === 'map'}
        compact
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

      {/* ── Mobile portrait: combined floor selector + bottom nav ── */}
      {activeView === 'map' && showSiblings && currentLayer && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 landscape:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div
            className="relative rounded-[20px] overflow-hidden"
            style={{ filter: 'drop-shadow(0px 12px 20px #D0D6E2)' }}
          >
            {/* Glass background */}
            <div className="absolute inset-0 rounded-[20px] bg-white" />
            <div
              className="absolute inset-0 rounded-[20px]"
              style={{
                background: 'linear-gradient(270deg, rgba(214, 214, 214, 0.45) 0%, rgba(112, 112, 112, 0.45) 90.38%)',
                backgroundBlendMode: 'luminosity',
                backdropFilter: 'blur(50px)',
                WebkitBackdropFilter: 'blur(50px)',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />

            {/* Floor selector section */}
            <div className="relative z-10 flex flex-col items-center pt-[10px] pb-[4px]">
              <span className="text-[13px] text-[#585555] font-light mb-[6px]">Nivel</span>
              <div className="relative flex items-center max-w-[95vw] px-1">
                <div className="flex items-center gap-[2px] overflow-x-auto [&::-webkit-scrollbar]:h-0 px-1">
                  {[...siblings].reverse().map((sibling) => {
                    const isCurrent = sibling.id === (activeLayerId ?? currentLayer?.id);
                    const shortLabel = sibling.label.replace(/^(piso|nivel|planta|n)\s*/i, '');
                    return (
                      <button
                        key={sibling.id}
                        onClick={() => handleSiblingSelect(sibling)}
                        className={`flex-shrink-0 min-w-[38px] h-[38px] rounded-[10px] text-[15px] font-semibold transition-colors outline-none px-2 ${
                          isCurrent
                            ? 'bg-[rgba(234,234,234,0.7)] text-[#484848]'
                            : 'text-[#A2A2A2]'
                        }`}
                      >
                        {shortLabel}
                      </button>
                    );
                  })}
                </div>
                {/* Scroll hint arrow */}
                <div
                  className="flex-shrink-0 size-[28px] rounded-full flex items-center justify-center ml-1"
                  style={{
                    background: 'rgba(128, 128, 128, 0.23)',
                    backgroundBlendMode: 'luminosity',
                    backdropFilter: 'blur(50px)',
                    WebkitBackdropFilter: 'blur(50px)',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#585555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </div>
              </div>
              {/* Position indicator bar */}
              {(() => {
                const currentIdx = [...siblings].reverse().findIndex((s) => s.id === (activeLayerId ?? currentLayer?.id));
                const total = siblings.length;
                const barWidth = total > 0 ? Math.max(30, 100 / total) : 40;
                const barOffset = total > 1 ? (currentIdx / (total - 1)) * (100 - barWidth) : 0;
                return (
                  <div className="w-[100px] h-[3px] rounded-full bg-[rgba(234,234,234,0.45)] mt-[8px] overflow-hidden relative">
                    <div
                      className="absolute h-full rounded-full bg-[#A2A2A2] transition-all duration-300"
                      style={{ width: `${barWidth}%`, left: `${barOffset}%` }}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Nav tabs section */}
            <div className="relative z-10 flex items-center justify-around px-[24px] pb-[14px] pt-[4px]">
              {([
                { section: 'home' as const, label: 'Inicio' },
                { section: 'map' as const, label: 'Plantas' },
                { section: 'location' as const, label: 'Ubicación' },
              ]).map(({ section, label }) => {
                const isActive = activeSection === section;
                return (
                  <button
                    key={section}
                    onClick={() => handleNavigate(section)}
                    className={`flex flex-col items-center justify-center gap-[6px] w-[100px] h-[55px] rounded-[100px] transition-colors outline-none ${
                      isActive ? 'bg-[rgba(234,234,234,0.7)]' : ''
                    }`}
                  >
                    <MobileTabIcon section={section} active={isActive} />
                    <span
                      className="text-[12px] leading-[125%] tracking-[0.02em]"
                      style={{
                        fontFamily: "'Poppins', system-ui, sans-serif",
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? '#1A1A1A' : '#585555',
                      }}
                    >
                      {label}
                    </span>
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
