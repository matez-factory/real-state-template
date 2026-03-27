import { useEffect, useRef, useState, useCallback } from 'react';
import type { Layer } from '@/types/hierarchy.types';

interface SiblingNavigatorProps {
  siblings: Layer[];
  currentLayerId: string;
  label: string;
  onSelect: (sibling: Layer) => void;
  projectName?: string;
  logoUrl?: string;
}

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
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(22);

  // Highest floor first (reversed from DB order which is lowest first)
  const sorted = [...siblings].reverse();

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setThumbHeight(100);
      setThumbTop(0);
      return;
    }
    const ratio = clientHeight / scrollHeight;
    const h = Math.max(ratio * 100, 15);
    const top = (scrollTop / (scrollHeight - clientHeight)) * (100 - h);
    setThumbHeight(h);
    setThumbTop(top);
  }, []);

  // Scroll to active floor on mount and when floor changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const offset = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    }
    // Update thumb after scroll settles
    const timer = setTimeout(updateThumb, 350);
    return () => clearTimeout(timer);
  }, [currentLayerId, updateThumb]);

  // Listen to scroll events to update thumb position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateThumb, { passive: true });
    updateThumb();
    return () => el.removeEventListener('scroll', updateThumb);
  }, [updateThumb]);

  // Click-and-drag to scroll the number list (desktop mouse)
  const dragScrollRef = useRef({ active: false, dragged: false, startY: 0, startScroll: 0 });

  const handleListMouseDown = (e: React.MouseEvent) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    dragScrollRef.current = { active: true, dragged: false, startY: e.clientY, startScroll: scroll.scrollTop };

    const onMove = (ev: MouseEvent) => {
      const ds = dragScrollRef.current;
      if (!ds.active) return;
      const dy = ev.clientY - ds.startY;
      if (Math.abs(dy) > 3) ds.dragged = true;
      if (ds.dragged) scroll.scrollTop = ds.startScroll - dy;
    };
    const onUp = () => {
      dragScrollRef.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Drag the scrollbar thumb
  const handleTrackMouseDown = (e: React.MouseEvent) => {
    const track = trackRef.current;
    const scroll = scrollRef.current;
    if (!track || !scroll) return;
    e.preventDefault();
    e.stopPropagation();

    const doMove = (clientY: number) => {
      const trackRect = track.getBoundingClientRect();
      const trackH = trackRect.height;
      const currentThumbH = (scroll.clientHeight / scroll.scrollHeight) * trackH;
      const y = clientY - trackRect.top - currentThumbH / 2;
      const maxY = trackH - currentThumbH;
      const ratio = Math.max(0, Math.min(1, y / maxY));
      scroll.scrollTop = ratio * (scroll.scrollHeight - scroll.clientHeight);
    };

    doMove(e.clientY);

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      doMove(ev.clientY);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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
        {/* White background for number list — single scrollable container */}
        <div
          ref={scrollRef}
          className="flex-shrink-0 w-[clamp(38px,6vw,63px)] min-h-0 rounded-[clamp(6px,1.5vh,10px)] overflow-y-auto overflow-x-hidden cursor-grab active:cursor-grabbing select-none"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: 'inset 0px 0px 16px rgba(255, 255, 255, 0.05), inset 0px 4px 4px rgba(255, 255, 255, 0.15)',
            scrollbarWidth: 'none',
          }}
          onMouseDown={handleListMouseDown}
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

        {/* Scrollbar — interactive track + dynamic thumb */}
        <div className="flex-shrink-0 flex flex-col items-center w-[3px]">
          <div
            ref={trackRef}
            className="flex-1 w-[3px] rounded-full relative cursor-pointer"
            style={{ background: 'rgba(255, 255, 255, 0.5)' }}
            onMouseDown={handleTrackMouseDown}
          >
            <div
              className="absolute left-0 w-full rounded-full transition-[top] duration-100"
              style={{
                top: `${thumbTop}%`,
                height: `${thumbHeight}%`,
                background: '#FFFFFF',
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
