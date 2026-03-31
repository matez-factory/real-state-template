import { useSyncExternalStore } from 'react';

const QUERY = '(orientation: portrait) and (max-width: 1279px)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Alineado con Tailwind portrait/max-xl; lectura síncrona en el primer paint (sin flash escritorio→móvil). */
export function useIsMobilePortrait(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
