import { BFPIncidentStatus } from '../../components/bfp/IncidentStatusBadge';
import { AlarmLevel } from '../../components/bfp/AlarmLevelBadge';

export type IncidentType =
  | 'residential_fire'
  | 'commercial_fire'
  | 'vehicular_fire'
  | 'storage_fire'
  | 'rubbish_fire'
  | 'others';

/**
 * Extends the resident-facing CommunityReport shape (services/api/models.ts)
 * with the fields BFP personnel need: alarm level, incident type, cause,
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
  alarm_level?: AlarmLevel | null;
  cause_of_fire?: string | null;
  casualties?: number | null;
  injuries?: number | null;
  fatalities?: number | null;
  establishment_name?: string | null;
  owner_name?: string | null;
  occupant_name?: string | null;
  time_fire_started?: string | null;
  time_fire_out?: string | null;
  notes?: string | null;
  // Additional photos added by BFP personnel during investigation
  // (see migration_add_report_evidence.sql) — separate from report_image,
  // which is the resident's original submission photo.
  evidence_photos?: { evidence_id: number; image_path: string; caption: string | null }[];
  barangay_contacts?: { name: string; role: string; phone_number: string }[];
  dispatches?: IncidentDispatch[];
}

export interface BFPPersonnelItem {
  user_id: number;
  name: string;
  rank: string;
  full_title: string;
  station_assigned: string;
}

/**
 * Normalizes full BFP rank titles into standard uniformed service abbreviations:
 * - Senior Fire Officer 4 -> SFO4
 * - Senior Fire Officer 3 -> SFO3
 * - Senior Fire Officer 2 -> SFO2
 * - Senior Fire Officer 1 -> SFO1
 * - Fire Officer 3 -> FO3
 * - Fire Officer 2 -> FO2
 * - Fire Officer 1 -> FO1
 * - Chief Inspector -> CINSP
 * - Senior Inspector -> SINSP
 * - Inspector -> INSP
 * - Superintendent -> SUPT
 * - Senior Superintendent -> SSUPT
 * - Chief Superintendent -> CSUPT
 * - Director -> DIR
 */
export function formatRankAbbr(rank?: string | null): string {
  if (!rank) return '';
  const trimmed = rank.trim();
  const map: Record<string, string> = {
    'Senior Fire Officer 4': 'SFO4',
    'Senior Fire Officer 3': 'SFO3',
    'Senior Fire Officer 2': 'SFO2',
    'Senior Fire Officer 1': 'SFO1',
    'Fire Officer 3': 'FO3',
    'Fire Officer 2': 'FO2',
    'Fire Officer 1': 'FO1',
    'Fire Inspector': 'FINSP',
    'Senior Fire Inspector': 'FSINSP',
    'Chief Fire Inspector': 'FCINSP',
    'Inspector': 'INSP',
    'Senior Inspector': 'SINSP',
    'Chief Inspector': 'CINSP',
    'Superintendent': 'SUPT',
    'Senior Superintendent': 'SSUPT',
    'Chief Superintendent': 'CSUPT',
    'Director': 'DIR',
    'Non-Uniformed Personnel': 'NUP',
  };
  return map[trimmed] ?? trimmed;
}

export function formatOfficerWithRank(name: string, rank?: string | null): string {
  const abbr = formatRankAbbr(rank);
  return abbr ? `${abbr} ${name}` : name;
}

/**
 * Normalizes any long-form BFP rank strings in status notes into standard abbreviations (e.g. SFO4, FO1).
 */
export function abbreviateNoteRanks(note?: string | null): string {
  if (!note) return '';
  return note
    .replace(/Senior Fire Officer 4/g, 'SFO4')
    .replace(/Senior Fire Officer 3/g, 'SFO3')
    .replace(/Senior Fire Officer 2/g, 'SFO2')
    .replace(/Senior Fire Officer 1/g, 'SFO1')
    .replace(/Fire Officer 3/g, 'FO3')
    .replace(/Fire Officer 2/g, 'FO2')
    .replace(/Fire Officer 1/g, 'FO1')
    .replace(/Senior Fire Inspector/g, 'FSINSP')
    .replace(/Chief Fire Inspector/g, 'FCINSP')
    .replace(/Fire Inspector/g, 'FINSP')
    .replace(/Chief Inspector/g, 'CINSP')
    .replace(/Senior Inspector/g, 'SINSP')
    .replace(/Inspector/g, 'INSP')
    .replace(/Senior Superintendent/g, 'SSUPT')
    .replace(/Chief Superintendent/g, 'CSUPT')
    .replace(/Superintendent/g, 'SUPT')
    .replace(/Non-Uniformed Personnel/g, 'NUP');
}

export interface IncidentDispatch {
  dispatch_id: number;
  dispatched_at: string;
  trucks: string[];
  personnel: {
    user_id: number;
    name: string;
    rank: string;
    full_title: string;
  }[];
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
  alarm_level?: AlarmLevel | null;
  cause_of_fire?: string;
  casualties?: number;
  notes?: string;
  data_time: string; // ISO datetime of when the incident occurred
  photoUri?: string;
}

export interface UpdateIncidentDetailsPayload {
  incident_type?: IncidentType | null;
  cause_of_fire?: string;
  casualties?: number;
  injuries?: number;
  fatalities?: number;
  establishment_name?: string | null;
  owner_name?: string | null;
  occupant_name?: string | null;
  time_fire_started?: string | null;
  time_fire_out?: string | null;
  notes?: string;
  alarm_level?: AlarmLevel | null;
}