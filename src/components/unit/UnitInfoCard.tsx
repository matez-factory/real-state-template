import { useMemo } from 'react';
import { Ruler, BedDouble, Bath, Fence, Compass } from 'lucide-react';
import type { Layer } from '@/types/hierarchy.types';
import { getFeatureIcon } from '@/lib/constants/feature-icons';
import { UnitStatusBadge } from './UnitStatusBadge';
import { UnitFeatureRow } from './UnitFeatureRow';

/*
 * Figma "ficha" panel — exact CSS values from inspector:
 *   Outer: 337×612 (612×337 rotated), rgba(214,214,214,0.45), luminosity, blur 50, rounded-28
 *   Thumbnail: 337×170, border-radius 28 28 0 0
 *   Inner card (Rectangle 36): ~290px wide, rgba(255,255,255,0.7), inset shadows, blur 14, rounded-20
 *   Inner card padding: ~36px left, content positions relative to pill top-left
 */

const outerGlassStyle: React.CSSProperties = {
  background: 'rgba(214, 214, 214, 0.45)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  borderRadius: '28px',
  border: '1.4px solid rgba(255, 255, 255, 0.4)',
};

const innerCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.7)',
  boxShadow: 'inset 0px 0px 16px rgba(255, 255, 255, 0.05), inset 0px 4px 4px rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderRadius: '20px',
};

const poppins = "'Poppins', system-ui, sans-serif";

interface UnitInfoCardProps {
  layer: Layer;
  thumbnailUrl?: string;
  accentColor?: string;
  onContact: () => void;
}

export function UnitInfoCard({ layer, thumbnailUrl, accentColor, onContact }: UnitInfoCardProps) {
  const {
    name, status, unitTypeName, price, description, orientation,
    area, areaUnit, bedrooms, bathrooms, hasBalcony, features,
  } = layer;

  const areaLabel = areaUnit === 'ft2' ? 'ft²' : areaUnit === 'ha' ? 'ha' : 'm²';

  const priceFormatted = useMemo(() => {
    if (!price || price <= 0) return null;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [price]);

  const featureRows = useMemo(() => {
    const rows: { icon: typeof Ruler; text: string }[] = [];

    if (area && area > 0) {
      rows.push({ icon: Ruler, text: `Área Total ${area} ${areaLabel}` });
    }
    // Monoambiente: either bedrooms === 0 or description explicitly says so.
    // When monoambiente, we show the bed icon + "Monoambiente" (overrides bedrooms count).
    const isMonoambiente =
      bedrooms === 0 ||
      (typeof description === 'string' && description.toLowerCase().includes('monoambiente'));
    if (isMonoambiente) {
      rows.push({ icon: BedDouble, text: 'Monoambiente' });
    } else if (bedrooms != null) {
      rows.push({ icon: BedDouble, text: `${bedrooms} Dormitorio${bedrooms !== 1 ? 's' : ''}` });
    }
    if (bathrooms != null) {
      rows.push({ icon: Bath, text: `${bathrooms} Baño${bathrooms !== 1 ? 's' : ''}` });
    }
    if (hasBalcony) {
      rows.push({ icon: Fence, text: 'Balcón' });
    }
    if (orientation) {
      rows.push({ icon: Compass, text: `Orientación ${orientation}` });
    }

    if (features) {
      for (const f of features) {
        rows.push({ icon: getFeatureIcon(f.icon, f.text), text: f.text });
      }
    }

    return rows;
  }, [area, areaLabel, bedrooms, bathrooms, hasBalcony, orientation, features, description]);

  return (
    <div className="w-[337px] flex-shrink-0 overflow-hidden" style={outerGlassStyle}>
      {/* Figma: 337×170, border-radius 28px top corners */}
      {thumbnailUrl && (
        <div className="w-full h-[170px] overflow-hidden" style={{ borderRadius: '28px 28px 0 0' }}>
          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Inner white card — flex column: header fixed, features scroll, footer fixed */}
      <div
        className="mx-[12px] mb-[12px] mt-[12px] flex flex-col max-h-[420px]"
        style={innerCardStyle}
      >
        {/* Fixed header: Name, Status, Price, Description */}
        <div className="px-[24px] pt-[12px] flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2
              className="text-[26px] font-medium leading-[39px] capitalize"
              style={{ color: '#484848', fontFamily: poppins }}
            >
              {name}
            </h2>
            <UnitStatusBadge status={status} />
          </div>

          <div className="flex items-baseline justify-between">
            {unitTypeName ? (
              <p
                className="text-[18px] font-medium leading-[27px] capitalize truncate min-w-0 mr-[8px]"
                title={`Modelo ${unitTypeName}`}
                style={{ color: '#757474', fontFamily: poppins }}
              >
                Modelo {unitTypeName}
              </p>
            ) : <span />}
            {priceFormatted && (
              <span
                className="text-[24px] font-semibold leading-[36px] uppercase flex-shrink-0 whitespace-nowrap"
                style={{ color: accentColor || '#1A1A1A', fontFamily: poppins }}
              >
                {priceFormatted}
              </span>
            )}
          </div>

          {description && description.trim().toLowerCase() !== 'monoambiente' && (
            <p
              className="text-[14px] leading-[20px] mt-[8px]"
              style={{ color: '#757474', fontFamily: poppins }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Scrollable features */}
        {featureRows.length > 0 && (
          <div className="px-[24px] mt-[12px] overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex flex-col gap-[6px]">
              {featureRows.map((row, i) => (
                <UnitFeatureRow key={i} icon={row.icon} text={row.text} />
              ))}
            </div>
          </div>
        )}

        {/* Fixed footer: Divider + CTA */}
        <div className="px-[24px] pb-[16px] flex-shrink-0">
          <div className="my-[14px]">
            <div style={{ borderTop: '1px solid #A49F9F', opacity: 0.14 }} />
          </div>

          <button
            onClick={onContact}
            className="w-[254px] mx-auto h-[42px] flex items-center justify-center rounded-[69px] transition-opacity hover:opacity-90 outline-none"
            style={{ background: accentColor || '#1A1A1A' }}
          >
            <span
              className="text-[20px] font-medium leading-[30px] capitalize"
              style={{ color: '#FFFFFF', fontFamily: poppins }}
            >
              Solicitar Información
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
