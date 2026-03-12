import { useState, useCallback } from 'react';
import {
  ChevronLeft,
  Ruler,
  Grid3X3,
  Mail,
  Phone,
  Share2,
  Check,
  Home,
  Map,
  MapPin,
} from 'lucide-react';
import type { Layer, Media, Project } from '@/types/hierarchy.types';
import { FadeImage } from '@/components/shared/FadeImage';
import { STATUS_LABELS } from '@/lib/constants/status';
import { getFeatureIcon } from '@/lib/constants/feature-icons';

interface LotFichaOverlayProps {
  lot: Layer;
  media: Media[];
  project: Project;
  logos: Media[];
  onClose: () => void;
  onNavigate?: (section: 'home' | 'map' | 'location' | 'contact') => void;
  onContactOpen?: () => void;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  available: 'bg-green-500/80 text-white',
  reserved: 'bg-yellow-500/80 text-white',
  sold: 'bg-red-500/80 text-white',
  not_available: 'bg-gray-500/80 text-white',
};

const NAV_ITEMS: { section: 'home' | 'map' | 'location' | 'contact'; icon: typeof Home; label: string }[] = [
  { section: 'home', icon: Home, label: 'Inicio' },
  { section: 'map', icon: Map, label: 'Mapa' },
  { section: 'location', icon: MapPin, label: 'Ubicación' },
  { section: 'contact', icon: Phone, label: 'Contacto' },
];

