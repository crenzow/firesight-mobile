import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BarangayRiskFeature, IncidentMarker, RiskLevel } from '../../services/api/models';

import LianGeoJson from '../../boundaries/barangay_boundaries_lian.json';

const RISK_HEX: Record<RiskLevel, string> & Record<string, string> = {
  mild: '#EAB308',      // Warm Golden Yellow (user preferred)
  moderate: '#F97316',  // True Vibrant Orange (distinct from yellow & red)
  high: '#EF4444',      // Crimson Red
  // Backward compatibility fallbacks
  low: '#EAB308',
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

export interface LeafletMapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  panToUserLocation: (lat: number, lng: number) => void;
  removeUserMarker?: () => void;
  switchMapType: (type: 'standard' | 'satellite' | 'terrain') => void;
  focusBarangay: (name: string) => void;
  highlightBarangay: (name: string | null) => void;
}

export interface LeafletMapViewProps {
  mode: 'risk' | 'incidents';
  barangays: BarangayRiskFeature[];
  incidents: IncidentMarker[];
  userLocation: { latitude: number; longitude: number } | null;
  centerLat: number;
  centerLng: number;
  zoom?: number;
  isBFP?: boolean;
  mapType?: 'standard' | 'satellite' | 'terrain';
  selectedRiskFilter?: 'all' | RiskLevel;
  selectedBarangayName?: string | null;
  onMapDragged?: () => void;
  onSelectBarangay?: (barangayName: string) => void;
}

/**
 * Renders Leaflet (via CDN, inside a WebView) instead of a native map SDK —
 * per the master prompt's "Leaflet.js via WebView" requirement. Data is
 * injected as a JSON blob into the HTML string on each render; Leaflet
 * itself only loads once the WebView mounts.
 */
