import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { Button } from '../../components/ui/Button';
import { LeafletPickerMap, PickerMapType } from '../../components/map/LeafletPickerMap';
import { MapFloatingControls } from '../../components/map/MapFloatingControls';
import { MapTypeModal } from '../../components/map/MapTypeModal';
import { reverseGeocode } from '../../utils/geocoding';

export default function LocationScreen() {
  const { colors, spacing, typography, shadow, isDark } = useTheme();
  const { draft, updateDraft } = useReportDraft();

  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState<string>('Locating…');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [mapType, setMapType] = useState<PickerMapType>('satellite');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapTypeModalOpen, setIsMapTypeModalOpen] = useState(false);

  // Ref to the pan function exposed by LeafletPickerMap
  const panToRef = useRef<((lat: number, lng: number) => void) | null>(null);

  // Debounce timer for geocoding so we don't spam on every drag frame
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!draft.deviceLocation) return;
    setCurrentLat(draft.deviceLocation.latitude);
    setCurrentLng(draft.deviceLocation.longitude);
    // Initial geocode
    setIsGeocodingLoading(true);
    setPlaceName('Locating…');
    reverseGeocode(draft.deviceLocation.latitude, draft.deviceLocation.longitude).then((name) => {
      setPlaceName(name);
      setIsGeocodingLoading(false);
    });
  }, [draft.deviceLocation]);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    // Debounce geocoding to only fire 800ms after user stops dragging
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    setIsGeocodingLoading(true);
    geocodeTimer.current = setTimeout(async () => {
      const name = await reverseGeocode(lat, lng);
      setPlaceName(name);
      setIsGeocodingLoading(false);
    }, 800);
  }, []);

  const handleMapReady = useCallback((pan: (lat: number, lng: number) => void) => {
    panToRef.current = pan;
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!draft.deviceLocation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsLocating(true);
    panToRef.current?.(draft.deviceLocation.latitude, draft.deviceLocation.longitude);
    // Update state to reflect new position
    setCurrentLat(draft.deviceLocation.latitude);
    setCurrentLng(draft.deviceLocation.longitude);
    reverseGeocode(draft.deviceLocation.latitude, draft.deviceLocation.longitude).then((name) => {
      setPlaceName(name);
      setIsLocating(false);
    });
  }, [draft.deviceLocation]);

  const handleConfirm = () => {
    if (currentLat === null || currentLng === null) return;
    updateDraft({
      incidentLocation: { latitude: currentLat, longitude: currentLng },
      incidentPlaceName: placeName,
    });
    router.push('/(report)/review');
  };

  if (!draft.deviceLocation) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AlertTriangle size={32} color={colors.warning} />
        <Text style={{ color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>
          Device location is unavailable. Please retake the photo.
        </Text>
        <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <LeafletPickerMap
        initialLat={draft.deviceLocation.latitude}
        initialLng={draft.deviceLocation.longitude}
        mapType={mapType}
        onLocationChange={handleLocationChange}
        onReady={handleMapReady}
      />

      {/* Back button — top left */}
      <SafeAreaView style={styles.backOverlay} edges={['top']}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.floatButton,
            {
              backgroundColor: isDark ? 'rgba(21, 26, 48, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              borderWidth: 1,
            },
            shadow.card,
            {
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>

      {/* Floating map controls (Layer switch + Locate me) */}
      <SafeAreaView style={styles.rightOverlay} edges={['top']}>
        <MapFloatingControls
          onOpenMapType={() => {
            Haptics.selectionAsync().catch(() => {});
            setIsMapTypeModalOpen(true);
          }}
          onLocateUser={handleLocateMe}
          isLocating={isLocating}
        />
      </SafeAreaView>

      {/* Map Type Sheet */}
      <MapTypeModal
        visible={isMapTypeModalOpen}
        onClose={() => setIsMapTypeModalOpen(false)}
        mapType={mapType}
        onChange={(type) => {
          if (type === 'standard' || type === 'satellite') {
            setMapType(type);
          }
        }}
      />

      {/* Floating Bottom Card */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <View
          style={[
            styles.bottomCard,
            shadow.large,
            {
              backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              borderWidth: 1,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: typography.size.md, marginBottom: 2 }}>
            Pin Incident Location
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 18, marginBottom: spacing.md }}>
            Drag the map to point the crosshair at the exact location of the fire.
          </Text>

          {/* Place name chip */}
          <View style={[styles.placeChip, { backgroundColor: `${colors.brandOrange}14`, borderColor: `${colors.brandOrange}30` }]}>
            {isGeocodingLoading ? (
              <ActivityIndicator size="small" color={colors.brandOrange} style={{ marginRight: 8 }} />
            ) : null}
            <Text style={{ color: colors.brandOrange, fontWeight: '700', fontSize: 13, flexShrink: 1 }} numberOfLines={2}>
              📍 {placeName}
            </Text>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label="Confirm Location"
              onPress={handleConfirm}
              disabled={isGeocodingLoading || currentLat === null || currentLng === null}
              icon={<Check size={18} color="#FFFFFF" />}
              iconPosition="left"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
    paddingTop: 12,
    paddingLeft: 16,
  },
  rightOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
    paddingTop: 12,
    paddingRight: 16,
  },
  floatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 },
  bottomCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
