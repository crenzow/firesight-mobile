import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check, AlertTriangle, LocateFixed, Layers, Globe } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { Button } from '../../components/ui/Button';
import { LeafletPickerMap, PickerMapType } from '../../components/map/LeafletPickerMap';
import { reverseGeocode } from '../../utils/geocoding';

export default function LocationScreen() {
  const { colors, spacing, typography, shadow } = useTheme();
  const { draft, updateDraft } = useReportDraft();

  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState<string>('Locating…');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [mapType, setMapType] = useState<PickerMapType>('satellite');
  const [isLocating, setIsLocating] = useState(false);

  // Ref to the pan function exposed by LeafletPickerMap
  const panToRef = useRef<((lat: number, lng: number) => void) | null>(null);

  // Debounce timer for geocoding so we don't spam on every drag frame
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!draft.deviceLocation) return;
    setCurrentLat(draft.deviceLocation.latitude);
    setCurrentLng(draft.deviceLocation.longitude);
    // Initial geocode
    setPlaceName('Locating…');
    reverseGeocode(draft.deviceLocation.latitude, draft.deviceLocation.longitude).then(setPlaceName);
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

  const handleLocateMe = useCallback(() => {
    if (!draft.deviceLocation) return;
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

  const MAP_TYPES: { key: PickerMapType; label: string; Icon: typeof Layers }[] = [
    { key: 'standard', label: 'Default', Icon: Layers },
    { key: 'satellite', label: 'Satellite', Icon: Globe },
  ];

  return (
    <View style={styles.container}>
      {/* Map */}
      <LeafletPickerMap
        initialLat={draft.deviceLocation.latitude}
        initialLng={draft.deviceLocation.longitude}
        mapType={mapType}
        onLocationChange={handleLocationChange}
        onReady={(pan) => { panToRef.current = pan; }}
      />

      {/* Back button — top left */}
      <SafeAreaView style={styles.backOverlay} edges={['top']}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.floatButton, shadow.card, { backgroundColor: colors.surface }]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
      </SafeAreaView>

      {/* Map type toggle + locate-me — stacked on right side */}
      <SafeAreaView style={styles.rightOverlay} edges={['top']}>
        {/* Map Type Toggle */}
        <View style={[styles.mapTypeContainer, shadow.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {MAP_TYPES.map((item, i) => {
            const isActive = mapType === item.key;
            return (
              <React.Fragment key={item.key}>
                {i > 0 && <View style={[styles.mapTypeDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => setMapType(item.key)}
                  style={[styles.mapTypeBtn, isActive && { backgroundColor: `${colors.brandOrange}12` }]}
                >
                  <item.Icon
                    size={16}
                    color={isActive ? colors.brandOrange : colors.textMuted}
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                  <Text style={[styles.mapTypeLabel, { color: isActive ? colors.brandOrange : colors.textMuted }, isActive && styles.mapTypeLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        {/* Locate Me Button */}
        <Pressable
          onPress={handleLocateMe}
          style={[styles.floatButton, shadow.card, { backgroundColor: colors.surface, marginTop: 10 }]}
        >
          {isLocating
            ? <ActivityIndicator size="small" color={colors.brandOrange} />
            : <LocateFixed size={20} color={colors.brandOrange} />
          }
        </Pressable>
      </SafeAreaView>

      {/* Floating Bottom Card */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <View style={[styles.bottomCard, shadow.large, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: typography.size.md, marginBottom: 2 }}>
            Pin Incident Location
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 18, marginBottom: spacing.md }}>
            Drag the map to point the crosshair at the exact location of the fire.
          </Text>

          {/* Place name chip */}
          <View style={[styles.placeChip, { backgroundColor: `${colors.brandOrange}14`, borderColor: `${colors.brandOrange}30` }]}>
            {isGeocodingLoading
              ? <ActivityIndicator size="small" color={colors.brandOrange} style={{ marginRight: 8 }} />
              : null
            }
            <Text style={{ color: colors.brandOrange, fontWeight: '700', fontSize: 13, flexShrink: 1 }} numberOfLines={2}>
              📍 {placeName}
            </Text>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label="Confirm Location"
              onPress={handleConfirm}
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
  // Back button anchored to the top-left
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
    paddingTop: 12,
    paddingLeft: 16,
  },
  // Map type toggle + locate-me stacked on the top-right
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
  mapTypeContainer: {
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
  },
  mapTypeDivider: { height: 1, marginHorizontal: 6 },
  mapTypeBtn: {
    width: 58,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  mapTypeLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.2 },
  mapTypeLabelActive: { fontWeight: '700' },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 },
  bottomCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
