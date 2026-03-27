import { useEffect, useRef } from 'react';
import type { Layer } from '@/types/hierarchy.types';

interface SiblingNavigatorProps {
  siblings: Layer[];
  currentLayerId: string;
  label: string;
  onSelect: (sibling: Layer) => void;
  projectName?: string;
  logoUrl?: string;
}

/*
 * Figma CSS (exact from inspector):
 *
 * Outer "ficha": 114x614, rounded-20, positioned at left:47 top:116
 *   bg: rgba(214,214,214,0.45), backdrop-filter: blur(50px)
 *   border: 1.4px solid rgba(255,255,255,0.4), shadow: 0 2 4 rgba(0,0,0,0.1)
 *
 * Header (inside ficha, top area):
 *   Logo: ~30x32px image
 *   Name: Poppins 400 12px white, at top ~42px
 *   "Nivel": Poppins 300 14px white, at top ~74px
 *
 * Scrollbar at left:100 (from panel left), top:156:
 *   Track: 362px, border 3px rgba(255,255,255,0.5)
 *   Thumb: ~78px, border 3px #FFFFFF
 *
 * Number list bg (Rectangle 36): starts ~top:223 within panel
 *   bg: rgba(255,255,255,0.7), backdrop-filter: blur(14px), rounded-10
 *   inset shadow: 0 0 16px rgba(255,255,255,0.05), 0 4px 4px rgba(255,255,255,0.15)
 *
 * Numbers: Poppins 600 16px #707070, ~40px row height
 * Separators: 1px solid #D1D1D1, width 63px
 * Active row: bg rgba(0,0,0,0.1), 63x39px
 */

export function SiblingNavigator({
  siblings,
  currentLayerId,
  label,
  onSelect,
  projectName,
  logoUrl,
}: SiblingNavigatorProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sorted = [...siblings].reverse();

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const offset = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [currentLayerId]);

  return (
    <aside
      className="hidden landscape:flex absolute left-[clamp(10px,3vw,47px)] top-[clamp(50px,14vh,116px)] z-40 flex-col rounded-[clamp(10px,3vh,20px)] w-[clamp(68px,10vw,114px)] overflow-hidden"
      style={{
        height: 'calc(100vh - clamp(60px,15vh,116px) - clamp(20px,5vh,48px))',
        maxHeight: '614px',
        background: 'rgba(214, 214, 214, 0.45)',
        backgroundBlendMode: 'luminosity',
        backdropFilter: 'blur(50px)',
        WebkitBackdropFilter: 'blur(50px)',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        border: '1.4px solid rgba(255, 255, 255, 0.4)',
      }}
    >
      {/* Header: logo + name + "Nivel" on the glass bg */}
      <div className="flex flex-col items-center pt-[clamp(6px,2vh,10px)] pb-[clamp(4px,1.5vh,8px)] px-2 flex-shrink-0">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={projectName ?? ''}
            className="h-[clamp(20px,5vh,32px)] w-auto object-contain mb-[2px]"
          />
        )}
        <p
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 'clamp(9px, 2.5vh, 12px)',
            lineHeight: '1.5',
            color: '#FFFFFF',
            textTransform: 'capitalize',
            textAlign: 'center',
          }}
        >
          {projectName}
        </p>
        <p
          className="mt-[clamp(2px,0.5vh,4px)]"
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(10px, 3vh, 14px)',
            lineHeight: '2',
            color: '#FFFFFF',
            textTransform: 'capitalize',
          }}
        >
          {label}
        </p>
      </div>

      {/* Number list area + scrollbar */}
      <div className="relative flex-1 min-h-0 flex pb-[clamp(6px,2vh,20px)] pr-[clamp(6px,1vw,20px)] pl-[clamp(8px,1.5vw,25px)] gap-[clamp(4px,0.8vw,12px)]">
        {/* White background for number list */}
        <div
          className="flex-shrink-0 w-[clamp(38px,6vw,63px)] min-h-0 rounded-[clamp(6px,1.5vh,10px)] overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: 'inset 0px 0px 16px rgba(255, 255, 255, 0.05), inset 0px 4px 4px rgba(255, 255, 255, 0.15)',
          }}
        >
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {sorted.map((sibling, i) => {
              const isCurrent = sibling.id === currentLayerId;
              const shortLabel = sibling.label.replace(/^(piso|nivel|planta|n)\s*/i, '');
              return (
                <button
                  key={sibling.id}
                  ref={isCurrent ? activeRef : undefined}
                  onClick={() => onSelect(sibling)}
                  className="outline-none block w-full"
                  style={{
                    height: 'clamp(22px, 6vh, 39px)',
                    lineHeight: 'clamp(22px, 6vh, 39px)',
                    textAlign: 'center',
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    fontSize: 'clamp(10px, 2.8vh, 16px)',
                    fontWeight: 600,
                    color: '#707070',
                    background: isCurrent ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                    borderTop: i > 0 ? '1px solid #D1D1D1' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    textTransform: 'capitalize',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = isCurrent ? 'rgba(0, 0, 0, 0.1)' : 'transparent';
                  }}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollbar — Line 1 (track) + Line 2 (thumb) from Figma */}
        <div className="flex-shrink-0 flex flex-col items-center w-[3px]">
          <div
            className="flex-1 w-[3px] rounded-full relative"
            style={{ background: 'rgba(255, 255, 255, 0.5)' }}
          >
            <div
              className="absolute top-0 left-0 w-full rounded-full"
              style={{ height: '22%', background: '#FFFFFF' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
