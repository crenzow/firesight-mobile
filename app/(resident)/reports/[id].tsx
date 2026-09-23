import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Check, Clock, ShieldCheck, Truck, CheckCircle2, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { reportService } from '../../../services/api/reportService';
import { CommunityReport, ReportStatus, ReportStatusHistoryEntry } from '../../../services/api/models';
import { StatusBadge } from '../../../components/home/StatusBadge';
import { formatFullDate, formatTime } from '../../../utils/formatters';
import { APP_CONFIG } from '../../../constants/config';

const TIMELINE_STEPS: ReportStatus[] = ['pending', 'accepted', 'dispatched', 'resolved'];

const getStepConfig = (step: ReportStatus, colors: any) => {
  switch (step) {
    case 'pending': return { Icon: Clock, color: colors.warning, label: 'Under Review' };
    case 'accepted': return { Icon: ShieldCheck, color: colors.info, label: 'Accepted' };
    case 'dispatched': return { Icon: Truck, color: colors.brandOrange, label: 'Dispatched' };
    case 'resolved': return { Icon: CheckCircle2, color: colors.success, label: 'Resolved' };
    default: return { Icon: Check, color: colors.textMuted, label: step };
  }
};

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Report Details" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>

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
            {report.status === 'invalid' ? (
              <View style={{ alignItems: 'center', padding: spacing.lg }}>
                <XCircle size={48} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
                <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginBottom: spacing.xs, textAlign: 'center' }}>
                  Report Marked as Invalid
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 }}>
                  This report has been reviewed and marked as invalid by the BFP. It may be a duplicate, a false alarm, or missing crucial information.
                </Text>
              </View>
            ) : (
              TIMELINE_STEPS.map((step, index) => {
              const isComplete = report.status === 'invalid' ? false : index <= currentStepIndex;
              const isActive = index === currentStepIndex;
              const entry = history.find((h) => h.status === step);
              const isLast = index === TIMELINE_STEPS.length - 1;
              const config = getStepConfig(step, colors);
              const { Icon } = config;

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: isComplete ? `${config.color}15` : colors.background,
                          borderColor: isComplete ? config.color : colors.border,
                          borderWidth: isActive ? 2 : 1,
                          width: isActive ? 32 : 28,
                          height: isActive ? 32 : 28,
                          borderRadius: isActive ? 16 : 14,
                        },
                      ]}
                    >
                      <Icon 
                        size={isActive ? 16 : 14} 
                        color={isComplete ? config.color : colors.textMuted} 
                      />
                    </View>
                    {!isLast ? (
                      <View 
                        style={[
                          styles.timelineLine, 
                          { 
                            backgroundColor: isComplete && index < currentStepIndex ? config.color : colors.border,
                            opacity: isComplete && index < currentStepIndex ? 1 : 0.5
                          }
                        ]} 
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.xl, justifyContent: 'center' }}>
                    <Text
                      style={{
                        color: isActive ? colors.textPrimary : isComplete ? colors.textSecondary : colors.textMuted,
                        fontSize: isActive ? typography.size.md : typography.size.sm,
                        fontWeight: isActive ? '800' : isComplete ? '600' : '500',
                      }}
                    >
                      {config.label}
                    </Text>
                    {entry ? (
                      <View style={{ marginTop: 4 }}>
                        {entry.notes && (
                           <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 20, marginBottom: 4 }}>
                             {entry.notes}
                           </Text>
                        )}
                        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
                          {formatFullDate(entry.created_at)} · {formatTime(entry.created_at)}
                        </Text>
                      </View>
                    ) : (
                      isActive && (
                        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>
                          Currently in this status.
                        </Text>
                      )
                    )}
                  </View>
                </View>
              );
            }))}
          </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
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