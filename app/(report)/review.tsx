import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { ChevronLeft, MapPin, AlertTriangle, RefreshCw, Maximize2, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { PhotoLightboxModal } from '../../components/ui/PhotoLightboxModal';
import { reportService } from '../../services/api/reportService';
import { ApiError } from '../../services/api/client';

export default function ReviewScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { draft, updateDraft, resetDraft } = useReportDraft();
  const navigation = useNavigation();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleRetake = () => {
    // Go all the way back to capture so the user retakes the photo
    router.push('/(report)/capture');
  };

  const handleCancelReport = () => {
    resetDraft();
    navigation.getParent()?.goBack();
  };

  const handleSubmit = async () => {
    if (!draft.photoUri || !draft.incidentLocation || !draft.barangayId) {
      setIsConfirmVisible(false);
      setSubmitError('Missing photo, pinned location, or barangay information. Please retake the photo or location.');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.90 : 1 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2.5} />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: 20, fontWeight: '800' }]}>
            Review Report
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center' }}>Confirm details before submitting</Text>
        </View>
        <Pressable
          onPress={handleCancelReport}
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
          accessibilityRole="button"
        >
          <Text style={{ color: colors.danger, fontWeight: '600', fontSize: typography.size.sm }}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {draft.photoUri ? (
          <View>
            <Pressable
              onPress={() => setFullscreen(true)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
            >
              <Image source={{ uri: draft.photoUri }} style={[styles.photo, { borderRadius: radius.lg }]} resizeMode="cover" />
            </Pressable>
            <Pressable
              onPress={() => setFullscreen(true)}
              style={({ pressed }) => [
                styles.expandChip,
                {
                  backgroundColor: pressed ? colors.brandOrange : 'rgba(0,0,0,0.55)',
                  borderRadius: radius.full,
                  transform: [{ scale: pressed ? 0.90 : 1 }],
                },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View full size photo"
            >
              <Maximize2 size={12} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleRetake}
              style={({ pressed }) => [
                styles.retakeChip,
                {
                  backgroundColor: pressed ? colors.brandOrange : 'rgba(0,0,0,0.55)',
                  borderRadius: radius.full,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
            >
              <RefreshCw size={12} color="#FFFFFF" />
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.locationRow, { marginTop: spacing.lg }]}>
          <MapPin size={16} color={colors.brandOrange} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>Incident Location</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: 2 }}>
              {draft.incidentPlaceName ?? (draft.incidentLocation ? 'Location pinned on map' : 'Location not pinned')}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.fieldLabel,
            { color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.lg, marginBottom: spacing.xs },
          ]}
        >
          Description (optional)
        </Text>
        <TextInput
          value={draft.description}
          onChangeText={(t) => updateDraft({ description: t })}
          placeholder="Briefly describe what you see."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          style={[
            styles.textArea,
            {
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              fontSize: typography.size.sm,
            },
          ]}
        />

        {submitError ? (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginTop: spacing.md }}>{submitError}</Text>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Submit Fire Report" onPress={() => setIsConfirmVisible(true)} />
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700', textAlign: 'center' },
  photo: { width: '100%', height: 220 },
  expandChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  retakeChip: {
    position: 'absolute',
    top: 12,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 30,
    gap: 4,
  },
  retakeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: { fontWeight: '600' },
  textArea: { borderWidth: 1.5, padding: 12, minHeight: 90, textAlignVertical: 'top' },
  warningCard: { flexDirection: 'row', padding: 12, borderWidth: 1 },
});