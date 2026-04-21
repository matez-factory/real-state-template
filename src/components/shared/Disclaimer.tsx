import type { Project } from '@/types/hierarchy.types';

interface DisclaimerProps {
  project: Pick<Project, 'disclaimerEnabled' | 'disclaimerText'>;
  /**
   * Tailwind bottom class for the mobile portrait pill (e.g. "bottom-[170px]").
   * Default is "bottom-[100px]" — sits just above the 91px bottom nav.
   * Each view should pass a value that keeps the pill above its own bottom UI
   * (arrows, floor selector, etc.).
   */
  mobileBottomClass?: string;
}

export function Disclaimer({
  project,
  mobileBottomClass = 'bottom-[100px]',
}: DisclaimerProps) {
  if (!project.disclaimerEnabled || !project.disclaimerText) return null;

  const glassStyle: React.CSSProperties = {
    background: 'rgba(214, 214, 214, 0.45)',
    backgroundBlendMode: 'luminosity',
    backdropFilter: 'blur(50px)',
    WebkitBackdropFilter: 'blur(50px)',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1.4px solid rgba(255, 255, 255, 0.4)',
  };

  return (
    <>
      {/* Mobile portrait: centered pill above bottom UI */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none portrait:block landscape:hidden xl:hidden ${mobileBottomClass}`}
      >
        <div
          className="px-3 py-1 rounded-full"
          style={glassStyle}
        >
          <p
            className="text-[10px] leading-tight m-0 whitespace-nowrap"
            style={{ color: '#484848', fontFamily: "'Poppins', system-ui, sans-serif" }}
          >
            {project.disclaimerText}
          </p>
        </div>
      </div>

      {/* Desktop / landscape: pill anchored bottom-left, center-aligned with SocialButtons */}
      <div
        className="hidden landscape:block xl:block absolute left-[clamp(12px,2.5vw,35px)] bottom-[clamp(13px,4.5vh,42px)] z-30 pointer-events-none"
      >
        <div
          className="px-3 py-1 rounded-full"
          style={glassStyle}
        >
          <p
            className="text-[11px] leading-tight m-0"
            style={{ color: '#484848', fontFamily: "'Poppins', system-ui, sans-serif" }}
          >
            {project.disclaimerText}
          </p>
        </div>
      </div>
    </>
  );
}
