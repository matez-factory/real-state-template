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
  Ruler,
  Grid3X3,
  CornerDownRight,
  BedDouble,
  Bath,
  Fence,
  Compass,
  WashingMachine,
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
  ruler: Ruler,
  'grid-3x3': Grid3X3,
  'corner-down-right': CornerDownRight,
  'bed-double': BedDouble,
  bath: Bath,
  fence: Fence,
  compass: Compass,
  'washing-machine': WashingMachine,
};

export const DEFAULT_FEATURE_ICON = Flame;

// Icons assigned by default at import time (generic placeholders). When a
// feature carries one of these, prefer resolving by text keywords.
const GENERIC_ICON_NAMES = new Set(['circle', 'dot', '']);

// Keyword → icon rules applied to feature text when the icon name is missing
// or generic. Order matters: first match wins, so put more specific keywords
// before broader ones.
const KEYWORD_ICON_RULES: ReadonlyArray<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ['dimension'], icon: Ruler },
  { keywords: ['superficie', 'área total', 'area total', 'metros cuadrados', 'm²', 'm2'], icon: Grid3X3 },
  { keywords: ['esquina'], icon: CornerDownRight },
  { keywords: ['gas natural', 'gas'], icon: Flame },
  { keywords: ['cloaca', 'agua corriente', 'agua potable'], icon: Droplets },
  { keywords: ['electricidad', 'energía eléctrica', 'energia electrica', 'luz eléctrica', 'luz electrica'], icon: Zap },
  { keywords: ['pavimentad', 'asfaltad', 'acceso por calle', 'calle'], icon: Car },
  { keywords: ['financiación', 'financiacion', 'crédito', 'credito', 'hipotecario', 'cuota'], icon: DollarSign },
  { keywords: ['wifi', 'internet'], icon: Wifi },
  { keywords: ['seguridad', 'alarma', 'vigilancia', 'cerco perimetral'], icon: Shield },
  { keywords: ['parque', 'árbol', 'arbol', 'forestación', 'forestacion', 'jardín', 'jardin', 'espacio verde'], icon: TreePine },
  { keywords: ['vista panorám', 'vista al', 'montaña', 'montana', 'cerro'], icon: Mountain },
  { keywords: ['soleado', 'luz natural'], icon: Sun },
  { keywords: ['ventilación', 'ventilacion', 'brisa'], icon: Wind },
  { keywords: ['climatización', 'climatizacion', 'calefacción', 'calefaccion', 'aire acondicionado'], icon: Thermometer },
  { keywords: ['lavander'], icon: WashingMachine },
  { keywords: ['cochera', 'garaje', 'garage', 'estacionamiento', 'parking'], icon: ParkingCircle },
  { keywords: ['gimnasio', 'gym'], icon: Dumbbell },
  { keywords: ['pileta', 'piscina'], icon: Waves },
  { keywords: ['sum', 'salón de usos', 'salon de usos', 'amenity', 'amenities'], icon: Building2 },
  { keywords: ['dormitorio', 'habitación', 'habitacion'], icon: BedDouble },
  { keywords: ['baño', 'bano'], icon: Bath },
  { keywords: ['balcón', 'balcon', 'terraza'], icon: Fence },
  { keywords: ['orientación', 'orientacion'], icon: Compass },
  { keywords: ['cocina', 'kitchen'], icon: CookingPot },
  { keywords: ['ducha', 'shower'], icon: ShowerHead },
  { keywords: ['amueblad', 'muebles'], icon: Sofa },
];

function resolveByText(text: string | undefined): LucideIcon | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_ICON_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.icon;
  }
  return null;
}

export function getFeatureIcon(name?: string | null, text?: string): LucideIcon {
  const key = name?.toLowerCase() ?? '';

  if (key && !GENERIC_ICON_NAMES.has(key) && FEATURE_ICON_MAP[key]) {
    return FEATURE_ICON_MAP[key];
  }

  const byText = resolveByText(text);
  if (byText) return byText;

  return FEATURE_ICON_MAP[key] ?? DEFAULT_FEATURE_ICON;
}
