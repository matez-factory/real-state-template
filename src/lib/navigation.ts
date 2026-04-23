import type { ExplorerPageData } from '@/types/hierarchy.types';

/** URL for the "Inicio" button. Always `/home` — that route renders `HomeRoute`,
 *  which redirects to the tour layer if one exists or shows a "no tour" placeholder
 *  over the splash background otherwise. */
export const HOME_URL = '/home';

/** URL for the "Atrás" / back button */
export function getBackUrl(data: ExplorerPageData): string {
  const { currentLayer, currentPath, rootLayers } = data;

  // At splash — nowhere to go back
  if (!currentLayer) return '/';

  // At depth 0 — go to previous root sibling, or splash if first
  if (currentLayer.depth === 0) {
    const idx = rootLayers.findIndex((l) => l.id === currentLayer.id);
    if (idx > 0) {
      return `/${rootLayers[idx - 1].slug}`;
    }
    return '/';
  }

  // Deeper layers — go to parent
  const parentPath = currentPath.slice(0, -1);
  return parentPath.length > 0
    ? `/${parentPath.join('/')}`
    : '/';
}
