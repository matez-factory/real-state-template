import type {
  Project,
  Layer,
  Media,
  FeatureItem,
  ExplorerPageData,
  SiblingExplorerBundle,
  EntityStatus,
  ProjectType,
  ProjectStatus,
  ProjectScale,
  LayerType,
  MediaType,
  MediaPurpose,
  BreadcrumbItem,
} from '@/types/hierarchy.types';

// ============================================================
// Raw DB row types (snake_case from API)
// ============================================================

export interface RawProject {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  scale: string;
  layer_labels: string[];
  max_depth: number;
  svg_overlay_url: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  coordinates: { lat: number; lng: number } | null;
  google_maps_embed_url: string | null;

  logo_url: string | null;
  secondary_logo_url: string | null;
  tagline: string | null;
  disclaimer_enabled: boolean | null;
  disclaimer_text: string | null;

  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  website: string | null;

  has_video_intro: boolean;
  has_gallery: boolean;
  has_360_tour: boolean;
  has_recorrido_360_embed: boolean;
  recorrido_360_embed_url: string | null;
  has_downloads: boolean;
  has_state_management: boolean;
  has_layers_gallery: boolean;
  has_zoom_in: boolean;
  hotspot_tower_id: string | null;
  hotspot_marker_id: string | null;
  accent_color: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  linkedin: string | null;
}

export interface RawLayer {
  id: string;
  project_id: string;
  parent_id: string | null;
  type: string;
  depth: number;
  sort_order: number;
  slug: string;
  name: string;
  label: string | null;
  path: string | null;
  parent_name: string | null;
  svg_element_id: string | null;
  group_element_id: string | null;
  status: string;

  svg_overlay_url: string | null;
  svg_overlay_mobile_url: string | null;
  background_image_url: string | null;
  background_image_mobile_url: string | null;

  area: number | null;
  area_unit: string | null;
  front_length: number | null;
  depth_length: number | null;

  price: number | null;
  currency: string | null;
  price_per_unit: number | null;

  is_corner: boolean | null;
  features: FeatureItem[] | null;

  unit_type_id: string | null;

  tour_embed_url: string | null;
  video_url: string | null;

  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_notes: string | null;
  reserved_at: string | null;
  sold_at: string | null;

  properties: Record<string, unknown>;
}

export interface RawMedia {
  id: string;
  project_id: string;
  layer_id: string | null;
  unit_type_id: string | null;
  type: string;
  purpose: string;
  storage_path: string;
  url: string | null;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
}

export interface RawUnitType {
  id: string;
  project_id: string;
  name: string;
  slug: string | null;
  asset_type: string | null;
  area: number | null;
  area_unit: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  has_balcony: boolean | null;
  orientation: string | null;
  features: { icon: string; text: string }[] | null;
  tour_360_url: string | null;
  video_url: string | null;
}

// ============================================================
// Transform functions
// ============================================================

export function transformProject(raw: RawProject): Project {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description || undefined,
    type: raw.type as ProjectType,
    status: raw.status as ProjectStatus,
    scale: (raw.scale || 'small') as ProjectScale,
    layerLabels: raw.layer_labels ?? [],
    maxDepth: raw.max_depth,
    svgOverlayUrl: raw.svg_overlay_url || undefined,
    address: raw.address || undefined,
    city: raw.city || undefined,
    state: raw.state || undefined,
    country: raw.country || undefined,
    coordinates: raw.coordinates || undefined,
    googleMapsEmbedUrl: raw.google_maps_embed_url || undefined,
    logoUrl: raw.logo_url || undefined,
    secondaryLogoUrl: raw.secondary_logo_url || undefined,
    tagline: raw.tagline || undefined,
    disclaimerEnabled: raw.disclaimer_enabled ?? false,
    disclaimerText: raw.disclaimer_text || undefined,
    phone: raw.phone || undefined,
    email: raw.email || undefined,
    whatsapp: raw.whatsapp || undefined,
    website: raw.website || undefined,
    hasVideoIntro: raw.has_video_intro ?? false,
    hasGallery: raw.has_gallery ?? false,
    has360Tour: raw.has_360_tour ?? true,
    hasRecorrido360Embed: raw.has_recorrido_360_embed ?? false,
    recorrido360EmbedUrl: raw.recorrido_360_embed_url || undefined,
    hasDownloads: raw.has_downloads ?? false,
    hasStateManagement: raw.has_state_management ?? true,
    hasLayersGallery: raw.has_layers_gallery ?? false,
    hasZoomIn: raw.has_zoom_in ?? false,
    hotspotTowerId: raw.hotspot_tower_id ?? 'tower',
    hotspotMarkerId: raw.hotspot_marker_id ?? 'marker',
    accentColor: raw.accent_color ?? undefined,
    instagram: raw.instagram || undefined,
    facebook: raw.facebook || undefined,
    twitter: raw.twitter || undefined,
    youtube: raw.youtube || undefined,
    tiktok: raw.tiktok || undefined,
    linkedin: raw.linkedin || undefined,
  };
}

