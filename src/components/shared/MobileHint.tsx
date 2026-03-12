import { useState, useEffect, useRef } from 'react';
import { Hand, X, MoveHorizontal } from 'lucide-react';
import { useIsMobilePortrait } from '@/hooks/useIsMobilePortrait';

interface MobileHintProps {
  isTourActive: boolean;
  isTransitioning: boolean;
  currentSceneId: string;
  pillMessage?: string;
}

export function MobileHint({
  isTourActive,
  isTransitioning,
  currentSceneId,
  pillMessage = 'Tocá las manzanas para explorar',
}: MobileHintProps) {
  const [showPill, setShowPill] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const panoramaHintShown = useRef(false);
  const isMobilePortrait = useIsMobilePortrait();

  const isPortraitTour = isMobilePortrait && isTourActive;

  useEffect(() => {
    if (!isPortraitTour || isTransitioning || panoramaHintShown.current) return;

    panoramaHintShown.current = true;
    const showTimer = setTimeout(() => setShowOverlay(true), 400);
    const hideTimer = setTimeout(() => setShowOverlay(false), 3500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isPortraitTour, isTransitioning]);

  useEffect(() => {
    setShowPill(false);
    const isMobile = window.innerWidth <= 1280;

    if (isMobile && isTourActive) {
      const showTimer = setTimeout(() => setShowPill(true), 800);
      const hideTimer = setTimeout(() => setShowPill(false), 4500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [currentSceneId, isTourActive]);

  return (
    <>
      {showOverlay && isPortraitTour && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in pointer-events-none">
          <div className="relative bg-black/80 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-4 max-w-[260px] pointer-events-auto">
            <button
              onClick={() => setShowOverlay(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white/80 transition-colors outline-none"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative flex items-center gap-3">
              <MoveHorizontal className="w-5 h-5 text-white/60 animate-pulse" />
              <Hand className="w-12 h-12 text-white/90" />
              <MoveHorizontal className="w-5 h-5 text-white/60 animate-pulse" />
            </div>

            <div className="text-center">
              <p className="text-white font-medium text-sm">
                Deslizá hacia los laterales
              </p>
              <p className="text-white/50 text-xs mt-1">
                para ver la imagen completa.
              </p>
            </div>
          </div>
        </div>
      )}

      {showPill && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in xl:hidden">
          <div className="lots-glass rounded-full shadow-lg px-3 py-1.5 flex items-center gap-2 text-white text-xs">
            <Hand className="w-3 h-3 animate-pulse" />
            <span>{pillMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
