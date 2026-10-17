import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import {
  Bell,
  Search,
  ChevronRight,
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
import { mapService } from '../../services/api/mapService';
import { BarangayRiskFeature, RiskLevel } from '../../services/api/models';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

// Lian, Batangas municipal centroid
const LIAN_CENTER = { lat: 14.0065, lng: 120.6425 };
const EMPTY_INCIDENTS: any[] = [];

export default function MapScreen() {
  const { colors, spacing, radius, typography, isDark, shadow } = useTheme();
  const { location, requestLocation, isLoading: isLocating } = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const mapRef = useRef<LeafletMapRef>(null);

  const [mapType, setMapType] = useState<MapType>('standard');
  const [barangays, setBarangays] = useState<BarangayRiskFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLegendVisible, setIsLegendVisible] = useState(false);

  // Selected barangay for the detail card
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayRiskFeature | null>(null);

  // Modals state
  const [isMapTypeModalOpen, setIsMapTypeModalOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');

  useEffect(() => {
    mapService
      .getBarangayRisk()
      .then((data) => {
        setBarangays(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      return selectedRisk === 'all' || b.risk_level === selectedRisk;
    });
  }, [barangays, selectedRisk]);

  // Risk counts for the interactive pills
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

  // User's home barangay feature (only if resident has a registered address in Lian, Batangas)
  const isUserFromLian = useMemo(() => {
    if (!user?.address) return false;
    const municipality = (user.address.municipality || '').trim().toLowerCase();
    const province = (user.address.province || '').trim().toLowerCase();

    // Must be explicitly located in Lian, Batangas
    const isLian = municipality === 'lian';
    const isBatangas = !province || province === 'batangas';
    return isLian && isBatangas;
  }, [user?.address]);

  const userBarangayFeature = useMemo(() => {
    if (!isUserFromLian || !barangays.length) return null;

    // Check by exact barangay_id first if present
    if (user?.address?.barangay_id) {
      const byId = barangays.find((b) => b.barangay_id === user.address?.barangay_id);
      if (byId) return byId;
    }

    const userBarangayName = user?.address?.barangay_name?.trim();
    if (!userBarangayName) return null;

    return (
      barangays.find(
        (b) =>
          b.barangay_name.toLowerCase().includes(userBarangayName.toLowerCase()) ||
          userBarangayName.toLowerCase().includes(b.barangay_name.toLowerCase())
      ) || null
    );
  }, [isUserFromLian, barangays, user?.address?.barangay_id, user?.address?.barangay_name]);

  const handleLocateMe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
      // Select the barangay to display the detail card without zooming or moving the camera
      setSelectedBarangay(found);
    }
  };

  const handleSelectFromDirectory = (feature: BarangayRiskFeature) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedBarangay(feature);
    mapRef.current?.focusBarangay(feature.barangay_name);
  };

  const handleChangeRiskFilter = (nextRisk: 'all' | RiskLevel) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedRisk(nextRisk);
  };

  return (
    <View style={styles.screen}>
      {/* 1. Edge-to-Edge Live Map Background */}
      {isLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.brandOrange} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading Lian Fire Hazard Map…
          </Text>
        </View>
      ) : (
        <LeafletMapView
          ref={mapRef}
          key={selectedRisk}
          mode="risk"
          mapType={mapType}
          barangays={filteredBarangays}
          selectedBarangayName={selectedBarangay?.barangay_name || null}
          incidents={EMPTY_INCIDENTS}
          userLocation={location}
          centerLat={LIAN_CENTER.lat}
          centerLng={LIAN_CENTER.lng}
          zoom={12}
          onSelectBarangay={handleSelectBarangayByName}
        />
      )}

      {/* 2. Apple Maps Floating Frosted Glass Header */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.headerSafeArea}>
        <View
          style={[
            styles.floatingHeader,
            {
              backgroundColor: isDark ? 'rgba(15, 28, 63, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
            shadow.card,
          ]}
        >
          {/* Top Row: Title, Scope, and Notifications */}
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Fire Risk Map
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Lian, Batangas · 19 Barangays
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
                onPress={() =>
                  router.push({
                    pathname: '/(resident)/notifications',
                    params: { from: pathname },
                  } as any)
                }
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

          {/* Quick-Filter Metric Pills (Apple Weather-Style) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScrollContainer}
            style={styles.pillsScrollView}
          >
            {/* All Pill */}
            <Pressable
              onPress={() => handleChangeRiskFilter('all')}
              style={[
                styles.pill,
                selectedRisk === 'all'
                  ? { backgroundColor: colors.brandOrange, borderColor: colors.brandOrange }
                  : {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
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
              onPress={() => handleChangeRiskFilter(selectedRisk === 'high' ? 'all' : 'high')}
              style={[
                styles.pill,
                selectedRisk === 'high'
                  ? { backgroundColor: colors.riskHigh, borderColor: colors.riskHigh }
                  : {
                      backgroundColor: isDark ? `${colors.riskHigh}1F` : `${colors.riskHigh}14`,
                      borderColor: isDark ? `${colors.riskHigh}4D` : `${colors.riskHigh}33`,
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
              onPress={() => handleChangeRiskFilter(selectedRisk === 'moderate' ? 'all' : 'moderate')}
              style={[
                styles.pill,
                selectedRisk === 'moderate'
                  ? { backgroundColor: colors.riskModerate, borderColor: colors.riskModerate }
                  : {
                      backgroundColor: isDark ? `${colors.riskModerate}1F` : `${colors.riskModerate}14`,
                      borderColor: isDark ? `${colors.riskModerate}4D` : `${colors.riskModerate}33`,
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
              onPress={() => handleChangeRiskFilter(selectedRisk === 'mild' ? 'all' : 'mild')}
              style={[
                styles.pill,
                selectedRisk === 'mild'
                  ? { backgroundColor: colors.riskMild, borderColor: colors.riskMild }
                  : {
                      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.12)' : 'rgba(234, 179, 8, 0.08)',
                      borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.2)',
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
        </View>
      </SafeAreaView>

      {/* 3. Floating Action Island (Right Side) */}
      <View style={styles.floatingControlsIsland}>
        <MapFloatingControls
          onOpenMapType={() => {
            Haptics.selectionAsync().catch(() => {});
            setIsMapTypeModalOpen(true);
          }}
          onLocateUser={handleLocateMe}
          isLocating={isLocating}
          onToggleLegend={() => {
            Haptics.selectionAsync().catch(() => {});
            setIsLegendVisible((prev) => !prev);
          }}
          isLegendVisible={isLegendVisible}
        />
      </View>

      {/* 4. Hazard Risk Legend (Collapsible) */}
      {isLegendVisible && (
        <RiskLegend
          style={styles.riskLegendPosition}
          onClose={() => {
            Haptics.selectionAsync().catch(() => {});
            setIsLegendVisible(false);
          }}
        />
      )}

      {/* 5. Apple Maps-Style Detail Card (Only visible when a barangay is tapped/selected) */}
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
        userBarangayFeature={userBarangayFeature}
        onSelectBarangay={handleSelectFromDirectory}
        selectedBarangayName={selectedBarangay?.barangay_name}
      />

      {/* 7. Map Type Modal */}
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
    borderRadius: 22,
    borderWidth: 1,
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
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  pillsScrollView: {
    marginTop: 10,
  },
  pillsScrollContainer: {
    gap: 6,
    paddingRight: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  floatingControlsIsland: {
    position: 'absolute',
    right: 16,
    top: 154,
    zIndex: 10,
  },
  riskLegendPosition: {
    position: 'absolute',
    top: 154,
    left: 16,
    zIndex: 10,
  },
});