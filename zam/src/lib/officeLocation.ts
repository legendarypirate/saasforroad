export const OFFICE_API = `${process.env.NEXT_PUBLIC_API_URL}/api/office_location`;

export interface OfficeLocation {
  id: number;
  name: string;
  latitude: number | string;
  longitude: number | string;
  radius_meters: number;
  address?: string;
  is_active: boolean;
}
