import type { Project } from '@/types/hierarchy.types';

interface LocationViewProps {
  project: Project;
}

export function LocationView({ project }: LocationViewProps) {
  const lat = project.coordinates?.lat ?? -33.731722;
  const lng = project.coordinates?.lng ?? -61.982139;

  const embedSrc =
    project.googleMapsEmbedUrl ??
    `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        src={embedSrc}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación del desarrollo"
      />

      <div className="absolute bottom-16 xl:bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-2 md:gap-3 xl:gap-4">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 md:px-4 md:py-2 xl:px-6 xl:py-3 glass-panel !rounded-full text-white text-xs md:text-sm xl:text-base font-medium transition-colors hover:bg-white/10"
        >
          Cómo llegar
        </a>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 md:px-4 md:py-2 xl:px-6 xl:py-3 glass-panel !rounded-full text-white text-xs md:text-sm xl:text-base font-medium transition-colors hover:bg-white/10"
        >
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
}
