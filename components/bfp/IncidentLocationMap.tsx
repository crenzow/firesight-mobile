import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapType = 'road' | 'satellite' | 'hybrid';

export interface GPSUpdate {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null; // m/s from expo-location
  accuracy?: number | null;
}

interface IncidentLocationMapProps {
  latitude: number;
  longitude: number;
  originLat?: number | null;
  originLng?: number | null;
  originLabel?: string;
  mapType?: MapType;
  markerColor?: string;
  /** True = 55° tilt nav view that follows real GPS via currentGPS */
  isNavigating?: boolean;
  /** Live GPS position injected without reloading the WebView */
  currentGPS?: GPSUpdate | null;
  onNavigationComplete?: () => void;
  /** @deprecated use originLat/originLng */
  userLocation?: { latitude: number; longitude: number } | null;
}

const TILE_CONFIGS: Record<MapType, { tiles: string[]; overlay: string | null }> = {
  road: {
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    overlay: null,
  },
  satellite: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    overlay: null,
  },
  hybrid: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    overlay: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
  },
};

export const IncidentLocationMap: React.FC<IncidentLocationMapProps> = ({
  latitude,
  longitude,
  originLat,
  originLng,
  originLabel = 'Origin',
  mapType = 'road',
  markerColor = '#F4622B',
  isNavigating = false,
  currentGPS,
  onNavigationComplete,
  userLocation,
}) => {
  const webViewRef = useRef<any>(null);

  const oLat = originLat ?? userLocation?.latitude ?? null;
  const oLng = originLng ?? userLocation?.longitude ?? null;
  const hasRoute = oLat != null && oLng != null;
  const cfg = TILE_CONFIGS[mapType];
  const tilesJson = JSON.stringify(cfg.tiles);
  const overlayJson = cfg.overlay ? `'${cfg.overlay}'` : 'null';
  const isSatellite = mapType === 'satellite' || mapType === 'hybrid';
  const mapBgColor = isSatellite ? '#080E28' : '#F2EFE9';

  /**
   * Inject GPS position into the live WebView WITHOUT reloading HTML.
   * This is the core of real-time navigation — the map doesn't reload,
   * it just receives position updates as injected JS calls.
   */
  useEffect(() => {
    if (!currentGPS || !isNavigating || !webViewRef.current) return;
    const { latitude: lat, longitude: lng } = currentGPS;
    // expo-location gives speed in m/s; protect against negative values and convert to km/h
    // Apply industry-standard GPS noise deadband (2.5 km/h or ~0.7 m/s) to eliminate stationary jitter
    const rawSpeed = currentGPS.speed && currentGPS.speed > 0.7 ? currentGPS.speed : 0;
    const kmh = rawSpeed * 3.6;
    const speedKmh = kmh < 2.5 ? 0 : Math.round(kmh);
    const headingDeg = Math.round(currentGPS.heading ?? 0);
    webViewRef.current.injectJavaScript(
      `window.onGPSUpdate && window.onGPSUpdate(${lat},${lng},${headingDeg},${speedKmh},${currentGPS.accuracy ?? 999}); true;`
    );
  }, [currentGPS, isNavigating]);

  const html = useMemo(() => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#map{width:100%;height:100%;background:${mapBgColor};overflow:hidden}

  /* ── Navigation HUD ──────────────── */
  #hud{
    position:absolute;top:108px;left:16px;right:16px;z-index:200;
    display:none;flex-direction:column;gap:8px;
    pointer-events:none;
  }
  #turn-card{
    display:none; /* User requested removal */
  }
  #info-bar{
    background:#FFFFFF;
    border:1px solid rgba(0,0,0,0.08);
    border-radius:22px;padding:12px 20px;
    display:flex;justify-content:space-between;align-items:center;
    box-shadow:0 4px 20px rgba(0,0,0,0.08);
  }
  .s{display:flex;flex-direction:column}
  .sl{color:#8992A6;font-size:10px;font-weight:800;letter-spacing:0.8px;font-family:-apple-system,Helvetica,sans-serif;text-transform:uppercase}
  .sv{color:#101827;font-size:17px;font-weight:800;font-family:-apple-system,Helvetica,sans-serif;margin-top:2px}
  #speed-pill{
    background:rgba(244,98,43,0.12);border:1px solid rgba(244,98,43,0.3);
    border-radius:30px;padding:4px 14px;
    display:flex;flex-direction:column;align-items:center;
  }
  #speed-val{color:#F4622B;font-size:18px;font-weight:900;font-family:-apple-system,Helvetica,sans-serif;line-height:1.1}
  #speed-unit{color:#F4622B;font-size:8.5px;font-weight:800;letter-spacing:0.5px;font-family:-apple-system,Helvetica,sans-serif}

  /* Loading */
  #loading{
    position:absolute;top:50%;left:50%;
    transform:translate(-50%,-50%);
    background:#FFFFFF;color:#101827;
    padding:12px 20px;border-radius:50px;
    font-family:-apple-system,Helvetica,sans-serif;font-size:13px;font-weight:700;
    display:none;align-items:center;gap:8px;z-index:300;
    border:1px solid rgba(0,0,0,0.08);
    box-shadow:0 4px 16px rgba(0,0,0,0.1);
  }
  .spin{width:14px;height:14px;border:2px solid rgba(0,0,0,0.1);border-top-color:#F4622B;border-radius:50%;animation:spin 0.7s linear infinite}

  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes pulse{0%{transform:scale(1);opacity:0.5}100%{transform:scale(3);opacity:0}}
</style>
</head>
<body>
<div id="map"></div>

<!-- Real-time Navigation HUD (only when IS_NAV) -->
<div id="hud">
  <div id="turn-card">
    <div id="arrow-box"><span id="nav-arrow">↑</span></div>
    <div style="flex:1;min-width:0">
      <div id="turn-dist">—</div>
      <div id="turn-street">Waiting for GPS…</div>
    </div>
  </div>
  <div id="info-bar">
    <div class="s">
      <div class="sl">Remaining</div>
      <div class="sv" id="stat-rem">—</div>
    </div>
    <div id="speed-pill">
      <div id="speed-val">0</div>
      <div id="speed-unit">KM/H</div>
    </div>
    <div class="s" style="text-align:right">
      <div class="sl">ETA</div>
      <div class="sv" id="stat-eta">—</div>
    </div>
  </div>
</div>

<!-- Loading route spinner -->
<div id="loading"><div class="spin"></div> Loading route…</div>

<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
/* ── Injected constants ── */
var DEST_LNG   = ${longitude};
var DEST_LAT   = ${latitude};
var ORIGIN_LNG = ${oLng ?? 0};
var ORIGIN_LAT = ${oLat ?? 0};
var HAS_ROUTE  = ${hasRoute};
var IS_NAV     = ${isNavigating};
var MCOLOR     = '${markerColor}';
var TILES      = ${tilesJson};
var OVERLAY    = ${overlayJson};
var ORIGIN_LBL = '${(originLabel ?? '').replace(/'/g, "\\'")}';

