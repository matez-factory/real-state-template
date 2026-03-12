import { useEffect, useRef, useCallback, useState } from 'react';
import type { EntityStatus } from '@/types/hierarchy.types';
import { STATUS_LABELS } from '@/lib/constants/status';

interface SVGEntityConfig {
  id: string;
  label: string;
  status: EntityStatus;
  onClick: () => void;
  onHover?: () => void;
}

interface InteractiveSVGProps {
  svgUrl: string;
  svgMobileUrl?: string;
  entities: SVGEntityConfig[];
  backgroundUrl?: string;
  backgroundMobileUrl?: string;
  variant?: 'lots' | 'building';
  onReady?: () => void;
}

const STATUS_DOT_COLORS: Record<EntityStatus, string> = {
  available: '#22c55e',
  reserved: '#eab308',
  sold: '#ef4444',
  not_available: '#9ca3af',
};

const STATUS_FILL: Record<EntityStatus, string> = {
  available: 'rgba(34, 197, 94, 0.12)',
  reserved: 'rgba(234, 179, 8, 0.12)',
  sold: 'rgba(239, 68, 68, 0.12)',
  not_available: 'rgba(156, 163, 175, 0.08)',
};
const STATUS_FILL_HOVER: Record<EntityStatus, string> = {
  available: 'rgba(34, 197, 94, 0.30)',
  reserved: 'rgba(234, 179, 8, 0.30)',
  sold: 'rgba(239, 68, 68, 0.30)',
  not_available: 'rgba(156, 163, 175, 0.18)',
};
const STATUS_STROKE: Record<EntityStatus, string> = {
  available: 'rgba(34, 197, 94, 0.6)',
  reserved: 'rgba(234, 179, 8, 0.6)',
  sold: 'rgba(239, 68, 68, 0.6)',
  not_available: 'rgba(156, 163, 175, 0.3)',
};

type ListenerEntry = { element: SVGElement; event: string; handler: EventListener };

