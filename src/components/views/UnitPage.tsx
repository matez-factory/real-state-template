import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { useIsMobilePortrait } from '@/hooks/useIsMobilePortrait';
import { TopNav } from '@/components/navigation/TopNav';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';
import { UnitInfoCard } from '@/components/unit/UnitInfoCard';
import { UnitMediaViewer } from '@/components/unit/UnitMediaViewer';
import { GlassArrows } from '@/components/shared/GlassArrows';
import { MobileUnitSheet } from '@/components/unit/MobileUnitSheet';

type MediaTab = 'gallery' | 'video' | 'tour';
type ActiveView = 'unit' | 'location';

type NavSection = 'home' | 'map' | 'location' | 'contact' | 'planos' | 'galeria' | 'tour';
const TAB_TO_SECTION: Record<MediaTab, NavSection> = { gallery: 'planos', video: 'galeria', tour: 'tour' };
const SECTION_TO_TAB: Record<string, MediaTab> = { planos: 'gallery', galeria: 'video', tour: 'tour' };


interface UnitPageProps {
  data: ExplorerPageData;
  floorBackgroundUrl?: string;
}

export function UnitPage({ data, floorBackgroundUrl }: UnitPageProps) {
  const navigate = useNavigate();
  const { project, currentLayer, media } = data;
  const isMobilePortrait = useIsMobilePortrait();

  const [mediaTab, setMediaTab] = useState<MediaTab>('gallery');
  const [activeView, setActiveView] = useState<ActiveView>('unit');
  const [contactOpen, setContactOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [planoIndex, setPlanoIndex] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const homeUrl = getHomeUrl(data);
  const floorUrl = getBackUrl(data);

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const galleryImages = useMemo(() => {
    if (isMobilePortrait) {
      const mobile = media.filter((m) => m.type === 'image' && m.purpose === 'gallery_mobile');
      if (mobile.length > 0) return mobile;
    }
    return media.filter((m) => m.type === 'image' && m.purpose === 'gallery');
  }, [media, isMobilePortrait]);

  const uploadedVideos = useMemo(
    () => media.filter((m) => m.type === 'video'),
    [media]
  );

  const fichaImages = useMemo(() => {
    if (isMobilePortrait) {
      const furnishedMobile = media.filter((m) => m.type === 'image' && m.purpose === 'ficha_furnished_mobile');
      const measuredMobile = media.filter((m) => m.type === 'image' && m.purpose === 'ficha_measured_mobile');
      if (furnishedMobile.length > 0 || measuredMobile.length > 0) {
        return [...furnishedMobile, ...measuredMobile];
      }
    }
    const furnished = media.filter((m) => m.type === 'image' && m.purpose === 'ficha_furnished');
    const measured = media.filter((m) => m.type === 'image' && m.purpose === 'ficha_measured');
    return [...furnished, ...measured];
  }, [media, isMobilePortrait]);
  const unitThumbnail = useMemo(
    () => media.find((m) => m.purpose === 'thumbnail' && m.type === 'image')?.url,
    [media]
  );
  const fichaImage = fichaImages[0]?.url;
  const thumbnailUrl = unitThumbnail ?? fichaImage ?? floorBackgroundUrl;

  const hasPlanos = fichaImages.length > 0;
  const hasGallery = galleryImages.length > 0 || project.hasGallery;
  const hasVideo = !!(currentLayer?.videoUrl) || uploadedVideos.length > 0;
  const hasTour = !!(currentLayer?.tourEmbedUrl) || project.hasRecorrido360Embed;

  const navItems = useMemo(() => {
    const items: { section: NavSection; label: string }[] = [];
    if (hasPlanos) items.push({ section: 'planos', label: 'Planos' });
    if (hasGallery || hasVideo) items.push({ section: 'galeria', label: 'Galería' });
    if (hasTour) items.push({ section: 'tour', label: 'Tour' });
    return items;
  }, [hasPlanos, hasGallery, hasVideo, hasTour]);

  const handleNavigate = useCallback((section: NavSection) => {
    const tab = SECTION_TO_TAB[section];
    if (tab) {
      setActiveView('unit');
      setMediaTab(tab);
      setGalleryIndex(0);
      setPlanoIndex(0);
    }
  }, []);

  const galleryPrev = useCallback(() => {
    setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const galleryNext = useCallback(() => {
    setGalleryIndex((i) => (i + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const activeSection = activeView === 'location' ? 'location' as const : TAB_TO_SECTION[mediaTab];

  if (!currentLayer) return null;


  return (
    <div className="relative h-screen overflow-hidden bg-[#2A2A2A]">
      {/* Background — full-bleed image changes per tab */}
      {mediaTab === 'gallery' && fichaImages.length > 0 && (
        <img src={fichaImages[planoIndex]?.url} alt="" className="absolute inset-0 w-full h-full object-cover portrait:object-contain transition-opacity duration-300" key={planoIndex} />
      )}
      {mediaTab === 'video' && galleryImages.length > 0 && (
        <img
          src={galleryImages[galleryIndex]?.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover portrait:object-contain transition-opacity duration-300"
          key={galleryIndex}
        />
      )}

      {activeView === 'unit' ? (
        <div
          className="absolute inset-0 flex"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as HTMLElement).dataset.swipeX = String(touch.clientX);
          }}
          onTouchEnd={(e) => {
            const startX = Number((e.currentTarget as HTMLElement).dataset.swipeX || 0);
            const endX = e.changedTouches[0].clientX;
            const dx = endX - startX;
            if (Math.abs(dx) < 50) return;
            if (mediaTab === 'gallery' && fichaImages.length > 1) {
              if (dx < 0) setPlanoIndex((i) => (i + 1) % fichaImages.length);
              else setPlanoIndex((i) => (i - 1 + fichaImages.length) % fichaImages.length);
            } else if (mediaTab === 'video' && galleryImages.length > 1) {
              if (dx < 0) galleryNext();
              else galleryPrev();
            }
          }}
        >
          {/* Tour tab: full-screen iframe, NO card */}
          {mediaTab === 'tour' && (
            <div className="absolute inset-0 z-20">
              <UnitMediaViewer
                activeTab="tour"
                galleryImages={[]}
                uploadedVideos={[]}
                tourEmbedUrl={currentLayer.tourEmbedUrl}
              />
            </div>
          )}

          {/* Left: Glass info card — hidden during tour */}
          {mediaTab !== 'tour' && (
            <div className="absolute left-[47px] top-1/2 -translate-y-1/2 z-30 hidden landscape:block landscape:max-lg:left-[10px] landscape:max-lg:origin-left landscape:max-lg:scale-[0.5]">
              <UnitInfoCard
                layer={currentLayer}
                thumbnailUrl={thumbnailUrl}
                accentColor={project.accentColor}
                onContact={() => setContactOpen(true)}
              />
            </div>
          )}

          {/* Planos arrows + progress — when multiple fichas */}
          {mediaTab === 'gallery' && fichaImages.length > 1 && !sheetExpanded && (
            <GlassArrows
              onPrev={() => setPlanoIndex((i) => (i - 1 + fichaImages.length) % fichaImages.length)}
              onNext={() => setPlanoIndex((i) => (i + 1) % fichaImages.length)}
              count={fichaImages.length}
              activeIndex={planoIndex}
              className="absolute left-1/2 -translate-x-1/2 z-30 landscape:bottom-[clamp(16px,3vh,28px)] portrait:bottom-[180px]"
              small
            />
          )}

          {/* Gallery arrows + progress */}
          {mediaTab === 'video' && galleryImages.length > 1 && !sheetExpanded && (
            <GlassArrows
              onPrev={galleryPrev}
              onNext={galleryNext}
              count={galleryImages.length}
              activeIndex={galleryIndex}
              className="absolute left-1/2 -translate-x-1/2 z-30 landscape:bottom-[clamp(16px,3vh,28px)] portrait:bottom-[180px]"
              small
            />
          )}

          {/* Mobile portrait: handled by MobileUnitSheet below */}
        </div>
      ) : (
        <LocationView project={project} />
      )}

      {/* TopNav */}
      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        navItems={navItems}
        mapLabel="Planos"
        showBack
        onBack={activeView === 'location'
          ? () => setActiveView('unit')
          : () => navigate(floorUrl)
        }
        showHome={activeView === 'unit'}
        onHome={() => navigate(homeUrl)}
        hideMobileNav={activeView === 'unit'}
        compact
      />

      {/* Social icons — bottom right */}
      {activeView === 'unit' && <SocialButtons project={project} />}

      {/* Mobile portrait: bottom sheet with unit info + nav */}
      {activeView === 'unit' && currentLayer && (
        <MobileUnitSheet
          layer={currentLayer}
          thumbnailUrl={thumbnailUrl}
          accentColor={project.accentColor}
          onContact={() => setContactOpen(true)}
          activeSection={activeSection}
          navItems={navItems}
          onNavigate={handleNavigate}
          expanded={sheetExpanded}
          onExpandedChange={setSheetExpanded}
          hideCard={mediaTab === 'tour'}
        />
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