export const LeafletMapView = React.forwardRef<LeafletMapRef, LeafletMapViewProps>(({
  mode,
  barangays,
  incidents,
  userLocation,
  centerLat,
  centerLng,
  zoom,
  isBFP = false,
  mapType = 'standard',
  selectedRiskFilter = 'all',
  selectedBarangayName = null,
  onMapDragged,
  onSelectBarangay,
}, ref) => {
  const webviewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, targetZoom = 15) => {
      webviewRef.current?.injectJavaScript(
        `if (window.flyToLocation) { window.flyToLocation(${lat}, ${lng}, ${targetZoom}); } true;`
      );
    },
    panToUserLocation: (lat: number, lng: number) => {
      webviewRef.current?.injectJavaScript(
        `if (window.panToUserLocation) { window.panToUserLocation(${lat}, ${lng}); } true;`
      );
    },
    removeUserMarker: () => {
      webviewRef.current?.injectJavaScript(
        `if (window.removeUserMarker) { window.removeUserMarker(); } true;`
      );
    },
    switchMapType: (type: 'standard' | 'satellite' | 'terrain') => {
      webviewRef.current?.injectJavaScript(
        `if (window.switchMapType) { window.switchMapType(${JSON.stringify(type)}); } true;`
      );
    },
    focusBarangay: (name: string) => {
      webviewRef.current?.injectJavaScript(
        `if (window.focusBarangay) { window.focusBarangay(${JSON.stringify(name)}); } true;`
      );
    },
    highlightBarangay: (name: string | null) => {
      webviewRef.current?.injectJavaScript(
        `if (window.highlightBarangay) { window.highlightBarangay(${JSON.stringify(name)}); } true;`
      );
    },
  }));

  const initialUserLocationRef = useRef(userLocation);
  const initialMapTypeRef = useRef(mapType);
  const initialSelectedBarangayRef = useRef(selectedBarangayName);
  const initialSelectedRiskFilterRef = useRef(selectedRiskFilter);

  // Serialize arrays so new array references with identical content never reload the WebView
  const barangaysHash = useMemo(
    () => barangays.map((b) => `${b.barangay_id}:${b.barangay_name}:${b.risk_level}`).join(','),
    [barangays]
  );
  const incidentsHash = useMemo(
    () => incidents.map((i: any) => `${i.incident_id || i.id}:${i.latitude},${i.longitude}`).join(','),
    [incidents]
  );

  const html = useMemo(
    () =>
      buildMapHtml({
        mode,
        barangays,
        incidents,
        userLocation: initialUserLocationRef.current,
        centerLat,
        centerLng,
        zoom,
        isBFP,
        mapType: initialMapTypeRef.current,
        selectedRiskFilter: initialSelectedRiskFilterRef.current,
        selectedBarangayName: initialSelectedBarangayRef.current,
      }),
    // Only re-generate html if core structural data or mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, barangaysHash, incidentsHash, centerLat, centerLng, zoom, isBFP]
  );

  useEffect(() => {
    if (userLocation && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.setUserMarker) { window.setUserMarker(${userLocation.latitude}, ${userLocation.longitude}); } true;`
      );
    } else if (!userLocation && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.removeUserMarker) { window.removeUserMarker(); } true;`
      );
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.switchMapType) { window.switchMapType(${JSON.stringify(mapType)}); } true;`
      );
    }
  }, [mapType]);

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.highlightBarangay) { window.highlightBarangay(${JSON.stringify(selectedBarangayName || null)}); } true;`
      );
    }
  }, [selectedBarangayName]);

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.setRiskFilter) { window.setRiskFilter(${JSON.stringify(selectedRiskFilter || 'all')}); } true;`
      );
    }
  }, [selectedRiskFilter]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'USER_DRAGGED') {
        onMapDragged?.();
      } else if (data.type === 'BARANGAY_SELECTED') {
        onSelectBarangay?.(data.name);
      } else if (data.type === 'MAP_BACKGROUND_CLICKED') {
        onSelectBarangay?.('');
      }
    } catch {
      // ignore
    }
  };

  const source = useMemo(() => ({ html }), [html]);

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={source}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      cacheEnabled
      cacheMode="LOAD_DEFAULT"
      startInLoadingState={false}
      scrollEnabled={false}
      overScrollMode="never"
      androidLayerType="hardware"
      renderToHardwareTextureAndroid={true}
      onMessage={handleMessage}
    />
  );
});

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
  selectedRiskFilter,
  selectedBarangayName,
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
        color: RISK_HEX[b.risk_level] || '#EAB308',
        geojson: geojsonFeature || null,
      };
    })
  );

  const incidentData = JSON.stringify(
    incidents.map((i: any) => ({
      id: i.incident_id ?? (i as any).report_id ?? (i as any).id,
      lat: i.latitude,
      lng: i.longitude,
      barangay: i.barangay_name,
      type: i.incident_type,
      alarm: i.alarm_level,
      date: (i as any).created_at ?? i.data_time,
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

  const isSatelliteInit = mapType === 'satellite';
  const initialBg = isSatelliteInit ? '#080E28' : '#F2EFE9';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background: ${initialBg};
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      transition: background-color 0.2s ease;
    }
    .leaflet-container {
      background: ${initialBg} !important;
    }
    .leaflet-tile {
      image-rendering: auto;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transform: translate3d(0, 0, 0);
      will-change: transform;
    }
    .leaflet-tile-container {
      background-color: transparent !important;
    }
    /* ── Apple Maps-Style Premium Popup (Matches Native UI) ────── */
    .leaflet-popup {
      margin-bottom: 6px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .leaflet-popup-content-wrapper {
      background: #FFFFFF;
      color: #101827;
      border-radius: 22px;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 14px 40px rgba(15, 28, 63, 0.16), 0 4px 12px rgba(15, 28, 63, 0.08);
      overflow: hidden;
    }
    .leaflet-popup-content {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.4;
      min-width: 255px;
      max-width: 290px;
    }
    .leaflet-popup-tip-container {
      width: 28px;
      height: 14px;
    }
    .leaflet-popup-tip {
      width: 14px;
      height: 14px;
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 4px 8px rgba(15, 28, 63, 0.1);
      border-radius: 2px;
    }
    .leaflet-container a.leaflet-popup-close-button {
      top: 11px;
      right: 12px;
      color: #8992A6;
      font-size: 15px;
      width: 24px;
      height: 24px;
      line-height: 22px;
      text-align: center;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.05);
      transition: all 0.15s ease;
      font-weight: 600;
    }
    .leaflet-container a.leaflet-popup-close-button:hover {
      color: #101827;
      background: rgba(0, 0, 0, 0.1);
    }

    /* Popup interior */
    .fs-pop-card {
      padding: 13px 15px 14px 15px;
    }
    .fs-pop-hero {
      padding-bottom: 9px;
      border-bottom: 1px solid #E3E6ED;
      margin-bottom: 9px;
    }
    .fs-pop-title {
      font-weight: 800;
      font-size: 15px;
      letter-spacing: -0.2px;
      color: #101827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    .fs-pop-badges {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    .fs-pop-pill {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.2px;
      padding: 2.5px 8px;
      border-radius: 20px;
      text-transform: uppercase;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
    }
    .fs-pop-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .fs-pop-table tr td {
      padding: 3.5px 0;
      vertical-align: top;
    }
    .fs-pop-lbl {
      color: #8992A6;
      font-weight: 600;
      width: 33%;
    }
    .fs-pop-val {
      color: #101827;
      font-weight: 600;
      text-align: right;
    }

    .risk-dot { border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .incident-pin { border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .leaflet-popup-content { font-family: -apple-system, Roboto, sans-serif; font-size: 12px; margin: 8px 10px; }
    .leaflet-popup-content b { font-size: 13px; }
    .leaflet-control-attribution { font-size: 9px; }
    .brgy-label-icon {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      pointer-events: none !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brgy-label {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.15px;
      color: #1E293B;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      text-shadow:
        -1.3px -1.3px 0 rgba(255,255,255,0.96),
         1.3px -1.3px 0 rgba(255,255,255,0.96),
        -1.3px  1.3px 0 rgba(255,255,255,0.96),
         1.3px  1.3px 0 rgba(255,255,255,0.96),
         0px    1.5px 4px rgba(255,255,255,0.9);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .brgy-label--satellite {
      color: #FFFFFF;
      text-shadow:
        -1.3px -1.3px 0 rgba(10,19,48,0.92),
         1.3px -1.3px 0 rgba(10,19,48,0.92),
        -1.3px  1.3px 0 rgba(10,19,48,0.92),
         1.3px  1.3px 0 rgba(10,19,48,0.92),
         0px    1.5px 5px rgba(0,0,0,0.9);
    }
    .brgy-label--selected {
      font-size: 12px;
      font-weight: 800;
      transform: scale(1.08);
    }
    .brgy-label--dimmed {
      opacity: 0.42;
    }
    .brgy-label--hidden {
      opacity: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const mode = ${JSON.stringify(mode)};
    const isBFP = ${JSON.stringify(isBFP)};
    var activeMapType = ${JSON.stringify(mapType || 'standard')};
    var currentSelectedKey = ${JSON.stringify(selectedBarangayName ? selectedBarangayName.toLowerCase().trim() : null)};
    var currentRiskFilter = ${JSON.stringify(selectedRiskFilter || 'all')};
    const barangays = ${barangayData};
    const incidents = ${incidentData};
    const userLocation = ${userMarker};

    const initialZoom = ${zoom || (centerLat === 14.0065 && centerLng === 120.6425 ? 12 : 14)};
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 19,
      bounceAtZoomLimits: false,
    }).setView([${centerLat}, ${centerLng}], initialZoom);
    
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
    var barangayEntries = {};
    var poblacionHubMarker = null;

    window.switchMapType = function(type) {
      activeMapType = type || 'standard';
      var isSat = activeMapType === 'satellite';
      var targetBg = isSat ? '#080E28' : '#F2EFE9';
      var mapEl = document.getElementById('map');
      if (mapEl) mapEl.style.backgroundColor = targetBg;
      document.body.style.backgroundColor = targetBg;
      if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
      }
      var tileUrl = baseMaps[activeMapType] || baseMaps['standard'];
      var attr = attributions[activeMapType] || attributions['standard'];
      var maxNative = isSat ? 17 : (activeMapType === 'terrain' ? 17 : 19);
      currentTileLayer = L.tileLayer(tileUrl, {
        attribution: attr,
        maxNativeZoom: maxNative,
        maxZoom: 19,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateInterval: 100,
        fadeAnimation: true,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);
      if (window.updateBarangayLabels) {
        window.updateBarangayLabels();
      }
    };

    window.switchMapType(activeMapType);

    // Notify React Native when user manually drags/pans the map
    map.on('dragstart', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'USER_DRAGGED' }));
      }
    });

    // Tapping outside any barangay clears the active selection
    map.on('click', function() {
      if (currentSelectedKey && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_BACKGROUND_CLICKED' }));
      }
    });

    window.flyToLocation = function(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 15, { animate: true, duration: 1.0 });
    };

    window.setUserMarker = function(lat, lng) {
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

    window.removeUserMarker = function() {
      if (window.userMarker) {
        map.removeLayer(window.userMarker);
        window.userMarker = null;
      }
    };

    window.panToUserLocation = function(lat, lng) {
      map.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
      window.setUserMarker(lat, lng);
    };

    var barangayLayers = {};

    window.focusBarangay = function(name) {
      if (!name) return;
      var key = String(name).toLowerCase().trim();
      var layer = barangayLayers[key];
      if (layer) {
        if (layer.getBounds) {
          map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 15, animate: true, duration: 1.0 });
        } else if (layer.getLatLng) {
          map.flyTo(layer.getLatLng(), 15, { animate: true, duration: 1.0 });
        }
      }
    };

    function formatShortLabel(name) {
      return String(name)
        .replace(/^Barangay\s+(\d+)\s*\(Poblacion\)$/i, 'Brgy. $1')
        .replace(/^Barangay\s+(\d+)\s*\(Pob\.\)$/i, 'Brgy. $1');
    }

    function isPoblacionBrgy(name) {
      return /Poblacion|Pob\./i.test(String(name));
    }

    window.updateBarangayLabels = function() {
      var z = map.getZoom();
      var isSat = activeMapType === 'satellite';
      var keys = Object.keys(barangayEntries);

      keys.forEach(function(k) {
        var entry = barangayEntries[k];
        if (!entry || !entry.labelEl) return;
        var isSelected = currentSelectedKey && currentSelectedKey === k;
        var hasAnySelected = !!currentSelectedKey;

        // Show rural barangay labels at zoom >= 12; compact Poblacion labels at zoom >= 14 (unless selected)
        var shouldShow = isSelected || (entry.isPob ? z >= 14 : z >= 12);

        var classes = ['brgy-label'];
        if (isSat) classes.push('brgy-label--satellite');
        if (isSelected) classes.push('brgy-label--selected');
        else if (hasAnySelected) classes.push('brgy-label--dimmed');
        if (!shouldShow) classes.push('brgy-label--hidden');

        entry.labelEl.className = classes.join(' ');
      });

      if (poblacionHubMarker && poblacionHubMarker._icon) {
        var hubSpan = poblacionHubMarker._icon.querySelector('.brgy-label');
        if (hubSpan) {
          var anyPobSelected = currentSelectedKey && /barangay\s+[1-5]/i.test(currentSelectedKey);
          var showHub = z >= 12 && z < 14 && !anyPobSelected;
          var hubClasses = ['brgy-label'];
          if (isSat) hubClasses.push('brgy-label--satellite');
          if (currentSelectedKey) hubClasses.push('brgy-label--dimmed');
          if (!showHub) hubClasses.push('brgy-label--hidden');
          hubSpan.className = hubClasses.join(' ');
        }
      }
    };

    window.setRiskFilter = function(filter) {
      currentRiskFilter = filter || 'all';
      var keys = Object.keys(barangayEntries);

      keys.forEach(function(k) {
        var entry = barangayEntries[k];
        if (!entry) return;

        var matches = currentRiskFilter === 'all' || entry.risk === currentRiskFilter;

        if (entry.layer) {
          if (entry.layer.setStyle) {
            entry.layer.setStyle({
              opacity: matches ? 1 : 0,
              fillOpacity: matches ? (currentSelectedKey === k ? 0.58 : (currentSelectedKey ? 0.16 : 0.35)) : 0,
            });
          }
        }

        if (entry.labelMarker && entry.labelMarker._icon) {
          entry.labelMarker._icon.style.display = matches ? '' : 'none';
        }
      });

      if (window.updateBarangayLabels) {
        window.updateBarangayLabels();
      }
    };

    window.highlightBarangay = function(name) {
      currentSelectedKey = name ? String(name).toLowerCase().trim() : null;
      var keys = Object.keys(barangayEntries);

      keys.forEach(function(k) {
        var entry = barangayEntries[k];
        if (!entry || !entry.layer || !entry.layer.setStyle) return;

        var matches = currentRiskFilter === 'all' || entry.risk === currentRiskFilter;
        if (!matches) {
          entry.layer.setStyle({ opacity: 0, fillOpacity: 0 });
          return;
        }

        if (!currentSelectedKey) {
          // Default state — all barangays crisp at normal weight/opacity
          entry.layer.setStyle({
            color: entry.color,
            weight: 1.5,
            opacity: 1,
            fillColor: entry.color,
            fillOpacity: 0.35
          });
        } else if (k === currentSelectedKey) {
          // Selected barangay — bold stroke & elevated fill
          entry.layer.setStyle({
            color: entry.color,
            weight: 3.2,
            opacity: 1,
            fillColor: entry.color,
            fillOpacity: 0.58
          });
          if (entry.layer.bringToFront) {
            entry.layer.bringToFront();
          }
        } else {
          // Unselected barangays — gently dimmed so the selected one pops
          entry.layer.setStyle({
            color: entry.color,
            weight: 1.1,
            opacity: 0.45,
            fillColor: entry.color,
            fillOpacity: 0.16
          });
        }
      });

      window.updateBarangayLabels();
    };

    if (mode === 'risk') {
      barangays.forEach((b) => {
        var key = String(b.name).toLowerCase().trim();
        var isPob = isPoblacionBrgy(b.name);
        var shortLabel = formatShortLabel(b.name);

        if (b.geojson) {
          var layer = L.geoJSON(b.geojson, {
            style: { color: b.color, weight: 1.5, fillColor: b.color, fillOpacity: 0.35 },
            onEachFeature: function(feature, l) {
              l.on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BARANGAY_SELECTED', name: b.name }));
                }
              });
            }
          }).addTo(map);
          barangayLayers[key] = layer;

          var center = layer.getBounds().getCenter();
          var labelMarker = L.marker(center, {
            interactive: false,
            icon: L.divIcon({
              className: 'brgy-label-icon',
              html: '<span class="brgy-label">' + shortLabel + '</span>',
              iconSize: [120, 22],
              iconAnchor: [60, 11]
            })
          }).addTo(map);

          barangayEntries[key] = {
            key: key,
            name: b.name,
            risk: b.risk,
            color: b.color,
            layer: layer,
            isPob: isPob,
            labelMarker: labelMarker,
            labelEl: labelMarker.getElement ? labelMarker.getElement().querySelector('.brgy-label') : null
          };
        } else {
          var marker = L.circleMarker([b.lat, b.lng], {
            radius: 16,
            color: '#FFFFFF',
            weight: 2,
            fillColor: b.color,
            fillOpacity: 0.55,
          }).addTo(map);
          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BARANGAY_SELECTED', name: b.name }));
            }
          });
          barangayLayers[key] = marker;
          barangayEntries[key] = {
            key: key,
            name: b.name,
            risk: b.risk,
            color: b.color,
            layer: marker,
            isPob: isPob,
            labelMarker: null,
            labelEl: null
          };
        }
      });

      // Add a single "Poblacion" cluster label for overview zoom levels (12-13)
      poblacionHubMarker = L.marker([14.0385, 120.6518], {
        interactive: false,
        icon: L.divIcon({
          className: 'brgy-label-icon',
          html: '<span class="brgy-label">Poblacion</span>',
          iconSize: [100, 20],
          iconAnchor: [50, 10]
        })
      }).addTo(map);

      map.on('zoomend', function() {
        window.updateBarangayLabels();
      });

      // Apply initial highlight, risk filter and label states
      if (currentRiskFilter !== 'all') {
        window.setRiskFilter(currentRiskFilter);
      } else {
        window.highlightBarangay(currentSelectedKey);
      }    } else {
      incidents.forEach((i) => {
        if (!i.lat || !i.lng) return;
        const lat = parseFloat(i.lat);
        const lng = parseFloat(i.lng);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

        const isTaskForceOrGeneral = i.alarm && (i.alarm.indexOf('task_force') !== -1 || i.alarm === 'general_alarm');
        const isHighAlarm = i.alarm === '3rd_alarm' || i.alarm === '4th_alarm' || i.alarm === '5th_alarm';
        const color = isTaskForceOrGeneral ? '#E14245' : isHighAlarm ? '#F4622B' : i.alarm === '2nd_alarm' ? '#E8A33D' : '#3B82C4';

        const marker = L.circleMarker([lat, lng], {
          radius: 9,
          color: '#FFFFFF',
          weight: 2.5,
          fillColor: color,
          fillOpacity: 0.95,
        }).addTo(map);

        let dateLabel = 'Date not recorded';
        if (i.date && typeof i.date === 'string' && i.date.trim() !== '') {
          try {
            const d = new Date(i.date.replace(' ', 'T'));
            if (!isNaN(d.getTime())) {
              dateLabel = d.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            }
          } catch (e) {}
        }

        const incidentStatus = (i.status || 'resolved').toUpperCase();
        const stBg = incidentStatus === 'RESOLVED' ? 'rgba(34, 197, 94, 0.18)' : incidentStatus === 'DISPATCHED' ? 'rgba(244, 98, 43, 0.22)' : 'rgba(59, 130, 246, 0.22)';
        const stColor = incidentStatus === 'RESOLVED' ? '#4ADE80' : incidentStatus === 'DISPATCHED' ? '#F97316' : '#60A5FA';
        const stBorder = incidentStatus === 'RESOLVED' ? '#22C55E' : incidentStatus === 'DISPATCHED' ? '#F4622B' : '#3B82F6';

        const alarmText = i.alarm ? i.alarm.replace(/_/g, ' ').toUpperCase() : null;

        var popupHtml =
          '<div class="fs-pop-card">' +
            '<div class="fs-pop-hero">' +
              '<div class="fs-pop-title">' + (i.barangay || 'Lian Incident') + '</div>' +
              '<div class="fs-pop-badges">' +
                (alarmText ? '<span class="fs-pop-pill" style="background:' + color + '15;color:' + color + ';border-color:' + color + '55">' + alarmText + '</span>' : '') +
                (isBFP ? '<span class="fs-pop-pill" style="background:' + stBg + ';color:' + stColor + ';border-color:' + stBorder + '">' + incidentStatus + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<table class="fs-pop-table">' +
              '<tr><td class="fs-pop-lbl">Date/Time</td><td class="fs-pop-val">' + dateLabel + '</td></tr>' +
              (i.cause ? '<tr><td class="fs-pop-lbl">Cause</td><td class="fs-pop-val">' + i.cause + '</td></tr>' : '') +
              (i.casualties != null ? '<tr><td class="fs-pop-lbl">Casualties</td><td class="fs-pop-val" style="color:' + (Number(i.casualties) > 0 ? '#E14245' : '#101827') + '">' + i.casualties + ' reported</td></tr>' : '') +
              (isBFP && i.reporter ? '<tr><td class="fs-pop-lbl">Reporter</td><td class="fs-pop-val">' + i.reporter + (i.contact ? ' &middot; ' + i.contact : '') + '</td></tr>' : '') +
            '</table>' +
          '</div>';

        marker.bindPopup(popupHtml, {
          offset: [0, -10],
          closeButton: true,
          autoPan: true,
          autoPanPaddingTopLeft: [20, 240],
          autoPanPaddingBottomRight: [20, 60],
        });
      });

      // Auto-zoom to fit all incident markers
      if (incidents.length > 0) {
        var bounds = L.latLngBounds(incidents.map(function(inc) { return [inc.lat, inc.lng]; }));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }

    if (userLocation) {
      window.setUserMarker(userLocation.latitude, userLocation.longitude);
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