import type { RawProject, RawLayer, RawMedia, RawUnitType } from './data/transform';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const PROJECT_SLUG = import.meta.env.VITE_PROJECT_SLUG || '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export function fetchProject(): Promise<RawProject> {
  return get<RawProject>(`/projects/by-slug/${PROJECT_SLUG}`);
}

export function fetchLayers(projectId: string): Promise<RawLayer[]> {
  return get<RawLayer[]>(`/layers/by-project/${projectId}`);
}

export function fetchMedia(projectId: string): Promise<RawMedia[]> {
  return get<RawMedia[]>(`/media/by-project/${projectId}`);
}

export function fetchUnitTypes(projectId: string): Promise<RawUnitType[]> {
  return get<RawUnitType[]>(`/unit-types/by-project/${projectId}`);
}
