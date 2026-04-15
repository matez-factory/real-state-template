import type { Plugin } from 'vite';

interface ProjectMeta {
  name: string;
  description: string | null;
  logo_url: string | null;
  tagline: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function projectMetaPlugin(): Plugin {
  let projectMeta: ProjectMeta | null = null;

  return {
    name: 'project-meta',

    async configResolved(config) {
      const slug = config.env?.VITE_PROJECT_SLUG || process.env.VITE_PROJECT_SLUG || '';
      if (!slug) {
        console.warn('[project-meta] VITE_PROJECT_SLUG not set, skipping meta injection');
        return;
      }

      // BUILD_API_URL for build-time access (not exposed to client).
      // Defaults to production URL, or localhost in dev mode.
      const apiBase =
        process.env.BUILD_API_URL ||
        (config.mode === 'production'
          ? 'https://real-state-api-mu32.onrender.com/api/v1'
          : 'http://localhost:8080/api/v1');

      const url = `${apiBase}/projects/by-slug/${slug}`;
      console.log(`[project-meta] Fetching project meta from ${url}`);

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        projectMeta = (await res.json()) as ProjectMeta;
        console.log(`[project-meta] Loaded meta for "${projectMeta.name}"`);
      } catch (err) {
        console.warn(`[project-meta] Could not fetch project data: ${err}`);
        console.warn('[project-meta] Meta tags will use fallback values');
      }
    },

    transformIndexHtml(html) {
      if (!projectMeta) return html;

      const title = escapeHtml(projectMeta.tagline || projectMeta.name);
      const description = projectMeta.description
        ? escapeHtml(projectMeta.description)
        : '';
      const image = projectMeta.logo_url || '';

      const metaTags = [
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:type" content="website" />`,
        description && `<meta property="og:description" content="${description}" />`,
        image && `<meta property="og:image" content="${image}" />`,
        description && `<meta name="description" content="${description}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${title}" />`,
        description && `<meta name="twitter:description" content="${description}" />`,
        image && `<meta name="twitter:image" content="${image}" />`,
      ]
        .filter(Boolean)
        .join('\n    ');

      // Replace static title and inject meta tags before </head>
      return html
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace('</head>', `    ${metaTags}\n  </head>`);
    },
  };
}
