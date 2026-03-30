import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData } from '@/types/hierarchy.types';
// Back from tour always goes to splash — no need for getBackUrl
import { Spin360Viewer, type Spin360ViewerRef } from '@/components/video/Spin360Viewer';
import { MobileHint } from '@/components/shared/MobileHint';
import { TopNav } from '@/components/navigation/TopNav';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { GlassArrows } from '@/components/shared/GlassArrows';

interface ProjectHomePageProps {
  data: ExplorerPageData;
}

type ActiveView = 'tour' | 'location';


export function ProjectHomePage({ data }: ProjectHomePageProps) {
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
    // For building projects: siblings are the floors (current layer is the "tour" layer)
    // Pick the highest floor (last non-tour sibling, sorted low→high)
    const floors = siblings.filter((s) => s.type !== 'tour');
    if (floors.length > 0) {
      const target = floors[floors.length - 1];
      return `/${target.slug}`;
    }
    if (children.length > 0) {
      const childFloors = children.filter((c) => c.type !== 'tour');
      const target = childFloors.length > 0 ? childFloors[childFloors.length - 1] : children[0];
      return `/${data.currentPath.join('/')}/${target.slug}`;
    }
    return null;
  }, [data.currentPath, children, siblings]);

  // From the tour/home page, back always goes to splash
  const backUrl = '/';

  const handleNavigate = (section: string) => {
    if (section === 'home') {
      // Already on the home page — just switch back to tour view
      setActiveView('tour');
    } else if (section === 'map') {
      // Navigate directly to first floor — avoids flash of tour view
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
        {activeView === 'location' && <LocationView project={project} />}
      </div>

      {activeView === 'tour' && (
        <MobileHint
          isTourActive
          isTransitioning={false}
          currentSceneId={currentViewpoint}
          pillMessage="Deslizá para ver la imagen completa"
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
            compact
          />

          {/* Social icons — bottom right */}
          {activeView === 'tour' && <SocialButtons project={project} />}
        </>
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
