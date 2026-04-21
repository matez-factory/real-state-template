import {
  Flame,
  Car,
  DollarSign,
  Zap,
  Droplets,
  Wifi,
  Shield,
  TreePine,
  Mountain,
  Sun,
  Wind,
  Thermometer,
  Lock,
  ParkingCircle,
  Dumbbell,
  Waves,
  Building2,
  Sofa,
  CookingPot,
  ShowerHead,
  Home,
  Leaf,
  CornerDownRight,
  WashingMachine,
  Ruler,
  Grid3X3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Si el valor de icon es una URL (http/https o ruta relativa), se renderiza como <img>.
 *  De lo contrario, se busca en el mapa de Lucide. */
export type FeatureIconValue = LucideIcon | string;

export const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  // Canónicos (alineados con el admin)
  flame: Flame,
  car: Car,
  'dollar-sign': DollarSign,
  zap: Zap,
  droplets: Droplets,
  wifi: Wifi,
  shield: Shield,
  'tree-pine': TreePine,
  mountain: Mountain,
  sun: Sun,
  wind: Wind,
  thermometer: Thermometer,
  lock: Lock,
  'parking-circle': ParkingCircle,
  dumbbell: Dumbbell,
  waves: Waves,
  building: Building2,
  sofa: Sofa,
  'cooking-pot': CookingPot,
  'shower-head': ShowerHead,
  'corner-down-right': CornerDownRight,
  'washing-machine': WashingMachine,
  ruler: Ruler,
  'grid-3x3': Grid3X3,
  // Aliases legacy (admin usaba estos nombres antes de la corrección)
  tree: TreePine,
  water: Droplets,
  pool: Waves,
  home: Home,
  garden: Leaf,
  leaf: Leaf,
};

export const DEFAULT_FEATURE_ICON = Flame;

/** Devuelve un LucideIcon si `name` es un nombre conocido, o la URL literal si es
 *  una URL (http/https). Los componentes deben renderizar `<img>` para URLs. */
export function getFeatureIcon(name: string): FeatureIconValue {
  if (name && (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('/'))) {
    return name;
  }
  return FEATURE_ICON_MAP[name] ?? DEFAULT_FEATURE_ICON;
}
