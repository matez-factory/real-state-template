import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Share2,
  Check,
  Eye,
  X,
  Images,
  Play,
} from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import type { ExplorerPageData, Layer } from '@/types/hierarchy.types';
import { getHomeUrl, getBackUrl } from '@/lib/navigation';
import { STATUS_LABELS } from '@/lib/constants/status';
import { TopNav } from '@/components/navigation/TopNav';
import { ContactModal } from '@/components/navigation/ContactModal';
import { LocationView } from '@/components/navigation/LocationView';

interface UnitPageProps {
  data: ExplorerPageData;
  floorBackgroundUrl?: string;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  available: 'bg-green-500/80 text-white',
  reserved: 'bg-yellow-500/80 text-white',
  sold: 'bg-red-500/80 text-white',
  not_available: 'bg-gray-500/80 text-white',
};

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

type ActiveView = 'unit' | 'location';

export function UnitPage({ data, floorBackgroundUrl }: UnitPageProps) {
  const navigate = useNavigate();
  const { project, currentLayer, media, siblings, currentPath } = data;

  const [copied, setCopied] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeView, setActiveView] = useState<ActiveView>('unit');
  const [contactOpen, setContactOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<'gallery' | 'video' | 'tour'>('gallery');

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const galleryImages = useMemo(() => {
    const fichaImages = media.filter(
      (m) => m.type === 'image' && (m.purpose === 'ficha_furnished' || m.purpose === 'ficha_measured')
    );
    const otherImages = media.filter(
      (m) => m.type === 'image' && m.purpose !== 'ficha_furnished' && m.purpose !== 'ficha_measured' && m.purpose !== 'background' && m.purpose !== 'background_mobile' && m.purpose !== 'logo' && m.purpose !== 'logo_developer'
    );
    return [...fichaImages, ...otherImages];
  }, [media]);

  const uploadedVideos = useMemo(
    () => media.filter((m) => m.type === 'video'),
    [media]
  );

  const logos = useMemo(
    () => media.filter((m) => m.purpose === 'logo' || m.purpose === 'logo_developer'),
    [media]
  );

  const hasVideo = !!(currentLayer?.videoUrl) || uploadedVideos.length > 0;
  const hasTour = !!currentLayer?.tourEmbedUrl;
  const hasGallery = galleryImages.length > 0;

  const mediaTabs = useMemo(() => {
    const tabs: { key: 'gallery' | 'video' | 'tour'; label: string; icon: typeof Images }[] = [];
    if (hasGallery) tabs.push({ key: 'gallery', label: 'Galería', icon: Images });
    if (hasVideo) tabs.push({ key: 'video', label: 'Video', icon: Play });
    if (hasTour) tabs.push({ key: 'tour', label: 'Tour 360', icon: Eye });
    return tabs;
  }, [hasGallery, hasVideo, hasTour]);

  const isBuilding = project.type === 'building';
  const entityPrefix = isBuilding ? 'Depto' : 'Lote';

  const homeUrl = getHomeUrl(data);
  const floorUrl = getBackUrl(data);

  const prevImage = useCallback(() => {
    setCarouselIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const nextImage = useCallback(() => {
    setCarouselIndex((i) => (i + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) nextImage();
      else prevImage();
    }
  }, [nextImage, prevImage]);

  const handleWhatsApp = useCallback(() => {
    if (!currentLayer) return;
    const whatsapp = project.whatsapp?.replace(/\D/g, '') ?? '';
    const message = encodeURIComponent(
      `Hola, me interesa el ${entityPrefix} ${currentLayer.label} en ${project.name}. ¿Podrían darme más información?`
    );
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
  }, [project, currentLayer, entityPrefix]);

  const handleEmail = useCallback(() => {
    if (!currentLayer) return;
    const subject = encodeURIComponent(`Consulta ${entityPrefix} ${currentLayer.label} - ${project.name}`);
    const body = encodeURIComponent(`Hola, me interesa el ${entityPrefix} ${currentLayer.label}. ¿Podrían darme más información?`);
    window.open(`mailto:${project.email}?subject=${subject}&body=${body}`, '_blank');
  }, [project, currentLayer, entityPrefix]);

  const handleShare = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const navigateToSibling = useCallback((sibling: Layer) => {
    const siblingPath = [...currentPath.slice(0, -1), sibling.slug];
    navigate(`/${siblingPath.join('/')}`);
  }, [currentPath, navigate]);

  const activeSection = activeView === 'location' ? 'location' as const : 'map' as const;

  if (!currentLayer) return null;

  const {
    area, price, description, orientation, features,
    frontLength, depthLength, bedrooms, bathrooms,
    unitTypeName, hasBalcony, floorNumber, isCorner, areaUnit,
    tourEmbedUrl, videoUrl,
  } = currentLayer;

  const showTabs = mediaTabs.length > 1;
  const areaLabel = areaUnit === 'ft2' ? 'ft²' : areaUnit === 'ha' ? 'ha' : 'm²';
  const statusLabel = STATUS_LABELS[currentLayer.status]?.toUpperCase() ?? currentLayer.status;

  const ambientes = isBuilding
    ? [
      bedrooms != null ? `${bedrooms} dorm.` : '',
      bathrooms != null ? `${bathrooms} baño${bathrooms !== 1 ? 's' : ''}` : '',
    ].filter(Boolean).join(' / ')
    : '';
  const pricePerM2 = area && area > 0 && price && price > 0 ? Math.round(price / area) : null;
  const dimensions = (frontLength || depthLength)
    ? `${frontLength ?? ''}m × ${depthLength ?? ''}m`
    : null;

  const characteristics: string[] = [];
  if (hasBalcony) characteristics.push('Balcón');
  if (isCorner) characteristics.push('Esquina');
  if (features) features.forEach(f => characteristics.push(f.text));

  const handleNavigate = (section: 'home' | 'map' | 'location' | 'contact') => {
    if (section === 'home') navigate(homeUrl);
    else if (section === 'map') navigate(floorUrl);
    else if (section === 'location') setActiveView('location');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden text-white">
      {floorBackgroundUrl && (
        <div className="fixed inset-0 pointer-events-none">
          <img src={floorBackgroundUrl} alt="" className="w-full h-full object-cover opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {activeView === 'unit' ? (
        <>
          {/* PORTRAIT + DESKTOP */}
          <div className="relative h-full overflow-y-auto max-xl:landscape:hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="relative max-w-7xl mx-auto px-6 xl:px-8 pt-6">
              <div className="flex items-center gap-4 mb-1">
                <button
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors outline-none flex-shrink-0"
                  aria-label="Volver"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-2xl xl:text-3xl font-bold tracking-wide">
                  {entityPrefix} {currentLayer.label}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE_STYLES[currentLayer.status]}`}>
                  {statusLabel}
                </span>
              </div>
              {floorNumber != null && (
                <p className="text-sm text-white/30 ml-13">Piso {floorNumber}</p>
              )}
            </div>

            <div className="relative max-w-7xl mx-auto px-6 xl:px-8 py-8 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 items-start">
              <div>
                {showTabs && (
                  <div className="flex gap-1 mb-3">
                    {mediaTabs.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setMediaTab(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none ${
                          mediaTab === key
                            ? 'bg-white/15 text-white'
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {(mediaTab === 'gallery' || (!showTabs && hasGallery)) && mediaTab !== 'video' && mediaTab !== 'tour' && (
                  <>
                    <div
                      className="relative bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] xl:min-h-[420px]"
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      {galleryImages.length > 0 ? (
                        <img
                          src={galleryImages[carouselIndex]?.url}
                          alt={`${entityPrefix} ${currentLayer.label} — ${carouselIndex + 1}/${galleryImages.length}`}
                          className="w-full h-auto object-contain p-4 xl:p-6"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-white/20 text-sm">Sin imagen disponible</span>
                      )}

                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 items-center justify-center transition-colors outline-none"
                            aria-label="Anterior"
                          >
                            <ChevronLeft className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 items-center justify-center transition-colors outline-none"
                            aria-label="Siguiente"
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
                          </button>
                        </>
                      )}

                      {galleryImages.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full text-xs text-white/70">
                          {carouselIndex + 1} / {galleryImages.length}
                        </div>
                      )}
                    </div>

                    {galleryImages.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {galleryImages.map((img, i) => (
                          <button
                            key={img.id}
                            onClick={() => setCarouselIndex(i)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors outline-none flex-shrink-0 ${
                              i === carouselIndex ? 'border-white/60' : 'border-transparent hover:border-white/30'
                            }`}
                          >
                            <img src={img.url!} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {mediaTab === 'video' && (
                  <div className="space-y-4">
                    {videoUrl && (
                      <div className="rounded-2xl overflow-hidden bg-white/5">
                        <div className="aspect-video">
                          <iframe
                            src={getEmbedUrl(videoUrl)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    {uploadedVideos.map((v) => (
                      <div key={v.id} className="rounded-2xl overflow-hidden">
                        <VideoPlayer src={v.url!} className="w-full aspect-video" />
                      </div>
                    ))}
                  </div>
                )}

                {mediaTab === 'tour' && tourEmbedUrl && (
                  <div className="relative rounded-2xl overflow-hidden bg-white/5">
                    <div className="aspect-video">
                      <iframe
                        src={getEmbedUrl(tourEmbedUrl)}
                        className="w-full h-full"
                        allow="xr-spatial-tracking; gyroscope; accelerometer"
                        allowFullScreen
                      />
                    </div>
                    <button
                      onClick={() => setTourModalOpen(true)}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Pantalla completa
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {price != null && price > 0 && (
                  <div className="bg-white/5 rounded-2xl p-5">
                    <div className="text-2xl font-bold">
                      USD $ {price.toLocaleString('es-AR')}
                    </div>
                    {pricePerM2 != null && (
                      <div className="text-sm text-white/40 mt-1">
                        USD {pricePerM2} / {areaLabel}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white/5 rounded-2xl p-5">
                  <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">Detalles</h3>
                  <div className="space-y-3">
                    {isBuilding ? (
                      <>
                        {unitTypeName && <DetailRow label="Tipo" value={unitTypeName} />}
                        {area != null && area > 0 && <DetailRow label="Superficie" value={`${area} ${areaLabel}`} />}
                        {ambientes && <DetailRow label="Ambientes" value={ambientes} />}
                        {orientation && <DetailRow label="Orientación" value={orientation} />}
                      </>
                    ) : (
                      <>
                        {area != null && area > 0 && <DetailRow label="Superficie" value={`${area} ${areaLabel}`} />}
                        {dimensions && <DetailRow label="Dimensiones" value={dimensions} />}
                      </>
                    )}
                  </div>
                </div>

                {characteristics.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">Características</h3>
                    <div className="space-y-2.5">
                      {characteristics.map((text, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                          <span className="text-sm">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {description && (
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Descripción</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{description}</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={handleEmail} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none" aria-label="Email">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button onClick={handleWhatsApp} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none" aria-label="WhatsApp">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none" aria-label="Compartir">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {siblings.length > 1 && (
              <div className="relative max-w-7xl mx-auto px-6 xl:px-8 pb-12">
                <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
                  Otras unidades en este piso
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {siblings.map((sibling) => {
                    const isCurrent = sibling.id === currentLayer.id;
                    return (
                      <button
                        key={sibling.id}
                        onClick={() => !isCurrent && navigateToSibling(sibling)}
                        disabled={isCurrent}
                        className={`bg-white/5 rounded-xl p-4 text-left transition-all outline-none ${
                          isCurrent
                            ? 'ring-1 ring-sky-400/50 bg-sky-500/10 cursor-default'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold text-white text-sm">{sibling.name}</div>
                        {sibling.area && (
                          <div className="text-xs text-white/40 mt-1">{sibling.area} {areaLabel}</div>
                        )}
                        {sibling.price && (
                          <div className="text-sm font-medium text-green-400 mt-1">
                            ${sibling.price.toLocaleString()}
                          </div>
                        )}
                        <span className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE_STYLES[sibling.status]}`}>
                          {STATUS_LABELS[sibling.status]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="h-20 xl:h-0" />
          </div>

          {/* LANDSCAPE MOBILE */}
          <div className="relative h-full hidden max-xl:landscape:flex flex-row">
            <div className="w-[55%] h-full flex flex-col p-3 pt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={() => navigate(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors outline-none flex-shrink-0"
                  aria-label="Volver"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <h1 className="text-sm font-bold tracking-wide truncate">
                  {entityPrefix} {currentLayer.label}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 ${STATUS_BADGE_STYLES[currentLayer.status]}`}>
                  {statusLabel}
                </span>
              </div>
              {floorNumber != null && (
                <p className="text-[10px] text-white/30 ml-9 -mt-0.5 mb-1">Piso {floorNumber}</p>
              )}

              {showTabs && (
                <div className="flex gap-1 mb-1.5">
                  {mediaTabs.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setMediaTab(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors outline-none ${
                        mediaTab === key
                          ? 'bg-white/15 text-white'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {(mediaTab === 'gallery' || (!showTabs && hasGallery)) && mediaTab !== 'video' && mediaTab !== 'tour' && (
                <>
                  <div
                    className="flex-1 min-h-0 relative bg-white/5 rounded-xl overflow-hidden flex items-center justify-center"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {galleryImages.length > 0 ? (
                      <img
                        src={galleryImages[carouselIndex]?.url}
                        alt={`${entityPrefix} ${currentLayer.label}`}
                        className="w-full h-full object-contain p-2"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-white/20 text-xs">Sin imagen</span>
                    )}
                    {galleryImages.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-full text-[10px] text-white/70">
                        {carouselIndex + 1} / {galleryImages.length}
                      </div>
                    )}
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                      {galleryImages.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setCarouselIndex(i)}
                          className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-colors outline-none flex-shrink-0 ${
                            i === carouselIndex ? 'border-white/60' : 'border-transparent hover:border-white/30'
                          }`}
                        >
                          <img src={img.url!} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {mediaTab === 'video' && (
                <div className="flex-1 min-h-0 space-y-2">
                  {videoUrl && (
                    <div className="rounded-xl overflow-hidden bg-white/5 h-full">
                      <div className="aspect-video">
                        <iframe
                          src={getEmbedUrl(videoUrl)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                  {uploadedVideos.map((v) => (
                    <div key={v.id} className="rounded-xl overflow-hidden">
                      <VideoPlayer src={v.url!} className="w-full aspect-video" />
                    </div>
                  ))}
                </div>
              )}

              {mediaTab === 'tour' && tourEmbedUrl && (
                <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden bg-white/5">
                  <iframe
                    src={getEmbedUrl(tourEmbedUrl)}
                    className="w-full h-full"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                    allowFullScreen
                  />
                  <button
                    onClick={() => setTourModalOpen(true)}
                    className="absolute top-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Expandir
                  </button>
                </div>
              )}
            </div>

            <div className="w-[45%] h-full overflow-y-auto p-3 pt-11 space-y-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
              {price != null && price > 0 && (
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-lg font-bold">USD $ {price.toLocaleString('es-AR')}</div>
                  {pricePerM2 != null && (
                    <div className="text-[11px] text-white/40 mt-0.5">USD {pricePerM2} / {areaLabel}</div>
                  )}
                </div>
              )}

              <div className="bg-white/5 rounded-xl p-3">
                <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Detalles</h3>
                <div className="space-y-2">
                  {isBuilding ? (
                    <>
                      {unitTypeName && <DetailRow label="Tipo" value={unitTypeName} compact />}
                      {area != null && area > 0 && <DetailRow label="Superficie" value={`${area} ${areaLabel}`} compact />}
                      {ambientes && <DetailRow label="Ambientes" value={ambientes} compact />}
                      {orientation && <DetailRow label="Orientación" value={orientation} compact />}
                    </>
                  ) : (
                    <>
                      {area != null && area > 0 && <DetailRow label="Superficie" value={`${area} ${areaLabel}`} compact />}
                      {dimensions && <DetailRow label="Dimensiones" value={dimensions} compact />}
                    </>
                  )}
                </div>
              </div>

              {characteristics.length > 0 && (
                <div className="bg-white/5 rounded-xl p-3">
                  <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Características</h3>
                  <div className="space-y-1.5">
                    {characteristics.map((text, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-green-400" />
                        </div>
                        <span className="text-xs">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {description && (
                <div className="bg-white/5 rounded-xl p-3">
                  <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Descripción</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{description}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                <button onClick={handleEmail} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none" aria-label="Email">
                  <Mail className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleWhatsApp} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none" aria-label="WhatsApp">
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none" aria-label="Compartir">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {siblings.length > 1 && (
                <div className="pt-1 pb-3">
                  <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Otras unidades</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {siblings.map((sibling) => {
                      const isCurrent = sibling.id === currentLayer.id;
                      return (
                        <button
                          key={sibling.id}
                          onClick={() => !isCurrent && navigateToSibling(sibling)}
                          disabled={isCurrent}
                          className={`bg-white/5 rounded-lg p-2 text-left transition-all outline-none ${
                            isCurrent
                              ? 'ring-1 ring-sky-400/50 bg-sky-500/10 cursor-default'
                              : 'hover:bg-white/10'
                          }`}
                        >
                          <div className="font-semibold text-white text-[11px]">{sibling.name}</div>
                          {sibling.area && <div className="text-[9px] text-white/40">{sibling.area} {areaLabel}</div>}
                          <span className={`mt-1 inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold ${STATUS_BADGE_STYLES[sibling.status]}`}>
                            {STATUS_LABELS[sibling.status]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <LocationView project={project} />
      )}

      <TopNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onContactOpen={() => setContactOpen(true)}
        mapLabel="Niveles"
        showBack={activeView === 'location'}
        onBack={() => setActiveView('unit')}
      />

      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      {tourModalOpen && tourEmbedUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setTourModalOpen(false)}
        >
          <div
            className="relative w-full h-full max-w-6xl max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTourModalOpen(false)}
              className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={getEmbedUrl(tourEmbedUrl)}
              className="w-full h-full rounded-xl"
              allow="xr-spatial-tracking; gyroscope; accelerometer"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`flex justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="text-white/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
