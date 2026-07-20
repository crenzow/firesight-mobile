import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { X, Zap, ZapOff, MapPin, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { Button } from '../../components/ui/Button';

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
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        updateDraft({
          photoUri: photo.uri,
          location,
          barangayId: user?.address?.barangay_id ?? null,
        });
        router.push('/(report)/review');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <AlertTriangle size={32} color={colors.brandOrange} />
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' }}>
          Camera access is required
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.xs, textAlign: 'center' }}>
          FireSight needs your camera to capture photo evidence for fire reports.
        </Text>
        <View style={{ marginTop: spacing.lg, width: '100%' }}>
          <Button label="Grant Camera Access" onPress={requestPermission} />
        </View>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>Cancel</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
            <X size={22} color="#FFFFFF" />
          </Pressable>

          <View style={[styles.reportModeBadge, { backgroundColor: colors.brandOrange }]}>
            <Text style={styles.reportModeText}>REPORT MODE</Text>
          </View>

          <Pressable onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))} style={styles.iconButton} hitSlop={8}>
            {flash === 'off' ? <ZapOff size={20} color="#FFFFFF" /> : <Zap size={20} color="#FFC24B" />}
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <View style={[styles.bottomBar, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
          <View style={[styles.locationChip, { borderRadius: radius.md }]}>
            <MapPin size={14} color={isLocating ? '#C9CDD9' : colors.brandOrange} />
            <Text style={styles.locationText}>
              {isLocating
                ? 'Detecting location…'
                : location
                  ? `${location.latitude.toFixed(5)}°, ${location.longitude.toFixed(5)}° · ±${Math.round(location.accuracy ?? 0)}m`
                  : locationError
                    ? 'Location unavailable — tap capture to retry'
                    : user?.address?.barangay_name ?? 'Locating…'}
            </Text>
          </View>

          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            style={[styles.shutterOuter, isCapturing && { opacity: 0.6 }]}
          >
            <View style={[styles.shutterInner, { backgroundColor: colors.brandOrange }]}>
              {isCapturing ? <ActivityIndicator color="#FFFFFF" /> : null}
            </View>
          </Pressable>

          <View style={[styles.warningBanner, { backgroundColor: 'rgba(225,66,69,0.9)', borderRadius: radius.md }]}>
            <Text style={styles.warningText}>
              Call 160 (BFP) immediately if lives are in danger. This app is for reporting only.
            </Text>
          </View>
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