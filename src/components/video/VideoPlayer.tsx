import { useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  onEnded?: () => void;
  onPlaying?: () => void;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  onEnded,
  onPlaying,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative bg-black ${className}`}>
      {isLoading && !onPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-white/60 text-sm">Cargando video...</div>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        onLoadedData={() => setIsLoading(false)}
        onPlaying={onPlaying}
        onEnded={onEnded}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
