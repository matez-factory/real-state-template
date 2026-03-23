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
  available: 'rgba(17, 187, 93, 0.73)',
  reserved: 'rgba(224, 124, 17, 0.73)',
  sold: '#d6254c',
  not_available: '#9ca3af',
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

    /* Nuclear: kill ALL fills from SVG source to prevent blue (#3159ff).
       1. Remove any <style> blocks (could have rules with !important)
       2. Remove fill attribute from every element
       3. Clear any inline style.fill
       4. Inject a <style> that forces fill:none on all shapes
       We re-apply fills explicitly in entity setup below. */
    svg.querySelectorAll('style').forEach((s) => s.remove());
    svg.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('fill');
      if ((el as HTMLElement).style) (el as HTMLElement).style.removeProperty('fill');
      // Apply fill:none inline to each element — avoids a <style> rule that leaks to the whole page
      (el as SVGElement).style.setProperty('fill', 'none', 'important');
    });

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
        if (isBuilding) {
          /* Hide non-entity shapes completely — SVG default fill (#3159ff) would bleed through */
          element.style.fill = 'transparent';
          element.style.stroke = 'none';
        } else {
          element.style.opacity = '0.3';
        }
      }
    });

    const listeners: ListenerEntry[] = [];

    entities.forEach((entity) => {
      let element = svg.querySelector(`#${CSS.escape(entity.id)}`) as SVGElement | null;
      // Fallback: try suffix after last dash (e.g. "14-a" → "a"), then uppercase ("A")
      if (!element && entity.id.includes('-')) {
        const suffix = entity.id.split('-').pop()!;
        element = svg.querySelector(`#${CSS.escape(suffix)}`) as SVGElement | null;
        if (!element) {
          element = svg.querySelector(`#${CSS.escape(suffix.toUpperCase())}`) as SVGElement | null;
        }
      }
      // Fallback: try case-insensitive match
      if (!element) {
        element = svg.querySelector(`[id="${entity.id}" i]`) as SVGElement | null
          ?? Array.from(svg.querySelectorAll('[id]')).find(
            (el) => el.id.toLowerCase() === entity.id.toLowerCase()
          ) as SVGElement | null;
      }
      if (!element) {
        console.warn(`Element with id "${entity.id}" not found in SVG`);
        return;
      }

      /* Mark entity and all its children so the CSS reset rule skips them */
      element.setAttribute('data-entity', '1');
      element.style.setProperty('fill', 'transparent', 'important');
      element.querySelectorAll('*').forEach((child) => {
        (child as SVGElement).setAttribute('data-entity', '1');
        (child as SVGElement).style.setProperty('fill', 'transparent', 'important');
        if (isBuilding) (child as SVGElement).style.setProperty('stroke', 'none', 'important');
      });
      if (!isBuilding) {
        /* lots variant keeps transparent fill, no stroke */
      } else {
        element.style.stroke = 'none';
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
      let hoverExtra: SVGGElement | null = null;
      let labelDot: SVGElement | null = null;
      let labelText: SVGElement | null = null;

      let hoverFired = false;
      const onEnter = () => {
        if (isBuilding) {
          /* Figma: Rectangle 1308 — rgba(52,90,216,0.15) highlight on SVG path */
          const hoverFill = 'rgba(52, 90, 216, 0.15)';
          element.style.setProperty('fill', hoverFill, 'important');
          element.querySelectorAll('*').forEach((c) => {
            (c as SVGElement).style.setProperty('fill', hoverFill, 'important');
          });
          if (bgShape) {
            /* Figma hover pill: bg rgba(214,214,214,0.45), rounded-[10px] */
            bgShape.setAttribute('fill', 'rgba(214, 214, 214, 0.45)');
            bgShape.setAttribute('rx', '10');
            bgShape.setAttribute('width', String(Number(bgShape.getAttribute('data-hover-w'))));
            bgShape.setAttribute('height', String(Number(bgShape.getAttribute('data-hover-h'))));
            bgShape.setAttribute('x', String(Number(bgShape.getAttribute('data-hover-x'))));
            bgShape.setAttribute('y', String(Number(bgShape.getAttribute('data-hover-y'))));
          }
        } else {
          element.style.fill = 'rgba(255, 255, 255, 0.15)';
          if (bgShape) bgShape.setAttribute('fill', 'rgba(0, 0, 0, 0.85)');
        }
        if (labelDot) {
          labelDot.setAttribute('cy', labelDot.getAttribute('data-hover-cy') ?? '0');
          labelDot.setAttribute('cx', labelDot.getAttribute('data-hover-cx') ?? labelDot.getAttribute('cx')!);
        }
        if (labelText) {
          labelText.setAttribute('y', labelText.getAttribute('data-hover-y') ?? '5');
          labelText.setAttribute('x', labelText.getAttribute('data-hover-x') ?? labelText.getAttribute('x')!);
          /* Figma hover: Poppins 700 18px */
          labelText.setAttribute('font-size', '18');
          labelText.setAttribute('font-weight', '700');
        }
        if (hoverExtra) hoverExtra.style.display = 'block';
        if (scaleGroup) scaleGroup.style.transform = 'scale(1.05)';
        if (!hoverFired && entity.onHover) {
          hoverFired = true;
          entity.onHover();
        }
      };
      const onLeave = () => {
        if (isBuilding) {
          element.style.setProperty('fill', 'transparent', 'important');
          element.querySelectorAll('*').forEach((c) => {
            (c as SVGElement).style.setProperty('fill', 'transparent', 'important');
          });
          if (bgShape) {
            /* Figma rest pill: bg rgba(233,233,233,0.81), rounded-[20px] */
            bgShape.setAttribute('fill', 'rgba(233, 233, 233, 0.81)');
            bgShape.setAttribute('rx', '20');
            bgShape.setAttribute('width', String(Number(bgShape.getAttribute('data-rest-w'))));
            bgShape.setAttribute('height', String(Number(bgShape.getAttribute('data-rest-h'))));
            bgShape.setAttribute('x', String(Number(bgShape.getAttribute('data-rest-x'))));
            bgShape.setAttribute('y', String(Number(bgShape.getAttribute('data-rest-y'))));
          }
        } else {
          element.style.fill = 'transparent';
          if (bgShape) bgShape.setAttribute('fill', 'rgba(0, 0, 0, 0.45)');
        }
        if (labelDot) {
          labelDot.setAttribute('cy', labelDot.getAttribute('data-rest-cy') ?? '0');
          labelDot.setAttribute('cx', labelDot.getAttribute('data-rest-cx') ?? labelDot.getAttribute('cx')!);
        }
        if (labelText) {
          labelText.setAttribute('y', labelText.getAttribute('data-rest-y') ?? '5');
          labelText.setAttribute('x', labelText.getAttribute('data-rest-x') ?? labelText.getAttribute('x')!);
          /* Figma rest: Poppins 600 16px */
          labelText.setAttribute('font-size', '16');
          labelText.setAttribute('font-weight', '600');
        }
        if (hoverExtra) hoverExtra.style.display = 'none';
        if (scaleGroup) scaleGroup.style.transform = 'scale(1)';
      };
      const onClick = (e: Event) => {
        e.stopPropagation();
        entity.onClick();
      };
      const onFocus = () => onEnter();
      const onBlur = () => onLeave();
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
        posGroup.setAttribute('data-ui', '1');

        scaleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        scaleGroup.style.transition = 'transform 0.2s ease';
        scaleGroup.style.transformOrigin = '0 0';

        if (isBuilding) {
          /*
           * Figma specs (from MCP):
           * Rest pill (201:238): bg rgba(233,233,233,0.81), mix-blend-luminosity,
           *   border 1.4px rgba(255,255,255,0.4), rounded-[20px]
           *   Label: Poppins SemiBold 16px #484848, dot 10px
           * Hover pill (166:189): bg rgba(214,214,214,0.45), mix-blend-luminosity,
           *   backdrop-blur 50px, border 1.4px rgba(255,255,255,0.4), rounded-[10px]
           *   shadow 0 2 4 rgba(0,0,0,0.1)
           *   Label: Poppins Bold 18px #484848
           *   "Ver más": Poppins Medium 12px #707070
           *   Dot: 10px (status color)
           */
          const labelLen = entity.label.length;
          const restW = Math.max(labelLen * 11 + 40, 66);
          const restH = 31;
          const hoverW = Math.max(restW + 20, 112);
          const hoverH = 65;

          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('x', String(-restW / 2));
          bgRect.setAttribute('y', String(-restH / 2));
          bgRect.setAttribute('width', String(restW));
          bgRect.setAttribute('height', String(restH));
          bgRect.setAttribute('rx', '20');
          bgRect.setAttribute('fill', 'rgba(233, 233, 233, 0.81)');
          bgRect.setAttribute('stroke', 'rgba(255, 255, 255, 0.4)');
          bgRect.setAttribute('stroke-width', '1.4');
          bgRect.style.transition = 'all 0.2s ease';
          /* Store rest/hover dimensions for toggle */
          bgRect.setAttribute('data-rest-w', String(restW));
          bgRect.setAttribute('data-rest-h', String(restH));
          bgRect.setAttribute('data-rest-x', String(-restW / 2));
          bgRect.setAttribute('data-rest-y', String(-restH / 2));
          bgRect.setAttribute('data-hover-w', String(hoverW));
          bgRect.setAttribute('data-hover-h', String(hoverH));
          bgRect.setAttribute('data-hover-x', String(-hoverW / 2));
          bgRect.setAttribute('data-hover-y', String(-hoverH / 2));
          bgShape = bgRect;

          /*
           * Figma pill CSS positions (relative to pill origin):
           * Rest pill: dot at center-left, label next to dot
           * Hover pill (112x65): dot at left:21,top:19 → label at left:36,top:9
           *   "Ver más" at top:35, arrow icon at left:73,top:35
           *
           * SVG coords are centered (0,0 = pill center), so:
           *   Figma left:X,top:Y → SVG x: -W/2+X, y: -H/2+Y
           */
          /*
           * Layout: hover pill = hoverH (65px) tall, centered at 0.
           * Row 1 (dot + label): y center at -10 (upper half)
           * Row 2 (Ver más + arrow): y center at +18 (lower half)
           * Rest state: dot+label centered at y=0
           */
          /* Figma rest: dot at ~16px from left edge, text at ~28px from left edge */
          const restDotCx = -restW / 2 + 16;
          const restTextX = -restW / 2 + 28;
          /* Figma hover (112×65): dot at left:21(+5r)=26, text at left:36 */
          const hoverDotCx = -hoverW / 2 + 26;
          const hoverTextX = -hoverW / 2 + 36;

          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', String(restDotCx));
          dot.setAttribute('cy', '0');
          dot.setAttribute('r', '5');
          dot.setAttribute('fill', STATUS_DOT_COLORS[entity.status]);
          /* Store rest/hover positions for dot */
          dot.setAttribute('data-rest-cy', '0');
          dot.setAttribute('data-hover-cy', '-10');
          dot.setAttribute('data-rest-cx', String(restDotCx));
          dot.setAttribute('data-hover-cx', String(hoverDotCx));

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', String(restTextX));
          text.setAttribute('y', '5');
          text.setAttribute('font-family', "'Poppins', system-ui, sans-serif");
          text.setAttribute('font-size', '16');
          text.setAttribute('font-weight', '600');
          text.setAttribute('fill', '#484848');
          text.textContent = entity.label;
          /* Store rest/hover positions for text */
          text.setAttribute('data-rest-y', '5');
          text.setAttribute('data-hover-y', '-5');
          text.setAttribute('data-rest-x', String(restTextX));
          text.setAttribute('data-hover-x', String(hoverTextX));

          /* "Ver Más →" shown on hover — Figma: top:35.11 in 65px pill → SVG y ≈ 15 */
          const hoverG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          hoverG.style.display = 'none';
          const hoverText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          hoverText.setAttribute('x', '0');
          hoverText.setAttribute('y', '15');
          hoverText.setAttribute('text-anchor', 'middle');
          hoverText.setAttribute('font-family', "'Poppins', system-ui, sans-serif");
          hoverText.setAttribute('font-size', '12');
          hoverText.setAttribute('font-weight', '500');
          hoverText.setAttribute('fill', '#707070');
          hoverText.textContent = 'Ver Más  →';

          hoverG.appendChild(hoverText);
          hoverExtra = hoverG;

          labelDot = dot;
          labelText = text;
          scaleGroup.appendChild(bgRect);
          scaleGroup.appendChild(dot);
          scaleGroup.appendChild(text);
          scaleGroup.appendChild(hoverG);
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
      setVisible(false);
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
