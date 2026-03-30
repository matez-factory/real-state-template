import { useState } from 'react';
import { useIsMobilePortrait } from '@/hooks/useIsMobilePortrait';

const DISMISSED_KEY = 'rotate-overlay-dismissed';

interface RotateDeviceOverlayProps {
  backgroundUrl?: string;
}

export function RotateDeviceOverlay({ backgroundUrl }: RotateDeviceOverlayProps) {
  const isPortrait = useIsMobilePortrait();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch {}
  };

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center">
      {/* Background image */}
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark overlay — Figma: rgba(32,32,32,0.8) multiply */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(32, 32, 32, 0.8)',
          backgroundBlendMode: 'multiply',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8">
        {/* Rotate phone icon */}
        <svg
          width="76"
          height="76"
          viewBox="0 0 76 76"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-[16px]"
        >
          {/* Phone body — drawn centered then rotated as group */}
          <g transform="rotate(-30 38 38)">
            <rect x="23" y="10" width="30" height="52" rx="5" stroke="white" strokeWidth="2.5" fill="none" />
            {/* Home button dot */}
            <circle cx="38" cy="56" r="2" stroke="white" strokeWidth="1.5" fill="none" />
          </g>
          {/* Left curved arrow */}
          <path d="M8 48C3 40 3 30 8 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M4 24L8 22L10 27" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Right curved arrow */}
          <path d="M68 28C73 36 73 46 68 54" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M72 52L68 54L66 49" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        {/* Title — Figma: Poppins 400 32px #FFFFFF */}
        <h2 className="text-[32px] font-normal text-white leading-[48px] text-center">
          Girá tu dispositivo
        </h2>

        {/* Subtitle — Figma: Poppins 500 16px #D5D5D5 */}
        <div className="mt-[24px] text-center">
          <p className="text-[16px] font-medium text-[#D5D5D5] leading-[24px]">
            Cargando la experiencia 3D
          </p>
          <p className="text-[16px] font-medium text-[#D5D5D5] leading-[24px]">
            Esto puede tardar unos segundos
          </p>
        </div>

        {/* Continue button — Figma: glass pill, 284×44, rounded-100 */}
        <button
          onClick={handleDismiss}
          className="mt-[48px] w-[284px] h-[44px] rounded-full flex items-center justify-center gap-[8px] text-[16px] font-medium text-white transition-opacity hover:opacity-90 outline-none"
          style={{
            background: 'rgba(128, 128, 128, 0.23)',
            backgroundBlendMode: 'luminosity',
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <span>Continuar de todos modos</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
