import { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import type { Media } from '@/types/hierarchy.types';

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

type MediaTab = 'gallery' | 'video' | 'tour';

interface UnitMediaViewerProps {
  activeTab: MediaTab;
  galleryImages: Media[];
  uploadedVideos: Media[];
  videoUrl?: string;
  tourEmbedUrl?: string;
}

export function UnitMediaViewer({
  activeTab,
  galleryImages,
  uploadedVideos,
  videoUrl,
  tourEmbedUrl,
}: UnitMediaViewerProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? next() : prev();
    }
  }, [next, prev]);

  if (activeTab === 'gallery') {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {galleryImages.length > 0 ? (
          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={galleryImages[index]?.url}
              alt={`Imagen ${index + 1}/${galleryImages.length}`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors outline-none"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors outline-none"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/50 px-3 py-1 rounded-full text-xs text-white/70">
                  {index + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <span className="text-white/30 text-sm">Sin imagen disponible</span>
        )}
      </div>
    );
  }

  if (activeTab === 'video') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        {videoUrl && (
          <div className="w-full aspect-video max-h-full">
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        {uploadedVideos.map((v) => (
          <div key={v.id} className="w-full max-h-full">
            <VideoPlayer src={v.url!} className="w-full aspect-video rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'tour') {
    if (tourEmbedUrl) {
      return (
        <div className="w-full h-full">
          <iframe
            src={getEmbedUrl(tourEmbedUrl)}
            className="w-full h-full rounded-xl"
            allow="xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <p className="text-white/70 text-lg font-medium">Recorrido 360° no disponible</p>
          <p className="text-white/40 text-sm mt-2">Cargá el embed del tour 360° de la unidad desde el panel de administración.</p>
        </div>
      </div>
    );
  }

  return null;
}
