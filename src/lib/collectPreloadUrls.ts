import type { RawLayer, RawMedia } from './data/transform';

/**
 * Collect all unique image and SVG URLs from raw project data.
 */
export function collectPreloadUrls(
  rawLayers: RawLayer[],
  rawMedia: RawMedia[]
): string[] {
  const urls = new Set<string>();

  // Media items: images and SVGs only
  for (const m of rawMedia) {
    if ((m.type === 'image' || m.type === 'svg') && m.url) {
      urls.add(m.url);
    }
  }

  // Layer visual assets
  for (const l of rawLayers) {
    if (l.svg_overlay_url) urls.add(l.svg_overlay_url);
    if (l.svg_overlay_mobile_url) urls.add(l.svg_overlay_mobile_url);
    if (l.background_image_url) urls.add(l.background_image_url);
    if (l.background_image_mobile_url) urls.add(l.background_image_mobile_url);
  }

  return Array.from(urls);
}
