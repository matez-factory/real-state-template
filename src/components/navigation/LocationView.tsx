import type { Project } from '@/types/hierarchy.types';

interface LocationViewProps {
  project: Project;
}

export function LocationView({ project }: LocationViewProps) {
  const hasCoords = project.coordinates?.lat != null && project.coordinates?.lng != null;
  const lat = project.coordinates?.lat;
  const lng = project.coordinates?.lng;

  // Build the map query: prefer coordinates, fallback to address+city
  let mapQuery: string | null = null;
  if (hasCoords) {
    mapQuery = `${lat},${lng}`;
  } else {
    const parts = [project.address, project.city, project.state, project.country].filter(Boolean);
    if (parts.length > 0) {
      mapQuery = parts.join(', ');
    }
  }

  // Convert share/short URLs to embeddable format
  let embedSrc: string | null = null;
  const raw = project.googleMapsEmbedUrl;
  if (raw && (raw.includes('/maps/embed') || raw.includes('output=embed'))) {
    embedSrc = raw;
  } else if (mapQuery) {
    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${hasCoords ? 17 : 14}&output=embed`;
  }

  if (!embedSrc) {
    return (
      <div className="absolute inset-0 bg-[#2A2A2A] flex items-center justify-center">
        <p className="text-gray-400 text-lg">No hay ubicación configurada para este proyecto</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        src={embedSrc}
        className="w-full h-full portrait:max-xl:h-[calc(100%-91px)]"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación del desarrollo"
      />

      {mapQuery && (
        <div className="absolute bottom-16 portrait:max-xl:bottom-[100px] xl:bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-[clamp(8px,1vw,14px)] pointer-events-none">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-[clamp(12px,1.5vw,20px)] py-[clamp(6px,0.7vw,10px)] glass-panel !rounded-full text-white text-[clamp(11px,0.9vw,13px)] font-medium transition-colors hover:bg-white/10"
          >
            Cómo llegar
          </a>
          <a
            href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-[clamp(12px,1.5vw,20px)] py-[clamp(6px,0.7vw,10px)] glass-panel !rounded-full text-white text-[clamp(11px,0.9vw,13px)] font-medium transition-colors hover:bg-white/10"
          >
            Ver en Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
