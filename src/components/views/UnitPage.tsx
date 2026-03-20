import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExplorerPageData } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { TopNav } from '@/components/navigation/TopNav';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';
import { UnitInfoCard } from '@/components/unit/UnitInfoCard';
import { UnitMediaViewer } from '@/components/unit/UnitMediaViewer';

type MediaTab = 'gallery' | 'video' | 'tour';
type ActiveView = 'unit' | 'location';

type NavSection = 'home' | 'map' | 'location' | 'contact';
const TAB_TO_SECTION: Record<MediaTab, NavSection> = { gallery: 'map', video: 'home', tour: 'location' };
const SECTION_TO_TAB: Record<string, MediaTab> = { map: 'gallery', home: 'video', location: 'tour' };

const glassStyle: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
};

interface UnitPageProps {
  data: ExplorerPageData;
  floorBackgroundUrl?: string;
}

export function UnitPage({ data, floorBackgroundUrl }: UnitPageProps) {
  const navigate = useNavigate();
  const { project, currentLayer, media } = data;

  const [mediaTab, setMediaTab] = useState<MediaTab>('gallery');
  const [activeView, setActiveView] = useState<ActiveView>('unit');
  const [contactOpen, setContactOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const homeUrl = getHomeUrl(data);
  const floorUrl = getBackUrl(data);

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const galleryImages = useMemo(() => {
    const ficha = media.filter(
      (m) => m.type === 'image' && (m.purpose === 'ficha_furnished' || m.purpose === 'ficha_measured')
    );
    const other = media.filter(
      (m) => m.type === 'image' && !['ficha_furnished', 'ficha_measured', 'background', 'background_mobile', 'logo', 'logo_developer'].includes(m.purpose)
    );
    return [...ficha, ...other];
  }, [media]);

  const uploadedVideos = useMemo(
    () => media.filter((m) => m.type === 'video'),
    [media]
  );

  const fichaImages = useMemo(
    () => media.filter((m) => m.type === 'image' && (m.purpose === 'ficha_furnished' || m.purpose === 'ficha_measured')),
    [media]
  );
  const galleryOnlyImages = useMemo(
    () => media.filter((m) => m.type === 'image' && m.purpose === 'gallery'),
    [media]
  );
  const fichaImage = fichaImages[0]?.url;
  const thumbnailUrl = floorBackgroundUrl ?? fichaImage;

  const hasPlanos = fichaImages.length > 0;
  const hasGallery = galleryOnlyImages.length > 0 || project.hasGallery;
  const hasVideo = !!(currentLayer?.videoUrl) || uploadedVideos.length > 0;
  const hasTour = !!(currentLayer?.tourEmbedUrl) || project.hasRecorrido360Embed;

  const navItems = useMemo(() => {
    const items: { section: NavSection; label: string }[] = [];
    if (hasPlanos) items.push({ section: 'map', label: 'Planos' });
    if (hasGallery || hasVideo) items.push({ section: 'home', label: 'Galería' });
    if (hasTour) items.push({ section: 'location', label: 'Tour' });
    return items;
  }, [hasPlanos, hasGallery, hasVideo, hasTour]);

  const handleNavigate = useCallback((section: NavSection) => {
    const tab = SECTION_TO_TAB[section];
    if (tab) {
      setActiveView('unit');
      setMediaTab(tab);
      setGalleryIndex(0);
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

  /* Determine the full-bleed background based on active tab */
  const bgImage = mediaTab === 'gallery'
    ? fichaImage
    : mediaTab === 'video'
      ? (galleryImages[galleryIndex]?.url ?? fichaImage)
      : fichaImage;

  return (
    <div className="relative h-screen overflow-hidden bg-[#2A2A2A]">
      {/* Background — full-bleed image changes per tab */}
      {mediaTab === 'gallery' && fichaImage && (
        <img src={fichaImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {mediaTab === 'video' && galleryImages.length > 0 && (
        <img
          src={galleryImages[galleryIndex]?.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          key={galleryIndex}
        />
      )}

      {activeView === 'unit' ? (
        <div className="absolute inset-0 flex">
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
            <div className="absolute left-[47px] top-[132px] z-30 hidden lg:block landscape:max-xl:left-[16px] landscape:max-xl:top-[80px]">
              <UnitInfoCard
                layer={currentLayer}
                thumbnailUrl={thumbnailUrl}
                onContact={() => setContactOpen(true)}
              />
            </div>
          )}

          {/* Gallery arrows + progress — same style as 360 tour navigation */}
          {mediaTab === 'video' && galleryImages.length > 1 && (
            <div className="absolute bottom-[45px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-[22px]">
              {/* Arrow buttons — Figma: 44×44 glass circles, stroke 4px bold */}
              <div className="flex items-center gap-[21px]">
                <button
                  onClick={galleryPrev}
                  className="w-[44px] h-[44px] rounded-[100px] flex items-center justify-center text-white hover:text-white transition-colors outline-none"
                  style={glassStyle}
                  aria-label="Anterior"
                >
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }}>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={galleryNext}
                  className="w-[44px] h-[44px] rounded-[100px] flex items-center justify-center text-white hover:text-white transition-colors outline-none"
                  style={glassStyle}
                  aria-label="Siguiente"
                >
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }}>
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-[4px]">
                {galleryImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-[3px] rounded-full transition-all duration-300 ${
                      i === galleryIndex ? 'w-[41px] bg-[#f2f2f2]' : 'w-[28px] bg-[rgba(234,234,234,0.45)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mobile portrait: card overlaid at bottom — hidden during tour */}
          {mediaTab !== 'tour' && (
            <div className="absolute bottom-0 left-0 right-0 z-30 lg:hidden p-4 pb-16 landscape:hidden">
              <div className="max-w-[337px] mx-auto">
                <UnitInfoCard
                  layer={currentLayer}
                  thumbnailUrl={thumbnailUrl}
                  onContact={() => setContactOpen(true)}
                />
              </div>
            </div>
          )}
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
      />

      {/* Home button — Figma: glass circle next to back button */}
      {activeView === 'unit' && (
        <button
          onClick={() => navigate(homeUrl)}
          className="absolute top-[32px] left-[104px] z-40 w-[44px] h-[44px] rounded-[100px] flex items-center justify-center text-white/90 hover:text-white transition-colors outline-none landscape:max-xl:top-[16px] landscape:max-xl:left-[60px] landscape:max-xl:w-[36px] landscape:max-xl:h-[36px] portrait:top-3 portrait:left-[52px] portrait:w-[36px] portrait:h-[36px]"
          style={glassStyle}
          aria-label="Inicio"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
      )}

      {/* Social icons — bottom right */}
      {activeView === 'unit' && <SocialButtons project={project} />}

      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