/* ── Utility ── */
function toR(d){return d*Math.PI/180;}
function getBrng(a,b){
  var f1=toR(a[1]),f2=toR(b[1]),dl=toR(b[0]-a[0]);
  var y=Math.sin(dl)*Math.cos(f2);
  var x=Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dl);
  return(Math.atan2(y,x)*180/Math.PI+360)%360;
}
function getDist(a,b){
  var R=6371000,df=toR(b[1]-a[1]),dl=toR(b[0]-a[0]);
  var s=Math.sin(df/2)*Math.sin(df/2)+Math.cos(toR(a[1]))*Math.cos(toR(b[1]))*Math.sin(dl/2)*Math.sin(dl/2);
  return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
}
function fmtD(m){return m<1000?Math.round(m)+' m':(m/1000).toFixed(1)+' km';}
function fmtT(s){var m=Math.ceil(s/60);return m<1?'<1 min':m+' min';}
function getArrow(type,mod){
  if(!type||type==='depart'||type==='new name'||type==='continue')return '↑';
  if(type==='arrive')return '🏁';
  if(type==='roundabout'||type==='rotary')return '⟳';
  var m=mod||'';
  if(m==='left')return '◀';
  if(m==='right')return '▶';
  if(m==='sharp left')return '↰';
  if(m==='sharp right')return '↱';
  if(m==='slight left')return '↖';
  if(m==='slight right')return '↗';
  if(m==='uturn')return '↺';
  return '↑';
}

