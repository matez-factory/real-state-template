import { useState, useCallback, type ImgHTMLAttributes } from 'react';

interface FadeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fadeDuration?: number;
}

export function FadeImage({ fadeDuration = 300, className = '', style, onLoad, src, ...props }: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);

  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  return (
    <img
      ref={imgRef}
      src={src}
      {...props}
      className={className}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        transition: `opacity ${fadeDuration}ms ease`,
      }}
      onLoad={handleLoad}
    />
  );
}
