import type { EntityStatus, ProjectStatus } from '@/types/hierarchy.types';

export const STATUS_LABELS: Record<EntityStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
  not_available: 'No Disponible',
};

export const STATUS_CLASSES: Record<EntityStatus, string> = {
  available: 'bg-green-500/20 text-green-400 border border-green-500/30',
  reserved: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  sold: 'bg-red-500/20 text-red-400 border border-red-500/30',
  not_available: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

export const STATUS_DOT_CLASSES: Record<EntityStatus, string> = {
  available: 'bg-green-500',
  reserved: 'bg-orange-500',
  sold: 'bg-red-500',
  not_available: 'bg-gray-500',
};

export const STATUS_COLORS: Record<EntityStatus, { fill: string; stroke: string; indicator: string }> = {
  available: {
    fill: 'rgba(76, 175, 80, 0.25)',
    stroke: '#4CAF50',
    indicator: '#4CAF50',
  },
  reserved: {
    fill: 'rgba(255, 152, 0, 0.25)',
    stroke: '#FF9800',
    indicator: '#FF9800',
  },
  sold: {
    fill: 'rgba(244, 67, 54, 0.25)',
    stroke: '#F44336',
    indicator: '#F44336',
  },
  not_available: {
    fill: 'rgba(158, 158, 158, 0.25)',
    stroke: '#9E9E9E',
    indicator: '#9E9E9E',
  },
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
};

export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};