export function LotFichaOverlay({
  lot,
  media,
  project,
  logos,
  onClose,
  onNavigate,
  onContactOpen,
}: LotFichaOverlayProps) {
  const [copied, setCopied] = useState(false);

  const fichaImage = media.find(
    (m) => m.purpose === 'ficha_furnished' || m.purpose === 'thumbnail'
  );
  const previewImage = fichaImage ?? media.find((m) => m.type === 'image');
  const mobileBackground = media.find((m) => m.purpose === 'background_mobile');
  const desktopBackground = media.find((m) => m.purpose === 'background');

  const areaLabel = lot.areaUnit === 'ft2' ? 'ft²' : lot.areaUnit === 'ha' ? 'ha' : 'm²';
  const price = lot.price ?? 0;
  const dimensions = (lot.properties?.dimensions as string) ?? `${lot.frontLength}m x ${lot.depthLength}m`;
  const area = lot.area ?? 0;
  const features = lot.features ?? [];

  const handleWhatsApp = useCallback(() => {
    const whatsapp = project.whatsapp?.replace(/\D/g, '') ?? '';
    const message = encodeURIComponent(
      `Hola, me interesa el Lote ${lot.label} en ${project.name}. ¿Podrían darme más información?`
    );
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
  }, [project, lot.label]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(
      `Consulta Lote ${lot.label} - ${project.name}`
    );
    const body = encodeURIComponent(
      `Hola, me interesa el Lote ${lot.label}. ¿Podrían darme más información?`
    );
    window.open(
      `mailto:${project.email}?subject=${subject}&body=${body}`,
      '_blank'
    );
  }, [project, lot.label]);

  const handleShare = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleNavClick = useCallback((section: 'home' | 'map' | 'location' | 'contact') => {
    if (section === 'contact') {
      if (onContactOpen) onContactOpen();
      else handleWhatsApp();
    } else {
      onClose();
      onNavigate?.(section);
    }
  }, [onClose, onNavigate, onContactOpen, handleWhatsApp]);

  const allFeatures = [
    ...(lot.isCorner ? [{ icon: 'corner-down-right' as const, text: 'Esquina' }] : []),
    ...features,
  ];
  const featureItems = allFeatures.slice(0, 3).map((f) => ({
    icon: getFeatureIcon(f.icon),
    text: f.text,
  }));

  const statusLabel = STATUS_LABELS[lot.status]?.toUpperCase() ?? lot.status;

  return (
    <>
      {/* MOBILE PORTRAIT */}
      <div className="xl:hidden landscape:hidden fixed inset-0 z-50">
        {(mobileBackground?.url || desktopBackground?.url) && (
          <FadeImage
            src={mobileBackground?.url ?? desktopBackground?.url}
            alt={`Lote ${lot.label}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {!mobileBackground?.url && !desktopBackground?.url && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        )}

        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center lots-glass rounded-full hover:bg-black/50 transition-colors outline-none"
          aria-label="Volver"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        <div
          className="fixed bottom-0 left-0 right-0 z-10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="lots-glass rounded-t-xl px-3 pt-2 pb-1.5 text-white">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold tracking-wide">LOTE {lot.label}</h2>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${STATUS_BADGE_STYLES[lot.status]}`}>
                {statusLabel}
              </span>
            </div>

            <div className="bg-white/10 rounded-md p-1.5 mb-1 text-center">
              <span className="text-[11px] font-bold">USD $ {price.toLocaleString('es-AR')}</span>
            </div>

            <div className="grid grid-cols-2 gap-px mb-1">
              <div className="bg-white/5 rounded-l-md p-1.5">
                <div className="flex items-center gap-1 text-white/60 text-[8px] mb-0.5">
                  <Ruler className="w-2.5 h-2.5" /><span>Dimensiones</span>
                </div>
                <span className="font-medium text-[10px]">{dimensions}</span>
              </div>
              <div className="bg-white/5 rounded-r-md p-1.5 border-l border-white/10">
                <div className="flex items-center gap-1 text-white/60 text-[8px] mb-0.5">
                  <Grid3X3 className="w-2.5 h-2.5" /><span>Superficie</span>
                </div>
                <span className="font-medium text-[10px]">{area} {areaLabel}</span>
              </div>
            </div>

            <div className="space-y-0.5 mb-1">
              {featureItems.map(({ icon: Icon, text }, i) => (
                <div key={i} className="bg-white/5 rounded-md p-1.5 flex items-center gap-1.5">
                  <Icon className="w-2.5 h-2.5 text-white/60 flex-shrink-0" />
                  <span className="text-[9px] leading-tight">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              {logos.length > 0 && (
                <img src={(logos.find(l => l.purpose === 'logo_developer') ?? logos[logos.length - 1]).url!} alt="" className="h-4" />
              )}
              <div className="flex gap-1 ml-auto">
                <button onClick={handleEmail} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md transition-colors outline-none">
                  <Mail className="w-3 h-3" />
                </button>
                <button onClick={handleWhatsApp} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md transition-colors outline-none">
                  <Phone className="w-3 h-3" />
                </button>
                <button onClick={handleShare} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md transition-colors outline-none">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <nav className="h-14 lots-glass flex items-center justify-around px-2">
            {NAV_ITEMS.map(({ section, icon: Icon, label }) => (
              <button
                key={section}
                onClick={() => handleNavClick(section)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-white/70 active:text-white transition-colors outline-none"
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* MOBILE LANDSCAPE */}
      <div className="xl:hidden portrait:hidden fixed inset-0 z-50 pointer-events-none">
        {(desktopBackground?.url || mobileBackground?.url) && (
          <FadeImage
            src={desktopBackground?.url ?? mobileBackground?.url}
            alt={`Lote ${lot.label}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {!desktopBackground?.url && !mobileBackground?.url && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        )}

        <button
          onClick={onClose}
          className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center lots-glass rounded-full hover:bg-black/50 transition-colors outline-none pointer-events-auto"
          aria-label="Volver"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-white" />
        </button>

        <div className="absolute left-[5%] w-[150px] md:w-[200px] top-10 bottom-3 overflow-y-auto pointer-events-auto">
          <div className="lots-glass rounded-2xl p-2 md:p-2.5 text-white">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[10px] md:text-xs font-bold tracking-wide">LOTE {lot.label}</h2>
              <span className={`px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-semibold ${STATUS_BADGE_STYLES[lot.status]}`}>
                {statusLabel}
              </span>
            </div>

            <div className="bg-white/10 rounded-md p-1 md:p-1.5 mb-1 text-center">
              <span className="text-[10px] md:text-xs font-bold">USD $ {price.toLocaleString('es-AR')}</span>
            </div>

            <div className="space-y-0.5 mb-1">
              <div className="bg-white/5 rounded-md p-1 md:p-1.5">
                <div className="flex items-center gap-1 text-white/60 text-[7px] md:text-[8px] mb-0.5">
                  <Ruler className="w-2 h-2 md:w-2.5 md:h-2.5" /><span>Dimensiones</span>
                </div>
                <span className="font-medium text-[9px] md:text-[10px]">{dimensions}</span>
              </div>
              <div className="bg-white/5 rounded-md p-1 md:p-1.5">
                <div className="flex items-center gap-1 text-white/60 text-[7px] md:text-[8px] mb-0.5">
                  <Grid3X3 className="w-2 h-2 md:w-2.5 md:h-2.5" /><span>Superficie</span>
                </div>
                <span className="font-medium text-[9px] md:text-[10px]">{area} {areaLabel}</span>
              </div>
            </div>

            <div className="space-y-0.5 mb-1">
              {featureItems.map(({ icon: Icon, text }, i) => (
                <div key={i} className="bg-white/5 rounded-md p-1 md:p-1.5 flex items-center gap-1">
                  <Icon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white/60 flex-shrink-0" />
                  <span className="text-[7px] md:text-[8px] leading-tight">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              {logos.length > 0 && (
                <img src={(logos.find(l => l.purpose === 'logo_developer') ?? logos[logos.length - 1]).url!} alt="" className="h-3.5 md:h-4" />
              )}
              <div className="flex gap-1 ml-auto">
                <button onClick={handleEmail} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md transition-colors outline-none">
                  <Mail className="w-2.5 h-2.5 md:w-3 md:h-3" />
                </button>
                <button onClick={handleWhatsApp} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md transition-colors outline-none">
                  <Phone className="w-2.5 h-2.5 md:w-3 md:h-3" />
                </button>
                <button onClick={handleShare} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md transition-colors outline-none">
                  {copied ? <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400" /> : <Share2 className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden xl:block fixed inset-0 z-50 bg-black/60 backdrop-blur-md">
        {(desktopBackground?.url || mobileBackground?.url) && (
          <FadeImage
            src={desktopBackground?.url ?? mobileBackground?.url}
            alt={`Lote ${lot.label}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-10 w-12 h-12 flex items-center justify-center lots-glass rounded-full hover:bg-black/50 transition-colors outline-none"
          aria-label="Volver"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-[420px] max-h-[90vh] overflow-y-auto lots-glass rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold tracking-wide">LOTE {lot.label}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_BADGE_STYLES[lot.status]}`}>
              {statusLabel}
            </span>
          </div>

          {previewImage?.url && (
            <div className="rounded-xl overflow-hidden mb-3 h-28">
              <img src={previewImage.url} alt="Vista del desarrollo" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="bg-white/10 rounded-lg p-3 mb-3 text-center">
            <span className="text-xl font-bold">USD $ {price.toLocaleString('es-AR')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                <Ruler className="w-4 h-4" /><span>Dimensiones</span>
              </div>
              <span className="font-medium text-base">{dimensions}</span>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                <Grid3X3 className="w-4 h-4" /><span>Superficie</span>
              </div>
              <span className="font-medium text-base">{area} {areaLabel}</span>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {featureItems.map(({ icon: Icon, text }, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                <Icon className="w-4 h-4 text-white/60 flex-shrink-0" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            {logos.length > 0 && (
              <img src={(logos.find(l => l.purpose === 'logo_developer') ?? logos[logos.length - 1]).url!} alt="" className="h-8" />
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={handleEmail} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors outline-none" aria-label="Email">
                <Mail className="w-4 h-4" />
              </button>
              <button onClick={handleWhatsApp} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors outline-none" aria-label="WhatsApp">
                <Phone className="w-4 h-4" />
              </button>
              <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors outline-none" aria-label="Compartir">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
