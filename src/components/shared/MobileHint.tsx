import { useState, useEffect } from 'react';
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
  pillMessage = 'Deslizá para ver la imagen completa',
}: MobileHintProps) {
  const [showPill, setShowPill] = useState(false);
  const isMobilePortrait = useIsMobilePortrait();

  useEffect(() => {
    setShowPill(false);

    if (isMobilePortrait && isTourActive && !isTransitioning) {
      const showTimer = setTimeout(() => setShowPill(true), 400);
      const hideTimer = setTimeout(() => setShowPill(false), 5000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [currentSceneId, isTourActive, isMobilePortrait, isTransitioning]);

  if (!showPill) return null;

  return (
    <div className="absolute bottom-[180px] left-1/2 -translate-x-1/2 z-40 animate-fade-in portrait:block hidden">
      <div
        className="rounded-full px-[12px] py-[6px] flex items-center gap-[6px] text-white text-[12px] font-medium whitespace-nowrap"
        style={{
          background: 'rgba(128, 128, 128, 0.23)',
          backgroundBlendMode: 'luminosity',
          backdropFilter: 'blur(50px)',
          WebkitBackdropFilter: 'blur(50px)',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Swipe hand icon — matches Figma */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hand */}
          <path d="M12 14V4.5a1.5 1.5 0 0 1 3 0V10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 14V6.5a1.5 1.5 0 0 1 3 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 10.5V10a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6H9.5A5.5 5.5 0 0 1 4 14.5V12.5a1.5 1.5 0 0 1 3 0V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Left arrow */}
          <path d="M2 10L0.5 11.5L2 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right arrow */}
          <path d="M22 10L23.5 11.5L22 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{pillMessage}</span>
      </div>
    </div>
  );
}
