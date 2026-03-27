/**
 * Shared prev/next arrow buttons + progress dots.
 * Used in tour navigation, planos carousel, gallery carousel, etc.
 *
 * Uses clamp() for responsive sizing:
 *   Button: 36px on small → 44px on large
 *   Icon:   16px on small → 20px on large
 *   Gap:    16px on small → 21px on large
 */

const glassStyle: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1.4px solid rgba(255, 255, 255, 0.18)',
};

interface GlassArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  /** Total number of items (for progress dots). Pass 0 or 1 to hide dots. */
  count?: number;
  /** Current active index (for progress dots). */
  activeIndex?: number;
  className?: string;
}

export function GlassArrows({ onPrev, onNext, count = 0, activeIndex = 0, className = '' }: GlassArrowsProps) {
  return (
    <div className={`flex flex-col items-center gap-[clamp(12px,1.5vh,18px)] ${className}`}>
      <div className="flex items-center gap-[clamp(16px,1.5vw,21px)]">
        <button
          onClick={onPrev}
          className="size-[clamp(36px,3.5vw,44px)] rounded-full flex items-center justify-center text-white hover:text-white transition-colors outline-none"
          style={glassStyle}
          aria-label="Anterior"
        >
          <svg className="size-[clamp(16px,1.5vw,20px)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className="size-[clamp(36px,3.5vw,44px)] rounded-full flex items-center justify-center text-white hover:text-white transition-colors outline-none"
          style={glassStyle}
          aria-label="Siguiente"
        >
          <svg className="size-[clamp(16px,1.5vw,20px)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
      {count > 1 && (
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-[clamp(30px,3vw,41px)] bg-[#f2f2f2]'
                  : 'w-[clamp(20px,2vw,28px)] bg-[rgba(234,234,234,0.45)]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
