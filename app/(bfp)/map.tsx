import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import {
  Bell,
  Search,
  X,
  Flame,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { LeafletMapView, LeafletMapRef } from '../../components/map/LeafletMapView';
import { MapType } from '../../components/map/MapTypeSelector';
import { MapFloatingControls } from '../../components/map/MapFloatingControls';
import { MapTypeModal } from '../../components/map/MapTypeModal';
import { RiskLegend } from '../../components/map/RiskLegend';
import { BarangayDetailCard } from '../../components/map/BarangayDetailCard';
import { BarangayDirectorySheet } from '../../components/map/BarangayDirectorySheet';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { mapService } from '../../services/api/mapService';
import { incidentService } from '../../services/api/incidentService';
import { BFPIncidentMarker, BarangayRiskFeature, RiskLevel } from '../../services/api/models';
import { useLocation } from '../../hooks/useLocation';
import { useNotifications } from '../../context/NotificationContext';

// Lian, Batangas municipal centroid
const LIAN_CENTER = { lat: 14.0065, lng: 120.6425 };

const ALARM_LEGEND_ITEMS = [
  { label: '1st Alarm', color: '#34D399' },
  { label: '2nd Alarm', color: '#10B981' },
  { label: '3rd Alarm', color: '#FBBF24' },
  { label: '4th Alarm', color: '#F59E0B' },
  { label: '5th Alarm', color: '#F97316' },
  { label: 'Task Force', color: '#DC2626' },
  { label: 'General Alarm', color: '#881337' },
];

export default function BFPMapScreen() {
  const { colors, spacing, radius, typography, isDark, shadow } = useTheme();
  const { location, requestLocation, isLoading: isLocating } = useLocation();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const mapRef = useRef<LeafletMapRef>(null);

  const [mode, setMode] = useState<'risk' | 'incidents'>('risk');
  const [mapType, setMapType] = useState<MapType>('standard');
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [incidents, setIncidents] = useState<BFPIncidentMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLegendVisible, setIsLegendVisible] = useState(false);

  // Selected barangay for the detail card
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayRiskFeature | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [headerBottom, setHeaderBottom] = useState<number>(0);

  // Filters state
  const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');

  // Modals state
  const [isMapTypeModalOpen, setIsMapTypeModalOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      mapService.getBarangayRisk(),
      mapService.getBFPIncidents(),
      incidentService.list(),
    ]).then(([riskResult, bfpMapResult, listResult]) => {
      if (riskResult.status === 'fulfilled') setBarangays(riskResult.value);

      let loaded: any[] = [];
      if (bfpMapResult.status === 'fulfilled' && Array.isArray(bfpMapResult.value) && bfpMapResult.value.length > 0) {
        loaded = bfpMapResult.value;
      }
      if (loaded.length === 0 && listResult.status === 'fulfilled' && Array.isArray(listResult.value)) {
        loaded = listResult.value.filter(
          (i) => i.latitude && i.longitude && (Number(i.latitude) !== 0 || Number(i.longitude) !== 0)
        );
      }
      setIncidents(loaded);
      setIsLoading(false);
    });
  }, []);

  // Filtered barangays for Risk mode
  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      return selectedRisk === 'all' || b.risk_level === selectedRisk;
    });
  }, [barangays, selectedRisk]);

  // Risk counts for quick pills
  const riskCounts = useMemo(() => {
    let high = 0;
    let moderate = 0;
    let mild = 0;
    barangays.forEach((b) => {
      if (b.risk_level === 'high') high++;
      else if (b.risk_level === 'moderate') moderate++;
      else mild++;
    });
    return { high, moderate, mild, total: barangays.length };
  }, [barangays]);

  const handleLocateMe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (showUserLocation) {
      setShowUserLocation(false);
      mapRef.current?.removeUserMarker?.();
      return;
    }
    setShowUserLocation(true);
    if (location) {
      mapRef.current?.panToUserLocation(location.latitude, location.longitude);
      return;
    }
    const freshLoc = await requestLocation();
    if (freshLoc) {
      mapRef.current?.panToUserLocation(freshLoc.latitude, freshLoc.longitude);
    }
  };

  const handleSelectBarangayByName = (name: string) => {
    if (!name) {
      setSelectedBarangay((prev) => {
        if (prev) {
          Haptics.selectionAsync().catch(() => {});
        }
        return null;
      });
      return;
    }
    const found = barangays.find(
      (b) => b.barangay_name.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSelectedBarangay(found);
    }
  };

  const handleSelectFromDirectory = (feature: BarangayRiskFeature) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedBarangay(feature);
    mapRef.current?.focusBarangay(feature.barangay_name);
  };

  const handleModeChange = (nextMode: 'risk' | 'incidents') => {
    Haptics.selectionAsync().catch(() => {});
    setMode(nextMode);
    setSelectedBarangay(null);
  };

  return (
    <View style={styles.screen}>
      {/* 1. Edge-to-Edge Live Map Background */}
      {isLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.brandOrange} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading Operations Map…
          </Text>
        </View>
      ) : (
        <LeafletMapView
          ref={mapRef}
          key={mode}
          mode={mode}
          mapType={mapType}
          barangays={barangays}
          selectedRiskFilter={selectedRisk}
          selectedBarangayName={selectedBarangay?.barangay_name || null}
          incidents={incidents}
          userLocation={showUserLocation ? location : null}
          centerLat={LIAN_CENTER.lat}
          centerLng={LIAN_CENTER.lng}
          zoom={12}
          isBFP={true}
          onSelectBarangay={handleSelectBarangayByName}
        />
      )}

      {/* 2. Apple Maps Floating Frosted Glass Header */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.headerSafeArea}>
        <View
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setHeaderBottom(y + height);
          }}
          style={[
            styles.floatingHeader,
            {
              backgroundColor: isDark ? 'rgba(15, 28, 63, 0.94)' : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            },
            !isDark && shadow.card,
          ]}
        >
          {/* Top Row: Title, Subtitle, Search & Notification Actions */}
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {mode === 'risk' ? 'Fire Hazard Map' : 'Incidents Map'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {mode === 'risk'
                  ? 'Lian, Batangas · 19 Barangays'
                  : `${incidents.length} Resolved Incident${incidents.length === 1 ? '' : 's'}`}
              </Text>
            </View>

            {/* Header Actions: Search & Notifications */}
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setIsDirectoryOpen(true);
                }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  {
                    backgroundColor: pressed
                      ? colors.brandOrange
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Search barangays"
              >
                {({ pressed }) => (
                  <Search size={17} color={pressed ? '#FFFFFF' : colors.textPrimary} />
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  router.push({
                    pathname: '/(bfp)/notifications',
                    params: { from: pathname },
                  } as any);
                }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  {
                    backgroundColor: pressed
                      ? colors.brandOrange
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                {({ pressed }) => (
                  <>
                    <Bell size={17} color={pressed ? '#FFFFFF' : colors.textPrimary} />
                    {unreadCount > 0 ? (
                      <View style={[styles.bellBadge, { backgroundColor: colors.brandOrange }]}>
                        <Text style={styles.bellBadgeText}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Mode Segmented Control: Risk Map vs All Incidents */}
          <View style={{ marginTop: spacing.sm }}>
            <SegmentedControl
              segments={[
                { key: 'risk', label: 'Hazard Risk' },
                { key: 'incidents', label: 'Incidents' },
              ]}
              value={mode}
              onChange={(k) => handleModeChange(k as 'risk' | 'incidents')}
            />
          </View>

          {/* Quick-Filter Metric Pills (Only in Risk Mode) */}
          {mode === 'risk' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScrollContainer}
              style={styles.pillsScrollView}
            >
              {/* All Pill */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedRisk('all');
                }}
                style={({ pressed }) => [
                  styles.pill,
                  selectedRisk === 'all'
                    ? { backgroundColor: colors.brandOrange, borderColor: colors.brandOrange }
                    : {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      },
                  {
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: selectedRisk === 'all' ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  All ({riskCounts.total})
                </Text>
              </Pressable>

              {/* High Risk Pill */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedRisk(selectedRisk === 'high' ? 'all' : 'high');
                }}
                style={({ pressed }) => [
                  styles.pill,
                  selectedRisk === 'high'
                    ? { backgroundColor: colors.riskHigh, borderColor: colors.riskHigh }
                    : {
                        backgroundColor: isDark ? `${colors.riskHigh}1F` : `${colors.riskHigh}14`,
                        borderColor: isDark ? `${colors.riskHigh}4D` : `${colors.riskHigh}33`,
                      },
                  {
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: selectedRisk === 'high' ? '#FFFFFF' : colors.riskHigh },
                  ]}
                >
                  High ({riskCounts.high})
                </Text>
              </Pressable>

              {/* Moderate Risk Pill */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedRisk(selectedRisk === 'moderate' ? 'all' : 'moderate');
                }}
                style={({ pressed }) => [
                  styles.pill,
                  selectedRisk === 'moderate'
                    ? { backgroundColor: colors.riskModerate, borderColor: colors.riskModerate }
                    : {
                        backgroundColor: isDark ? `${colors.riskModerate}1F` : `${colors.riskModerate}14`,
                        borderColor: isDark ? `${colors.riskModerate}4D` : `${colors.riskModerate}33`,
                      },
                  {
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: selectedRisk === 'moderate' ? '#FFFFFF' : colors.riskModerate },
                  ]}
                >
                  Moderate ({riskCounts.moderate})
                </Text>
              </Pressable>

              {/* Mild Risk Pill */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedRisk(selectedRisk === 'mild' ? 'all' : 'mild');
                }}
                style={({ pressed }) => [
                  styles.pill,
                  selectedRisk === 'mild'
                    ? { backgroundColor: colors.riskMild, borderColor: colors.riskMild }
                    : {
                        backgroundColor: isDark ? 'rgba(234, 179, 8, 0.12)' : 'rgba(234, 179, 8, 0.08)',
                        borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.2)',
                      },
                  {
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: selectedRisk === 'mild' ? '#FFFFFF' : colors.riskMild },
                  ]}
                >
                  Mild ({riskCounts.mild})
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* 3. Floating Action Island (Right Side) & Legend (Left Side) */}
      {(() => {
        const floatingTop =
          headerBottom > 0
            ? headerBottom + 12
            : mode === 'risk'
            ? Platform.OS === 'ios'
              ? 220
              : 195
            : Platform.OS === 'ios'
            ? 180
            : 155;

        return (
          <>
            <View
              style={[
                styles.floatingControlsIsland,
                {
                  top: floatingTop,
                },
              ]}
            >
              <MapFloatingControls
                onOpenMapType={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setIsMapTypeModalOpen(true);
                }}
                onLocateUser={handleLocateMe}
                isLocating={isLocating}
                isLocationActive={showUserLocation}
                onToggleLegend={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setIsLegendVisible((prev) => !prev);
                }}
                isLegendVisible={isLegendVisible}
              />
            </View>

            {/* 4. Hazard Risk / Incident Legend (Collapsible) */}
            {isLegendVisible && (
              mode === 'risk' ? (
                <RiskLegend
                  style={[
                    styles.legendPosition,
                    {
                      top: floatingTop,
                    },
                  ]}
                  onClose={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsLegendVisible(false);
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.incidentLegendCard,
                    {
                      left: 16,
                      top: floatingTop,
                      backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : '#FFFFFF',
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    },
                    !isDark && shadow.card,
                  ]}
                >
                  <View style={styles.legendHeaderRow}>
                    <Text style={[styles.legendTitle, { color: colors.textMuted, fontSize: typography.size.xs }]}>
                      ALARM LEVEL
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setIsLegendVisible(false);
                      }}
                      hitSlop={8}
                      style={styles.legendCloseBtn}
                    >
                      <X size={13} color={colors.textMuted} />
                    </Pressable>
                  </View>

                  {ALARM_LEGEND_ITEMS.map((item) => (
                    <View key={item.label} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginLeft: 7, fontWeight: '600' }}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            )}
          </>
        );
      })()}

                  {/* 5. Apple Maps-Style Detail Card (Only visible when a barangay is tapped) */}
      {selectedBarangay && (
        <BarangayDetailCard
          barangay={selectedBarangay}
          onClose={() => {
            Haptics.selectionAsync().catch(() => {});
            setSelectedBarangay(null);
          }}
        />
      )}

      {/* 6. Apple-Style Barangay Directory Sheet */}
      <BarangayDirectorySheet
        visible={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        barangays={barangays}
        onSelectBarangay={handleSelectFromDirectory}
        selectedBarangayName={selectedBarangay?.barangay_name}
      />

      {/* 7. Map Type Modal (Visual Preview Satellite/Standard) */}
      <MapTypeModal
        visible={isMapTypeModalOpen}
        onClose={() => setIsMapTypeModalOpen(false)}
        mapType={mapType}
        onChange={setMapType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  floatingHeader: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 18,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  pillsScrollView: {
    marginTop: 8,
    marginHorizontal: -4,
  },
  pillsScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  floatingControlsIsland: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 220 : 195,
    zIndex: 9,
  },
  legendPosition: {
    position: 'absolute',
    left: 16,
    top: Platform.OS === 'ios' ? 220 : 195,
    zIndex: 9,
  },
  incidentLegendCard: {
    position: 'absolute',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  legendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  legendTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legendCloseBtn: {
    padding: 2,
    marginLeft: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
