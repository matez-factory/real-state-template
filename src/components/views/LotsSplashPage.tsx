import type { ExplorerPageData } from '@/types/hierarchy.types';
import { BuildingSplashPage } from './BuildingSplashPage';

interface LotsSplashPageProps {
  data: ExplorerPageData;
  onPlayIntro?: (videoUrl: string, targetPath: string) => void;
  preloadPhase?: 'loading' | 'fadeout' | 'done';
  preloadProgress?: number;
}

export function LotsSplashPage({ data, onPlayIntro, preloadPhase, preloadProgress }: LotsSplashPageProps) {
  return (
    <BuildingSplashPage
      data={data}
      onPlayIntro={onPlayIntro}
      preloadPhase={preloadPhase}
      preloadProgress={preloadProgress}
    />
  );
}
