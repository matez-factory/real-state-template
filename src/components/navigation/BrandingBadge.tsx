import type { Project, Media } from '@/types/hierarchy.types';

interface BrandingBadgeProps {
  project: Project;
  logos: Media[];
}

export function BrandingBadge({ project, logos }: BrandingBadgeProps) {
  const locationText =
    project.city && project.state
      ? `${project.city} - ${project.state}`
      : project.city || project.state || '';

  return (
    <>
      {/* Desktop — full card, bottom-left */}
      <div className="absolute bottom-6 left-6 z-40 hidden xl:block">
        <div className="lots-glass rounded-xl px-8 py-6 flex flex-col items-center text-center text-white">
          <h2 className="text-xl font-medium tracking-wide mb-4">
            {project.name}
          </h2>

          {logos.length > 0 && (
            <div className="flex items-center justify-center gap-5 mb-4">
              {logos.map((logo) => (
                <img
                  key={logo.id}
                  src={logo.url!}
                  alt={logo.altText || ''}
                  className="h-8 w-auto"
                />
              ))}
            </div>
          )}

          {locationText && (
            <div className="text-white/80 text-sm">{locationText}</div>
          )}
        </div>
      </div>

      {/* Portrait mobile — compact card, top-right */}
      <div className="absolute top-2 right-2 z-30 xl:hidden landscape:hidden">
        <div className="lots-glass rounded-xl px-3 py-2.5 flex flex-col items-center text-center text-white w-[100px]">
          <span className="text-[10px] font-semibold tracking-wide mb-1.5">
            {project.name}
          </span>
          {logos.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-1.5">
              {logos.map((logo) => (
                <img
                  key={logo.id}
                  src={logo.url!}
                  alt={logo.altText || ''}
                  className="h-4 w-auto"
                />
              ))}
            </div>
          )}
          {locationText && (
            <span className="text-[8px] text-white/60">{locationText}</span>
          )}
        </div>
      </div>

      {/* Landscape mobile — compact pill, bottom-center */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 hidden landscape:block xl:landscape:hidden">
        <div className="lots-glass rounded-lg px-3 py-1.5 flex items-center gap-2 text-white">
          {logos.length > 0 && (
            <div className="flex items-center gap-2">
              {logos.map((logo) => (
                <img
                  key={logo.id}
                  src={logo.url!}
                  alt={logo.altText || ''}
                  className="h-3.5 w-auto"
                />
              ))}
            </div>
          )}
          <span className="text-[10px] font-semibold tracking-wide">
            {project.name}
          </span>
          {locationText && (
            <>
              <span className="text-white/30 text-[10px]">&middot;</span>
              <span className="text-[10px] text-white/60">{locationText}</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
