const API = process.env.NEXT_PUBLIC_API_URL || '';

export interface TenderDocument {
  id: number;
  doc_type: string;
  engineer_name?: string;
  original_filename?: string;
  file_path?: string;
  status: string;
  extracted_data?: Record<string, string>;
  extraction_error?: string;
}

export interface TenderPackage {
  id: number;
  title: string;
  tender_number?: string;
  project_name?: string;
  client_name?: string;
  status: string;
  notes?: string;
  summary?: { last_export?: string; last_export_at?: string };
  documents?: TenderDocument[];
  createdAt?: string;
}

export const DOC_TYPE_OPTIONS = [
  { value: 'engineer_certificate', label: 'Инженерийн үнэмжлэх' },
  { value: 'imongolia', label: 'И-Монгол лавлагаа' },
  { value: 'id_card', label: 'Иргэний үнэмлэх' },
  { value: 'diploma', label: 'Диплом' },
  { value: 'employment', label: 'Ажиллах чадварын лавлагаа' },
  { value: 'other', label: 'Бусад' },
];

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Ноорог',
  processing: 'Боловсруулж байна',
  ready: 'Бэлэн',
  uploaded: 'Upload хийгдсэн',
  processed: 'Боловсруулсан',
  error: 'Алдаатай',
};

export async function fetchTenders(): Promise<TenderPackage[]> {
  const res = await fetch(`${API}/api/tender`);
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function fetchTender(id: string): Promise<TenderPackage | null> {
  const res = await fetch(`${API}/api/tender/${id}`);
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function createTender(body: Partial<TenderPackage>): Promise<TenderPackage | null> {
  const res = await fetch(`${API}/api/tender`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function uploadTenderDocument(
  packageId: number,
  file: File,
  docType: string,
  engineerName: string
): Promise<boolean> {
  const form = new FormData();
  form.append('file', file);
  form.append('doc_type', docType);
  form.append('engineer_name', engineerName);
  const res = await fetch(`${API}/api/tender/${packageId}/documents`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  return json.success === true;
}

export async function processAllDocuments(packageId: number): Promise<TenderPackage | null> {
  const res = await fetch(`${API}/api/tender/${packageId}/process-all`, { method: 'POST' });
  const json = await res.json();
  return json.success ? json.data : null;
}

export function getDocxDownloadUrl(packageId: number): string {
  return `${API}/api/tender/${packageId}/export-docx`;
}
