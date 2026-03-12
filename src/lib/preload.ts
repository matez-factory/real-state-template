const preloaded = new Set<string>();

export function preloadImage(url: string | undefined | null) {
  if (!url || preloaded.has(url)) return;
  preloaded.add(url);
  const img = new Image();
  img.src = url;
}

export function preloadSvg(url: string | undefined | null) {
  if (!url || preloaded.has(url)) return;
  preloaded.add(url);
  fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
}
