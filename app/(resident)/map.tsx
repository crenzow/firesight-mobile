import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { LeafletMapView } from '../../components/map/LeafletMapView';
import { MapType } from '../../components/map/MapTypeSelector';
import { MapFloatingControls } from '../../components/map/MapFloatingControls';
import { MapTypeModal } from '../../components/map/MapTypeModal';
import { RiskLegend } from '../../components/map/RiskLegend';
import { MapFilterModal } from '../../components/map/MapFilterModal';
import { mapService } from '../../services/api/mapService';
import { BarangayRiskFeature, RiskLevel } from '../../services/api/models';
import { useLocation } from '../../hooks/useLocation';

// Lian, Batangas municipal centroid — used as default center
const LIAN_CENTER = { lat: 14.0065, lng: 120.6425 };

export default function MapScreen() {
  const { colors, spacing } = useTheme();
  const { location } = useLocation();

  const [mapType, setMapType] = useState<MapType>('standard');
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationActive, setIsLocationActive] = useState(false);

  // Modals state
  const [isMapTypeModalOpen, setIsMapTypeModalOpen] = useState(false);
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

  const handleMapDragged = () => {
    if (isLocationActive) {
      setIsLocationActive(false);
    }
  };

  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      return selectedRisk === 'all' || b.risk_level === selectedRisk;
    });
  }, [barangays, selectedRisk]);

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
      {/* Universal Top Header matching Home, Learn, and Profile */}
      <AppHeader variant="dark" />

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

        {/* Map Floating Controls - Vertically stacked Layers & Filter */}
        <View style={[styles.controlsColumn, { top: spacing.md }]}>
          <MapFloatingControls
            onOpenMapType={() => setIsMapTypeModalOpen(true)}
            onOpenFilter={() => setIsFilterModalOpen(true)}
            isFilterActive={isFilterActive}
          />
        </View>
      </View>

      {/* Map Type Bottom Sheet (Google Maps Style) */}
      <MapTypeModal
        visible={isMapTypeModalOpen}
        onClose={() => setIsMapTypeModalOpen(false)}
        mapType={mapType}
        onChange={setMapType}
      />

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