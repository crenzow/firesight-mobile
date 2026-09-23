import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapType = 'road' | 'satellite' | 'hybrid';

export interface GPSUpdate {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null; // m/s from expo-location
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

  /**
   * Inject GPS position into the live WebView WITHOUT reloading HTML.
   * This is the core of real-time navigation — the map doesn't reload,
   * it just receives position updates as injected JS calls.
   */
  useEffect(() => {
    if (!currentGPS || !isNavigating || !webViewRef.current) return;
    const { latitude: lat, longitude: lng } = currentGPS;
    const heading = currentGPS.heading ?? 0;
    // expo-location gives speed in m/s; convert to km/h for display
    const speedKmh = Math.round((currentGPS.speed ?? 0) * 3.6);
    webViewRef.current.injectJavaScript(
      `window.onGPSUpdate && window.onGPSUpdate(${lat},${lng},${heading},${speedKmh}); true;`
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
  html,body,#map{width:100%;height:100%;background:#080E28;overflow:hidden}

  /* ── Navigation HUD ──────────────── */
  #hud{
    position:absolute;top:100px;left:0;right:0;z-index:200;
    display:none;flex-direction:column;gap:8px;padding:10px;
    pointer-events:none;
  }
  #turn-card{
    display:none; /* User requested removal */
    background:rgba(8,14,40,0.93);
    border:1px solid rgba(255,255,255,0.12);
    border-radius:18px;padding:12px 14px;
    align-items:center;gap:12px;
    -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);
    box-shadow:0 8px 32px rgba(0,0,0,0.55);
  }
  #arrow-box{
    width:58px;height:58px;border-radius:16px;flex-shrink:0;
    background:linear-gradient(135deg,#F4622B,#c93c16);
    display:flex;align-items:center;justify-content:center;
    font-size:30px;
    box-shadow:0 4px 18px rgba(244,98,43,0.45);
  }
  #turn-dist{color:#fff;font-size:23px;font-weight:800;font-family:-apple-system,Helvetica,sans-serif;line-height:1}
  #turn-street{
    color:rgba(255,255,255,0.55);font-size:12px;margin-top:4px;
    font-family:-apple-system,Helvetica,sans-serif;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;
  }
  #info-bar{
    background:rgba(8,14,40,0.88);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:13px;padding:10px 14px;
    display:flex;justify-content:space-between;align-items:center;
    -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
    box-shadow:0 4px 16px rgba(0,0,0,0.35);
  }
  .s{display:flex;flex-direction:column}
  .sl{color:rgba(255,255,255,0.4);font-size:9px;font-weight:700;letter-spacing:0.8px;font-family:-apple-system,Helvetica,sans-serif;text-transform:uppercase}
  .sv{color:#fff;font-size:16px;font-weight:800;font-family:-apple-system,Helvetica,sans-serif;margin-top:2px}
  #speed-pill{
    background:rgba(244,98,43,0.18);border:1px solid rgba(244,98,43,0.38);
    border-radius:30px;padding:4px 14px;
    display:flex;flex-direction:column;align-items:center;
  }
  #speed-val{color:#F4622B;font-size:18px;font-weight:900;font-family:-apple-system,Helvetica,sans-serif}
  #speed-unit{color:rgba(244,98,43,0.65);font-size:8px;font-weight:700;letter-spacing:0.5px;font-family:-apple-system,Helvetica,sans-serif}

  /* GPS signal waiting */
  #gps-wait{
    position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
    background:rgba(8,14,40,0.9);color:rgba(255,255,255,0.8);
    padding:8px 16px;border-radius:50px;
    font-family:-apple-system,Helvetica,sans-serif;font-size:12px;font-weight:600;
    display:none;align-items:center;gap:6px;z-index:300;
    border:1px solid rgba(255,255,255,0.1);
  }
  .pulse-dot{
    width:8px;height:8px;border-radius:50%;background:#3B82F6;
    animation:blink 1.2s ease-in-out infinite;
  }

  /* Loading */
  #loading{
    position:absolute;top:50%;left:50%;
    transform:translate(-50%,-50%);
    background:rgba(8,14,40,0.92);color:#fff;
    padding:12px 20px;border-radius:50px;
    font-family:-apple-system,Helvetica,sans-serif;font-size:13px;font-weight:600;
    display:none;align-items:center;gap:8px;z-index:300;
    border:1px solid rgba(255,255,255,0.1);
  }
  .spin{width:14px;height:14px;border:2px solid rgba(255,255,255,0.15);border-top-color:#F4622B;border-radius:50%;animation:spin 0.7s linear infinite}

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

<!-- GPS Acquiring indicator (nav mode only) -->
<div id="gps-wait"><div class="pulse-dot"></div> Acquiring GPS signal…</div>

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
  sources:{base:{type:'raster',tiles:TILES,tileSize:256,attribution:'Map data'}},
  layers:[{id:'base',type:'raster',source:'base'}]
};
if(OVERLAY){
  styleSpec.sources.ovl={type:'raster',tiles:[OVERLAY],tileSize:256};
  styleSpec.layers.push({id:'ovl',type:'raster',source:'ovl',paint:{'raster-opacity':0.78}});
}

