export interface BarangayRiskFeature {
  barangay_id: number;
  barangay_name: string;
  centroid_lat: number;
  centroid_lng: number;
  boundary_geojson: string | null; // GeoJSON polygon string, may be null
  risk_level: RiskLevel;
  prediction_score: number;
}

export interface IncidentMarker {
  incident_id: number;
  barangay_id: number;
  barangay_name: string;
  latitude: number;
  longitude: number;
  incident_type: 'residential_fire' | 'commercial_fire' | 'vehicular_fire' | 'storage_fire' | 'rubbish_fire' | 'others';
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  data_time: string;
  cause_of_fire?: string | null;
  casualties?: number | null;
  notes?: string | null;
}

/** Richer incident marker used only on the BFP map — includes reporter PII and full investigation fields. */
export interface BFPIncidentMarker extends IncidentMarker {
  report_id: number;
  reporter_name: string | null;
  contact_number: string | null;
  description: string;
  status: 'accepted' | 'dispatched' | 'resolved';
  created_at: string;
}

export type ReportStatus = 'pending' | 'accepted' | 'dispatched' | 'resolved' | 'invalid';
export type RiskLevel = 'low' | 'moderate' | 'high';

export interface CommunityReport {
  report_id: number;
  description: string;
  report_image: string | null;
  latitude: number;
  longitude: number;
  device_latitude?: number | null;
  device_longitude?: number | null;
  barangay_id: number;
  barangay_name?: string;
  status: ReportStatus;
  created_at: string;
}

export interface ReportStatusHistoryEntry {
  history_id: number;
  status: ReportStatus;
  notes: string | null;
  created_at: string;
}

export interface CreateReportPayload {
  description: string;
  latitude: number;
  longitude: number;
  device_latitude?: number;
  device_longitude?: number;
  location_accuracy_m?: number;
  barangay_id: number;
  photoUri: string;
}

export interface AreaStatus {
  barangay_id: number;
  barangay_name: string;
  risk_level: RiskLevel;
  incidents_this_month: number;
  advisory_active: boolean;
}

export interface Notification {
  notification_id: number;
  title: string;
  message: string;
  notification_type: 'alert' | 'update' | 'system';
  is_read: boolean;
  created_at: string;
  report_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  announcement_type: 'emergency' | 'general';
  created_at: string;
}

export interface EmergencyContact {
  contact_id: number;
  name: string;
  category: 'fire' | 'police' | 'medical' | 'disaster' | 'other';
  phone_number: string;
  description: string | null;
  is_primary: boolean;
}

export interface FireEducationArticle {
  content_id: number;
  title: string;
  category: 'prevention' | 'emergency_response' | 'awareness';
  summary: string;
  body: string;
  image_path: string | null;
  read_minutes: number;
  is_featured: boolean;
}