/* ── Map setup ── */
var styleSpec={
  version:8,
  sources:{
    base:{
      type:'raster',
      tiles:TILES,
      tileSize:256,
      maxzoom:${isSatellite ? 17 : 19},
      attribution:'Map data'
    }
  },
  layers:[{
    id:'base',
    type:'raster',
    source:'base',
    paint:{
      'raster-fade-duration':0
    }
  }]
};
if(OVERLAY){
  styleSpec.sources.ovl={
    type:'raster',
    tiles:[OVERLAY],
    tileSize:256,
    maxzoom:19
  };
  styleSpec.layers.push({
    id:'ovl',
    type:'raster',
    source:'ovl',
    paint:{
      'raster-opacity':0.78,
      'raster-fade-duration':0
    }
  });
}

var map=new maplibregl.Map({
  container:'map',
  style:styleSpec,
  center:(IS_NAV && HAS_ROUTE) ? [ORIGIN_LNG, ORIGIN_LAT] : [DEST_LNG, DEST_LAT],
  zoom: IS_NAV ? 16 : (HAS_ROUTE ? 13 : 15),
  pitch: 0,
  bearing:0,
  attributionControl:false,
  antialias:true,
  maxTileCacheSize:60,
  maxTileCacheZoomLevels:4
});

/* ── State ── */
var routeCoords=[];    // Full route: [[lng,lat],…]
var navSteps=[];       // OSRM step objects
var cumDistEnd=[];     // Cumulative distance from each coord to end (m)
var stepBounds=[];     // {start:coordIdx, stepIdx} for each step
var lastSnapIdx=0;
var lastSnapDist=0;
var hasJoinedRoad=false;
var gpsMarkerEl=null;
var gpsMarker=null;
var gpsReceived=false;
var lastGps=null;
var MIN_MOVE_METERS=2;
var totalDist=0, totalDur=0;
var offRoadDistEnd=0;
var originConnectorCoords=null;
var destConnectorCoords=null;
var isUserPanning=false;
var userPanTimer=null;

/* ── Markers ── */
function mkOriginMarker(){
  var isStation = ORIGIN_LBL.toLowerCase().indexOf('station') !== -1;
  var el=document.createElement('div');
  if(isStation){
    el.innerHTML='<div style="width:40px;height:40px;border-radius:12px;background:#0F1C3F;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,0.5)">🚒</div>';
  }else{
    el.innerHTML=
      '<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;pointer-events:none">'+
        '<div style="position:absolute;width:40px;height:40px;border-radius:50%;background:#3B82F6;opacity:0.25;animation:pulse 2s ease-out infinite"></div>'+
        '<div style="position:relative;z-index:2;width:24px;height:24px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 3px 12px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center">'+
          '<div style="width:7px;height:7px;border-radius:50%;background:#fff"></div>'+
        '</div>'+
      '</div>';
  }
  new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([ORIGIN_LNG,ORIGIN_LAT]).addTo(map);
}
function mkIncident(){
  var el=document.createElement('div');
  el.style.cssText='position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center';
  el.innerHTML=
    '<div style="position:absolute;width:56px;height:56px;border-radius:50%;background:'+MCOLOR+';opacity:0.22;animation:pulse 2s ease-out infinite"></div>'+
    '<div style="position:absolute;width:38px;height:38px;border-radius:50%;background:'+MCOLOR+';opacity:0.14;animation:pulse 2s ease-out 0.55s infinite"></div>'+
    '<div style="position:relative;z-index:2;width:44px;height:44px;border-radius:14px;background:'+MCOLOR+';border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 18px rgba(0,0,0,0.5)">🔥</div>';
  new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([DEST_LNG,DEST_LAT]).addTo(map);
}
function mkGPSArrow(initLng,initLat){
  gpsMarkerEl=document.createElement('div');
  // NOTE: Never put CSS transition:transform on the root marker element in MapLibre!
  // Doing so causes dragging/panning to lag, float, and bounce instead of sticking to the map.
  gpsMarkerEl.style.cssText='position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;pointer-events:none';
  gpsMarkerEl.innerHTML=
    '<div style="position:absolute;width:46px;height:46px;border-radius:50%;background:#3B82F6;opacity:0.22;animation:pulse 2s ease-out infinite"></div>'+
    '<div id="gps-arrow-icon" style="position:relative;z-index:2;width:30px;height:30px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 3px 14px rgba(37,99,235,0.6);display:flex;align-items:center;justify-content:center;transition:transform 0.2s linear">'+
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M12 2L3 21l9-4 9 4L12 2z"/></svg>'+
    '</div>';
  gpsMarker=new maplibregl.Marker({element:gpsMarkerEl,anchor:'center'})
    .setLngLat([initLng,initLat])
    .addTo(map);
}

