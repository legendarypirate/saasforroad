export type DeviceStatus = "moving" | "idle" | "offline" | "alarm"

export type DeviceType = "truck" | "van" | "car" | "asset"

export interface TrackPoint {
  lat: number
  lng: number
  t: number // relative timestamp seconds
  speed: number
}

export interface Device {
  id: string
  name: string
  imei: string
  plate: string
  type: DeviceType
  group: string
  driver: string
  status: DeviceStatus
  lat: number
  lng: number
  heading: number // degrees
  speed: number // km/h
  battery: number // %
  fuel: number // %
  signal: number // 0-4
  satellites: number
  temperature: number // C
  ignition: boolean
  odometer: number // km
  address: string
  lastUpdate: number // ms epoch offset
  track: TrackPoint[]
}

export interface AlertEvent {
  id: string
  deviceId: string
  deviceName: string
  type: "overspeed" | "geofence" | "sos" | "lowbattery" | "harshbrake" | "offline" | "ignition"
  message: string
  severity: "critical" | "warning" | "info"
  time: number // seconds ago
}

// Таван Толгой уурхайгаас Гашуунсухайт боомт хүрэх нүүрсний тээврийн коридор (Өмнөговь).
// Замын цэгүүд Таван Толгой (Цогтцэций) -> Гашуунсухайт боомт чиглэлийг дагана.
export const ROUTE = {
  origin: { lat: 43.66, lng: 105.53, name: "Таван Толгой" },
  destination: { lat: 43.02, lng: 106.02, name: "Гашуунсухайт боомт" },
}

// Эхлэх цэгээс Гашуунсухайт боомт руу (зүүн-урд зүг) чиглэсэн замыг үүсгэнэ.
function makeCorridorTrack(startLat: number, startLng: number, points: number): TrackPoint[] {
  const track: TrackPoint[] = []
  let lat = startLat
  let lng = startLng
  // Үндсэн чиглэл: Гашуунсухайт боомт руу (зүүн-урд)
  let heading = 2.15 // radians, ~south-east
  for (let i = 0; i < points; i++) {
    heading += (Math.random() - 0.5) * 0.35
    const step = 0.02 * (0.5 + Math.random() * 0.7)
    lat += Math.cos(heading) * step
    lng += Math.sin(heading) * step
    track.push({
      lat,
      lng,
      t: i * 30,
      speed: Math.round(40 + Math.random() * 55),
    })
  }
  return track
}

export const GROUPS = ["Таван Толгой", "Цогтцэций салбар", "Гашуунсухайт", "Цагаан хад"]

