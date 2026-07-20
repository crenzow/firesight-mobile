import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { Button } from '../../components/ui/Button';
import { reportService } from '../../services/api/reportService';
import { ApiError } from '../../services/api/client';

export default function ReviewScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { draft, updateDraft, resetDraft } = useReportDraft();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRetake = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!draft.photoUri || !draft.location || !draft.barangayId) {
      setSubmitError('Missing photo, location, or barangay information. Please retake the photo.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await reportService.create({
        description: draft.description,
        latitude: draft.location.latitude,
        longitude: draft.location.longitude,
        location_accuracy_m: draft.location.accuracy ?? undefined,
        barangay_id: draft.barangayId,
        photoUri: draft.photoUri,
      });
      resetDraft();
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
        <Pressable onPress={handleRetake} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
            Review Report
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>Confirm details before submitting</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {draft.photoUri ? (
          <View>
            <Image source={{ uri: draft.photoUri }} style={[styles.photo, { borderRadius: radius.lg }]} resizeMode="cover" />
            <Pressable
              onPress={handleRetake}
              style={[styles.retakeChip, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.full }]}
            >
              <RefreshCw size={12} color="#FFFFFF" />
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.locationRow, { marginTop: spacing.lg }]}>
          <MapPin size={16} color={colors.brandOrange} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>Location</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 1 }}>
              {draft.location
                ? `${draft.location.latitude.toFixed(5)}°N, ${draft.location.longitude.toFixed(5)}°E · ±${Math.round(draft.location.accuracy ?? 0)}m accuracy`
                : 'Location not detected'}
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
          placeholder="Briefly describe what you see — building size, type of fire, people nearby…"
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

        <View
          style={[
            styles.warningCard,
            { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}40`, borderRadius: radius.md, marginTop: spacing.lg },
          ]}
        >
          <AlertTriangle size={16} color={colors.danger} />
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.xs, marginLeft: spacing.sm, flex: 1, lineHeight: 16 }}>
            If there is immediate danger to life, call 160 (BFP) or 911 before submitting this report.
          </Text>
        </View>

        {submitError ? (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginTop: spacing.md }}>{submitError}</Text>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Submit Fire Report" onPress={() => setIsConfirmVisible(true)} />
        </View>
      </ScrollView>

      <Modal visible={isConfirmVisible} transparent animationType="fade" onRequestClose={() => setIsConfirmVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl }, shadow.card]}>
            <View style={[styles.modalIcon, { backgroundColor: `${colors.warning}1A` }]}>
              <AlertTriangle size={28} color={colors.warning} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: '700', textAlign: 'center', marginTop: spacing.md }}>
              Confirm Fire Report
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.size.sm,
                textAlign: 'center',
                marginTop: spacing.xs,
                lineHeight: 19,
              }}
            >
              You are about to submit a fire incident report to the Bureau of Fire Protection. This will alert BFP
              personnel immediately.
            </Text>
            <View style={[styles.modalActions, { marginTop: spacing.lg }]}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="outline" onPress={() => setIsConfirmVisible(false)} disabled={isSubmitting} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Submit Report" onPress={handleSubmit} loading={isSubmitting} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700', textAlign: 'center' },
  photo: { width: '100%', height: 220 },
  retakeChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  retakeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: { fontWeight: '600' },
  textArea: { borderWidth: 1.5, padding: 12, minHeight: 90, textAlignVertical: 'top' },
  warningCard: { flexDirection: 'row', padding: 12, borderWidth: 1 },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
});