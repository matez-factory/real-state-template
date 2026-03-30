// ============================================================
// Enums
// ============================================================

export type EntityStatus = 'available' | 'reserved' | 'sold' | 'not_available';
export type ProjectType = 'lots' | 'building' | 'masterplan';
export type ProjectStatus = 'draft' | 'active' | 'archived';
export type ProjectScale = 'small' | 'medium' | 'large';
export type LayerType = 'neighborhood' | 'block' | 'zone' | 'tower' | 'floor' | 'lot' | 'unit' | 'tour';
export type MediaType = 'image' | 'video' | 'svg' | 'document';
export type MediaPurpose =
  | 'background'
  | 'background_mobile'
  | 'thumbnail'
  | 'gallery'
  | 'gallery_mobile'
  | 'ficha_furnished'
  | 'ficha_furnished_mobile'
  | 'ficha_measured'
  | 'ficha_measured_mobile'
  | 'overlay'
  | 'overlay_mobile'
  | 'transition'
  | 'transition_mobile'
  | 'intro'
  | 'brochure'
  | 'logo'
  | 'logo_developer'
  | 'hotspot'
  | 'layers_gallery'
  | 'exterior_360'
  | 'favicon'
  | 'favicon_dark';

// ============================================================
// Feature items
// ============================================================

export interface FeatureItem {
  icon: string;   // Lucide icon name (e.g. 'flame', 'car', 'dollar-sign')
  text: string;
}

// ============================================================
// Core entities
// ============================================================

export interface Project {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  scale: ProjectScale;
  layerLabels: string[];
  maxDepth: number;
  svgOverlayUrl?: string;

  // Location
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  googleMapsEmbedUrl?: string;

  // Branding
  logoUrl?: string;
  secondaryLogoUrl?: string;
  tagline?: string;

  // Contact
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string;

  // Feature toggles
  hasVideoIntro: boolean;
  hasGallery: boolean;
  has360Tour: boolean;
  hasRecorrido360Embed: boolean;
  recorrido360EmbedUrl?: string;
  hasDownloads: boolean;
  hasStateManagement: boolean;
  hasLayersGallery: boolean;
  hasZoomIn: boolean;

  // SVG hotspot element IDs
  hotspotTowerId?: string;
  hotspotMarkerId?: string;

  // Social media
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;

  // Appearance
  accentColor?: string;
}

export interface Layer {
  id: string;
  projectId: string;
  parentId: string | null;
  type: LayerType;
  depth: number;
  sortOrder: number;
  slug: string;
  name: string;
  label: string;
  path?: string;
  parentName?: string;
  svgElementId?: string;
  status: EntityStatus;

  // Visual assets
  svgOverlayUrl?: string;
  svgOverlayMobileUrl?: string;
  backgroundImageUrl?: string;
  backgroundImageMobileUrl?: string;

  // Dimensions
  area?: number;
  areaUnit?: string;
  frontLength?: number;
  depthLength?: number;

  // Pricing
  price?: number;
  currency?: string;
  pricePerUnit?: number;

  // Characteristics
  isCorner?: boolean;
  features?: FeatureItem[];

  // Unit type
  unitTypeId?: string;
  unitTypeName?: string;

  // Fields from properties fallback / unit_type join
  bedrooms?: number;
  bathrooms?: number;
  orientation?: string;
  hasBalcony?: boolean;
  floorNumber?: number;
  description?: string;

  // Tour & video
  tourEmbedUrl?: string;
  videoUrl?: string;

  // Catch-all for non-typed fields
  properties: Record<string, unknown>;

  // Buyer info (leaf layers)
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerNotes?: string;
  reservedAt?: string;
  soldAt?: string;
}

export interface Media {
  id: string;
  projectId: string;
  layerId?: string;
  unitTypeId?: string;
  type: MediaType;
  purpose: MediaPurpose;
  storagePath: string;
  url?: string;
  title?: string;
  description?: string;
  altText?: string;
  sortOrder: number;
  metadata: Record<string, unknown>;
}

export interface UnitType {
  id: string;
  projectId: string;
  name: string;
  slug?: string;
  area?: number;
  areaUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  hasBalcony?: boolean;
  orientation?: string;
  features?: FeatureItem[];
}

// ============================================================
// Navigation
// ============================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============================================================
// Page data (what views receive)
// ============================================================

export interface ExplorerPageData {
  project: Project;
  currentLayer: Layer | null;     // null = project root
  children: Layer[];              // children of currentLayer (or root layers)
  media: Media[];                 // media for currentLayer (or project)
  childrenMedia: Record<string, Media[]>;  // layerId → media[]
  breadcrumbs: BreadcrumbItem[];
  isLeafLevel: boolean;           // true if children have no further children
  currentPath: string[];          // layer slugs leading to current position
  siblings: Layer[];              // layers sharing the same parent (includes current)
  rootLayers: Layer[];            // all depth-0 layers sorted by sortOrder (for navigation)
}

export interface SiblingExplorerBundle {
  current: ExplorerPageData;
  siblingDataMap: Record<string, ExplorerPageData>; // layerId → ExplorerPageData
  siblingOrder: string[];                           // ordered layer IDs (by sortOrder)
}