export function transformLayer(raw: RawLayer): Layer {
  const props = raw.properties ?? {};

  return {
    id: raw.id,
    projectId: raw.project_id,
    parentId: raw.parent_id,
    type: raw.type as LayerType,
    depth: raw.depth,
    sortOrder: raw.sort_order,
    slug: raw.slug,
    name: raw.name,
    label: raw.label || raw.name,
    path: raw.path || undefined,
    parentName: raw.parent_name || undefined,
    svgElementId: raw.svg_element_id || undefined,
    groupElementId: raw.group_element_id || undefined,
    status: raw.status as EntityStatus,

    svgOverlayUrl: raw.svg_overlay_url || undefined,
    svgOverlayMobileUrl: raw.svg_overlay_mobile_url || undefined,
    backgroundImageUrl: raw.background_image_url || undefined,
    backgroundImageMobileUrl: raw.background_image_mobile_url || undefined,

    area: raw.area ?? (props.area as number | undefined) ?? undefined,
    areaUnit: raw.area_unit || undefined,
    frontLength: raw.front_length ?? (props.front_meters as number | undefined) ?? undefined,
    depthLength: raw.depth_length ?? (props.depth_meters as number | undefined) ?? undefined,

    price: raw.price ?? (props.price as number | undefined) ?? undefined,
    currency: raw.currency || undefined,
    pricePerUnit: raw.price_per_unit ?? undefined,

    isCorner: raw.is_corner ?? (props.is_corner as boolean | undefined) ?? undefined,
    features: raw.features ?? (props.features as FeatureItem[] | undefined) ?? undefined,

    unitTypeId: raw.unit_type_id || undefined,
    unitTypeName: (props.unit_type as string | undefined) ?? undefined,

    tourEmbedUrl: raw.tour_embed_url || undefined,
    videoUrl: raw.video_url || undefined,

    bedrooms: (props.bedrooms as number | undefined) ?? undefined,
    bathrooms: (props.bathrooms as number | undefined) ?? undefined,
    orientation: (props.orientation as string | undefined) ?? undefined,
    hasBalcony: (props.has_balcony as boolean | undefined) ?? undefined,
    floorNumber: (props.floor_number as number | undefined) ?? undefined,
    description: (props.description as string | undefined) ?? undefined,

    properties: props,
    buyerName: raw.buyer_name || undefined,
    buyerEmail: raw.buyer_email || undefined,
    buyerPhone: raw.buyer_phone || undefined,
    buyerNotes: raw.buyer_notes || undefined,
    reservedAt: raw.reserved_at || undefined,
    soldAt: raw.sold_at || undefined,
  };
}

export function transformMedia(raw: RawMedia): Media {
  return {
    id: raw.id,
    projectId: raw.project_id,
    layerId: raw.layer_id || undefined,
    unitTypeId: raw.unit_type_id || undefined,
    type: raw.type as MediaType,
    purpose: raw.purpose as MediaPurpose,
    storagePath: raw.storage_path,
    url: raw.url || undefined,
    title: raw.title || undefined,
    description: raw.description || undefined,
    altText: raw.alt_text || undefined,
    sortOrder: raw.sort_order,
    metadata: raw.metadata,
  };
}

// ============================================================
// Build ExplorerPageData from raw DB data + a layer path
// ============================================================

