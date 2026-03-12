import { useEffect, useRef } from 'react';
import type { Layer } from '@/types/hierarchy.types';
import { STATUS_DOT_CLASSES } from '@/lib/constants/status';

interface SiblingNavigatorProps {
  siblings: Layer[];
  currentLayerId: string;
  label: string;
  onSelect: (sibling: Layer) => void;
}

export function SiblingNavigator({ siblings, currentLayerId, label, onSelect }: SiblingNavigatorProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sorted = [...siblings].reverse();

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const offset = active.offsetTop - container.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [currentLayerId]);

  return (
    <aside className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-40 flex-col bg-black/50 backdrop-blur-md rounded-l-xl max-h-[75vh] overflow-hidden">
      <div className="px-3 py-3 border-b border-white/10">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}es
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <div className="flex flex-col py-1">
          {sorted.map((sibling) => {
            const isCurrent = sibling.id === currentLayerId;
            return (
              <button
                key={sibling.id}
                ref={isCurrent ? activeRef : undefined}
                onClick={() => onSelect(sibling)}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm transition-colors outline-none relative
                  ${isCurrent
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {isCurrent && (
                  <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-sky-400 rounded-r-full" />
                )}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_CLASSES[sibling.status]}`} />
                <span className="truncate">{sibling.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
