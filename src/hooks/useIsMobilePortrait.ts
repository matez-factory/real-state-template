import { useState, useEffect } from 'react';

const QUERY = '(orientation: portrait) and (max-width: 1279px)';

export function useIsMobilePortrait(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setMatches(mq.matches);

    const handler = () => setMatches(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return matches;
}
