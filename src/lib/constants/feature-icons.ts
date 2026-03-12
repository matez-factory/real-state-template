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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
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
};

export const DEFAULT_FEATURE_ICON = Flame;

export function getFeatureIcon(name: string): LucideIcon {
  return FEATURE_ICON_MAP[name] ?? DEFAULT_FEATURE_ICON;
}
