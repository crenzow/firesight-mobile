import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { LeafletMapView } from '../../components/map/LeafletMapView';
import { MapTypeSelector, MapType } from '../../components/map/MapTypeSelector';
import { RiskLegend } from '../../components/map/RiskLegend';
import { SegmentedControl } from '../../components/glass/SegmentedControl';
import { YearFilterRow } from '../../components/bfp/YearFilterRow';
import { mapService } from '../../services/api/mapService';
import { BFPIncidentMarker, BarangayRiskFeature } from '../../services/api/models';

const firesightLogo = require('../../assets/images/firesight-logo.png');
const LIAN_CENTER = { lat: 14.0065, lng: 120.6425 };

export default function BFPMapScreen() {
  const { colors, spacing, typography, shadow } = useTheme();
  const [mode, setMode] = useState<'risk' | 'incidents'>('risk');
  const [mapType, setMapType] = useState<MapType>('standard');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [incidents, setIncidents] = useState<BFPIncidentMarker[]>([]);
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const filters = yearFilter !== 'all' ? { year: yearFilter } : {};
    Promise.allSettled([
      mapService.getBarangayRisk(),
      mapService.getBFPIncidents(filters),
    ]).then(([riskResult, incidentResult]) => {
      if (riskResult.status === 'fulfilled') setBarangays(riskResult.value);
      if (incidentResult.status === 'fulfilled') setIncidents(incidentResult.value);
      setIsLoading(false);
    });
  }, [yearFilter]);

  // availableYears derived from loaded incidents (shown in year filter UI)
  const availableYears = useMemo(() => {
    const years = new Set(
      incidents.map((i) => {
        const timeString = i.data_time || new Date().toISOString();
        return new Date(timeString.replace(' ', 'T')).getFullYear();
      })
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [incidents]);

  // When yearFilter is 'all', server already returns all; filteredIncidents === incidents
  const filteredIncidents = incidents;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F1C3F' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0F1C3F' }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={firesightLogo} style={{ width: 34, height: 34, marginRight: 1 }} resizeMode="contain" />
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 1 }}>
              FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text><Text style={{ color: '#FFFFFF' }}> MAP</Text>
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: typography.size.xs, marginTop: 1 }}>
            Fire-prone areas · Lian, Batangas
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <SegmentedControl
            segments={[
              { key: 'risk', label: 'Risk Map' },
              { key: 'incidents', label: 'All Incidents' },
            ]}
            value={mode}
            onChange={(key) => setMode(key as 'risk' | 'incidents')}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm }}>
          <YearFilterRow years={availableYears} value={yearFilter} onChange={setYearFilter} />
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        {!isLoading ? (
          <LeafletMapView
            mode={mode}
            mapType={mapType}
            barangays={barangays}
            incidents={filteredIncidents}
            userLocation={null}
            centerLat={LIAN_CENTER.lat}
            centerLng={LIAN_CENTER.lng}
            isBFP={true}
          />
        ) : null}

        {mode === 'risk' ? (
          <RiskLegend />
        ) : (
          <View style={[styles.legendCard, { backgroundColor: 'rgba(10,15,30,0.7)' }]}>
            <MapPin size={12} color="#F4622B" />
            <Text style={styles.legendText}>{filteredIncidents.length} incident{filteredIncidents.length === 1 ? '' : 's'}</Text>
          </View>
        )}

        <View style={[styles.controlsColumn, { top: spacing.xxl }]}>
          <MapTypeSelector mapType={mapType} onChange={setMapType} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1, position: 'relative' },
  legendCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  legendText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  controlsColumn: { position: 'absolute', right: 16, gap: 10 },
  controlButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});