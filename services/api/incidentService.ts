import { apiClient } from './client';
import {
  BFPIncident,
  BFPIncidentStatusHistoryEntry,
  CreateManualIncidentPayload,
  DashboardAnalytics,
  UpdateIncidentDetailsPayload,
} from './bfpModels';
import { BFPIncidentStatus } from '../../components/bfp/IncidentStatusBadge';

/**
 * BFP Personnel incident management API.
 *
 * IMPORTANT: none of these endpoints exist on the backend yet — this phase
 * is frontend-only per your request. Each function below documents the
 * exact PHP endpoint it expects, following the same "frontend contract
 * first, backend to match later" approach used for the resident app.
 *
 * `list()` and `getDetail()`/`getStatusHistory()` are new, richer endpoints
 * (under /incidents/) rather than reusing /reports/list.php, because BFP
 * screens need fields (severity, incident type, cause, casualties) that
 * the resident-facing `reports/*.php` endpoints don't join in.
 */
export const incidentService = {
  list: (filters?: { status?: BFPIncidentStatus; barangayId?: number; year?: number; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.barangayId) params.set('barangay_id', String(filters.barangayId));
    if (filters?.year) params.set('year', String(filters.year));
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString();
    return apiClient.get<BFPIncident[]>(`/incidents/list.php${query ? `?${query}` : ''}`);
  },

  getDetail: (reportId: number) => apiClient.get<BFPIncident>(`/incidents/detail.php?report_id=${reportId}`),

  getStatusHistory: (reportId: number) =>
    apiClient.get<BFPIncidentStatusHistoryEntry[]>(`/incidents/status_history.php?report_id=${reportId}`),

  /** Moves a pending report to 'accepted' — first confirmation step. */
  verify: (reportId: number, notes?: string) =>
    apiClient.post<BFPIncident>('/incidents/verify.php', { report_id: reportId, notes }),

  /** Marks a report as a false alarm / invalid. */
  markInvalid: (reportId: number, reason: string) =>
    apiClient.post<BFPIncident>('/incidents/mark_invalid.php', { report_id: reportId, reason }),

  /** Advances status along Reported -> Accepted -> Dispatched -> Resolved. */
  updateStatus: (reportId: number, status: BFPIncidentStatus, notes?: string) =>
    apiClient.post<BFPIncident>('/incidents/update_status.php', { report_id: reportId, status, notes }),

  /** Edits cause of fire, casualties, notes, severity on an existing incident. */
  updateDetails: (reportId: number, payload: UpdateIncidentDetailsPayload) =>
    apiClient.put<BFPIncident>(`/incidents/update_details.php?report_id=${reportId}`, payload),

  /** Manual entry for incidents not reported through the resident app. */
  createManual: (payload: CreateManualIncidentPayload) => {
    const formData = new FormData();
    formData.append('barangay_id', String(payload.barangay_id));
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    formData.append('description', payload.description);
    formData.append('incident_type', payload.incident_type);
    formData.append('severity_level', payload.severity_level);
    formData.append('data_time', payload.data_time);
    if (payload.cause_of_fire) formData.append('cause_of_fire', payload.cause_of_fire);
    if (payload.casualties != null) formData.append('casualties', String(payload.casualties));
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.photoUri) {
      const filename = payload.photoUri.split('/').pop() ?? 'evidence.jpg';
      formData.append('photo', { uri: payload.photoUri, name: filename, type: 'image/jpeg' } as unknown as Blob);
    }
    return apiClient.postForm<BFPIncident>('/incidents/create_manual.php', formData);
  },

  /** Adds an additional evidence photo to an existing incident. */
  addEvidence: (reportId: number, photoUri: string) => {
    const formData = new FormData();
    formData.append('report_id', String(reportId));
    const filename = photoUri.split('/').pop() ?? 'evidence.jpg';
    formData.append('photo', { uri: photoUri, name: filename, type: 'image/jpeg' } as unknown as Blob);
    return apiClient.postForm<{ message: string; image_path: string }>('/incidents/add_evidence.php', formData);
  },

  getDashboardAnalytics: () => apiClient.get<DashboardAnalytics>('/dashboard/analytics.php'),
};