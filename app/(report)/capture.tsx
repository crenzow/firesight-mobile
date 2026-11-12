import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { X, Zap, ZapOff, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { findBarangayByCoordinates } from '../../utils/barangayLookup';

export default function CaptureScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { updateDraft } = useReportDraft();
  const { user } = useAuth();
  const { location, isLoading: isLocating, error: locationError, requestLocation } = useLocation();

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!permission) return;
      if (!permission.granted) {
        if (permission.canAskAgain) {
          const res = await requestPermission();
          if (isMounted && !res.granted) {
            Alert.alert(
              'Camera Access Required',
              'FireSight needs camera access to take photo evidence for fire reports.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
        } else {
          if (isMounted) {
            Alert.alert(
              'Camera Access Disabled',
              'Camera access was denied. Please enable camera permissions in your device settings to report fire incidents.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        let initialBarangayId: number | null = null;
        if (location?.latitude && location?.longitude) {
          const match = findBarangayByCoordinates(location.latitude, location.longitude);
          initialBarangayId = match ? match.id : null;
        }

        updateDraft({
          photoUri: photo.uri,
          deviceLocation: location,
          barangayId: initialBarangayId,
        });
        router.push('/(report)/preview');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission || !permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        enableTorch={flash === 'on'}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: pressed ? colors.brandOrange : 'rgba(0,0,0,0.45)',
                transform: [{ scale: pressed ? 0.90 : 1 }],
              },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>

          <View style={[styles.reportModeBadge, { backgroundColor: colors.brandOrange }]}>
            <Text style={styles.reportModeText}>REPORT MODE</Text>
          </View>

          <Pressable
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: flash === 'on' ? 'rgba(255, 194, 75, 0.28)' : (pressed ? colors.brandOrange : 'rgba(0,0,0,0.45)'),
                borderColor: flash === 'on' ? '#FFC24B' : 'transparent',
                borderWidth: flash === 'on' ? 1.5 : 0,
                transform: [{ scale: pressed ? 0.90 : 1 }],
              },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={flash === 'on' ? 'Turn flashlight off' : 'Turn flashlight on'}
          >
            {flash === 'off' ? <ZapOff size={20} color="#FFFFFF" /> : <Zap size={20} color="#FFC24B" />}
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <View style={[styles.bottomBar, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
          <View style={[styles.locationChip, { borderRadius: radius.md }]}>
            {isLocating
              ? <ActivityIndicator size="small" color="#C9CDD9" style={{ marginRight: 4 }} />
              : <MapPin size={14} color={colors.brandOrange} />}
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.locationText} numberOfLines={1}>
                {isLocating
                  ? 'Detecting location…'
                  : location
                    ? (location.address || user?.address?.barangay_name || 'Location detected')
                    : locationError
                      ? 'Location unavailable — tap capture to retry'
                      : 'Locating…'}
              </Text>
              {location && !isLocating ? (
                <Text style={{ color: '#C9CDD9', fontSize: 10, marginTop: 2 }}>
                  {`${location.latitude.toFixed(5)}°, ${location.longitude.toFixed(5)}° · ±${Math.round(location.accuracy ?? 0)}m`}
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={handleCapture}
            disabled={isCapturing || isLocating || !location}
            style={({ pressed }) => [
              styles.shutterOuter,
              (isCapturing || isLocating || !location) && { opacity: 0.6 },
              {
                transform: [{ scale: pressed && !isCapturing && !isLocating && !!location ? 0.92 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Capture photo"
          >
            <View style={[styles.shutterInner, { backgroundColor: (isLocating || !location) ? colors.textMuted : colors.brandOrange }]}>
              {isCapturing ? <ActivityIndicator color="#FFFFFF" /> : null}
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  reportModeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  bottomBar: { alignItems: 'center', gap: 16 },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'center',
  },
  locationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: { paddingHorizontal: 14, paddingVertical: 10, width: '100%' },
  warningText: { color: '#FFFFFF', fontSize: 11, textAlign: 'center', lineHeight: 15, fontWeight: '600' },
});