import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Check } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { reportService } from '../../../services/api/reportService';
import { CommunityReport, ReportStatus, ReportStatusHistoryEntry } from '../../../services/api/models';
import { StatusBadge } from '../../../components/home/StatusBadge';
import { formatFullDate, formatTime } from '../../../utils/formatters';
import { APP_CONFIG } from '../../../constants/config';

const TIMELINE_STEPS: ReportStatus[] = ['pending', 'verified', 'resolved'];

export default function ReportDetailScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<CommunityReport | null>(null);
  const [history, setHistory] = useState<ReportStatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const reportId = Number(id);
    Promise.all([reportService.getReportById(reportId), reportService.getStatusHistory(reportId)])
      .then(([reportData, historyData]) => {
        setReport(reportData);
        setHistory(historyData);
      })
      .catch(() => {
        // Leave state as-is; UI below shows an empty/loading fallback.
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const currentStepIndex = report ? TIMELINE_STEPS.indexOf(report.status) : -1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
          Report Details
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading || !report ? (
        <View style={styles.loadingState}>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
            {isLoading ? 'Loading report…' : 'Report not found.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {report.report_image ? (
            <Image
              source={{ uri: `${APP_CONFIG.API_BASE_URL}/${report.report_image}` }}
              style={[styles.photo, { borderRadius: radius.lg }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]} />
          )}

          <View style={styles.topRow}>
            <StatusBadge status={report.status} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
              Ref. #FR-{new Date(report.created_at).getFullYear()}-{String(report.report_id).padStart(4, '0')}
            </Text>
          </View>

          <View style={[styles.infoRow, { marginTop: spacing.md }]}>
            <MapPin size={16} color={colors.textMuted} />
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginLeft: 6, fontWeight: '600' }}>
              {report.barangay_name ?? 'Brgy. Poblacion'}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2, marginLeft: 22 }}>
            {report.latitude.toFixed(5)}°N, {report.longitude.toFixed(5)}°E
          </Text>

          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.lg, lineHeight: 20 }}>
            {report.description}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.md, marginTop: spacing.xl }]}>
            Status Timeline
          </Text>

          <View
            style={[
              styles.timelineCard,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm },
              shadow.card,
            ]}
          >
            {TIMELINE_STEPS.map((step, index) => {
              const isComplete = report.status === 'invalid' ? false : index <= currentStepIndex;
              const entry = history.find((h) => h.status === step);
              const isLast = index === TIMELINE_STEPS.length - 1;

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: isComplete ? colors.success : colors.border,
                          borderColor: isComplete ? colors.success : colors.border,
                        },
                      ]}
                    >
                      {isComplete ? <Check size={12} color="#FFFFFF" /> : null}
                    </View>
                    {!isLast ? (
                      <View style={[styles.timelineLine, { backgroundColor: isComplete ? colors.success : colors.border }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.lg }}>
                    <Text
                      style={{
                        color: isComplete ? colors.textPrimary : colors.textMuted,
                        fontSize: typography.size.sm,
                        fontWeight: '700',
                        textTransform: 'capitalize',
                      }}
                    >
                      {step}
                    </Text>
                    {entry ? (
                      <>
                        <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 2 }}>
                          {entry.notes}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 }}>
                          {formatFullDate(entry.created_at)} · {formatTime(entry.created_at)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: 200 },
  photoPlaceholder: { width: '100%', height: 200 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontWeight: '700' },
  timelineCard: {},
  timelineRow: { flexDirection: 'row' },
  timelineIndicator: { alignItems: 'center', marginRight: 12 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
});