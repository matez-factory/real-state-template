import type { Project, Media } from '@/types/hierarchy.types';

interface LandingOverlayProps {
  project: Project;
  logos: Media[];
  onEnter: () => void;
}

export function LandingOverlay({ project, logos, onEnter }: LandingOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-[90%] max-w-[230px] xl:max-w-[320px] text-center text-white">
        <div className="lots-glass rounded-xl px-4 py-4 xl:px-6 xl:py-6 flex flex-col items-center">
          <h1 className="text-lg xl:text-[26px] font-medium tracking-wide mb-2 xl:mb-4 text-white">
            {project.name}
          </h1>

          {logos.length > 0 && (
            <div className="flex items-center justify-center gap-4 xl:gap-6 mb-3 xl:mb-5">
              {logos.map((logo) => (
                <img
                  key={logo.id}
                  src={logo.url!}
                  alt={logo.altText || ''}
                  className="h-8 xl:h-12 w-auto"
                />
              ))}
            </div>
          )}

          <button
            onClick={onEnter}
            className="w-fit px-6 py-1.5 xl:px-8 xl:py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm xl:text-base rounded-full transition-colors duration-200 outline-none"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