export function buildExplorerPageData(
  rawProject: RawProject,
  rawLayers: RawLayer[],
  rawMedia: RawMedia[],
  layerSlugs: string[],
  rawUnitTypes: RawUnitType[] = []
): ExplorerPageData {
  const project = transformProject(rawProject);

  const unitTypeMap = new Map(rawUnitTypes.map(ut => [ut.id, ut]));
  const allLayers = rawLayers.map(raw => {
    const layer = transformLayer(raw);
    if (layer.unitTypeId) {
      const ut = unitTypeMap.get(layer.unitTypeId);
      if (ut) {
        if (!layer.unitTypeName) layer.unitTypeName = ut.name;
        // Fallback: unit_type fills in missing layer fields
        if ((layer.area == null || layer.area === 0) && ut.area != null) layer.area = ut.area;
        if ((layer.bedrooms == null || layer.bedrooms === 0) && ut.bedrooms != null) layer.bedrooms = ut.bedrooms;
        if ((layer.bathrooms == null || layer.bathrooms === 0) && ut.bathrooms != null) layer.bathrooms = ut.bathrooms;
        if (layer.description == null && ut.description) layer.description = ut.description;
        if (layer.hasBalcony == null && ut.has_balcony != null) layer.hasBalcony = ut.has_balcony;
        if (layer.orientation == null && ut.orientation) layer.orientation = ut.orientation;
        if ((layer.features == null || layer.features.length === 0) && ut.features && ut.features.length > 0) layer.features = ut.features;
        // Tour 360 y video URL: si la unidad no sobrescribe, heredar del tipo.
        if (!layer.tourEmbedUrl && ut.tour_360_url) layer.tourEmbedUrl = ut.tour_360_url;
        if (!layer.videoUrl && ut.video_url) layer.videoUrl = ut.video_url;
        if (!layer.area && ut.area != null) layer.area = ut.area;
        if (!layer.areaUnit && ut.area_unit) layer.areaUnit = ut.area_unit;
      }
    }
    return layer;
  });

  const allMedia = rawMedia.map(transformMedia);

  // Walk the slug path to find the current layer
  let currentLayerId: string | null = null;
  const pathLayers: Layer[] = [];

  for (const slug of layerSlugs) {
    const found = allLayers.find(
      (l) => l.slug === slug && l.parentId === currentLayerId
    );
    if (!found) {
      throw new Error(`Layer not found: "${slug}" under parent ${currentLayerId}`);
    }
    pathLayers.push(found);
    currentLayerId = found.id;
  }

  const currentLayer = pathLayers.length > 0 ? pathLayers[pathLayers.length - 1] : null;

  const currentId = currentLayer?.id ?? null;
  const children = allLayers
    .filter((l) => l.parentId === currentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childIds = new Set(children.map((c) => c.id));
  const hasGrandchildren = allLayers.some((l) => l.parentId && childIds.has(l.parentId));
  const isLeafLevel = children.length > 0 && !hasGrandchildren;

  const includeAllProjectMedia = !currentLayer;
  const media = allMedia
    .filter((m) =>
      (currentLayer ? m.layerId === currentLayer.id : !m.layerId && !m.unitTypeId) ||
      (currentLayer?.unitTypeId && m.unitTypeId === currentLayer.unitTypeId && !m.layerId) ||
      (!m.layerId && !m.unitTypeId && (includeAllProjectMedia || m.purpose === 'logo' || m.purpose === 'logo_developer'))
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childrenMedia: Record<string, Media[]> = {};
  for (const child of children) {
    childrenMedia[child.id] = allMedia
      .filter((m) =>
        m.layerId === child.id ||
        (child.unitTypeId && m.unitTypeId === child.unitTypeId && !m.layerId)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const siblings = currentLayer
    ? allLayers
        .filter((l) => l.parentId === currentLayer.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const rootLayers = allLayers
    .filter((l) => l.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Build breadcrumbs — template uses /${slug} instead of /p/${project.slug}/${slug}
  const breadcrumbs: BreadcrumbItem[] = [
    { label: project.name, href: '/' },
  ];
  for (let i = 0; i < pathLayers.length; i++) {
    const layer = pathLayers[i];
    const isLast = i === pathLayers.length - 1;
    const href = isLast
      ? undefined
      : `/${pathLayers.slice(0, i + 1).map((l) => l.slug).join('/')}`;
    breadcrumbs.push({ label: layer.name, href });
  }

  return {
    project,
    currentLayer,
    children,
    media,
    childrenMedia,
    breadcrumbs,
    isLeafLevel,
    currentPath: layerSlugs,
    siblings,
    rootLayers,
  };
}

// ============================================================
// Build SiblingExplorerBundle — all sibling data in one pass
// ============================================================

export function buildSiblingExplorerBundle(
  rawProject: RawProject,
  rawLayers: RawLayer[],
  rawMedia: RawMedia[],
  layerSlugs: string[],
  rawUnitTypes: RawUnitType[] = []
): SiblingExplorerBundle {
  const current = buildExplorerPageData(rawProject, rawLayers, rawMedia, layerSlugs, rawUnitTypes);

  const siblingDataMap: Record<string, ExplorerPageData> = {};
  const parentPath = layerSlugs.slice(0, -1);

  for (const sibling of current.siblings) {
    const siblingPath = [...parentPath, sibling.slug];
    siblingDataMap[sibling.id] = buildExplorerPageData(
      rawProject, rawLayers, rawMedia, siblingPath, rawUnitTypes
    );
  }

  const siblingOrder = current.siblings.map((s) => s.id);

  return { current, siblingDataMap, siblingOrder };
}
