export type FactoryMapSite = {
  id: number;
  name: string;
  plant_type: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  /** When set, marker is from plant.rcos.mn (not a local road site). */
  rcos?: boolean;
  aimag?: string | null;
  location?: string | null;
  status?: string;
  source?: string | null;
};

export type FactoryEditPin = {
  lat: number;
  lng: number;
};

export const TYPE_COLORS: Record<string, string> = {
  asphalt: '#b45309',
  cement: '#64748b',
  crushing: '#0d9488',
  emulsion: '#7c3aed',
  ctb: '#2563eb',
  other: '#78716c',
};