var map=new maplibregl.Map({
  container:'map',
  style:styleSpec,
  center:[DEST_LNG,DEST_LAT],
  zoom: IS_NAV ? 17 : (HAS_ROUTE ? 13 : 15),
  pitch: IS_NAV ? 55 : 0,
  bearing:0,
  attributionControl:false,
  antialias:true
});

/* ── State ── */
var routeCoords=[];    // Full route: [[lng,lat],…]
var navSteps=[];       // OSRM step objects
var cumDistEnd=[];     // Cumulative distance from each coord to end (m)
var stepBounds=[];     // {start:coordIdx, stepIdx} for each step
var lastSnapIdx=0;
var lastBearing=0;
var gpsMarkerEl=null;
var gpsMarker=null;
var gpsReceived=false;
var totalDist=0, totalDur=0;

/* ── Markers ── */
function mkFireStation(){
  var el=document.createElement('div');
  el.innerHTML='<div style="width:40px;height:40px;border-radius:12px;background:#0F1C3F;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,0.5)">🚒</div>';
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
  gpsMarkerEl.style.cssText='position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;transition:transform 0.5s ease';
  gpsMarkerEl.innerHTML=
    '<div style="position:absolute;width:40px;height:40px;border-radius:50%;background:#3B82F6;opacity:0.25;animation:pulse 2.5s ease-out infinite"></div>'+
    '<div style="position:relative;z-index:2;width:28px;height:28px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 3px 12px rgba(59,130,246,0.55);display:flex;align-items:center;justify-content:center">'+
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M12 2L3 21l9-4 9 4L12 2z"/></svg>'+
    '</div>';
  gpsMarker=new maplibregl.Marker({element:gpsMarkerEl,anchor:'center'})
    .setLngLat([initLng,initLat])
    .addTo(map);
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
  map.fitBounds(b,{padding:{top:60,bottom:80,left:40,right:40},duration:1200});
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
  var lo=Math.max(0,lastSnapIdx-3);
  var hi=Math.min(routeCoords.length-1,lastSnapIdx+60);
  var bestD=Infinity,bestI=lastSnapIdx;
  for(var i=lo;i<=hi;i++){
    var d=getDist([lng,lat],routeCoords[i]);
    if(d<bestD){bestD=d;bestI=i;}
  }
  lastSnapIdx=bestI;
  return bestI;
}

