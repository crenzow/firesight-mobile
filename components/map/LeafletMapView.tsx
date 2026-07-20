import React, { useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BarangayRiskFeature, IncidentMarker, RiskLevel } from '../../services/api/models';

const RISK_HEX: Record<RiskLevel, string> = {
  low: '#2FA65A',
  moderate: '#E8A33D',
  high: '#E14245',
};

interface LeafletMapViewProps {
  mode: 'risk' | 'incidents';
  barangays: BarangayRiskFeature[];
  incidents: IncidentMarker[];
  userLocation: { latitude: number; longitude: number } | null;
  centerLat: number;
  centerLng: number;
}

/**
 * Renders Leaflet (via CDN, inside a WebView) instead of a native map SDK —
 * per the master prompt's "Leaflet.js via WebView" requirement. Data is
 * injected as a JSON blob into the HTML string on each render; Leaflet
 * itself only loads once the WebView mounts.
 */
export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  mode,
  barangays,
  incidents,
  userLocation,
  centerLat,
  centerLng,
}) => {
  const webviewRef = useRef<WebView>(null);

  const html = useMemo(
    () => buildMapHtml({ mode, barangays, incidents, userLocation, centerLat, centerLng }),
    [mode, barangays, incidents, userLocation, centerLat, centerLng]
  );

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={{ html }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState={false}
      scrollEnabled={false}
    />
  );
};

function buildMapHtml({
  mode,
  barangays,
  incidents,
  userLocation,
  centerLat,
  centerLng,
}: LeafletMapViewProps): string {
  const barangayData = JSON.stringify(
    barangays.map((b) => ({
      id: b.barangay_id,
      name: b.barangay_name,
      lat: b.centroid_lat,
      lng: b.centroid_lng,
      risk: b.risk_level,
      color: RISK_HEX[b.risk_level],
      geojson: b.boundary_geojson ? safeParseGeoJson(b.boundary_geojson) : null,
    }))
  );

  const incidentData = JSON.stringify(
    incidents.map((i) => ({
      id: i.incident_id,
      lat: i.latitude,
      lng: i.longitude,
      barangay: i.barangay_name,
      type: i.incident_type,
      severity: i.severity_level,
      date: i.data_time,
    }))
  );

  const userMarker = userLocation ? JSON.stringify(userLocation) : 'null';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #F5F6FA; }
    .risk-dot { border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .incident-pin { border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .leaflet-popup-content { font-family: -apple-system, Roboto, sans-serif; font-size: 12px; margin: 8px 10px; }
    .leaflet-popup-content b { font-size: 13px; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const mode = ${JSON.stringify(mode)};
    const barangays = ${barangayData};
    const incidents = ${incidentData};
    const userLocation = ${userMarker};

    const map = L.map('map', { zoomControl: false, attributionControl: true }).setView([${centerLat}, ${centerLng}], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    if (mode === 'risk') {
      barangays.forEach((b) => {
        if (b.geojson) {
          L.geoJSON(b.geojson, {
            style: { color: b.color, weight: 1.5, fillColor: b.color, fillOpacity: 0.35 },
          }).addTo(map).bindPopup('<b>' + b.name + '</b><br/>Risk: ' + b.risk.toUpperCase());
        } else {
          L.circleMarker([b.lat, b.lng], {
            radius: 16,
            color: '#FFFFFF',
            weight: 2,
            fillColor: b.color,
            fillOpacity: 0.55,
          })
            .addTo(map)
            .bindPopup('<b>' + b.name + '</b><br/>Risk: ' + b.risk.toUpperCase());
        }
      });
    } else {
      incidents.forEach((i) => {
        const color = i.severity === 'critical' || i.severity === 'high' ? '#E14245' : i.severity === 'medium' ? '#E8A33D' : '#3B82C4';
        const marker = L.circleMarker([i.lat, i.lng], {
          radius: 8,
          color: '#FFFFFF',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.9,
        }).addTo(map);
        const dateLabel = new Date(i.date.replace(' ', 'T')).toLocaleDateString();
        marker.bindPopup('<b>' + i.barangay + '</b><br/>' + i.type + ' &middot; ' + i.severity + '<br/>' + dateLabel);
      });
    }

    if (userLocation) {
      L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 7,
        color: '#FFFFFF',
        weight: 2,
        fillColor: '#0F1C3F',
        fillOpacity: 1,
      }).addTo(map);
    }
  </script>
</body>
</html>`;
}

function safeParseGeoJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});