/* ── Smooth Tangent Arc for Off-Road Connectors ── */
function makeTangentArc(pRoad, pPrev, pTarget, isRoadEnd){
  var dLng = pRoad[0] - pPrev[0];
  var dLat = pRoad[1] - pPrev[1];
  var len = Math.sqrt(dLng*dLng + dLat*dLat);
  if(len === 0) return [pRoad, pTarget];

  // Tangent direction: exiting the road or entering the road
  var dir = isRoadEnd ? [dLng/len, dLat/len] : [-dLng/len, -dLat/len];

  var tLng = pTarget[0] - pRoad[0];
  var tLat = pTarget[1] - pRoad[1];
  var tDist = Math.sqrt(tLng*tLng + tLat*tLat);
  if(tDist === 0) return [pRoad];

  // Dot product to project tangent smoothly
  var dot = (dir[0]*tLng + dir[1]*tLat) / tDist;
  var ext = tDist * (dot > 0 ? 0.42 : 0.22);
  var ctrl = [pRoad[0] + dir[0]*ext, pRoad[1] + dir[1]*ext];

  // High-resolution curved vector line (adapts dynamically as user zooms)
  var pts = [];
  var steps = 24;
  for(var s=0; s<=steps; s++){
    var t = s / steps;
    var inv = 1 - t;
    var x = inv*inv*pRoad[0] + 2*inv*t*ctrl[0] + t*t*pTarget[0];
    var y = inv*inv*pRoad[1] + 2*inv*t*ctrl[1] + t*t*pTarget[1];
    pts.push([x, y]);
  }
  return pts;
}

/* ── Refresh Dotted Connectors GeoJSON Source ── */
function refreshConnectorsSource(){
  var features = [];
  var junctions = [];

  if(originConnectorCoords && originConnectorCoords.length > 0){
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: originConnectorCoords }
    });
    if(routeCoords.length > 0) junctions.push(routeCoords[0]);
  }

  if(destConnectorCoords && destConnectorCoords.length > 0){
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: destConnectorCoords }
    });
    if(routeCoords.length > 0) junctions.push(routeCoords[routeCoords.length - 1]);
  }

  if(map.getSource('route-connectors')){
    map.getSource('route-connectors').setData({
      type: 'FeatureCollection',
      features: features
    });
  }

  if(map.getSource('route-junctions')){
    map.getSource('route-junctions').setData({
      type: 'FeatureCollection',
      features: junctions.map(function(pt){
        return { type: 'Feature', geometry: { type: 'Point', coordinates: pt } };
      })
    });
  }
}

/* ── Keep origin dotted connector line locked to live location ── */
function updateOriginConnector(liveLng, liveLat, snapIdx, snapDist){
  if(routeCoords.length === 0) return;

  // Once vehicle has joined the road network or advanced along the route, never show origin connector
  if(hasJoinedRoad || (snapIdx != null && snapIdx > 0) || (snapDist != null && snapDist <= 8)){
    hasJoinedRoad = true;
    if(originConnectorCoords !== null){
      originConnectorCoords = null;
      refreshConnectorsSource();
    }
    return;
  }

  var startRoad = routeCoords[0];
  var startDist = getDist([liveLng, liveLat], startRoad);
  if(startDist > 8){
    var prevStart = routeCoords[1] || startRoad;
    var arcOrigin = makeTangentArc(startRoad, prevStart, [liveLng, liveLat], false);
    arcOrigin.reverse();
    originConnectorCoords = arcOrigin;
  } else {
    // When vehicle drives onto the road (within 8m), remove the off-road dotted trail permanently
    hasJoinedRoad = true;
    originConnectorCoords = null;
  }
  refreshConnectorsSource();
}

