import { BFPIncidentStatus } from '../../components/bfp/IncidentStatusBadge';
import { SeverityLevel } from '../../components/bfp/SeverityBadge';

export type IncidentType =
  | 'residential_fire'
  | 'commercial_fire'
  | 'vehicular_fire'
  | 'storage_fire'
  | 'rubbish_fire'
  | 'others';

/**
 * Extends the resident-facing CommunityReport shape (services/api/models.ts)
 * with the fields BFP personnel need: severity, incident type, cause,
 * casualties, and reporter contact info that the resident-facing model
 * intentionally omits.
 */
export interface BFPIncident {
  report_id: number;
  reporter_name: string | null;
  contact_number: string | null;
  description: string;
  report_image: string | null;
  latitude: number;
  longitude: number;
  location_accuracy_m: number | null;
  barangay_id: number;
  barangay_name: string;
  status: BFPIncidentStatus;
  created_at: string;
  ai_fire_label?: 'fire' | 'non_fire' | null;
  ai_fire_confidence?: number | null;
  // Present only once an incident_record exists (i.e. status is at least 'accepted')
  incident_type?: IncidentType;
  severity_level?: SeverityLevel;
  cause_of_fire?: string | null;
  casualties?: number | null;
  notes?: string | null;
  // Additional photos added by BFP personnel during investigation
  // (see migration_add_report_evidence.sql) — separate from report_image,
  // which is the resident's original submission photo.
  evidence_photos?: { evidence_id: number; image_path: string; caption: string | null }[];
  barangay_contacts?: { name: string; role: string; phone_number: string }[];
}

export interface BFPIncidentStatusHistoryEntry {
  history_id: number;
  status: BFPIncidentStatus;
  notes: string | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface DashboardAnalytics {
  active_incidents: number;
  pending_verification: number;
  resolved_today: number;
  total_this_month: number;
}

export interface CreateManualIncidentPayload {
  barangay_id: number;
  latitude: number;
  longitude: number;
  description: string;
  incident_type: IncidentType;
  severity_level: SeverityLevel;
  cause_of_fire?: string;
  casualties?: number;
  notes?: string;
  data_time: string; // ISO datetime of when the incident occurred
  photoUri?: string;
}

export interface UpdateIncidentDetailsPayload {
  incident_type?: IncidentType;
  cause_of_fire?: string;
  casualties?: number;
  notes?: string;
  severity_level?: SeverityLevel;
}