import { useMemo, useCallback, useRef } from 'react';
import { Ruler, BedDouble, Bath, Fence, WashingMachine, Car, Compass } from 'lucide-react';
import type { Layer } from '@/types/hierarchy.types';
import { getFeatureIcon } from '@/lib/constants/feature-icons';
import { UnitStatusBadge } from './UnitStatusBadge';
import { MobileTabIcon } from '@/components/navigation/TopNav';

type NavSection = 'home' | 'map' | 'location' | 'contact' | 'planos' | 'galeria' | 'tour';

interface NavItem {
  section: NavSection;
  label: string;
}

interface MobileUnitSheetProps {
  layer: Layer;
  thumbnailUrl?: string;
  accentColor?: string;
  onContact: () => void;
  activeSection: NavSection | string;
  navItems: NavItem[];
  onNavigate: (section: NavSection) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  hideCard?: boolean;
}

const poppins = "'Poppins', system-ui, sans-serif";

export function MobileUnitSheet({
  layer,
  thumbnailUrl,
  accentColor,
  onContact,
  activeSection,
  navItems,
  onNavigate,
  expanded,
  onExpandedChange,
  hideCard,
}: MobileUnitSheetProps) {

  const {
    label, status, price, description, orientation, area, areaUnit, bedrooms, bathrooms, hasBalcony, features,
  } = layer;
 
  const areaLabel = areaUnit === 'ft2' ? 'ft²' : areaUnit === 'ha' ? 'ha' : 'm²';

  const priceFormatted = useMemo(() => {
    if (!price || price <= 0) return null;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [price]);

  // Compact features for collapsed state
  const compactFeatures = useMemo(() => {
    const items: { icon: string; text: string }[] = [];
    if (area && area > 0) items.push({ icon: 'ruler', text: `${area} ${areaLabel}` });
    // In compact view, monoambientes show "Mono" instead of a misleading "0"
    if (bedrooms === 0 || (typeof description === 'string' && description.toLowerCase().includes('monoambiente'))) {
      items.push({ icon: 'bed', text: 'Mono' });
    } else if (bedrooms != null) {
      items.push({ icon: 'bed', text: `${bedrooms}` });
    }
    if (bathrooms != null) items.push({ icon: 'bath', text: `${bathrooms}` });
    if (hasBalcony) items.push({ icon: 'fence', text: 'Balcón' });
    return items;
  }, [area, areaLabel, bedrooms, bathrooms, hasBalcony, description]);

  // Monoambiente check: bedrooms 0 OR description explicitly says "monoambiente"
  const isMonoambiente = useMemo(
    () =>
      bedrooms === 0 ||
      (typeof description === 'string' && description.toLowerCase().includes('monoambiente')),
    [bedrooms, description]
  );

  // Full features for expanded state
  const featureRows = useMemo(() => {
    const rows: { icon: typeof Ruler; text: string }[] = [];
    if (area && area > 0) rows.push({ icon: Ruler, text: `Área Total ${area} ${areaLabel}` });
    if (isMonoambiente) {
      rows.push({ icon: BedDouble, text: 'Monoambiente' });
    } else if (bedrooms != null) {
      rows.push({ icon: BedDouble, text: `${bedrooms} Dormitorio${bedrooms !== 1 ? 's' : ''}` });
    }
    if (bathrooms != null) rows.push({ icon: Bath, text: `${bathrooms} Baño${bathrooms !== 1 ? 's' : ''}` });
    if (hasBalcony) rows.push({ icon: Fence, text: 'Balcón' });
    if (orientation) rows.push({ icon: Compass, text: `Orientación ${orientation}` });
    if (features) {
      for (const f of features) {
        const iconName = f.icon?.toLowerCase() ?? '';
        if (iconName === 'washing-machine' || f.text.toLowerCase().includes('lavander')) {
          rows.push({ icon: WashingMachine, text: f.text });
        } else if (iconName === 'parking-circle' || iconName === 'car' || f.text.toLowerCase().includes('parking') || f.text.toLowerCase().includes('cochera')) {
          rows.push({ icon: Car, text: f.text });
        } else {
          rows.push({ icon: getFeatureIcon(f.icon), text: f.text });
        }
      }
    }
    return rows;
  }, [area, areaLabel, bedrooms, bathrooms, hasBalcony, features, orientation, isMonoambiente]);

  const handleClose = useCallback(() => onExpandedChange(false), [onExpandedChange]);

  // Drag-to-expand gesture
  const dragStartY = useRef<number | null>(null);
  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);
  const handleDragEnd = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current == null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    dragStartY.current = null;
    if (dy > 40 && !expanded) onExpandedChange(true);
    if (dy < -40 && expanded) onExpandedChange(false);
  }, [expanded, onExpandedChange]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 landscape:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Glass container */}
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
        {!hideCard && (
          <div
            className={`relative z-10 flex justify-center cursor-grab ${expanded ? 'pt-[12px] pb-[8px]' : 'pt-[8px] pb-[4px]'}`}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            <div className="w-[36px] h-[4px] rounded-full bg-[#484848]/30" />
          </div>
        )}

        {/* ── Collapsed card ── */}
        {!hideCard && !expanded && (
          <div
            className="relative z-10 px-[16px] pt-[4px] pb-[6px]"
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            {/* Row 1: Status + Price */}
            <div className="flex items-center justify-between">
              <UnitStatusBadge status={status} />
              {priceFormatted && (
                <span
                  className="text-[16px] font-semibold"
                  style={{ color: accentColor || '#1A1A1A', fontFamily: poppins }}
                >
                  {priceFormatted}
                </span>
              )}
            </div>
            {/* Row 2: Label + Ver Más */}
            <div className="flex items-center justify-between mt-[2px]">
              <span
                className="text-[20px] font-medium capitalize"
                style={{ color: '#484848', fontFamily: poppins }}
              >
                {label}
              </span>
              <button
                onClick={() => onExpandedChange(true)}
                className="px-[14px] py-[4px] rounded-full text-[12px] font-medium text-white outline-none"
                style={{ backgroundColor: accentColor || '#1A1A1A' }}
              >
                Ver Más
              </button>
            </div>
            {/* Row 3: Compact features — centered */}
            <div className="flex items-center justify-center gap-[16px] mt-[6px] pb-[4px] overflow-x-auto [&::-webkit-scrollbar]:h-0">
              {compactFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-[5px] flex-shrink-0">
                  <CompactIcon type={f.icon} />
                  <span className="text-[12px] text-[#7D7D7D] whitespace-nowrap" style={{ fontFamily: poppins }}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Expanded card ── */}
        {!hideCard && expanded && (
          <div className="relative z-10 max-h-[65vh] overflow-y-auto">
            {/* White inner card */}
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
                onClick={handleClose}
                className="absolute top-[10px] right-[14px] w-[24px] h-[24px] flex items-center justify-center text-[#7D7D7D] text-[18px] outline-none"
                aria-label="Cerrar"
              >
                ×
              </button>

              {/* Status */}
              <UnitStatusBadge status={status} />

              {/* Label + Price */}
              <div className="flex items-baseline justify-between mt-[2px] pr-[28px]">
                <span
                  className="text-[22px] font-medium capitalize"
                  style={{ color: '#484848', fontFamily: poppins }}
                >
                  {label}
                </span>
                {priceFormatted && (
                  <span
                    className="text-[20px] font-semibold"
                    style={{ color: accentColor || '#1A1A1A', fontFamily: poppins }}
                  >
                    {priceFormatted}
                  </span>
                )}
              </div>

              {/* Description — hide if it's just "Monoambiente" (rendered as a feature row) */}
              {description && description.trim().toLowerCase() !== 'monoambiente' && (
                <p className="text-[13px] leading-[18px] mt-[8px]" style={{ color: '#757474', fontFamily: poppins }}>
                  {description}
                </p>
              )}

              {/* Features */}
              {featureRows.length > 0 && (
                <div className="mt-[12px]">
                  <p className="text-[14px] font-medium mb-[6px]" style={{ color: '#484848', fontFamily: poppins }}>
                    Instalaciones
                  </p>
                  <div className="flex flex-col gap-[5px]">
                    {featureRows.map((row, i) => (
                      <div key={i} className="flex items-center gap-[8px]">
                        <row.icon className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#5A5A5A', strokeWidth: 1.5 }} />
                        <span className="text-[13px] font-normal capitalize" style={{ color: '#7D7D7D', fontFamily: poppins }}>
                          {row.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={onContact}
                className="w-full h-[40px] mt-[14px] flex items-center justify-center rounded-[69px] transition-opacity hover:opacity-90 outline-none"
                style={{ background: accentColor || '#1A1A1A' }}
              >
                <span className="text-[15px] font-medium text-white capitalize" style={{ fontFamily: poppins }}>
                  Solicitar Información
                </span>
              </button>
            </div>

            {/* Thumbnail preview below the white card */}
            {thumbnailUrl && (
              <div className="mx-[10px] mb-[8px] rounded-[14px] overflow-hidden">
                <img src={thumbnailUrl} alt="" className="w-full h-[130px] object-cover" />
              </div>
            )}
          </div>
        )}

        {/* ── Bottom nav tabs ── */}
        <div className="relative z-10 flex items-center justify-around px-[24px] pb-[14px] pt-[4px]">
          {navItems.map(({ section, label: navLabel }) => {
            const isActive = activeSection === section;
            return (
              <button
                key={section}
                onClick={() => onNavigate(section)}
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
                  {navLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompactIcon({ type }: { type: string }) {
  const cls = "w-[18px] h-[18px] text-[#7D7D7D]";
  switch (type) {
    case 'ruler':
      return <Ruler className={cls} strokeWidth={1.5} />;
    case 'bed':
      return <BedDouble className={cls} strokeWidth={1.5} />;
    case 'bath':
      return <Bath className={cls} strokeWidth={1.5} />;
    case 'fence':
      return <Fence className={cls} strokeWidth={1.5} />;
    default:
      return null;
  }
}
