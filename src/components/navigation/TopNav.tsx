import { useState, useEffect } from 'react';

type Section = 'home' | 'map' | 'location' | 'contact';

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
  mapLabel?: string;
  navItems?: NavItem[];
}

/* Shared glass style — Figma: rgba(128,128,128,0.23), luminosity, blur 50, shadow, NO border */
const glassStyle: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
};

export function TopNav({
  activeSection,
  onNavigate,
  onContactOpen,
  showBack,
  onBack,
  mapLabel = 'Plantas',
  navItems,
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
      {/* Back button — top left, 44×44 glass circle with arrow-left */}
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="absolute top-[32px] left-[47px] z-40 w-[44px] h-[44px] rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors outline-none landscape:max-xl:top-[16px] landscape:max-xl:left-[16px] landscape:max-xl:w-[36px] landscape:max-xl:h-[36px] portrait:top-[46px] portrait:left-[33px] portrait:w-[41px] portrait:h-[41px]"
          style={glassStyle}
          aria-label="Volver"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}

      {/* Navbar pill — Figma: centered top, 298×58, top:31-32px */}
      <div className="absolute top-[32px] left-1/2 -translate-x-1/2 z-40 hidden landscape:flex landscape:max-xl:top-[16px]">
        <nav
          className="h-[58px] rounded-full flex items-center px-[6px] landscape:max-xl:h-[44px]"
          style={glassStyle}
        >
          {NAV_ITEMS.map(({ section, label }) => (
            <button
              key={section}
              onClick={() => handleClick(section)}
              className={`h-[37px] px-[20px] rounded-[100px] text-[16px] font-semibold leading-[28px] capitalize transition-colors outline-none landscape:max-xl:h-[32px] landscape:max-xl:px-[14px] landscape:max-xl:text-[13px] ${
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

      {/* Fullscreen — top right, text "Pantalla Completa" + 44×44 glass circle with expand arrows */}
      <div className="absolute top-[32px] right-[30px] z-40 hidden landscape:flex items-center gap-[10px] text-white landscape:max-xl:top-[16px] landscape:max-xl:right-[16px]">
        <span className="text-[15px] font-semibold landscape:max-xl:text-[12px]">
          {isFullscreen ? 'Salir Pantalla' : 'Pantalla Completa'}
        </span>
        <button
          onClick={toggleFullscreen}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors outline-none landscape:max-xl:w-[36px] landscape:max-xl:h-[36px]"
          style={glassStyle}
          aria-label={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            /* Minimize: arrows pointing inward to center */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 14 14 14 14 20" />
              <polyline points="14 10 14 4 20 4" />
              <polyline points="10 10 10 4 4 4" />
            </svg>
          ) : (
            /* Expand: arrows pointing outward to corners */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile portrait — bottom tab bar, Figma: white rect + gradient glass on top, rounded-20 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 landscape:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav
          className="relative h-[91px] rounded-[20px] flex items-center justify-around px-[24px] overflow-hidden"
          style={{ filter: 'drop-shadow(0px 12px 20px #D0D6E2)' }}
        >
          {/* Layer 1: solid white background */}
          <div className="absolute inset-0 rounded-[20px] bg-white" />
          {/* Layer 2: glass gradient on top */}
          <div
            className="absolute inset-0 rounded-[20px]"
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
function MobileTabIcon({ section, active }: { section: string; active: boolean }) {
  const color = active ? '#1A1A1A' : '#585555';

  if (section === 'home') {
    /* Home/Inicio icon — house */
    return active ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9.5Z" fill={color} />
        <path d="M9 21V13H15V21" className="fill-white" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9.5Z" />
        <path d="M9 21V13H15V21" />
      </svg>
    );
  }

  if (section === 'map') {
    /* Plantas icon — grid/building floors */
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    );
  }

  if (section === 'location') {
    /* Ubicación icon — map pin */
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
        <circle cx="12" cy="9" r="3" />
      </svg>
    );
  }

  return null;
}