export const DEVICES: Device[] = [
  {
    id: "MGL-1042",
    name: "Тээврийн хэрэгсэл 01",
    imei: "356938035643809",
    plate: "УБА 1042",
    type: "truck",
    group: "Таван Толгой",
    driver: "Batbayar Dorj",
    status: "moving",
    lat: 43.62,
    lng: 105.56,
    heading: 151,
    speed: 68,
    battery: 92,
    fuel: 74,
    signal: 4,
    satellites: 11,
    temperature: -6,
    ignition: true,
    odometer: 148230,
    address: "Таван Толгой уурхай, Цогтцэций",
    lastUpdate: 3,
    track: makeCorridorTrack(43.62, 105.56, 44),
  },
  {
    id: "MGL-2087",
    name: "Тээврийн хэрэгсэл 07",
    imei: "356938035643810",
    plate: "УБН 2087",
    type: "truck",
    group: "Цогтцэций салбар",
    driver: "Nomin Erdene",
    status: "moving",
    lat: 43.48,
    lng: 105.67,
    heading: 150,
    speed: 74,
    battery: 88,
    fuel: 55,
    signal: 3,
    satellites: 9,
    temperature: -9,
    ignition: true,
    odometer: 89120,
    address: "ТТ–ГС авто зам, Цогтцэций орчим",
    lastUpdate: 6,
    track: makeCorridorTrack(43.48, 105.67, 44),
  },
  {
    id: "MGL-3391",
    name: "Тээврийн хэрэгсэл 12",
    imei: "356938035643811",
    plate: "МАН 3391",
    type: "van",
    group: "Цогтцэций салбар",
    driver: "Ganbaatar Sukh",
    status: "idle",
    lat: 43.37,
    lng: 105.75,
    heading: 0,
    speed: 0,
    battery: 76,
    fuel: 33,
    signal: 4,
    satellites: 10,
    temperature: -12,
    ignition: true,
    odometer: 51044,
    address: "Цогтцэций сум",
    lastUpdate: 12,
    track: makeCorridorTrack(43.37, 105.75, 30),
  },
  {
    id: "MGL-4410",
    name: "Тээврийн хэрэгсэл 04",
    imei: "356938035643812",
    plate: "ӨМН 4410",
    type: "truck",
    group: "Гашуунсухайт",
    driver: "Tömörbaatar Chuluun",
    status: "alarm",
    lat: 43.26,
    lng: 105.83,
    heading: 152,
    speed: 104,
    battery: 61,
    fuel: 12,
    signal: 2,
    satellites: 7,
    temperature: -3,
    ignition: true,
    odometer: 203980,
    address: "Говийн хээр, ТТ–ГС зам 120 км",
    lastUpdate: 2,
    track: makeCorridorTrack(43.26, 105.83, 44),
  },
  {
    id: "MGL-5523",
    name: "Тээврийн хэрэгсэл 15",
    imei: "356938035643813",
    plate: "УБЭ 5523",
    type: "van",
    group: "Таван Толгой",
    driver: "Oyunchimeg Bat",
    status: "moving",
    lat: 43.56,
    lng: 105.61,
    heading: 149,
    speed: 58,
    battery: 94,
    fuel: 81,
    signal: 4,
    satellites: 12,
    temperature: -7,
    ignition: true,
    odometer: 33210,
    address: "ТТ–ГС авто зам, хойд хэсэг",
    lastUpdate: 5,
    track: makeCorridorTrack(43.56, 105.61, 44),
  },
  {
    id: "MGL-6612",
    name: "Тээврийн хэрэгсэл 21",
    imei: "356938035643814",
    plate: "ДУН 6612",
    type: "car",
    group: "Цагаан хад",
    driver: "Enkhtuya Gan",
    status: "offline",
    lat: 43.14,
    lng: 105.93,
    heading: 0,
    speed: 0,
    battery: 18,
    fuel: 44,
    signal: 0,
    satellites: 0,
    temperature: -1,
    ignition: false,
    odometer: 77650,
    address: "Ханбогд орчим, Өмнөговь",
    lastUpdate: 1840,
    track: makeCorridorTrack(43.14, 105.93, 20),
  },
  {
    id: "AS-7788",
    name: "Тээврийн хэрэгсэл 88",
    imei: "356938035643815",
    plate: "ТРЛ 7788",
    type: "asset",
    group: "Гашуунсухайт",
    driver: "Unassigned",
    status: "idle",
    lat: 43.02,
    lng: 106.02,
    heading: 0,
    speed: 0,
    battery: 100,
    fuel: 0,
    signal: 3,
    satellites: 8,
    temperature: -18,
    ignition: false,
    odometer: 0,
    address: "Гашуунсухайт боомтын ачаа буулгах талбай",
    lastUpdate: 22,
    track: makeCorridorTrack(43.02, 106.02, 15),
  },
  {
    id: "MGL-8834",
    name: "Тээврийн хэрэгсэл 08",
    imei: "356938035643816",
    plate: "МАН 8834",
    type: "truck",
    group: "Гашуунсухайт",
    driver: "Saruul Munkh",
    status: "moving",
    lat: 43.20,
    lng: 105.88,
    heading: 151,
    speed: 62,
    battery: 83,
    fuel: 67,
    signal: 3,
    satellites: 10,
    temperature: -10,
    ignition: true,
    odometer: 119870,
    address: "ТТ–ГС авто зам, өмнөд хэсэг",
    lastUpdate: 4,
    track: makeCorridorTrack(43.20, 105.88, 44),
  },
]

export const ALERTS: AlertEvent[] = [
  {
    id: "a1",
    deviceId: "MGL-4410",
    deviceName: "Тээврийн хэрэгсэл 04",
    type: "overspeed",
    message: "80 км/ц бүсэд 104 км/ц хурд хэтрүүлсэн",
    severity: "critical",
    time: 42,
  },
  {
    id: "a2",
    deviceId: "MGL-4410",
    deviceName: "Тээврийн хэрэгсэл 04",
    type: "lowbattery",
    message: "Шатахуун бага: 12%",
    severity: "warning",
    time: 120,
  },
  {
    id: "a3",
    deviceId: "MGL-6612",
    deviceName: "Тээврийн хэрэгсэл 21",
    type: "offline",
    message: "Ханбогд орчим 30 мин холбоогүй байна",
    severity: "warning",
    time: 300,
  },
  {
    id: "a4",
    deviceId: "MGL-2087",
    deviceName: "Тээврийн хэрэгсэл 07",
    type: "geofence",
    message: "Гео-бүс рүү орлоо: Цогтцэций салбар",
    severity: "info",
    time: 480,
  },
  {
    id: "a5",
    deviceId: "MGL-1042",
    deviceName: "Тээврийн хэрэгсэл 01",
    type: "harshbrake",
    message: "Огцом тоормослолт илэрлээ",
    severity: "info",
    time: 640,
  },
  {
    id: "a6",
    deviceId: "MGL-8834",
    deviceName: "Тээврийн хэрэгсэл 08",
    type: "ignition",
    message: "Хөдөлгүүр асав",
    severity: "info",
    time: 900,
  },
]

export const STATUS_META: Record<
  DeviceStatus,
  { label: string; color: string; dot: string }
> = {
  moving: { label: "Хөдөлгөөнд байна", color: "text-success", dot: "bg-success" },
  idle: { label: "Зогссон", color: "text-warning", dot: "bg-warning" },
  offline: { label: "Унтарсан", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  alarm: { label: "Сануулгатай", color: "text-destructive", dot: "bg-destructive" },
}

export function formatAgo(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} сек өмнө`
  if (seconds < 3600) return `${Math.round(seconds / 60)} мин өмнө`
  return `${Math.round(seconds / 3600)} цаг өмнө`
}
