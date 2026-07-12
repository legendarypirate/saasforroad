// Газрын зургийн суурь давхаргууд (leaflet-ээс хамааралгүй тул хаанаас ч import хийж болно)
export type BaseLayerId = "osm" | "satellite" | "light"

export interface BaseLayer {
  id: BaseLayerId
  label: string
  url: string
  attribution: string
  raw?: boolean // dark invert filter-ээс чөлөөлөх эсэх (satellite)
}

export const BASE_LAYERS: BaseLayer[] = [
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  {
    id: "satellite",
    label: "satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    raw: true,
  },
  {
    id: "light",
    label: "light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
]
