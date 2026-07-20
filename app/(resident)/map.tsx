import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Locate, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { LeafletMapView } from '../../components/map/LeafletMapView';
import { MapModeToggle } from '../../components/map/MapModeToggle';
import { RiskLegend } from '../../components/map/RiskLegend';
import { mapService } from '../../services/api/mapService';
import { BarangayRiskFeature, IncidentMarker } from '../../services/api/models';
import { useLocation } from '../../hooks/useLocation';
import { APP_CONFIG } from '../../constants/config';

// Lian, Batangas municipal centroid — used as the map's default center/zoom
// before the resident's own location is available.
const LIAN_CENTER = { lat: 14.0392, lng: 120.6389 };

export default function MapScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { location, requestLocation } = useLocation();

  const [mode, setMode] = useState<'risk' | 'incidents'>('risk');
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapKey, setMapKey] = useState(0); // bump to force WebView re-center on "locate me"

  useEffect(() => {
    Promise.allSettled([mapService.getBarangayRisk(), mapService.getIncidents()]).then(([riskResult, incidentResult]) => {
      if (riskResult.status === 'fulfilled') setBarangays(riskResult.value);
      if (incidentResult.status === 'fulfilled') setIncidents(incidentResult.value);
      setIsLoading(false);
    });
  }, []);

  const handleLocateMe = async () => {
    await requestLocation();
    setMapKey((k) => k + 1);
  };

  const center = location ? { lat: location.latitude, lng: location.longitude } : LIAN_CENTER;

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNavy }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.brandNavy }}>
        <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textInverse, fontSize: typography.size.md, fontWeight: '800' }}>
              FIRESIGHT MAP
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>
              {APP_CONFIG.DEFAULT_MUNICIPALITY}, {APP_CONFIG.DEFAULT_PROVINCE} · Live data
            </Text>
          </View>
          <Pressable style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <SlidersHorizontal size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md }}>
          <MapModeToggle mode={mode} onChange={setMode} />
        </View>
      </SafeAreaView>

      <View style={[styles.mapContainer, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brandOrange} />
          </View>
        ) : (
          <LeafletMapView
            key={mapKey}
            mode={mode}
            barangays={barangays}
            incidents={incidents}
            userLocation={location}
            centerLat={center.lat}
            centerLng={center.lng}
          />
        )}

        {mode === 'risk' ? <RiskLegend /> : null}

        <View style={[styles.controlsColumn, { top: spacing.lg }]}>
          <Pressable
            onPress={handleLocateMe}
            style={[styles.controlButton, { backgroundColor: colors.surface, borderRadius: radius.md }, shadow.card]}
          >
            <Locate size={18} color={colors.brandNavy} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapContainer: { flex: 1, position: 'relative' },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controlsColumn: { position: 'absolute', right: 16, gap: 10 },
  controlButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});