import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { MapPin, AlertTriangle, RefreshCw, Maximize2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { Button } from '../../components/ui/Button';
import { OutsideLianBadge } from '../../components/ui/OutsideLianBadge';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { PhotoLightboxModal } from '../../components/ui/PhotoLightboxModal';
import { reportService } from '../../services/api/reportService';
import { ApiError } from '../../services/api/client';

export default function ReviewScreen() {
  const { colors, spacing, shadow, isDark } = useTheme();
  const { draft, updateDraft, resetDraft } = useReportDraft();
  const navigation = useNavigation();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(report)/capture');
  };

  const handleCancelReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    resetDraft();
    navigation.getParent()?.goBack();
  };

  const handleSubmit = async () => {
    if (!draft.photoUri || !draft.incidentLocation) {
      setIsConfirmVisible(false);
      setSubmitError('Missing photo or pinned location. Please retake the photo or location.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await reportService.create({
        description: draft.description,
        latitude: draft.incidentLocation.latitude,
        longitude: draft.incidentLocation.longitude,
        device_latitude: draft.deviceLocation?.latitude,
        device_longitude: draft.deviceLocation?.longitude,
        location_accuracy_m: draft.deviceLocation?.accuracy ?? undefined,
        location_name: draft.incidentPlaceName ?? undefined,
        barangay_id: draft.barangayId,
        photoUri: draft.photoUri,
      });
      resetDraft();
      setIsConfirmVisible(false);
      router.replace({
        pathname: '/(report)/success',
        params: { reportId: String(created.report_id), createdAt: created.created_at },
      });
    } catch (err) {
      setIsConfirmVisible(false);
      setSubmitError(err instanceof ApiError ? err.message : 'Unable to submit your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader
        title="Review Report"
        subtitle="Confirm details before submitting"
        onBack={() => router.back()}
        rightElement={
          <Pressable
            onPress={handleCancelReport}
            hitSlop={10}
            style={({ pressed }) => [
              styles.cancelTextBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cancel report"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        }
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Attached Photo Card */}
          {draft.photoUri ? (
            <View style={[styles.photoCard, { backgroundColor: cardBg }, !isDark && shadow.card]}>
              <Pressable
                onPress={() => setFullscreen(true)}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}
                accessibilityRole="button"
                accessibilityLabel="View full photo"
              >
                <Image source={{ uri: draft.photoUri }} style={styles.photo} resizeMode="cover" />
              </Pressable>

              {/* Floating action pills */}
              <View style={styles.photoActionsRow}>
                <Pressable
                  onPress={handleRetake}
                  style={({ pressed }) => [
                    styles.chipBtn,
                    {
                      backgroundColor: pressed ? colors.brandOrange : 'rgba(15, 28, 63, 0.82)',
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Retake photo"
                >
                  <RefreshCw size={12} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.chipText}>Retake</Text>
                </Pressable>

                <Pressable
                  onPress={() => setFullscreen(true)}
                  style={({ pressed }) => [
                    styles.chipIconBtn,
                    {
                      backgroundColor: pressed ? colors.brandOrange : 'rgba(15, 28, 63, 0.82)',
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Fullscreen photo"
                >
                  <Maximize2 size={13} color="#FFFFFF" strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Incident Location Card */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                borderWidth: isDark ? 1 : 0,
                marginTop: spacing.md,
              },
              !isDark && shadow.card,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardKicker, { color: colors.textMuted }]}>INCIDENT LOCATION</Text>
              {!draft.barangayId && <OutsideLianBadge size="sm" variant="short" />}
            </View>

            <View style={styles.locationBody}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.brandOrange}1A` }]}>
                <MapPin size={18} color={colors.brandOrange} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.locationPrimary, { color: colors.textPrimary }]} numberOfLines={2}>
                  {draft.incidentPlaceName ?? (draft.incidentLocation ? 'Pinned on map' : 'Location not pinned')}
                </Text>
                <Text style={[styles.locationSecondary, { color: colors.textSecondary }]}>
                  {draft.barangayId ? 'Lian, Batangas' : 'Outside Lian Municipality'}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                borderWidth: isDark ? 1 : 0,
                marginTop: spacing.md,
              },
              !isDark && shadow.card,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardKicker, { color: colors.textMuted }]}>DESCRIPTION</Text>
              <Text style={[styles.optionalTag, { color: colors.textMuted }]}>Optional</Text>
            </View>

            <TextInput
              value={draft.description}
              onChangeText={(t) => updateDraft({ description: t })}
              placeholder="Describe smoke color, flame intensity, structures at risk, etc."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[
                styles.textArea,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                },
              ]}
            />
          </View>

          {/* Error notice */}
          {submitError ? (
            <View style={[styles.errorBox, { backgroundColor: `${colors.danger}18` }]}>
              <AlertTriangle size={15} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{submitError}</Text>
            </View>
          ) : null}

          {/* Submit Action */}
          <View style={{ marginTop: spacing.xl }}>
            <Button
              label="Submit Fire Report"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setIsConfirmVisible(true);
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <ConfirmationDialog
        visible={isConfirmVisible}
        type="confirm"
        title="Confirm Fire Report"
        message="You are about to submit a fire incident report to the Bureau of Fire Protection. This will alert BFP personnel immediately."
        confirmText="Submit Report"
        cancelText="Cancel"
        loading={isSubmitting}
        onConfirm={handleSubmit}
        onCancel={() => setIsConfirmVisible(false)}
        icon={<AlertTriangle size={28} color="#FFFFFF" strokeWidth={2.5} />}
      />

      {/* Fullscreen photo viewer modal */}
      {draft.photoUri ? (
        <PhotoLightboxModal
          visible={fullscreen}
          imageSource={{ uri: draft.photoUri }}
          title="Attached Incident Photo"
          subtitle="Report Evidence"
          onClose={() => setFullscreen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelTextBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  photoCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 220,
  },
  photoActionsRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  sectionCard: {
    borderRadius: 18,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  optionalTag: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  locationBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPrimary: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  locationSecondary: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 85,
    textAlignVertical: 'top',
    fontSize: 13.5,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
  },
});
