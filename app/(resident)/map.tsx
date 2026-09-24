import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { LeafletMapView } from '../../components/map/LeafletMapView';
import { MapTypeSelector, MapType } from '../../components/map/MapTypeSelector';
import { RiskLegend } from '../../components/map/RiskLegend';
import { MapFilterModal } from '../../components/map/MapFilterModal';
import { mapService } from '../../services/api/mapService';
import { BarangayRiskFeature, RiskLevel } from '../../services/api/models';
import { useLocation } from '../../hooks/useLocation';
import { APP_CONFIG } from '../../constants/config';

const firesightLogo = require('../../assets/images/firesight-logo.png');

// Lian, Batangas municipal centroid — used as default center
const LIAN_CENTER = { lat: 14.0065, lng: 120.6425 };

export default function MapScreen() {
  const { colors, spacing, typography } = useTheme();
  const { location } = useLocation();

  const [mapType, setMapType] = useState<MapType>('standard');
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationActive, setIsLocationActive] = useState(false);

  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');

  useEffect(() => {
    mapService.getBarangayRisk().then((data) => {
      setBarangays(data);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  // Temporarily disabled while the resident map location control is being reviewed.
  // const handleLocateMe = async () => {
  //   setIsLocationActive(true);
  //   await requestLocation();
  //   setMapKey((k) => k + 1);
  // };

  const handleMapDragged = () => {
    // When user pans/drags away, automatically deactivate location mode
    if (isLocationActive) {
      setIsLocationActive(false);
    }
  };

  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      return selectedRisk === 'all' || b.risk_level === selectedRisk;
    });
  }, [barangays, selectedRisk]);

  // Center defaults to user's location ONLY when location is explicitly active, otherwise LIAN_CENTER.
  // This prevents map layer toggling from jumping back to user's location when user has panned away.
  const center = useMemo(() => {
    if (isLocationActive && location) {
      return { lat: location.latitude, lng: location.longitude };
    }
    return LIAN_CENTER;
  }, [isLocationActive, location]);

  const isFilterActive = selectedRisk !== 'all';

  const handleResetFilters = () => {
    setSelectedRisk('all');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNavy }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.brandNavy }}>
        <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={firesightLogo} style={{ width: 34, height: 34, marginRight: 1 }} resizeMode="contain" />
              <Text style={{ color: colors.textInverse, fontSize: 20, fontWeight: '800', letterSpacing: 1 }}>
                FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text><Text style={{ color: colors.textInverse }}> MAP</Text>
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>
              {APP_CONFIG.DEFAULT_MUNICIPALITY}, {APP_CONFIG.DEFAULT_PROVINCE} · Fire Risk Map
            </Text>
          </View>

          {/* Filter Button with Label */}
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
        </View>
      </SafeAreaView>

      <View style={[styles.mapContainer, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brandOrange} />
          </View>
        ) : (
          <LeafletMapView
            key={selectedRisk}
            mode="risk"
            mapType={mapType}
            barangays={filteredBarangays}
            incidents={[]}
            userLocation={location}
            centerLat={center.lat}
            centerLng={center.lng}
            zoom={isLocationActive ? 15 : 12}
            onMapDragged={handleMapDragged}
          />
        )}

        <RiskLegend />

        {/* Map Floating Controls - Right Column */}
        <View style={[styles.controlsColumn, { top: spacing.md }]}>
          <MapTypeSelector mapType={mapType} onChange={setMapType} />

          {/* Temporarily disabled current-location button. */}
          {/*
          <Pressable
            onPress={handleLocateMe}
            style={[styles.locateButton, { backgroundColor: colors.surface, borderColor: colors.border }, shadow.card]}
            accessibilityLabel="Locate current location"
          >
            <LocateFixed size={18} color={isLocationActive ? colors.brandOrange : colors.textMuted} />
          </Pressable>
          */}
        </View>
      </View>

      {/* Map Filter Modal */}
      <MapFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedRisk={selectedRisk}
        onSelectRisk={setSelectedRisk}
        onReset={handleResetFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
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
  mapContainer: { flex: 1, position: 'relative' },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controlsColumn: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 10,
  },
  locateButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});