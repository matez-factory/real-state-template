import { useState, useMemo, useCallback, useRef } from 'react';
import { Ruler, Grid3X3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Layer, Media, Project } from '@/types/hierarchy.types';
import { FadeImage } from '@/components/shared/FadeImage';
import { UnitStatusBadge } from '@/components/unit/UnitStatusBadge';
import { UnitInfoCard } from '@/components/unit/UnitInfoCard';
import { UnitFeatureRow } from '@/components/unit/UnitFeatureRow';
import { TopNav, MobileTabIcon } from '@/components/navigation/TopNav';
import { SocialButtons } from '@/components/navigation/SocialButtons';
import { ContactModal } from '@/components/navigation/ContactModal';
import { getFeatureIcon, type FeatureIconValue } from '@/lib/constants/feature-icons';

interface LotFichaOverlayProps {
  lot: Layer;
  media: Media[];
  project: Project;
  logos: Media[];
  onClose: () => void;
  onNavigate?: (section: 'home' | 'map' | 'location') => void;
  onContactOpen?: () => void;
}

const poppins = "'Poppins', system-ui, sans-serif";

const MOBILE_NAV_ITEMS: { section: 'home' | 'map' | 'location'; label: string }[] = [
  { section: 'home', label: 'Inicio' },
  { section: 'map', label: 'Lotes' },
  { section: 'location', label: 'Ubicación' },
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
  const [expanded, setExpanded] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Drag-to-expand gesture
  const dragStartY = useRef<number | null>(null);
  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);
  const handleDragEnd = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current == null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    dragStartY.current = null;
    if (dy > 40 && !expanded) setExpanded(true);
    if (dy < -40 && expanded) setExpanded(false);
  }, [expanded]);

  const fichaImage = media.find(
    (m) => m.purpose === 'ficha_furnished' || m.purpose === 'thumbnail'
  );
  const previewImage = fichaImage ?? media.find((m) => m.type === 'image');
  const mobileBackground = media.find((m) => m.purpose === 'background_mobile');
  const desktopBackground = media.find((m) => m.purpose === 'background');

  const areaLabel = lot.areaUnit === 'ft2' ? 'ft²' : lot.areaUnit === 'ha' ? 'ha' : 'm²';
  const price = lot.price ?? 0;
  const dimensions = (lot.properties?.dimensions as string) ?? (lot.frontLength && lot.depthLength ? `${lot.frontLength}m x ${lot.depthLength}m` : null);
  const area = lot.area ?? 0;
  const features = lot.features ?? [];

  const priceFormatted = useMemo(() => {
    if (!price || price <= 0) return null;
    return `USD $ ${price.toLocaleString('es-AR')}`;
  }, [price]);

  const allFeatures = useMemo(() => {
    const items: { icon: FeatureIconValue; text: string }[] = [];
    if (dimensions) items.push({ icon: Ruler, text: `Dimensiones ${dimensions}` });
    if (area > 0) items.push({ icon: Grid3X3, text: `Superficie ${area} ${areaLabel}` });
    if (lot.isCorner) items.push({ icon: getFeatureIcon('corner-down-right'), text: 'Lote en esquina' });
    for (const f of features) {
      items.push({ icon: getFeatureIcon(f.icon, f.text), text: f.text });
    }
    return items;
  }, [dimensions, area, areaLabel, lot.isCorner, features]);

  // Adapt lot for UnitInfoCard: inject lot-specific data as features
  const lotLayer = useMemo<Layer>(() => {
    const lotFeatures: { icon: string; text: string }[] = [];
    if (dimensions) lotFeatures.push({ icon: 'ruler', text: `Dimensiones ${dimensions}` });
    if (area > 0) lotFeatures.push({ icon: 'grid-3x3', text: `Superficie ${area} ${areaLabel}` });
    if (lot.isCorner) lotFeatures.push({ icon: 'corner-down-right', text: 'Lote en esquina' });
    for (const f of features) {
      lotFeatures.push({ icon: f.icon, text: f.text });
    }
    return {
      ...lot,
      label: `Lote ${lot.label}`,
      features: lotFeatures,
      // Clear fields that UnitInfoCard would render separately
      area: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      hasBalcony: undefined,
    };
  }, [lot, dimensions, area, areaLabel, features]);

  const handleNavClick = useCallback((section: string) => {
    onClose();
    onNavigate?.(section as 'home' | 'map' | 'location');
  }, [onClose, onNavigate]);

  const handleContact = useCallback(() => {
    if (onContactOpen) {
      onContactOpen();
    } else {
      setContactOpen(true);
    }
  }, [onContactOpen]);

  const handleHomeNav = useCallback(() => {
    onClose();
    onNavigate?.('home');
  }, [onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2A2A]">
      {/* Background image */}
      {(desktopBackground?.url || mobileBackground?.url) && (
        <>
          <FadeImage
            src={desktopBackground?.url ?? mobileBackground?.url}
            alt={`Lote ${lot.label}`}
            className={`absolute inset-0 w-full h-full object-cover ${mobileBackground?.url ? 'portrait:max-xl:hidden' : ''}`}
          />
          {mobileBackground?.url && (
            <FadeImage
              src={mobileBackground.url}
              alt={`Lote ${lot.label}`}
              className="absolute inset-0 w-full h-full object-cover hidden portrait:max-xl:block"
            />
          )}
        </>
      )}

      {/* TopNav — same as UnitPage, hidden on mobile portrait (bottom sheet has its own nav) */}
      <TopNav
        activeSection="map"
        onNavigate={handleNavClick}
        onContactOpen={handleContact}
        mapLabel="Lotes"
        showBack
        onBack={onClose}
        showHome
        onHome={handleHomeNav}
        hideMobileNav
        compact
      />

      {/* Desktop/Landscape: Use UnitInfoCard directly — identical to building */}
      <div className="absolute left-[47px] top-1/2 -translate-y-1/2 z-30 hidden landscape:block landscape:max-lg:left-[60px] landscape:max-lg:origin-left landscape:max-lg:scale-[0.5]">
        <UnitInfoCard
          layer={lotLayer}
          thumbnailUrl={previewImage?.url}
          accentColor={project.accentColor}
          onContact={handleContact}
        />
      </div>

      {/* Social buttons — desktop/landscape only */}
      <SocialButtons project={project} />

      {/* ── MOBILE PORTRAIT: Bottom sheet ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 landscape:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="relative rounded-t-[20px] overflow-hidden"
          style={{ filter: 'drop-shadow(0px -4px 20px rgba(0,0,0,0.15))' }}
        >
          {/* Glass bg layers */}
          <div className="absolute inset-0 rounded-t-[20px] bg-white" />
          <div
            className="absolute inset-0 rounded-t-[20px]"
            style={{
              background: 'linear-gradient(270deg, rgba(214, 214, 214, 0.45) 0%, rgba(112, 112, 112, 0.45) 90.38%)',
              backgroundBlendMode: 'luminosity',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* Handle bar — draggable, bigger touch target when expanded */}
          <div
            className={`relative z-10 flex justify-center cursor-grab ${expanded ? 'pt-[12px] pb-[8px]' : 'pt-[8px] pb-[4px]'}`}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            <div className="w-[36px] h-[4px] rounded-full bg-[#484848]/30" />
          </div>

          {/* ── Collapsed card ── */}
          {!expanded && (
            <div
              className="relative z-10 px-[16px] pt-[4px] pb-[6px]"
              onTouchStart={handleDragStart}
              onTouchEnd={handleDragEnd}
            >
              <div className="flex items-center justify-between">
                <UnitStatusBadge status={lot.status} />
                {priceFormatted && (
                  <span
                    className="text-[16px] font-semibold"
                    style={{ color: project.accentColor || '#1A1A1A', fontFamily: poppins }}
                  >
                    {priceFormatted}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-[2px]">
                <span
                  className="text-[20px] font-medium"
                  style={{ color: '#484848', fontFamily: poppins }}
                >
                  Lote {lot.label}
                </span>
                <button
                  onClick={() => setExpanded(true)}
                  className="px-[14px] py-[4px] rounded-full text-[12px] font-medium text-white outline-none"
                  style={{ backgroundColor: project.accentColor || '#1A1A1A' }}
                >
                  Ver Más
                </button>
              </div>
              {/* Compact features */}
              <div className="flex items-center justify-center gap-[16px] mt-[6px] pb-[4px]">
                {dimensions && (
                  <div className="flex items-center gap-[5px] flex-shrink-0">
                    <Ruler className="w-[18px] h-[18px] text-[#7D7D7D]" strokeWidth={1.5} />
                    <span className="text-[12px] text-[#7D7D7D]" style={{ fontFamily: poppins }}>
                      {dimensions}
                    </span>
                  </div>
                )}
                {area > 0 && (
                  <div className="flex items-center gap-[5px] flex-shrink-0">
                    <Grid3X3 className="w-[18px] h-[18px] text-[#7D7D7D]" strokeWidth={1.5} />
                    <span className="text-[12px] text-[#7D7D7D]" style={{ fontFamily: poppins }}>
                      {area} {areaLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Expanded card ── */}
          {expanded && (
            <div className="relative z-10 max-h-[65vh] overflow-y-auto">
              <div
                className="mx-[10px] mt-[10px] mb-[8px] rounded-[16px] px-[18px] pt-[14px] pb-[16px] relative"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  boxShadow: 'inset 0px 0px 16px rgba(255, 255, 255, 0.05), inset 0px 4px 4px rgba(255, 255, 255, 0.15)',
                }}
              >
                {/* Close × */}
                <button
                  onClick={() => setExpanded(false)}
                  className="absolute top-[10px] right-[14px] w-[24px] h-[24px] flex items-center justify-center text-[#7D7D7D] text-[18px] outline-none"
                  aria-label="Cerrar"
                >
                  ×
                </button>

                <UnitStatusBadge status={lot.status} />

                <div className="flex items-baseline justify-between mt-[2px] pr-[28px]">
                  <span
                    className="text-[22px] font-medium"
                    style={{ color: '#484848', fontFamily: poppins }}
                  >
                    Lote {lot.label}
                  </span>
                  {priceFormatted && (
                    <span
                      className="text-[20px] font-semibold"
                      style={{ color: project.accentColor || '#1A1A1A', fontFamily: poppins }}
                    >
                      {priceFormatted}
                    </span>
                  )}
                </div>

                {/* Features (includes dimensions + area + custom features) */}
                {allFeatures.length > 0 && (
                  <div className="flex flex-col gap-[6px] mt-[12px]">
                    {allFeatures.map((f, i) => (
                      <div key={i} className="flex items-center gap-[8px]">
                        {typeof f.icon === 'string' ? (
                          <img src={f.icon} alt="" className="w-[16px] h-[16px] shrink-0 object-contain" />
                        ) : (
                          (() => { const Icon = f.icon as LucideIcon; return <Icon className="w-[16px] h-[16px] shrink-0" style={{ color: '#5A5A5A', strokeWidth: 1.5 }} />; })()
                        )}
                        <span className="text-[13px]" style={{ color: '#7D7D7D', fontFamily: poppins }}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleContact}
                  className="w-full h-[40px] mt-[14px] flex items-center justify-center rounded-[69px] transition-opacity hover:opacity-90 outline-none"
                  style={{ background: project.accentColor || '#1A1A1A' }}
                >
                  <span className="text-[15px] font-medium text-white capitalize" style={{ fontFamily: poppins }}>
                    Solicitar Información
                  </span>
                </button>
              </div>

              {/* Thumbnail below the white card */}
              {previewImage?.url && (
                <div className="mx-[10px] mb-[8px] rounded-[14px] overflow-hidden">
                  <img src={previewImage.url} alt="" className="w-full h-[130px] object-cover" />
                </div>
              )}
            </div>
          )}

          {/* ── Bottom nav tabs (3 items, no Contacto) ── */}
          <div className="relative z-10 flex items-center justify-around px-[24px] pb-[14px] pt-[4px]">
            {MOBILE_NAV_ITEMS.map(({ section, label }) => {
              const isActive = section === 'map';
              return (
                <button
                  key={section}
                  onClick={() => handleNavClick(section)}
                  className={`flex flex-col items-center justify-center gap-[6px] w-[100px] h-[55px] rounded-[100px] transition-colors outline-none ${
                    isActive ? 'bg-[rgba(234,234,234,0.7)]' : ''
                  }`}
                >
                  <MobileTabIcon section={section} active={isActive} />
                  <span
                    className="text-[12px] leading-[125%] tracking-[0.02em]"
                    style={{
                      fontFamily: poppins,
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

      {/* Contact modal */}
      <ContactModal
        project={project}
        logos={logos}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
