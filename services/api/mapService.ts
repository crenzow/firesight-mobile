import { apiClient } from './client';
import { BarangayRiskFeature, IncidentMarker } from './models';

export const mapService = {
  /** All 19 Lian barangays with current risk level + optional GeoJSON boundary. */
  getBarangayRisk: () => apiClient.get<BarangayRiskFeature[]>('/map/barangay_risk.php', false),

  /** Verified/resolved incident locations only — matches the use-case doc's
   *  "limited incident information, avoid clutter" requirement. */
  getIncidents: () => apiClient.get<IncidentMarker[]>('/map/incidents.php', false),
};