/* ── Dotted Off-Road Connectors (Google Maps style) ── */
function drawConnectors(curLng, curLat){
  if(routeCoords.length === 0) return;
  var startRoad = routeCoords[0];
  var endRoad = routeCoords[routeCoords.length - 1];

  var liveLng = curLng != null ? curLng : (lastGps ? lastGps.lng : ORIGIN_LNG);
  var liveLat = curLat != null ? curLat : (lastGps ? lastGps.lat : ORIGIN_LAT);
  var startPt = [liveLng, liveLat];
  var destPt = [DEST_LNG, DEST_LAT];

  var startDist = getDist(startPt, startRoad);
  var endDist = getDist(endRoad, destPt);

  // 1. Origin to Road Start connector
  // If the user is already on the road (<= 8m), hide origin dots
  if(startDist > 8){
    hasJoinedRoad = false;
    var prevStart = routeCoords[1] || startRoad;
    var arcOrigin = makeTangentArc(startRoad, prevStart, startPt, false);
    arcOrigin.reverse();
    originConnectorCoords = arcOrigin;
  } else {
    hasJoinedRoad = true;
    originConnectorCoords = null;
  }

  // 2. Road End to Destination Pin connector
  // If the incident pin is already on the road (<= 8m), hide destination dots
  if(endDist > 8){
    offRoadDistEnd = endDist;
    var prevEnd = routeCoords[routeCoords.length - 2] || endRoad;
    var arcDest = makeTangentArc(endRoad, prevEnd, destPt, true);
    destConnectorCoords = arcDest;
  } else {
    destConnectorCoords = null;
  }

  if(!map.getSource('route-connectors')){
    map.addSource('route-connectors', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // 1. Outer casing: mathematically synchronized period to produce a crisp 1px white border
    map.addLayer({
      id: 'rc-casing',
      type: 'line',
      source: 'route-connectors',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 6.5,
        'line-dasharray': [0.01, 1.52],
        'line-opacity': 0.95
      }
    });

    // 2. Core slate dots: identical period ensures perfect concentric circles without drifting
    map.addLayer({
      id: 'rc-dots',
      type: 'line',
      source: 'route-connectors',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#475569',
        'line-width': 4.5,
        'line-dasharray': [0.01, 2.2],
        'line-opacity': 1.0
      }
    });
  }

  // Transition junction circle at the end of the solid road line
  if(!map.getSource('route-junctions')){
    map.addSource('route-junctions', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'rj-circle',
      type: 'circle',
      source: 'route-junctions',
      paint: {
        'circle-radius': 5,
        'circle-color': '#FFFFFF',
        'circle-stroke-color': '#475569',
        'circle-stroke-width': 2
      }
    });
  }

  refreshConnectorsSource();
}

/* ── Fallback Direct Dotted Route (when no drivable roads exist) ── */
function drawDirectFallbackRoute(){
  var directCoords = [[ORIGIN_LNG, ORIGIN_LAT], [DEST_LNG, DEST_LAT]];
  map.addSource('route-direct', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: directCoords }
    }
  });

  map.addLayer({
    id: 'rd-casing',
    type: 'line',
    source: 'route-direct',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 6.5,
      'line-dasharray': [0.01, 1.52],
      'line-opacity': 0.95
    }
  });

  map.addLayer({
    id: 'rd-dots',
    type: 'line',
    source: 'route-direct',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#475569',
      'line-width': 4.5,
      'line-dasharray': [0.01, 2.2],
      'line-opacity': 1.0
    }
  });
  fitRoute(directCoords);
}

/* ── Route drawing ── */
function drawRoute(geom){
  /* Full route (greyed while driving) */
  map.addSource('route-full',{type:'geojson',data:geom});
  map.addLayer({id:'rf-shadow',type:'line',source:'route-full',
    layout:{'line-join':'round','line-cap':'round'},
    paint:{'line-color':'#000','line-width':12,'line-opacity':0.12}});
  map.addLayer({id:'rf-out',type:'line',source:'route-full',
    layout:{'line-join':'round','line-cap':'round'},
    paint:{'line-color':'#fff','line-width':9,'line-opacity':IS_NAV?0.25:0.9}});
  map.addLayer({id:'rf-core',type:'line',source:'route-full',
    layout:{'line-join':'round','line-cap':'round'},
    paint:{'line-color':MCOLOR,'line-width':5,'line-opacity':IS_NAV?0.2:1}});

  /* Remaining route (full color — grows shorter as you drive) */
  if(IS_NAV){
    map.addSource('route-rem',{type:'geojson',data:geom});
    map.addLayer({id:'rr-out',type:'line',source:'route-rem',
      layout:{'line-join':'round','line-cap':'round'},
      paint:{'line-color':'#fff','line-width':9,'line-opacity':0.9}});
    map.addLayer({id:'rr-core',type:'line',source:'route-rem',
      layout:{'line-join':'round','line-cap':'round'},
      paint:{'line-color':MCOLOR,'line-width':5.5,'line-opacity':1}});
  }
}
function fitRoute(coords){
  var b=new maplibregl.LngLatBounds();
  coords.forEach(function(c){b.extend(c);});
  b.extend([ORIGIN_LNG,ORIGIN_LAT]);
  b.extend([DEST_LNG,DEST_LAT]);
  map.fitBounds(b,{padding:{top:80,bottom:120,left:50,right:50},duration:1200});
}

