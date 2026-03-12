import { useState, useEffect } from 'react';
import type { RawProject, RawLayer, RawMedia, RawUnitType } from './data/transform';
import { fetchProject, fetchLayers, fetchMedia, fetchUnitTypes } from './api';

export interface RawProjectData {
  rawProject: RawProject;
  rawLayers: RawLayer[];
  rawMedia: RawMedia[];
  rawUnitTypes: RawUnitType[];
}

export function useProjectData() {
  const [data, setData] = useState<RawProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rawProject = await fetchProject();
        const [rawLayers, rawMedia, rawUnitTypes] = await Promise.all([
          fetchLayers(rawProject.id),
          fetchMedia(rawProject.id),
          fetchUnitTypes(rawProject.id),
        ]);
        if (!cancelled) {
          setData({ rawProject, rawLayers, rawMedia, rawUnitTypes });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error loading project');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
