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
  /** Show a home button next to back (used in unit ficha view) */
  showHome?: boolean;
  onHome?: () => void;
  mapLabel?: string;
  navItems?: NavItem[];
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

/* Responsive sizing via clamp — same scale as GlassArrows / SocialButtons */
const btnClass =
  'size-[clamp(36px,3.5vw,44px)] rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors outline-none';
const iconClass = 'size-[clamp(18px,1.6vw,22px)]';

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
        <div className="absolute top-[clamp(16px,2.5vh,32px)] left-[clamp(20px,3vw,47px)] z-40 hidden landscape:flex items-center gap-[clamp(8px,0.8vw,13px)] portrait:flex portrait:top-[46px] portrait:left-[33px]">
          <button
            onClick={onBack}
            className={btnClass}
            style={glassStyle}
            aria-label="Volver"
          >
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          {showHome && onHome && (
            <button
              onClick={onHome}
              className={btnClass}
              style={glassStyle}
              aria-label="Inicio"
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          className="h-[clamp(42px,4.5vw,58px)] rounded-full flex items-center px-[clamp(4px,0.5vw,6px)]"
          style={glassStyle}
        >
          {NAV_ITEMS.map(({ section, label }) => (
            <button
              key={section}
              onClick={() => handleClick(section)}
              className={`h-[clamp(28px,3vw,37px)] px-[clamp(12px,1.4vw,20px)] rounded-[100px] text-[clamp(12px,1.1vw,16px)] font-semibold leading-[28px] capitalize transition-colors outline-none ${
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

      {/* ── Right: Fullscreen text + button ── */}
      <div className="absolute top-[clamp(16px,2.5vh,32px)] right-[clamp(16px,2vw,30px)] z-40 hidden landscape:flex items-center gap-[clamp(6px,0.7vw,10px)] text-white">
        <span className="text-[clamp(11px,1vw,15px)] font-semibold">
          {isFullscreen ? 'Salir Pantalla' : 'Pantalla Completa'}
        </span>
        <button
          onClick={toggleFullscreen}
          className={btnClass}
          style={glassStyle}
          aria-label={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 14 14 14 14 20" />
              <polyline points="14 10 14 4 20 4" />
              <polyline points="10 10 10 4 4 4" />
            </svg>
          ) : (
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile portrait: bottom tab bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 landscape:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav
          className="relative h-[91px] rounded-[20px] flex items-center justify-around px-[24px] overflow-hidden"
          style={{ filter: 'drop-shadow(0px 12px 20px #D0D6E2)' }}
        >
          <div className="absolute inset-0 rounded-[20px] bg-white" />
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
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    );
  }

  if (section === 'location') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
        <circle cx="12" cy="9" r="3" />
      </svg>
    );
  }

  return null;
}