/* ── HUD update ── */
function hudUpdate(snapIdx,speedKmh){
  var si=getStepIdx(snapIdx);
  var step=navSteps[si];
  var next=navSteps[si+1];
  var remDist=cumDistEnd[snapIdx]||0;
  var progress=1-(remDist/(totalDist||1));
  var remDur=totalDur*(1-progress);

  var ar=next?getArrow(next.maneuver.type,next.maneuver.modifier):'🏁';
  var street=next?(next.name||'Continue forward'):'You have arrived!';
  var toNext=step?fmtD(step.distance*(1-((snapIdx-stepBounds[si].start)/Math.max(1,step.geometry.coordinates.length-1)))):'';

  document.getElementById('nav-arrow').textContent=ar;
  document.getElementById('turn-dist').textContent=toNext||'Arriving…';
  document.getElementById('turn-street').textContent=street;
  document.getElementById('stat-rem').textContent=fmtD(remDist);
  document.getElementById('stat-eta').textContent=fmtT(remDur);
  document.getElementById('speed-val').textContent=String(speedKmh||0);

  if(remDist<15){
    setTimeout(function(){
      if(window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'navComplete'}));
    },1500);
  }
}

/* ── OSRM fetch ── */
async function fetchRoute(){
  document.getElementById('loading').style.display='flex';
  try{
    var url='https://router.project-osrm.org/route/v1/driving/'
      +ORIGIN_LNG+','+ORIGIN_LAT+';'
      +DEST_LNG+','+DEST_LAT
      +'?overview=full&geometries=geojson&steps=true';
    var r=await fetch(url);
    var d=await r.json();
    if(d.code!=='Ok')throw new Error('no route');
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
window.onGPSUpdate=function(lat,lng,heading,speedKmh){
  if(!IS_NAV)return;

  /* First update: hide "waiting" indicator */
  if(!gpsReceived){
    gpsReceived=true;
    document.getElementById('gps-wait').style.display='none';
    /* Initial camera fly-in to actual GPS position */
    map.flyTo({center:[lng,lat],zoom:17.5,pitch:55,bearing:heading||0,duration:1200});
  }

  /* Move the blue GPS arrow */
  if(gpsMarker)gpsMarker.setLngLat([lng,lat]);
  if(gpsMarkerEl)gpsMarkerEl.style.transform='rotate('+heading+'deg)';

  /* Calculate smooth bearing from movement if heading unreliable */
  var br=heading||lastBearing;
  lastBearing=br;

  /* Smoothly follow GPS with 3D tilt — duration intentionally short (camera = live feed) */
  map.easeTo({
    center:[lng,lat],
    bearing:br,
    pitch:55,
    zoom:17.5,
    duration:900,
    easing:function(t){return t*(2-t);}  /* ease-out */
  });

  /* Snap position to nearest route coordinate */
  if(routeCoords.length>0){
    var si=snapToRoute(lng,lat);

    /* Trim remaining route so the blue line shrinks as you drive */
    if(map.getSource('route-rem')){
      map.getSource('route-rem').setData({
        type:'LineString',
        coordinates:routeCoords.slice(si)
      });
    }

    /* Update HUD with real data */
    hudUpdate(si,speedKmh);
  }
};

/* ── Main ── */
map.on('load',async function(){
  mkIncident();

  if(HAS_ROUTE){
    mkFireStation();
    var route=await fetchRoute();
    if(route){
      routeCoords=route.geometry.coordinates;
      navSteps=route.legs[0].steps;
      totalDist=route.distance;
      totalDur=route.duration;
      buildCumDist(routeCoords);
      buildStepBounds(navSteps);
      drawRoute(route.geometry);

      if(IS_NAV){
        /* Show HUD, GPS arrow at origin, wait for real GPS */
        document.getElementById('hud').style.display='flex';
        document.getElementById('gps-wait').style.display='flex';
        mkGPSArrow(ORIGIN_LNG,ORIGIN_LAT);
        /* Initial nav camera at origin */
        map.easeTo({center:[ORIGIN_LNG,ORIGIN_LAT],zoom:17.5,pitch:55,bearing:0,duration:1000});
        /* Populate HUD with full-route info while waiting */
        document.getElementById('stat-rem').textContent=fmtD(totalDist);
        document.getElementById('stat-eta').textContent=fmtT(totalDur);
      }else{
        fitRoute(routeCoords);
      }
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
      scrollEnabled={false}
      onMessage={handleMessage}
    />
  );
};

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: 'transparent' },
});