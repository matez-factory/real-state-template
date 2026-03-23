import { useState, useMemo, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Media } from '@/types/hierarchy.types';
import { VideoPlayer } from './VideoPlayer';
import { useIsMobilePortrait } from '@/hooks/useIsMobilePortrait';

interface NavigationRenderProps {
  onPrev: () => void;
  onNext: () => void;
  isTransitioning: boolean;
}

interface Spin360ViewerProps {
  media: Media[];
  spinSvgs: Record<string, string>;
  onEnterBuilding?: () => void;
  preloadOnEntrance?: string[];
  enterLabel?: string;
  hideControls?: boolean;
  hideSvgOverlay?: boolean;
  renderNavigation?: (props: NavigationRenderProps) => React.ReactNode;
  enablePanorama?: boolean;
  hotspotTowerId?: string;
  hotspotMarkerId?: string;
  onViewpointChange?: (id: string) => void;
  onTransitionChange?: (isTransitioning: boolean) => void;
  /** Project name shown in the hotspot card */
  projectName?: string;
  /** Logo URL shown in the hotspot card */
  projectLogoUrl?: string;
  /** Accent color from project (used in hotspot card button) */
  accentColor?: string;
}

export interface Spin360ViewerRef {
  enterBuilding: () => void;
}

export const Spin360Viewer = forwardRef<Spin360ViewerRef, Spin360ViewerProps>(function Spin360Viewer({
  media,
  spinSvgs,
  onEnterBuilding,
  preloadOnEntrance,
  enterLabel = 'Explorar niveles',
  hideControls,
  hideSvgOverlay,
  renderNavigation,
  enablePanorama = false,
  hotspotTowerId,
  hotspotMarkerId,
  onViewpointChange,
  onTransitionChange,
  projectName,
  projectLogoUrl,
  accentColor,
}: Spin360ViewerProps, ref: React.Ref<Spin360ViewerRef>) {
  const viewpointOrder = useMemo(() => {
    return media
      .filter((m) => m.type === 'svg' && m.purpose === 'hotspot')
      .sort((a, b) => {
        // Sort by sortOrder first, then by viewpoint name (stop-01 < stop-02 < stop-03)
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        const aVp = ((a.metadata as Record<string, unknown>)?.viewpoint as string) ?? '';
        const bVp = ((b.metadata as Record<string, unknown>)?.viewpoint as string) ?? '';
        return aVp.localeCompare(bVp, undefined, { numeric: true });
      })
      .map((m) => (m.metadata as Record<string, unknown>)?.viewpoint as string)
      .filter(Boolean);
  }, [media]);

  const [currentViewpoint, setCurrentViewpoint] = useState<string>(() => '');
  const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [transitionVideoUrl, setTransitionVideoUrl] = useState<string | null>(null);
  const [entranceVideoUrl, setEntranceVideoUrl] = useState<string | null>(null);
  const [entranceVideoPlaying, setEntranceVideoPlaying] = useState(false);
  const [entranceFadingOut, setEntranceFadingOut] = useState(false);
  const [hotspotCard, setHotspotCard] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false, x: 0, y: 0,
  });
  const hotspotHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hotspotCardRef = useRef<HTMLDivElement>(null);
  const isMouseOverCard = useRef(false);
  const onVideoEndRef = useRef<(() => void) | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const isMobilePortrait = useIsMobilePortrait();
  const portraitPanorama = isMobilePortrait && enablePanorama;

  useEffect(() => {
    if (viewpointOrder.length > 0 && !currentViewpoint) {
      setCurrentViewpoint(viewpointOrder[0]);
    }
  }, [viewpointOrder, currentViewpoint]);

  useEffect(() => {
    if (currentViewpoint) {
      onViewpointChange?.(currentViewpoint);
    }
  }, [currentViewpoint, onViewpointChange]);

  useEffect(() => {
    onTransitionChange?.(phase === 'transitioning');
  }, [phase, onTransitionChange]);

  const viewpoints = useMemo(() => {
    return viewpointOrder.map((id) => {
      const image = media.find((m) => {
        if (m.type !== 'image') return false;
        const meta = m.metadata as Record<string, unknown>;
        return meta?.viewpoint === id;
      });
      return { id, image, svgPath: spinSvgs[id] };
    });
  }, [viewpointOrder, media, spinSvgs]);

  useEffect(() => {
    media.forEach((m) => {
      if (m.type === 'video' && m.purpose === 'transition' && m.url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'video';
        link.href = m.url;
        document.head.appendChild(link);
      }
    });
  }, [media]);

  const findTransitionVideo = useCallback(
    (from: string, to: string): Media | undefined => {
      return media.find((m) => {
        if (m.type !== 'video' || m.purpose !== 'transition') return false;
        const meta = m.metadata as Record<string, unknown>;
        return meta?.from_viewpoint === from && meta?.to_viewpoint === to;
      });
    },
    [media]
  );

  const findEntranceVideo = useCallback(
    (viewpoint: string): Media | undefined => {
      return media.find((m) => {
        if (m.type !== 'video') return false;
        const meta = m.metadata as Record<string, unknown>;
        return meta?.entrance_from_viewpoint === viewpoint;
      });
    },
    [media]
  );

  const handleEnterBuilding = useCallback(() => {
    const video = findEntranceVideo(currentViewpoint);
    if (video?.url) {
      setEntranceVideoUrl(video.url);
      preloadOnEntrance?.forEach((url) => {
        if (url.endsWith('.svg')) {
          fetch(url);
        } else {
          const img = new Image();
          img.src = url;
        }
      });
    } else {
      onEnterBuilding?.();
    }
  }, [currentViewpoint, findEntranceVideo, onEnterBuilding, preloadOnEntrance]);

  useImperativeHandle(ref, () => ({
    enterBuilding: handleEnterBuilding,
  }), [handleEnterBuilding]);

  useEffect(() => {
    if (phase !== 'idle') return;

    const container = svgContainerRef.current;
    if (!container) return;

    let cancelled = false;
    const svgPath = spinSvgs[currentViewpoint];
    if (!svgPath) return;

    const isMobile = window.innerWidth <= 1280;

    fetch(svgPath)
      .then((res) => res.text())
      .then((svgText) => {
        if (cancelled) return;

        container.innerHTML = svgText;

        const svg = container.querySelector('svg');
        if (!svg) return;

        svg.querySelectorAll('image').forEach((img) => img.remove());

        if (portraitPanorama) {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.width = '100%';
          svg.style.height = '100%';
        } else {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
          svg.style.position = 'absolute';
          svg.style.inset = '0';
          svg.style.width = '100%';
          svg.style.height = '100%';
        }

        const towerId = hotspotTowerId ?? 'tower';
        const markerId = hotspotMarkerId ?? 'marker';
        const tower = svg.querySelector(`#${CSS.escape(towerId)}`) as SVGElement | null;
        const marker = svg.querySelector(`#${CSS.escape(markerId)}`) as SVGElement | null;
        const hasNamedElements = !!tower || !!marker;

        if (hasNamedElements) {
          if (tower) {
            if (isMobile) {
              tower.classList.add('hotspot-pulse');
            } else {
              tower.style.fill = 'rgba(255, 255, 255, 0.05)';
              tower.style.stroke = 'rgba(255, 255, 255, 0.4)';
              tower.style.strokeWidth = '2';
            }
          }

          if (marker) {
            marker.style.fill = 'rgba(74, 144, 226, 0.7)';
            marker.style.stroke = '#ffffff';
            marker.style.strokeWidth = '4';
            marker.style.cursor = 'pointer';
            marker.style.transition = 'fill 0.3s ease, stroke-width 0.3s ease';

            marker.addEventListener('mouseenter', () => {
              marker.style.fill = 'rgba(74, 144, 226, 1)';
              marker.style.strokeWidth = '6';
            });
            marker.addEventListener('mouseleave', () => {
              marker.style.fill = 'rgba(74, 144, 226, 0.7)';
              marker.style.strokeWidth = '4';
            });
            marker.addEventListener('click', (e) => {
              e.stopPropagation();
              handleEnterBuilding();
            });

            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'r');
            animate.setAttribute('values', '22;28;22');
            animate.setAttribute('dur', '2s');
            animate.setAttribute('repeatCount', 'indefinite');
            marker.appendChild(animate);
          }
        } else {
          svg.querySelectorAll('circle').forEach((c) => c.remove());

          if (isMobile) {
            const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = `
              @keyframes hotspotPulse {
                0%, 100% {
                  fill: rgba(255, 255, 255, 0.1);
                  stroke: rgba(255, 255, 255, 0.4);
                }
                50% {
                  fill: rgba(255, 255, 255, 0.2);
                  stroke: rgba(255, 255, 255, 0.7);
                }
              }
              .hotspot-pulse {
                animation: hotspotPulse 2s ease-in-out infinite;
                stroke-width: 2px;
              }
            `;
            svg.insertBefore(style, svg.firstChild);
          }

          const shapes = svg.querySelectorAll<SVGElement>('path, polygon, polyline, rect, ellipse');

          /* Calculate hotspot center position on mount — needed for mobile always-visible card */
          {
            const containerRect = container.getBoundingClientRect();
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            shapes.forEach((s) => {
              const r = s.getBoundingClientRect();
              if (r.left < minX) minX = r.left;
              if (r.top < minY) minY = r.top;
              if (r.right > maxX) maxX = r.right;
              if (r.bottom > maxY) maxY = r.bottom;
            });
            if (minX < Infinity) {
              const cx = ((minX + maxX) / 2 - containerRect.left) / containerRect.width * 100;
              const cy = ((minY + maxY) / 2 - containerRect.top) / containerRect.height * 100;
              setHotspotCard((prev) => prev.x === 0 ? { visible: false, x: cx, y: cy } : prev);
            }
          }

          shapes.forEach((shape) => {
            shape.style.cursor = 'pointer';
            shape.style.transition = 'fill 0.2s ease, stroke 0.2s ease';

            if (isMobile) {
              shape.classList.add('hotspot-pulse');
            } else {
              shape.style.fill = 'transparent';
              shape.style.stroke = 'transparent';
            }

            if (!isMobile) {
              shape.addEventListener('mouseenter', () => {
                // Cancel any pending hide
                if (hotspotHideTimer.current) {
                  clearTimeout(hotspotHideTimer.current);
                  hotspotHideTimer.current = null;
                }
                shapes.forEach((s) => {
                  s.style.fill = 'rgba(255, 255, 255, 0.15)';
                  s.style.stroke = 'rgba(255, 255, 255, 0.6)';
                });
                // Calculate center of all shapes for card position
                const containerRect = container.getBoundingClientRect();
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                shapes.forEach((s) => {
                  const r = s.getBoundingClientRect();
                  if (r.left < minX) minX = r.left;
                  if (r.top < minY) minY = r.top;
                  if (r.right > maxX) maxX = r.right;
                  if (r.bottom > maxY) maxY = r.bottom;
                });
                const centerX = ((minX + maxX) / 2 - containerRect.left) / containerRect.width * 100;
                const centerY = ((minY + maxY) / 2 - containerRect.top) / containerRect.height * 100;
                setHotspotCard({ visible: true, x: centerX, y: centerY });
              });

              shape.addEventListener('mouseleave', () => {
                // Delay hiding — check if mouse moved onto the card before actually hiding
                hotspotHideTimer.current = setTimeout(() => {
                  if (isMouseOverCard.current) return;
                  shapes.forEach((s) => {
                    s.style.fill = 'transparent';
                    s.style.stroke = 'transparent';
                  });
                  setHotspotCard((prev) => ({ ...prev, visible: false }));
                }, 300);
              });
            }

            if (isMobile) {
              shape.addEventListener('click', (e) => {
                e.stopPropagation();
                handleEnterBuilding();
              });
            }
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      container.innerHTML = '';
    };
  }, [currentViewpoint, phase, handleEnterBuilding, spinSvgs, portraitPanorama, hotspotTowerId, hotspotMarkerId]);

  useEffect(() => {
    if (!portraitPanorama || !scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    });
  }, [currentViewpoint, portraitPanorama]);

  const navigateTo = useCallback(
    (target: string) => {
      if (target === currentViewpoint || phase === 'transitioning') return;

      if (portraitPanorama) {
        setCurrentViewpoint(target);
        return;
      }

      const video = findTransitionVideo(currentViewpoint, target);
      if (video?.url) {
        setVideoPlaying(false);
        setPhase('transitioning');
        setTransitionVideoUrl(video.url);
        onVideoEndRef.current = () => {
          setCurrentViewpoint(target);
          setPhase('idle');
          setVideoPlaying(false);
          setTransitionVideoUrl(null);
        };
      } else {
        setCurrentViewpoint(target);
      }
    },
    [currentViewpoint, phase, findTransitionVideo, portraitPanorama]
  );

  const currentIdx = viewpointOrder.indexOf(currentViewpoint);
  const nextIdx = (currentIdx + 1) % viewpointOrder.length;
  const prevIdx = (currentIdx - 1 + viewpointOrder.length) % viewpointOrder.length;

  useEffect(() => {
    if (portraitPanorama) return;
    const el = dragRef.current;
    if (!el) return;

    let startX = 0;
    let dragging = false;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      dragging = true;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) >= 25) {
        if (dx < 0) {
          navigateTo(viewpointOrder[(currentIdx + 1) % viewpointOrder.length]);
        } else {
          navigateTo(viewpointOrder[(currentIdx - 1 + viewpointOrder.length) % viewpointOrder.length]);
        }
      }
    };

    const onPointerCancel = () => {
      dragging = false;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [portraitPanorama, navigateTo, currentIdx, viewpointOrder]);

  const showOverlay = phase === 'idle' || !videoPlaying;

  const shapePointerEvents = '[&_path]:pointer-events-auto [&_polygon]:pointer-events-auto [&_polyline]:pointer-events-auto [&_rect]:pointer-events-auto [&_ellipse]:pointer-events-auto';
  const svgOverlay = showOverlay && !entranceVideoPlaying && !hideSvgOverlay && (
    <div
      ref={svgContainerRef}
      className={
        portraitPanorama
          ? `absolute top-0 left-0 w-full h-full z-20 pointer-events-none ${shapePointerEvents}`
          : `absolute inset-0 z-20 pointer-events-none ${shapePointerEvents}`
      }
    />
  );

  return (
    <div className="relative w-full h-full">
      {portraitPanorama ? (
        <>
          {viewpoints.map((vp) => (
            <div
              key={vp.id}
              ref={vp.id === currentViewpoint ? scrollRef : undefined}
              className="absolute inset-0 overflow-x-auto overflow-y-hidden no-scrollbar"
              style={{
                opacity: vp.id === currentViewpoint ? 1 : 0,
                zIndex: vp.id === currentViewpoint ? 5 : 1,
                touchAction: 'pan-x',
                pointerEvents: vp.id === currentViewpoint ? 'auto' : 'none',
              }}
            >
              <div
                className="h-full relative"
                style={{ width: 'calc(100dvh * 1920 / 1080)' }}
              >
                <img
                  src={vp.image?.url}
                  alt=""
                  className="h-full w-auto"
                />
                {vp.id === currentViewpoint && svgOverlay}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {viewpoints.map((vp) => (
            <img
              key={vp.id}
              src={vp.image?.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: vp.id === currentViewpoint ? 1 : 0,
                zIndex: vp.id === currentViewpoint ? 5 : 1,
              }}
            />
          ))}

          {svgOverlay}

          {showOverlay && !entranceVideoPlaying && (
            <div
              ref={dragRef}
              className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            />
          )}
        </>
      )}

      {/* Hotspot card — desktop only, positioned on SVG hover */}
      {hotspotCard.visible && (
        <div
          ref={hotspotCardRef}
          className="absolute z-50 flex-col items-center pointer-events-auto hidden landscape:flex"
          style={{
            left: `${hotspotCard.x}%`,
            top: `${hotspotCard.y}%`,
            transform: 'translate(-50%, -16px)',
          }}
          onMouseEnter={() => {
            isMouseOverCard.current = true;
            if (hotspotHideTimer.current) {
              clearTimeout(hotspotHideTimer.current);
              hotspotHideTimer.current = null;
            }
          }}
          onMouseLeave={() => {
            isMouseOverCard.current = false;
            setHotspotCard((prev) => ({ ...prev, visible: false }));
          }}
        >
          {/* White dot with gray ring — 32×32 */}
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(128, 128, 128, 0.23)',
              border: '1.4px solid white',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="w-[20px] h-[20px] rounded-full bg-white" />
          </div>

          {/* Card — gray glass outer border, white inner with everything */}
          <div
            className="mt-[6px] w-[168px] rounded-[10px] p-[6px]"
            style={{
              background: 'rgba(214, 214, 214, 0.45)',
              backgroundBlendMode: 'luminosity',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* White inner — logo + name + button all inside */}
            <div className="w-full rounded-[8px] bg-white/90 flex flex-col items-center pt-[14px] pb-[10px] px-[10px]">
              {projectLogoUrl && (
                <img src={projectLogoUrl} alt="" className="w-[36px] h-[36px] object-contain mb-[6px]" />
              )}
              {projectName && (
                <span className="text-[12px] font-normal text-[#5A5A5A] tracking-[0.08em] mb-[10px]">
                  {projectName.toUpperCase()}
                </span>
              )}
              <button
                onClick={handleEnterBuilding}
                style={accentColor ? { backgroundColor: accentColor } : undefined}
                className={`w-full h-[36px] rounded-full text-[13px] font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity outline-none ${
                  accentColor ? 'text-white' : 'bg-[#1A1A1A] text-white'
                }`}
              >
                Ingresar &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'transitioning' && transitionVideoUrl && (
        <div className="absolute inset-0" style={{ zIndex: videoPlaying ? 10 : 1 }}>
          <VideoPlayer
            src={transitionVideoUrl}
            autoPlay
            muted
            controls={false}
            onPlaying={() => setVideoPlaying(true)}
            onEnded={() => onVideoEndRef.current?.()}
            className="w-full h-full"
          />
        </div>
      )}

      {showOverlay && !entranceVideoPlaying && !hideControls && (
        <>
          {onEnterBuilding && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleEnterBuilding}
                className="bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium text-white shadow-lg hover:bg-white/20 transition-colors"
              >
                {enterLabel}
              </button>
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 z-20 flex items-end justify-center pb-20">
            <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <button
                onClick={() => navigateTo(viewpointOrder[prevIdx])}
                className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Vista anterior"
              >
                ←
              </button>
              <button
                onClick={() => navigateTo(viewpointOrder[nextIdx])}
                className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Vista siguiente"
              >
                →
              </button>
            </div>
          </div>
        </>
      )}

      {renderNavigation?.({
        onPrev: () => navigateTo(viewpointOrder[prevIdx]),
        onNext: () => navigateTo(viewpointOrder[nextIdx]),
        isTransitioning: phase === 'transitioning',
      })}

      {entranceVideoUrl && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            zIndex: entranceVideoPlaying ? 50 : 1,
            opacity: entranceFadingOut ? 0 : 1,
          }}
        >
          <VideoPlayer
            src={entranceVideoUrl}
            autoPlay
            muted
            controls={false}
            onPlaying={() => setEntranceVideoPlaying(true)}
            onEnded={() => {
              setEntranceFadingOut(true);
              setTimeout(() => onEnterBuilding?.(), 500);
            }}
            className="w-full h-full"
          />
        </div>
      )}

    </div>
  );
});
