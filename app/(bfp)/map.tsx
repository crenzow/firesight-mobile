import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Filter } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { LeafletMapView } from '../../components/map/LeafletMapView';
import { MapTypeSelector, MapType } from '../../components/map/MapTypeSelector';
import { RiskLegend } from '../../components/map/RiskLegend';
import { SegmentedControl } from '../../components/glass/SegmentedControl';
import { MapFilterModal } from '../../components/map/MapFilterModal';
import { mapService } from '../../services/api/mapService';
import { BFPIncidentMarker, BarangayRiskFeature, RiskLevel } from '../../services/api/models';

const firesightLogo = require('../../assets/images/firesight-logo.png');
const LIAN_CENTER = { lat: 14.0065, lng: 120.6425 };

export default function BFPMapScreen() {
  const { colors, spacing, typography } = useTheme();
  const [mode, setMode] = useState<'risk' | 'incidents'>('risk');
  const [mapType, setMapType] = useState<MapType>('standard');
  const [incidents, setIncidents] = useState<BFPIncidentMarker[]>([]);
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      mapService.getBarangayRisk(),
      mapService.getBFPIncidents(),
    ]).then(([riskResult, incidentResult]) => {
      if (riskResult.status === 'fulfilled') setBarangays(riskResult.value);
      if (incidentResult.status === 'fulfilled') setIncidents(incidentResult.value);
      setIsLoading(false);
    });
  }, []);

  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      return selectedRisk === 'all' || b.risk_level === selectedRisk;
    });
  }, [barangays, selectedRisk]);

  const isFilterActive = selectedRisk !== 'all';

  return (
    <View style={{ flex: 1, backgroundColor: '#0F1C3F' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0F1C3F' }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
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

          {/* Filter Button (Only show in risk mode) */}
          {mode === 'risk' && (
            <Pressable
              onPress={() => setIsFilterModalOpen(true)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isFilterActive ? colors.brandOrange : 'rgba(255,255,255,0.12)',
                  borderColor: isFilterActive ? colors.brandOrange : 'rgba(255,255,255,0.2)',
                },
              ]}
            >
              <Filter size={15} color="#FFFFFF" />
              <Text style={styles.filterButtonText}>Filter</Text>
              {isFilterActive && <View style={styles.activeDot} />}
            </Pressable>
          )}
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

      </SafeAreaView>

      <View style={styles.mapContainer}>
        {!isLoading ? (
          <LeafletMapView
            key={`${mode}-${selectedRisk}`}
            mode={mode}
            mapType={mapType}
            barangays={filteredBarangays}
            incidents={incidents}
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
            <Text style={styles.legendText}>{incidents.length} incident{incidents.length === 1 ? '' : 's'}</Text>
          </View>
        )}

        <View style={[styles.controlsColumn, { top: spacing.xxl }]}>
          <MapTypeSelector mapType={mapType} onChange={setMapType} />
        </View>
      </View>

      <MapFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedRisk={selectedRisk}
        onSelectRisk={setSelectedRisk}
        onReset={() => setSelectedRisk('all')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1, position: 'relative' },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    position: 'relative',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F4622B',
  },
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