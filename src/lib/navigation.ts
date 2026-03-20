import type { ExplorerPageData } from '@/types/hierarchy.types';

/** URL for the "Inicio" button — tour layer if project has 360, otherwise first root layer */
export function getHomeUrl(data: ExplorerPageData): string {
  const { rootLayers, project } = data;
  // If project has 360 tour, navigate to the tour layer
  if (project.has360Tour) {
    const tourLayer = rootLayers.find((l) => l.type === 'tour');
    if (tourLayer) return `/${tourLayer.slug}`;
  }
  if (rootLayers.length > 0) {
    return `/${rootLayers[0].slug}`;
  }
  return '/';
}

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
