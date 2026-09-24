import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BarangayRiskFeature, IncidentMarker, RiskLevel } from '../../services/api/models';

import LianGeoJson from '../../boundaries/barangay_boundaries_lian.json';

const RISK_HEX: Record<RiskLevel, string> = {
  low: '#2FA65A',
  moderate: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

const DB_TO_GEOJSON_MAP: Record<string, string> = {
  'Barangay 1 (Poblacion)': 'Barangay 1 (Pob.)',
  'Barangay 2 (Poblacion)': 'Barangay 2 (Pob.)',
  'Barangay 3 (Poblacion)': 'Barangay 3 (Pob.)',
  'Barangay 4 (Poblacion)': 'Barangay 4 (Pob.)',
  'Barangay 5 (Poblacion)': 'Barangay 5 (Pob.)',
  'Puting Kahoy': 'Puting-Kahoy',
};

interface LeafletMapViewProps {
  mode: 'risk' | 'incidents';
  barangays: BarangayRiskFeature[];
  incidents: IncidentMarker[];
  userLocation: { latitude: number; longitude: number } | null;
  centerLat: number;
  centerLng: number;
  zoom?: number;
  isBFP?: boolean;
  mapType?: 'standard' | 'satellite' | 'terrain';
  onMapDragged?: () => void;
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
  zoom,
  isBFP = false,
  mapType = 'standard',
  onMapDragged,
}) => {
  const webviewRef = useRef<WebView>(null);

  const html = useMemo(
    () => buildMapHtml({ mode, barangays, incidents, userLocation, centerLat, centerLng, zoom, isBFP, mapType }),
    [mode, barangays, incidents, userLocation, centerLat, centerLng, zoom, isBFP]
  );

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.switchMapType) { window.switchMapType(${JSON.stringify(mapType)}); } true;`
      );
    }
  }, [mapType]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'USER_DRAGGED') {
        onMapDragged?.();
      }
    } catch {
      // ignore
    }
  };

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
      onMessage={handleMessage}
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
  zoom,
  isBFP,
  mapType,
}: LeafletMapViewProps): string {
  const barangayData = JSON.stringify(
    barangays.map((b) => {
      const mappedName = DB_TO_GEOJSON_MAP[b.barangay_name] || b.barangay_name;
      const geojsonFeature = (LianGeoJson as any).features.find(
        (f: any) => f.properties?.adm4_name === mappedName
      );
      
      return {
        id: b.barangay_id,
        name: b.barangay_name,
        lat: b.centroid_lat,
        lng: b.centroid_lng,
        risk: b.risk_level,
        color: RISK_HEX[b.risk_level],
        geojson: geojsonFeature || null,
      };
    })
  );

  const incidentData = JSON.stringify(
    incidents.map((i: any) => ({
      id: i.incident_id,
      lat: i.latitude,
      lng: i.longitude,
      barangay: i.barangay_name,
      type: i.incident_type,
      severity: i.severity_level,
      date: i.data_time,
      cause: i.cause_of_fire || null,
      casualties: i.casualties ?? null,
      notes: i.notes || null,
      // BFP-only fields (present when isBFP=true)
      report_id: (i as any).report_id ?? null,
      status: (i as any).status ?? null,
      reporter: (i as any).reporter_name ?? null,
      contact: (i as any).contact_number ?? null,
      description: (i as any).description ?? null,
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
    const isBFP = ${JSON.stringify(isBFP)};
    const mapType = ${JSON.stringify(mapType || 'standard')};
    const barangays = ${barangayData};
    const incidents = ${incidentData};
    const userLocation = ${userMarker};

    const initialZoom = ${zoom || (centerLat === 14.0065 && centerLng === 120.6425 ? 12 : 14)};
    const map = L.map('map', { zoomControl: false, attributionControl: true }).setView([${centerLat}, ${centerLng}], initialZoom);
    
    const baseMaps = {
      "standard": 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      "satellite": 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      "terrain": 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    };
    const attributions = {
      "standard": '&copy; OpenStreetMap contributors',
      "satellite": 'Tiles &copy; Esri',
      "terrain": 'Tiles &copy; Esri'
    };

    var currentTileLayer = null;
    window.switchMapType = function(type) {
      if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
      }
      var tileUrl = baseMaps[type] || baseMaps['standard'];
      var attr = attributions[type] || attributions['standard'];
      currentTileLayer = L.tileLayer(tileUrl, {
        attribution: attr,
        maxZoom: 19,
      }).addTo(map);
    };

    window.switchMapType(mapType);

    // Notify React Native when user manually drags/pans the map
    map.on('dragstart', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'USER_DRAGGED' }));
      }
    });

    window.panToUserLocation = function(lat, lng) {
      map.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
      if (window.userMarker) {
        map.removeLayer(window.userMarker);
      }
      window.userMarker = L.circleMarker([lat, lng], {
        radius: 7,
        color: '#FFFFFF',
        weight: 2,
        fillColor: '#F4622B',
        fillOpacity: 1,
      }).addTo(map);
    };

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
        const color = i.severity === 'critical' || i.severity === 'high' ? '#E14245' : i.severity === 'moderate' ? '#E8A33D' : '#3B82C4';
        const marker = L.circleMarker([i.lat, i.lng], {
          radius: 8,
          color: '#FFFFFF',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.9,
        }).addTo(map);
        let popupHtml;
        const timeString = i.date || new Date().toISOString();
        if (isBFP) {
          const fmt = function(v) { return v != null && v !== '' ? v : '-'; };
          const dateLabel = new Date(timeString.replace(' ', 'T')).toLocaleString();
          const sc = i.severity === 'critical' ? '#E14245' : i.severity === 'high' ? '#E8A33D' : i.severity === 'moderate' ? '#E8A33D' : '#3B82C4';
          const stc = i.status === 'resolved' ? '#2FA65A' : i.status === 'dispatched' ? '#E8A33D' : '#3B82C4';
          popupHtml =
            '<div style="font-family:-apple-system,Roboto,sans-serif;min-width:220px;max-width:280px">' +
              '<div style="background:#0F1C3F;color:#fff;padding:8px 10px;border-radius:6px 6px 0 0;margin:-8px -10px 8px;">' +
                '<div style="font-weight:800;font-size:13px">' + fmt(i.barangay) + '</div>' +
                '<div style="display:flex;gap:6px;margin-top:4px;align-items:center">' +
                  '<span style="background:' + sc + ';color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;text-transform:uppercase">' + fmt(i.severity) + '</span>' +
                  '<span style="background:' + stc + ';color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;text-transform:uppercase">' + fmt(i.status) + '</span>' +
                  '<span style="color:rgba(255,255,255,0.7);font-size:9px;text-transform:uppercase">' + fmt(i.type) + '</span>' +
                '</div>' +
              '</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
                '<tr><td style="color:#666;padding:3px 0;width:42%">Date/Time</td><td style="font-weight:600;color:#111">' + dateLabel + '</td></tr>' +
                (i.cause ? '<tr><td style="color:#666;padding:3px 0">Cause</td><td style="font-weight:600;color:#111">' + i.cause + '</td></tr>' : '') +
                (i.casualties != null ? '<tr><td style="color:#666;padding:3px 0">Casualties</td><td style="font-weight:600;color:' + (i.casualties > 0 ? '#E14245' : '#111') + '">' + i.casualties + '</td></tr>' : '') +
                (i.reporter ? '<tr><td colspan="2" style="border-top:1px solid #eee;padding-top:5px"></td></tr><tr><td style="color:#666;padding:3px 0">Reporter</td><td style="font-weight:600;color:#111">' + i.reporter + '</td></tr>' : '') +
                (i.contact ? '<tr><td style="color:#666;padding:3px 0">Contact</td><td style="font-weight:600;color:#0F1C3F">' + i.contact + '</td></tr>' : '') +
                (i.description ? '<tr><td colspan="2" style="color:#444;font-size:10px;padding-top:4px;border-top:1px solid #eee">' + i.description + '</td></tr>' : '') +
                (i.notes ? '<tr><td colspan="2" style="color:#666;font-size:10px;padding-top:4px;font-style:italic">Note: ' + i.notes + '</td></tr>' : '') +
              '</table>' +
            '</div>';
        } else {
          const dateLabel = new Date(timeString.replace(' ', 'T')).toLocaleDateString();
          popupHtml = '<b>' + i.barangay + '</b><br/>' + i.type + ' &middot; ' + i.severity + '<br/>' + dateLabel;
          if (i.cause) popupHtml += '<br/>Cause: ' + i.cause;
          if (i.casualties) popupHtml += '<br/>Casualties: ' + i.casualties;
        }
        marker.bindPopup(popupHtml);
      });
 
      // Auto-zoom to fit all incident markers
      if (incidents.length > 0) {
        var bounds = L.latLngBounds(incidents.map(function(inc) { return [inc.lat, inc.lng]; }));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
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
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
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