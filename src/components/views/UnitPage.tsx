import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { useIsMobilePortrait } from '@/hooks/useIsMobilePortrait';
import { TopNav } from '@/components/navigation/TopNav';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { ContactModal } from '@/components/navigation/ContactModal';
import { Disclaimer } from '@/components/shared/Disclaimer';
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

  const [mediaTabPreference, setMediaTab] = useState<MediaTab>('gallery');
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
  /** Embed Matterport/etc. viene del layer en LayerForm (`tour_embed_url`), no del flag global del proyecto:
   * `has_recorrido_360_embed` no se pasa al iframe y dejaba la pestaña Tour vacía. */
  const tourEmbedUrl = useMemo(() => {
    const u = currentLayer?.tourEmbedUrl?.trim();
    return u || undefined;
  }, [currentLayer?.tourEmbedUrl]);
  const hasTour = Boolean(tourEmbedUrl);
  /* Gallery y video comparten la pestaña "Galería", por eso cuentan como una sola sección. */
  const mediaSectionCount =
    (hasPlanos ? 1 : 0) +
    ((hasGallery || hasVideo) ? 1 : 0) +
    (hasTour ? 1 : 0);
  /* Con una sola sección no hay navegación que hacer: se conserva la navbar principal
   * y esa única media se renderiza de fondo. La de media solo aparece con 2+ secciones. */
  const showMediaNavbar = mediaSectionCount >= 2;

  /* Sin assets *_mobile en portrait: contain = foto web entera; con mobile: cover. */
  const hasGalleryMobileAssets = useMemo(
    () => media.some((m) => m.type === 'image' && m.purpose === 'gallery_mobile'),
    [media]
  );
  const hasFichaMobileAssets = useMemo(
    () =>
      media.some(
        (m) =>
          m.type === 'image' &&
          (m.purpose === 'ficha_furnished_mobile' || m.purpose === 'ficha_measured_mobile')
      ),
    [media]
  );
  const galleryFullBleedClass =
    isMobilePortrait && !hasGalleryMobileAssets
      ? 'object-cover portrait:object-contain'
      : 'object-cover portrait:object-cover';
  const fichaFullBleedClass =
    isMobilePortrait && !hasFichaMobileAssets
      ? 'object-cover portrait:object-contain'
      : 'object-cover portrait:object-cover';

  const navItems = useMemo<{ section: NavSection; label: string }[]>(() => {
    if (!showMediaNavbar) {
      return [
        { section: 'home', label: 'Inicio' },
        { section: 'map', label: 'Plantas' },
        { section: 'location', label: 'Ubicación' },
      ];
    }
    const items: { section: NavSection; label: string }[] = [];
    if (hasPlanos) items.push({ section: 'planos', label: 'Planos' });
    if (hasGallery || hasVideo) items.push({ section: 'galeria', label: 'Galería' });
    if (hasTour) items.push({ section: 'tour', label: 'Tour' });
    return items;
  }, [showMediaNavbar, hasPlanos, hasGallery, hasVideo, hasTour]);

  const clampedGalleryIndex = useMemo(() => {
    const n = galleryImages.length;
    if (n === 0) return 0;
    return Math.min(galleryIndex, n - 1);
  }, [galleryIndex, galleryImages.length]);

  const clampedPlanoIndex = useMemo(() => {
    const n = fichaImages.length;
    if (n === 0) return 0;
    return Math.min(planoIndex, n - 1);
  }, [planoIndex, fichaImages.length]);

  /* mediaTab es derivado: si la preferencia del usuario apunta a una tab sin
   * contenido, cae al primer tab con media. Evita setState en effect. */
  const mediaTab = useMemo<MediaTab>(() => {
    const preferenceValid =
      (mediaTabPreference === 'gallery' && hasPlanos) ||
      (mediaTabPreference === 'video' && (hasGallery || hasVideo)) ||
      (mediaTabPreference === 'tour' && hasTour);
    if (preferenceValid) return mediaTabPreference;
    if (hasPlanos) return 'gallery';
    if (hasGallery || hasVideo) return 'video';
    if (hasTour) return 'tour';
    return mediaTabPreference;
  }, [mediaTabPreference, hasPlanos, hasGallery, hasVideo, hasTour]);

  const handleNavigate = useCallback((section: NavSection) => {
    if (section === 'home') {
      navigate(homeUrl);
      return;
    }
    if (section === 'map') {
      navigate(floorUrl);
      return;
    }
    if (section === 'location') {
      setActiveView('location');
      return;
    }
    const tab = SECTION_TO_TAB[section];
    if (tab) {
      setActiveView('unit');
      setMediaTab(tab);
      setGalleryIndex(0);
      setPlanoIndex(0);
    }
  }, [navigate, homeUrl, floorUrl]);

  const galleryPrev = useCallback(() => {
    setGalleryIndex((i) => {
      const n = galleryImages.length;
      if (n === 0) return 0;
      const cur = Math.min(i, n - 1);
      return (cur - 1 + n) % n;
    });
  }, [galleryImages.length]);

  const galleryNext = useCallback(() => {
    setGalleryIndex((i) => {
      const n = galleryImages.length;
      if (n === 0) return 0;
      const cur = Math.min(i, n - 1);
      return (cur + 1) % n;
    });
  }, [galleryImages.length]);

  const activeSection: NavSection = activeView === 'location'
    ? 'location'
    : showMediaNavbar
      ? TAB_TO_SECTION[mediaTab]
      : 'map';

  if (!currentLayer) return null;


  return (
    <div className="relative h-dvh overflow-hidden bg-[#2A2A2A]">
      {/* Background — full-bleed image changes per tab */}
      {mediaTab === 'gallery' && fichaImages.length > 0 && (
        <img
          src={fichaImages[clampedPlanoIndex]?.url}
          alt=""
          className={`absolute inset-0 w-full h-full ${fichaFullBleedClass} transition-opacity duration-300`}
          key={fichaImages[clampedPlanoIndex]?.id ?? clampedPlanoIndex}
        />
      )}
      {mediaTab === 'video' && galleryImages.length > 0 && (
        <img
          src={galleryImages[clampedGalleryIndex]?.url}
          alt=""
          className={`absolute inset-0 w-full h-full ${galleryFullBleedClass} transition-opacity duration-300`}
          key={galleryImages[clampedGalleryIndex]?.id ?? clampedGalleryIndex}
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
              const n = fichaImages.length;
              if (dx < 0) {
                setPlanoIndex((i) => {
                  const cur = Math.min(i, n - 1);
                  return (cur + 1) % n;
                });
              } else {
                setPlanoIndex((i) => {
                  const cur = Math.min(i, n - 1);
                  return (cur - 1 + n) % n;
                });
              }
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
                tourEmbedUrl={tourEmbedUrl}
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

          {/* Mobile portrait: handled by MobileUnitSheet below */}
        </div>
      ) : (
        <LocationView project={project} />
      )}

      {/* Planos arrows + progress — fixed, outside swipe container */}
      {activeView === 'unit' && mediaTab === 'gallery' && fichaImages.length > 1 && !sheetExpanded && (
        <GlassArrows
          onPrev={() => setPlanoIndex((i) => {
            const n = fichaImages.length;
            if (n === 0) return 0;
            const cur = Math.min(i, n - 1);
            return (cur - 1 + n) % n;
          })}
          onNext={() => setPlanoIndex((i) => {
            const n = fichaImages.length;
            if (n === 0) return 0;
            const cur = Math.min(i, n - 1);
            return (cur + 1) % n;
          })}
          count={fichaImages.length}
          activeIndex={clampedPlanoIndex}
          className="fixed left-1/2 -translate-x-1/2 z-40 landscape:bottom-[clamp(16px,3vh,28px)] portrait:bottom-[190px]"
          small
        />
      )}

      {/* Gallery arrows + progress — fixed, outside swipe container */}
      {activeView === 'unit' && mediaTab === 'video' && galleryImages.length > 1 && !sheetExpanded && (
        <GlassArrows
          onPrev={galleryPrev}
          onNext={galleryNext}
          count={galleryImages.length}
          activeIndex={clampedGalleryIndex}
          className="fixed left-1/2 -translate-x-1/2 z-40 landscape:bottom-[clamp(16px,3vh,28px)] portrait:bottom-[190px]"
          small
        />
      )}

      {/* TopNav */}
      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        navItems={navItems}
        showBack
        onBack={activeView === 'location'
          ? () => setActiveView('unit')
          : () => navigate(floorUrl)
        }
        showHome={activeView === 'unit' && showMediaNavbar}
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

      <Disclaimer project={project} mobileBottomClass="bottom-[250px]" />
    </div>
  );
}
