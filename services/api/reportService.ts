import { apiClient } from './client';
import { AreaStatus, CommunityReport, CreateReportPayload, ReportStatusHistoryEntry } from './models';

export const reportService = {
  /** Home screen "Area Status" card + risk badge for the resident's registered barangay. */
  getAreaStatus: () => apiClient.get<AreaStatus>('/reports/area_status.php'),

  /** Resident's own report history, most recent first. */
  getMyReports: (limit = 10) => apiClient.get<CommunityReport[]>(`/reports/list.php?mine=1&limit=${limit}`),

  getReportById: (reportId: number) => apiClient.get<CommunityReport>(`/reports/detail.php?report_id=${reportId}`),

  getStatusHistory: (reportId: number) =>
    apiClient.get<ReportStatusHistoryEntry[]>(`/reports/status_history.php?report_id=${reportId}`),

  /** Submits a fire report with photo as multipart form data. */
  create: (payload: CreateReportPayload) => {
    const formData = new FormData();
    formData.append('description', payload.description);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    if (payload.device_latitude != null) {
      formData.append('device_latitude', String(payload.device_latitude));
    }
    if (payload.device_longitude != null) {
      formData.append('device_longitude', String(payload.device_longitude));
    }
    if (payload.location_accuracy_m != null) {
      formData.append('location_accuracy_m', String(payload.location_accuracy_m));
    }
    formData.append('barangay_id', String(payload.barangay_id));

    const filename = payload.photoUri.split('/').pop() ?? 'report.jpg';
    const extMatch = /\.(\w+)$/.exec(filename);
    const fileType = extMatch ? `image/${extMatch[1] === 'jpg' ? 'jpeg' : extMatch[1]}` : 'image/jpeg';

    // React Native's FormData accepts this { uri, name, type } shape for files.
    formData.append('report_image', { uri: payload.photoUri, name: filename, type: fileType } as unknown as Blob);

    return apiClient.postForm<CommunityReport>('/reports/create.php', formData);
  },
};