export function InteractiveSVG({
  svgUrl,
  svgMobileUrl,
  entities,
  backgroundUrl,
  backgroundMobileUrl,
  variant = 'lots',
  onReady,
}: InteractiveSVGProps) {
  const isBuilding = variant === 'building';
  const containerRef = useRef<HTMLDivElement>(null);
  const listenersRef = useRef<ListenerEntry[]>([]);
  const [visible, setVisible] = useState(false);

  const resolveAssets = useCallback(() => {
    const isPortrait = window.matchMedia('(orientation: portrait) and (max-width: 1279px)').matches;
    return {
      activeSvgUrl: (isPortrait && svgMobileUrl) ? svgMobileUrl : svgUrl,
      activeBgUrl: (isPortrait && backgroundMobileUrl) ? backgroundMobileUrl : backgroundUrl,
    };
  }, [svgUrl, svgMobileUrl, backgroundUrl, backgroundMobileUrl]);

  const setupSVG = useCallback(async (container: HTMLDivElement) => {
    setVisible(false);
    const { activeSvgUrl, activeBgUrl } = resolveAssets();

    const res = await fetch(activeSvgUrl);
    if (!res.ok) throw new Error(`Failed to load SVG: ${res.statusText}`);

    const svgText = await res.text();
    container.innerHTML = svgText;

    const svg = container.querySelector('svg');
    if (!svg) throw new Error('No SVG element found');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.display = 'block';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.background = 'transparent';

    if (activeBgUrl) {
      const viewBox = svg.getAttribute('viewBox');
      const [, , vbWidth, vbHeight] = (viewBox ?? '0 0 1920 1080').split(' ');
      const bgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      if (onReady) {
        let fired = false;
        const fire = () => { if (!fired) { fired = true; onReady(); } };
        bgImage.addEventListener('load', fire, { once: true });
        bgImage.addEventListener('error', fire, { once: true });
      }
      bgImage.setAttribute('href', activeBgUrl);
      bgImage.setAttribute('x', '0');
      bgImage.setAttribute('y', '0');
      bgImage.setAttribute('width', vbWidth);
      bgImage.setAttribute('height', vbHeight);
      bgImage.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      svg.insertBefore(bgImage, svg.firstChild);
    } else {
      onReady?.();
    }

    const allPaths = svg.querySelectorAll('path, rect, polygon, circle, ellipse');
    allPaths.forEach((el) => {
      const element = el as SVGElement;
      if (!element.id || !entities.find(e => e.id === element.id)) {
        element.style.opacity = isBuilding ? '0.12' : '0.3';
      }
    });

    const listeners: ListenerEntry[] = [];

    entities.forEach((entity) => {
      const element = svg.querySelector(`#${CSS.escape(entity.id)}`) as SVGElement;
      if (!element) {
        console.warn(`Element with id "${entity.id}" not found in SVG`);
        return;
      }

      if (isBuilding) {
        element.style.fill = STATUS_FILL[entity.status];
        element.style.stroke = STATUS_STROKE[entity.status];
        element.style.strokeWidth = '2';
      } else {
        element.style.fill = 'transparent';
      }
      element.style.cursor = 'pointer';
      element.style.pointerEvents = 'all';
      element.style.transition = 'fill 0.2s ease, stroke 0.2s ease';
      element.style.opacity = '1';

      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `${entity.label} — ${STATUS_LABELS[entity.status]}`);
      element.style.outline = 'none';

      let bgShape: SVGElement | null = null;
      let scaleGroup: SVGGElement | null = null;

      let hoverFired = false;
      const onEnter = () => {
        element.style.fill = isBuilding ? STATUS_FILL_HOVER[entity.status] : 'rgba(255, 255, 255, 0.15)';
        if (bgShape) bgShape.setAttribute('fill', 'rgba(0, 0, 0, 0.85)');
        if (scaleGroup) scaleGroup.style.transform = 'scale(1.15)';
        if (!hoverFired && entity.onHover) {
          hoverFired = true;
          entity.onHover();
        }
      };
      const onLeave = () => {
        element.style.fill = isBuilding ? STATUS_FILL[entity.status] : 'transparent';
        if (bgShape) bgShape.setAttribute('fill', 'rgba(0, 0, 0, 0.45)');
        if (scaleGroup) scaleGroup.style.transform = 'scale(1)';
      };
      const onClick = (e: Event) => {
        e.stopPropagation();
        entity.onClick();
      };
      const onFocus = () => {
        element.style.fill = isBuilding ? STATUS_FILL_HOVER[entity.status] : 'rgba(255, 255, 255, 0.15)';
        if (bgShape) bgShape.setAttribute('fill', 'rgba(0, 0, 0, 0.85)');
        if (scaleGroup) scaleGroup.style.transform = 'scale(1.15)';
      };
      const onBlur = () => {
        element.style.fill = isBuilding ? STATUS_FILL[entity.status] : 'transparent';
        if (bgShape) bgShape.setAttribute('fill', 'rgba(0, 0, 0, 0.45)');
        if (scaleGroup) scaleGroup.style.transform = 'scale(1)';
      };
      const onKeyDown = (e: Event) => {
        const key = (e as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          entity.onClick();
        }
      };

      element.addEventListener('mouseenter', onEnter);
      element.addEventListener('mouseleave', onLeave);
      element.addEventListener('click', onClick);
      element.addEventListener('focus', onFocus);
      element.addEventListener('blur', onBlur);
      element.addEventListener('keydown', onKeyDown);

      listeners.push(
        { element, event: 'mouseenter', handler: onEnter },
        { element, event: 'mouseleave', handler: onLeave },
        { element, event: 'click', handler: onClick },
        { element, event: 'focus', handler: onFocus },
        { element, event: 'blur', handler: onBlur },
        { element, event: 'keydown', handler: onKeyDown },
      );

      try {
        const bbox = (element as SVGGraphicsElement).getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        const posGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        posGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
        posGroup.setAttribute('pointer-events', 'none');

        scaleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        scaleGroup.style.transition = 'transform 0.2s ease';
        scaleGroup.style.transformOrigin = '0 0';

        if (isBuilding) {
          const radius = 18;
          const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          bgCircle.setAttribute('cx', '0');
          bgCircle.setAttribute('cy', '0');
          bgCircle.setAttribute('r', String(radius));
          bgCircle.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
          bgCircle.style.transition = 'fill 0.2s ease';
          bgShape = bgCircle;

          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', '-6');
          dot.setAttribute('cy', '0');
          dot.setAttribute('r', '3.5');
          dot.setAttribute('fill', STATUS_DOT_COLORS[entity.status]);

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', '4');
          text.setAttribute('y', '5');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-family', 'system-ui, sans-serif');
          text.setAttribute('font-size', '14');
          text.setAttribute('font-weight', '700');
          text.setAttribute('fill', '#ffffff');
          text.textContent = entity.label;

          scaleGroup.appendChild(bgCircle);
          scaleGroup.appendChild(dot);
          scaleGroup.appendChild(text);
        } else {
          const textWidth = entity.label.length * 8 + 28;
          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('x', String(-textWidth / 2));
          bgRect.setAttribute('y', '-13');
          bgRect.setAttribute('width', String(textWidth));
          bgRect.setAttribute('height', '26');
          bgRect.setAttribute('rx', '13');
          bgRect.setAttribute('fill', 'rgba(0, 0, 0, 0.45)');
          bgRect.style.transition = 'fill 0.2s ease';
          bgShape = bgRect;

          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', String(-textWidth / 2 + 13));
          dot.setAttribute('cy', '0');
          dot.setAttribute('r', '4');
          dot.setAttribute('fill', STATUS_DOT_COLORS[entity.status]);

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', String(-textWidth / 2 + 23));
          text.setAttribute('y', '4');
          text.setAttribute('font-family', 'system-ui, sans-serif');
          text.setAttribute('font-size', '12');
          text.setAttribute('font-weight', '600');
          text.setAttribute('fill', '#ffffff');
          text.textContent = entity.label;

          scaleGroup.appendChild(bgRect);
          scaleGroup.appendChild(dot);
          scaleGroup.appendChild(text);
        }

        posGroup.appendChild(scaleGroup);
        svg.appendChild(posGroup);
      } catch (err) {
        console.warn(`Could not add label for ${entity.id}:`, err);
      }
    });

    listenersRef.current = listeners;
    setVisible(true);
  }, [resolveAssets, entities, isBuilding, onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      for (const { element, event, handler } of listenersRef.current) {
        element.removeEventListener(event, handler);
      }
      listenersRef.current = [];
      container.innerHTML = '';

      setupSVG(container).catch((err) => {
        if (!cancelled) console.error('Error loading SVG:', err);
      });
    };

    run();

    const hasMobileAssets = !!(svgMobileUrl || backgroundMobileUrl);
    const mq = hasMobileAssets
      ? window.matchMedia('(orientation: portrait) and (max-width: 1279px)')
      : null;

    if (mq) {
      const onOrientationChange = () => run();
      mq.addEventListener('change', onOrientationChange);
      return () => {
        cancelled = true;
        mq.removeEventListener('change', onOrientationChange);
        for (const { element, event, handler } of listenersRef.current) {
          element.removeEventListener(event, handler);
        }
        listenersRef.current = [];
        container.innerHTML = '';
      };
    }

    return () => {
      cancelled = true;
      for (const { element, event, handler } of listenersRef.current) {
        element.removeEventListener(event, handler);
      }
      listenersRef.current = [];
      container.innerHTML = '';
    };
  }, [setupSVG, svgMobileUrl, backgroundMobileUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
      }}
    />
  );
}
