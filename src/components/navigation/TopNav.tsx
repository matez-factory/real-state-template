import { useState, useEffect } from 'react';
import { Home, Map, MapPin, Phone, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';

type Section = 'home' | 'map' | 'location' | 'contact';

interface TopNavProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onContactOpen: () => void;
  showBack?: boolean;
  onBack?: () => void;
  mapLabel?: string;
}

export function TopNav({
  activeSection,
  onNavigate,
  onContactOpen,
  showBack,
  onBack,
  mapLabel = 'Mapa',
}: TopNavProps) {
  const NAV_ITEMS: { section: Section; icon: typeof Home; label: string }[] = [
    { section: 'home', icon: Home, label: 'Inicio' },
    { section: 'map', icon: Map, label: mapLabel },
    { section: 'location', icon: MapPin, label: 'Ubicación' },
    { section: 'contact', icon: Phone, label: 'Contacto' },
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
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="absolute top-2 left-2 md:top-4 md:left-4 xl:top-6 xl:left-6 z-40 w-8 h-8 md:w-10 md:h-10 xl:w-12 xl:h-12 flex items-center justify-center lots-glass rounded-full transition-all duration-200 hover:bg-black/50 hover:scale-105"
          aria-label="Volver"
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-5 xl:h-5 text-white" />
        </button>
      )}

      <div className="absolute top-2 right-2 md:top-4 md:right-4 xl:top-6 xl:right-6 z-[55] hidden landscape:flex xl:flex items-center gap-2 xl:gap-3">
        <nav className="h-8 md:h-10 xl:h-12 px-1 md:px-1.5 xl:px-2 lots-glass rounded-full flex items-center gap-0 md:gap-0.5 xl:gap-1">
          {NAV_ITEMS.map(({ section, icon: Icon, label }) => (
            <button
              key={section}
              onClick={() => handleClick(section)}
              className="flex items-center justify-center gap-2 w-7 h-7 md:w-8 md:h-8 xl:w-auto xl:h-9 xl:px-4 rounded-full text-sm font-medium transition-colors text-white/90 hover:text-white hover:bg-white/10 outline-none"
              aria-label={label}
            >
              <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-4 xl:h-4" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 xl:w-9 xl:h-9 rounded-full text-sm font-medium transition-colors text-white/90 hover:text-white hover:bg-white/10 outline-none"
            aria-label={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-4 xl:h-4" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-4 xl:h-4" />
            )}
          </button>
        </nav>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 xl:hidden landscape:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav className="h-14 bg-black/70 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2">
          {NAV_ITEMS.map(({ section, icon: Icon, label }) => (
            <button
              key={section}
              onClick={() => handleClick(section)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors outline-none ${
                activeSection === section
                  ? 'text-white'
                  : 'text-white/70 active:text-white'
              }`}
              aria-label={label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
