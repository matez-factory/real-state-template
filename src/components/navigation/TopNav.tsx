import { useState, useEffect } from 'react';

export type Section = 'home' | 'map' | 'location' | 'contact' | 'planos' | 'galeria' | 'tour';

interface NavItem {
  section: Section;
  label: string;
}

interface TopNavProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onContactOpen: () => void;
  showBack?: boolean;
  onBack?: () => void;
  /** Show a home button next to back (used in unit ficha view) */
  showHome?: boolean;
  onHome?: () => void;
  mapLabel?: string;
  navItems?: NavItem[];
  /** Hide the mobile portrait bottom tab bar (when ExplorerView renders its own combined bar) */
  hideMobileNav?: boolean;
  /** Compact mode — smaller buttons, fullscreen icon only (no text), visible in portrait */
  compact?: boolean;
}

/* Glass style with illumination border — shared by all top-bar elements */
const glassStyle: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1.4px solid rgba(255, 255, 255, 0.18)',
};

/* Responsive sizing via clamp — vh scales well for small landscape viewports */
const btnClass =
  'size-[clamp(28px,8vh,44px)] rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors outline-none';
const iconClass = 'size-[clamp(14px,4vh,22px)]';

export function TopNav({
  activeSection,
  onNavigate,
  onContactOpen,
  showBack,
  onBack,
  showHome,
  onHome,
  mapLabel = 'Plantas',
  navItems,
  hideMobileNav,
  compact,
}: TopNavProps) {
  const NAV_ITEMS: NavItem[] = navItems ?? [
    { section: 'home', label: 'Inicio' },
    { section: 'map', label: mapLabel },
    { section: 'location', label: 'Ubicación' },
  ];

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* noop */ }
  };

  const handleClick = (section: Section) => {
    if (section === 'contact') {
      onContactOpen();
    } else {
      onNavigate(section);
    }
  };

  return (
    <>
      {/* ── Left side: Back + optional Home ── */}
      {showBack && onBack && (
        <div className="absolute top-[clamp(16px,2.5vh,32px)] left-[clamp(20px,3vw,47px)] z-50 hidden landscape:flex items-center gap-[clamp(8px,0.8vw,13px)] portrait:flex portrait:top-[46px] portrait:left-[33px]">
          <button
            onClick={onBack}
            className={`${btnClass} ${compact ? 'portrait:!size-[clamp(24px,6vh,34px)]' : ''}`}
            style={glassStyle}
            aria-label="Volver"
          >
            <svg className={`${iconClass} ${compact ? 'portrait:!size-[clamp(12px,3vh,16px)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          {showHome && onHome && (
            <button
              onClick={onHome}
              className={`${btnClass} ${compact ? 'portrait:!size-[clamp(24px,6vh,34px)]' : ''}`}
              style={glassStyle}
              aria-label="Inicio"
            >
              <svg className={`${iconClass} ${compact ? 'portrait:!size-[clamp(12px,3vh,16px)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Center: Navbar pill ── */}
      <div className="absolute top-[clamp(16px,2.5vh,32px)] left-1/2 -translate-x-1/2 z-40 hidden landscape:flex">
        <nav
          className="h-[clamp(32px,9vh,58px)] rounded-full flex items-center px-[clamp(3px,0.5vw,6px)]"
          style={glassStyle}
        >
          {NAV_ITEMS.map(({ section, label }) => (
            <button
              key={section}
              onClick={() => handleClick(section)}
              className={`h-[clamp(22px,6vh,37px)] px-[clamp(8px,1.4vw,20px)] rounded-[100px] text-[clamp(10px,3vh,16px)] font-semibold leading-[28px] capitalize transition-colors outline-none ${
                activeSection === section
                  ? 'text-white bg-[rgba(217,217,217,0.27)]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Right: Fullscreen button + hover tooltip (hidden on iOS — no Fullscreen API) ── */}
      {document.fullscreenEnabled && <div className={`absolute top-[clamp(16px,2.5vh,32px)] right-[clamp(16px,2vw,30px)] z-40 items-center gap-[clamp(6px,0.7vw,10px)] text-white ${
        compact ? 'flex portrait:top-[46px] portrait:right-[33px]' : 'hidden landscape:flex'
      }`}>
        <div className="relative group">
          <button
            onClick={toggleFullscreen}
            className={`${btnClass} ${compact ? 'portrait:!size-[clamp(24px,6vh,34px)]' : ''}`}
            style={glassStyle}
            aria-label={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <svg className={`${iconClass} ${compact ? 'portrait:!size-[clamp(12px,3vh,16px)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 14 14 14 14 20" />
                <polyline points="14 10 14 4 20 4" />
                <polyline points="10 10 10 4 4 4" />
              </svg>
            ) : (
              <svg className={`${iconClass} ${compact ? 'portrait:!size-[clamp(12px,3vh,16px)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          <span
            className="pointer-events-none absolute right-0 top-[calc(100%+8px)] whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
            style={glassStyle}
          >
            {isFullscreen ? 'Salir pantalla' : 'Pantalla completa'}
          </span>
        </div>
      </div>}

      {/* ── Mobile portrait: bottom tab bar ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 landscape:hidden ${hideMobileNav ? 'hidden' : ''}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav
          className="relative h-[91px] rounded-t-[20px] flex items-center justify-around px-[24px] overflow-hidden"
          style={{ filter: 'drop-shadow(0px 12px 20px #D0D6E2)' }}
        >
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
          {NAV_ITEMS.map(({ section, label }) => {
            const isActive = activeSection === section;
            return (
              <button
                key={section}
                onClick={() => handleClick(section)}
                className={`relative z-10 flex flex-col items-center justify-center gap-[6px] w-[100px] h-[55px] rounded-[100px] transition-colors outline-none ${
                  isActive ? 'bg-[rgba(234,234,234,0.7)]' : ''
                }`}
                aria-label={label}
              >
                <MobileTabIcon section={section} active={isActive} />
                <span
                  className="text-[12px] leading-[125%] tracking-[0.02em]"
                  style={{
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#1A1A1A' : '#585555',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

/* Figma mobile tab icons — 24×24, active: filled #1A1A1A, inactive: stroke 1.5px #585555 */
export function MobileTabIcon({ section, active }: { section: string; active: boolean }) {
  const color = active ? '#1A1A1A' : '#585555';

  /* ── Explorer bar icons ── */

  // Inicio — house with chimney
  if (section === 'home') {
    return active ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 3L21 10V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10Z" fill={color} />
        <path d="M9 21V14H15V21" className="fill-white" />
        <rect x="16" y="5" width="2" height="4" rx="0.5" fill={color} />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10L12 3L21 10V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10Z" />
        <path d="M9 21V14H15V21" />
        <line x1="17" y1="5" x2="17" y2="9" />
      </svg>
    );
  }

  // Plantas — building/floors icon
  if (section === 'map') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <line x1="4" y1="8" x2="20" y2="8" />
        <line x1="4" y1="13" x2="20" y2="13" />
        <line x1="4" y1="18" x2="20" y2="18" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    );
  }

  // Ubicación — pin inside rounded border
  if (section === 'location') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7C10.34 7 9 8.34 9 10C9 12.5 12 16 12 16C12 16 15 12.5 15 10C15 8.34 13.66 7 12 7Z" />
        <circle cx="12" cy="10" r="1" />
      </svg>
    );
  }

  /* ── Unit detail bar icons ── */

  // Planos — two overlapping rectangles
  if (section === 'planos') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="M7 5V3H21V17H19" />
      </svg>
    );
  }

  // Galería — image/landscape
  if (section === 'galeria') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 16L8 11L13 16" />
        <path d="M14 14L17 11L21 15" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </svg>
    );
  }

  // Tour — 360° with circular arrow
  if (section === 'tour') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C15.31 3 18.18 4.84 19.74 7.5" />
        <polyline points="21 3 21 8 16 8" />
        <text x="12" y="13.5" textAnchor="middle" fontSize="7" fontWeight="600" fill={color} stroke="none" fontFamily="'Poppins', sans-serif">360°</text>
      </svg>
    );
  }

  // Contacto — phone
  if (section === 'contact') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.77 20.99 20.53 21 20.3 21C10.8 21 3 13.2 3 3.7C3 3.47 3.01 3.23 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.34 8.05 2.81C8.14 3.41 8.3 3.99 8.54 4.55L7.03 6.06C8.36 8.57 10.43 10.64 12.94 11.97L14.45 10.46C15.01 10.7 15.59 10.86 16.19 10.95C16.66 11.03 17 11.44 17 11.92V14.92" />
      </svg>
    );
  }

  return null;
}