/* ── Precompute cumulative distances ── */
function buildCumDist(coords){
  var n=coords.length;
  cumDistEnd=new Array(n);
  cumDistEnd[n-1]=0;
  for(var i=n-2;i>=0;i--){
    cumDistEnd[i]=cumDistEnd[i+1]+getDist(coords[i],coords[i+1]);
  }
  totalDist=cumDistEnd[0]||0;
}

/* ── Precompute step boundaries ── */
function buildStepBounds(steps){
  var ci=0;
  steps.forEach(function(step,si){
    stepBounds.push({start:ci,stepIdx:si});
    ci+=Math.max(1,step.geometry.coordinates.length-1);
  });
}
function getStepIdx(coordIdx){
  for(var i=stepBounds.length-1;i>=0;i--){
    if(coordIdx>=stepBounds[i].start)return stepBounds[i].stepIdx;
  }
  return 0;
}

/* ── Route snapping (forward-biased, O(window) not O(n)) ── */
function snapToRoute(lng,lat){
  var lo=Math.max(0,lastSnapIdx-6);
  var hi=Math.min(routeCoords.length-1,lastSnapIdx+60);
  var bestD=Infinity,bestI=lastSnapIdx;
  for(var i=lo;i<=hi;i++){
    var d=getDist([lng,lat],routeCoords[i]);
    if(d<bestD){bestD=d;bestI=i;}
  }
  // If GPS jumped or vehicle deviated (>45m), search full route to cleanly re-acquire
  if(bestD>45 && routeCoords.length>0){
    for(var j=0;j<routeCoords.length;j++){
      var dj=getDist([lng,lat],routeCoords[j]);
      if(dj<bestD){bestD=dj;bestI=j;}
    }
  }
  lastSnapIdx=bestI;
  lastSnapDist=bestD;
  return bestI;
}

/* ── HUD update ── */
function hudUpdate(snapIdx,speedKmh){
  var si=getStepIdx(snapIdx);
  var step=navSteps[si];
  var next=navSteps[si+1];
  var remDist=(cumDistEnd[snapIdx]||0) + offRoadDistEnd;
  var progress=Math.max(0, Math.min(1, 1-(remDist/(totalDist||1))));
  var remDur=Math.max(0, totalDur*(1-progress));

  var ar=next?getArrow(next.maneuver.type,next.maneuver.modifier):'🏁';
  var street=next?(next.name||'Continue forward'):'You have arrived!';
  var toNext=step?fmtD(step.distance*(1-((snapIdx-stepBounds[si].start)/Math.max(1,step.geometry.coordinates.length-1)))):'';

  document.getElementById('nav-arrow').textContent=ar;
  document.getElementById('turn-dist').textContent=toNext||'Arriving…';
  document.getElementById('turn-street').textContent=street;
  document.getElementById('stat-rem').textContent=fmtD(remDist);
  document.getElementById('stat-eta').textContent=fmtT(remDur);
  var safeSpeed = (speedKmh && speedKmh >= 2.5) ? Math.round(speedKmh) : 0;
  document.getElementById('speed-val').textContent=String(safeSpeed);

  if(remDist<15){
    setTimeout(function(){
      if(window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'navComplete'}));
    },1500);
  }
}

/* ── OSRM fetch ── */
async function fetchRoute(){
  var cacheKey='osrm_'+ORIGIN_LNG.toFixed(4)+'_'+ORIGIN_LAT.toFixed(4)+'_'+DEST_LNG.toFixed(4)+'_'+DEST_LAT.toFixed(4);
  try{
    var cached=sessionStorage.getItem(cacheKey);
    if(cached){
      var parsed=JSON.parse(cached);
      if(parsed && parsed.geometry)return parsed;
    }
  }catch(_){}

  document.getElementById('loading').style.display='flex';
  try{
    var url='https://router.project-osrm.org/route/v1/driving/'
      +ORIGIN_LNG+','+ORIGIN_LAT+';'
      +DEST_LNG+','+DEST_LAT
      +'?overview=full&geometries=geojson&steps=true';
    var r=await fetch(url);
    var d=await r.json();
    if(d.code!=='Ok')throw new Error('no route');
    try{
      sessionStorage.setItem(cacheKey,JSON.stringify(d.routes[0]));
    }catch(_){}
    return d.routes[0];
  }catch(e){
    document.getElementById('loading').textContent='Route unavailable';
    setTimeout(function(){document.getElementById('loading').style.display='none';},2000);
    return null;
  }finally{
    document.getElementById('loading').style.display='none';
  }
}

