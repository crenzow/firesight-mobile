import { apiClient } from './client';

export interface ResidentCctv {
  id: number;
  name: string;
  camera_ip: string | null;
  rtsp_port: number;
  stream_path: string;
  rtsp_username: string | null;
  has_password?: boolean;
  custom_rtsp_url: string | null;
  camera_token: string;
  notifications_enabled: boolean;
  last_fire_detected_at: string | null;
  stream_url: string;
  telemetry_url: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CctvResponse {
  has_camera: boolean;
  camera: ResidentCctv | null;
  message?: string;
}

export interface SaveCctvPayload {
  name?: string;
  camera_ip?: string;
  rtsp_port?: number;
  stream_path?: string;
  rtsp_username?: string;
  rtsp_password?: string;
  custom_rtsp_url?: string;
  notifications_enabled?: boolean;
}

export interface CctvTelemetry {
  connected: boolean;
  detection: {
    fire: boolean;
    smoke: boolean;
    detections: {
      box: [number, number, number, number];
      label: string;
      confidence: number;
    }[];
    fire_count: number;
    smoke_count: number;
    top_confidence: number;
    label: string;
    score_percent: number;
  } | null;
}

export const cctvService = {
  /** Fetch the logged-in resident's configured CCTV camera */
  get: () => apiClient.get<CctvResponse>('/cctv'),

  /** Save or update CCTV settings */
  save: (payload: SaveCctvPayload) => apiClient.post<CctvResponse>('/cctv', payload),

  /** Delete CCTV camera */
  remove: () => apiClient.delete<CctvResponse>('/cctv'),

  /** Fetch live AI detection telemetry */
  getTelemetry: async (telemetryUrl: string): Promise<CctvTelemetry | null> => {
    try {
      const res = await fetch(telemetryUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      return (await res.json()) as CctvTelemetry;
    } catch {
      return null;
    }
  },
};
