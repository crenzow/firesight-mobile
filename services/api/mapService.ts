import { apiClient } from './client';
import { BarangayRiskFeature, BFPIncidentMarker, IncidentMarker } from './models';

export const mapService = {
  /** All 19 Lian barangays with current risk level + optional GeoJSON boundary. */
  getBarangayRisk: () => apiClient.get<BarangayRiskFeature[]>('/map/barangay_risk.php', false),

  /**
   * Resident map incidents — public, limited fields (no PII, no internal notes).
   * Returns accepted/dispatched/resolved incidents from incident_record,
   * with fallback to raw community_report rows not yet linked to an incident_record.
   */
  getIncidents: () => apiClient.get<IncidentMarker[]>('/map/incidents.php', false),

  /**
   * BFP map incidents — requires personnel auth, returns full investigation data:
   * reporter info, cause, casualties, estimated damage, response time, notes.
   * Optional params: year (number), status ('accepted'|'dispatched'|'resolved')
   */
  getBFPIncidents: (filters?: { year?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set('year', String(filters.year));
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    return apiClient.get<BFPIncidentMarker[]>(`/map/incidents_bfp.php${query ? `?${query}` : ''}`);
  },
};