/* ─────────────────────────────────────────────────
   window.onGPSUpdate — called by React Native via
   injectJavaScript every time expo-location fires.
   This is the ONLY thing that moves the camera.
   ───────────────────────────────────────────────── */
window.onGPSUpdate=function(lat,lng,heading,speedKmh,accuracy){
  if(!IS_NAV)return;

  if(!isFinite(accuracy)||accuracy>65)return;

  /* Always update live speed display immediately */
  var safeSpeed = (speedKmh && speedKmh >= 2.5) ? Math.round(speedKmh) : 0;
  var spdEl=document.getElementById('speed-val');
  if(spdEl)spdEl.textContent=String(safeSpeed);

  /* Always update vehicle heading rotation immediately */
  if(heading!=null && heading!==0){
    var arrowIcon=document.getElementById('gps-arrow-icon');
    if(arrowIcon)arrowIcon.style.transform='rotate('+heading+'deg)';
  }

  /* First update */
  if(!gpsReceived){
    gpsReceived=true;
  }

  /* Move the blue GPS arrow without any floating or bouncing */
  if(gpsMarker)gpsMarker.setLngLat([lng,lat]);
  lastGps={lng:lng,lat:lat};

  /* Snap position to nearest route coordinate */
  if(routeCoords.length>0){
    var si=snapToRoute(lng,lat);

    /* Dynamically update the origin dotted connector: permanently hides once on the road */
    updateOriginConnector(lng,lat,si,lastSnapDist);

    /* Trim remaining route so the line shrinks as you drive */
    if(map.getSource('route-rem')){
      map.getSource('route-rem').setData({
        type:'LineString',
        coordinates:routeCoords.slice(si)
      });
    }

    /* Update HUD with real data */
    hudUpdate(si,speedKmh);
  }

  /* Smoothly track camera if user is not currently panning */
  if(!isUserPanning){
    map.easeTo({
      center:[lng,lat],
      duration:800,
      easing:function(t){return t;}
    });
  }
};

/* ── Main ── */
map.on('load',async function(){
  mkIncident();

  /* Listen for user pan gestures to pause/resume auto-camera tracking */
  map.on('dragstart',function(){
    isUserPanning=true;
    if(userPanTimer)clearTimeout(userPanTimer);
  });
  map.on('dragend',function(){
    if(userPanTimer)clearTimeout(userPanTimer);
    userPanTimer=setTimeout(function(){
      isUserPanning=false;
    },4000);
  });

  if(HAS_ROUTE){
    if(!IS_NAV){
      mkOriginMarker();
    }
    var route=await fetchRoute();
    if(route){
      routeCoords=route.geometry.coordinates;
      navSteps=route.legs[0].steps;
      buildCumDist(routeCoords);
      buildStepBounds(navSteps);
      drawRoute(route.geometry);
      drawConnectors();
      totalDist=route.distance + offRoadDistEnd;
      totalDur=route.duration;

      if(IS_NAV){
        /* Show HUD, GPS arrow at origin */
        document.getElementById('hud').style.display='flex';
        mkGPSArrow(ORIGIN_LNG,ORIGIN_LAT);
        /* Keep the initial camera fixed at the route origin. */
        map.jumpTo({center:[ORIGIN_LNG,ORIGIN_LAT],zoom:16,pitch:0,bearing:0});
        /* Populate HUD with full-route info while waiting */
        document.getElementById('stat-rem').textContent=fmtD(totalDist);
        document.getElementById('stat-eta').textContent=fmtT(totalDur);
      }else{
        fitRoute(routeCoords);
      }
    }else{
      drawDirectFallbackRoute();
    }
  }
});
</script>
</body>
</html>`,
    [latitude, longitude, oLat, oLng, mapType, markerColor, isNavigating, hasRoute, originLabel]
  );

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'navComplete') onNavigationComplete?.();
    } catch (_) {}
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      originWhitelist={['*']}
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
};

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: 'transparent' },
});