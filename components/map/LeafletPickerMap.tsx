import React, { useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type PickerMapType = 'standard' | 'satellite';

interface LeafletPickerMapProps {
  initialLat: number;
  initialLng: number;
  zoom?: number;
  mapType?: PickerMapType;
  onLocationChange?: (lat: number, lng: number) => void;
  onMoveEnd?: (lat: number, lng: number) => void;
  /** Called when map is ready; receives a pan(lat, lng) function */
  onReady?: (pan: (lat: number, lng: number) => void) => void;
}

/**
 * Renders a Leaflet map inside a WebView for picking an incident location.
 *
 * Tile sources:
 *   standard  → OpenStreetMap (free, no key)
 *   satellite → ESRI World Imagery (same stack used in LeafletMapView and IncidentLocationMap)
 *
 * - Native crosshair overlay so it is always crisp regardless of map state.
 * - Emits LOCATION_CHANGED postMessage on moveend.
 * - Exposes switchLayer via injectJavaScript for live tile switching.
 * - Exposes flyTo via injectJavaScript for the "Locate Me" button.
 */
export const LeafletPickerMap: React.FC<LeafletPickerMapProps> = ({
  initialLat,
  initialLng,
  zoom = 17,
  mapType = 'satellite',
  onLocationChange,
  onMoveEnd,
  onReady,
}) => {
  const webviewRef = useRef<WebView>(null);
  const isLoadedRef = useRef(false);

  const initialLatRef = useRef(initialLat);
  const initialLngRef = useRef(initialLng);
  const initialZoomRef = useRef(zoom);
  const initialMapTypeRef = useRef(mapType);

  const pan = useCallback((lat: number, lng: number) => {
    webviewRef.current?.injectJavaScript(
      `if (typeof map !== 'undefined' && map && map.flyTo) { map.flyTo([${lat}, ${lng}], 17, { animate: true, duration: 1.0 }); } true;`
    );
  }, []);

  const handleLoad = useCallback(() => {
    isLoadedRef.current = true;
    onReady?.(pan);
  }, [onReady, pan]);

  // Switch tile layer live without reloading the WebView
  React.useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if (window.switchLayer) { window.switchLayer('${mapType}'); } true;`
      );
    }
  }, [mapType]);

  const html = useMemo(
    () =>
      buildMapHtml(
        initialLatRef.current,
        initialLngRef.current,
        initialZoomRef.current,
        initialMapTypeRef.current
      ),
    []
  );

  const source = useMemo(() => ({ html }), [html]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_CHANGED') {
        onLocationChange?.(data.lat, data.lng);
        onMoveEnd?.(data.lat, data.lng);
      }
    } catch {
      // ignore parse errors
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={source}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        scrollEnabled={false}
        onMessage={handleMessage}
        onLoad={handleLoad}
      />
      {/* Precision Crosshair Target Overlay */}
      <View style={styles.crosshairContainer} pointerEvents="none">
        <View style={styles.targetRing}>
          <View style={[styles.reticleLine, styles.reticleTop]} />
          <View style={[styles.reticleLine, styles.reticleBottom]} />
          <View style={[styles.reticleLine, styles.reticleLeft]} />
          <View style={[styles.reticleLine, styles.reticleRight]} />
          <View style={styles.targetCenterPoint} />
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------

const TILES = {
  // Standard: OpenStreetMap (free, no key required)
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  // Satellite: ESRI World Imagery — same source used across all app maps
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const ATTRIBUTION = {
  standard: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  satellite: 'Tiles © Esri',
};

function buildMapHtml(lat: number, lng: number, zoom: number, initialMapType: PickerMapType): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0D1B2A; }
    .leaflet-control-attribution { font-size: 8px; opacity: 0.5; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var INIT_TYPE = '${initialMapType}';
    var TILES = {
      standard:  '${TILES.standard}',
      satellite: '${TILES.satellite}'
    };
    var ATTR = {
      standard:  '${ATTRIBUTION.standard}',
      satellite: '${ATTRIBUTION.satellite}'
    };

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${lat}, ${lng}], ${zoom});

    var currentLayer = L.tileLayer(TILES[INIT_TYPE], {
      maxZoom: 19,
      subdomains: INIT_TYPE === 'standard' ? 'abc' : '',
      attribution: ATTR[INIT_TYPE]
    }).addTo(map);

    /* Switch tile layer from React Native without reloading */
    window.switchLayer = function(type) {
      if (!TILES[type]) return;
      if (currentLayer) {
        map.removeLayer(currentLayer);
      }
      currentLayer = L.tileLayer(TILES[type], {
        maxZoom: 19,
        subdomains: type === 'standard' ? 'abc' : '',
        attribution: ATTR[type] || ''
      }).addTo(map);
    };

    /* Notify React Native when map center changes */
    map.on('moveend', function() {
      var c = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_CHANGED',
          lat: c.lat,
          lng: c.lng
        }));
      }
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },

  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  /* Precision Brand Reticle — Clean & Transparent */
  targetRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F4622B',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  targetCenterPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F4622B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  reticleLine: {
    position: 'absolute',
    backgroundColor: '#F4622B',
  },
  reticleTop: {
    top: -5,
    width: 1.5,
    height: 4,
  },
  reticleBottom: {
    bottom: -5,
    width: 1.5,
    height: 4,
  },
  reticleLeft: {
    left: -5,
    width: 4,
    height: 1.5,
  },
  reticleRight: {
    right: -5,
    width: 4,
    height: 1.5,
  },
});
