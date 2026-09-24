import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { IncidentMarker } from '../../services/api/models';

interface BFPHeatmapViewProps {
  mode: 'heatmap' | 'incidents';
  incidents: IncidentMarker[];
  centerLat: number;
  centerLng: number;
}

const SEVERITY_WEIGHT: Record<string, number> = { low: 0.3, moderate: 0.5, high: 0.8, critical: 1.0 };

/**
 * Risk Mapping module map — two modes:
 *  - 'heatmap': a density heatmap (via the leaflet.heat plugin) built from
 *    all incident coordinates, weighted by severity, showing fire-prone
 *    areas visually rather than as discrete markers.
 *  - 'incidents': the same discrete incident markers used elsewhere, for
 *    when personnel want to inspect individual records rather than density.
 *
 * A true ML-generated risk heatmap (per the thesis's risk_assessment /
 * prediction_score pipeline) would come from the backend; this incident-
 * density heatmap is a reasonable, honest stand-in using data that already
 * exists, and can be swapped for backend-supplied heat points later without
 * changing this component's shape.
 */
export const BFPHeatmapView: React.FC<BFPHeatmapViewProps> = ({ mode, incidents, centerLat, centerLng }) => {
  const html = useMemo(() => buildHtml({ mode, incidents, centerLat, centerLng }), [mode, incidents, centerLat, centerLng]);

  return (
    <WebView source={{ html }} originWhitelist={['*']} style={styles.webview} javaScriptEnabled scrollEnabled={false} />
  );
};

function buildHtml({ mode, incidents, centerLat, centerLng }: BFPHeatmapViewProps): string {
  const heatPoints = JSON.stringify(
    incidents.map((i) => [i.latitude, i.longitude, i.severity_level ? SEVERITY_WEIGHT[i.severity_level] ?? 0.4 : 0.4])
  );
  const markerData = JSON.stringify(
    incidents.map((i) => ({
      lat: i.latitude,
      lng: i.longitude,
      barangay: i.barangay_name,
      type: i.incident_type,
      severity: i.severity_level,
      date: i.data_time,
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0F1C3F; }
    .leaflet-control-attribution { font-size: 8px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <script>
    const mode = ${JSON.stringify(mode)};
    const heatPoints = ${heatPoints};
    const markers = ${markerData};

    const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    if (mode === 'heatmap') {
      if (heatPoints.length > 0) {
        L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 15, gradient: { 0.2: '#2FA65A', 0.5: '#E8A33D', 0.8: '#F4622B', 1.0: '#E14245' } }).addTo(map);
      }
    } else {
      markers.forEach((m) => {
        const color = m.severity === 'critical' || m.severity === 'high' ? '#E14245' : m.severity === 'moderate' ? '#E8A33D' : '#3B82C4';
        const marker = L.circleMarker([m.lat, m.lng], { radius: 8, color: '#FFFFFF', weight: 2, fillColor: color, fillOpacity: 0.9 }).addTo(map);
        const dateLabel = new Date(m.date.replace(' ', 'T')).toLocaleDateString();
        marker.bindPopup('<b>' + m.barangay + '</b><br/>' + m.type + ' &middot; ' + m.severity + '<br/>' + dateLabel);
      });
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: 'transparent' },
});