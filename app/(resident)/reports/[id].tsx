import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  XCircle,
  ZoomIn,
  X,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import * as Haptics from 'expo-haptics';
import { StatusBadge } from '../../../components/home/StatusBadge';
import { PhotoLightboxModal } from '../../../components/ui/PhotoLightboxModal';
import { reportService } from '../../../services/api/reportService';
import {
  CommunityReport,
  ReportStatus,
  ReportStatusHistoryEntry,
} from '../../../services/api/models';
import { formatFullDate, formatTime, formatIncidentDateTime } from '../../../utils/formatters';
import { APP_CONFIG, getStorageImageUrl } from '../../../constants/config';
import { reverseGeocode } from '../../../utils/geocoding';

interface StepDefinition {
  key: ReportStatus;
  label: string;
  defaultDescription: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
}

const TIMELINE_STEPS: StepDefinition[] = [
  {
    key: 'pending',
    label: 'Pending',
    defaultDescription: 'Report received. Awaiting station review and assessment.',
    Icon: Clock,
    color: '#D97706',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    defaultDescription: 'Report verified by BFP station. Units being organized.',
    Icon: ShieldCheck,
    color: '#2563EB',
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    defaultDescription: 'Fire responder units have been dispatched and are en route.',
    Icon: Truck,
    color: '#EA580C',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    defaultDescription: 'Incident has been controlled and marked resolved by responding units.',
    Icon: CheckCircle2,
    color: '#059669',
  },
];

export default function ReportDetailScreen() {
  const { colors, spacing, typography, radius, shadow, isDark } = useTheme();
  const { id, from, listFrom } = useLocalSearchParams<{ id: string; from?: string; listFrom?: string }>();
  const [report, setReport] = useState<CommunityReport | null>(null);
  const [history, setHistory] = useState<ReportStatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState('Loading location…');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleBack = useCallback(() => {
    if (from === '/(resident)/reports' || from === 'reports' || from === 'reports/index' || (from && from.includes('reports'))) {
      router.replace({
        pathname: '/(resident)/reports',
        params: listFrom ? { from: listFrom } : undefined,
      } as any);
    } else if (from && from.includes('profile')) {
      router.replace('/(resident)/profile');
    } else {
      router.replace('/(resident)/home');
    }
  }, [from, listFrom]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
          return true;
        }
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isPreviewOpen, handleBack])
  );

  useEffect(() => {
    if (!id) return;
    const reportId = Number(id);
    Promise.all([reportService.getReportById(reportId), reportService.getStatusHistory(reportId)])
      .then(([reportData, historyData]) => {
        setReport(reportData);
        setHistory(historyData);
      })
      .catch(() => {
        // Fallback handled by UI
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!report) return;
    let isMounted = true;
    setLocationName(report.barangay_name ?? 'Loading location…');
    reverseGeocode(report.latitude, report.longitude).then((name) => {
      if (isMounted) {
        setLocationName(
          name !== 'Unknown area' ? name : report.barangay_name ?? 'Unknown location'
        );
      }
    });
    return () => {
      isMounted = false;
    };
  }, [report]);

  const currentStepIndex = report
    ? TIMELINE_STEPS.findIndex((s) => s.key === report.status)
    : -1;

  const photoUri = getStorageImageUrl(report?.report_image);

  const referenceNo = report
    ? `FR-${new Date(report.created_at).getFullYear()}-${String(report.report_id).padStart(4, '0')}`
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Report Details" onBack={handleBack} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {isLoading ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Skeleton */}
            <Skeleton width="100%" height={210} borderRadius={18} />

            {/* Overview Skeleton Card */}
            <View style={{ marginTop: spacing.md }}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Skeleton width={80} height={24} borderRadius={6} />
                  <Skeleton width={100} height={20} borderRadius={6} />
                </View>
                <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
                <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                <Skeleton width="75%" height={14} borderRadius={4} />
              </Card>
            </View>

            {/* Timeline Skeleton Card */}
            <View style={{ marginTop: spacing.md }}>
              <Card>
                <Skeleton width={120} height={18} borderRadius={6} style={{ marginBottom: 16 }} />
                {[0, 1, 2].map((step) => (
                  <View key={step} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                    <Skeleton width={32} height={32} borderRadius={16} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton width="60%" height={14} borderRadius={4} />
                      <Skeleton width="40%" height={12} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          </ScrollView>
        ) : !report ? (
          <View style={styles.centerState}>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
              Report not found.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── 1. Photo Card (Top of Report) ── */}
            {photoUri ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setIsPreviewOpen(true);
                }}
                style={({ pressed }) => [
                  styles.photoCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Tap to preview photo"
              >
                <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="cover" />
                <View style={styles.photoZoomBadge}>
                  <ZoomIn size={13} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.photoZoomText}>Tap to view</Text>
                </View>
              </Pressable>
            ) : null}

            {/* ── 2. Report Overview Card ── */}
            <View style={{ marginTop: photoUri ? spacing.md : 0 }}>
              <Card>
                {/* Header: StatusBadge + Reference No */}
                <View style={styles.topMetaRow}>
                <StatusBadge status={report.status} />
                <View
                  style={[
                    styles.refPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                    },
                  ]}
                >
                  <Text style={[styles.refText, { color: colors.textSecondary }]}>
                    #{referenceNo}
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={[styles.infoRow, { marginTop: spacing.md }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${colors.brandOrange}15` }]}>
                  <MapPin size={16} color={colors.brandOrange} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
                    {locationName}
                  </Text>
                  <Text style={[styles.coordText, { color: colors.textMuted }]}>
                    {report.latitude.toFixed(5)}°N, {report.longitude.toFixed(5)}°E
                  </Text>
                </View>
              </View>

              {/* Timestamp */}
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                  <Calendar size={15} color={colors.textMuted} />
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary, marginLeft: 10 }]}>
                  Reported on {formatFullDate(report.created_at)} at {formatTime(report.created_at)}
                </Text>
              </View>

              {/* Description */}
              {!!report.description?.trim() && (
                <View
                  style={[
                    styles.descBox,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginTop: spacing.md,
                    },
                  ]}
                >
                  <Text style={[styles.descLabel, { color: colors.textMuted }]}>
                    REPORTER NOTE
                  </Text>
                  <Text style={[styles.descBody, { color: colors.textPrimary }]}>
                    {report.description.trim()}
                  </Text>
                </View>
              )}
              </Card>
            </View>

            {/* ── 3. Status Timeline ── */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Status Timeline
            </Text>

            <Card padding={spacing.lg}>
              {report.status === 'invalid' ? (
                <View style={styles.invalidBox}>
                  <View style={[styles.invalidIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <XCircle size={32} color="#DC2626" />
                  </View>
                  <Text style={[styles.invalidTitle, { color: colors.textPrimary }]}>
                    Report Marked as Invalid
                  </Text>
                  <Text style={[styles.invalidDesc, { color: colors.textSecondary }]}>
                    This report has been reviewed and marked as invalid by the BFP. It may be a duplicate, false alarm, or missing critical information.
                  </Text>
                  {history.find((h) => h.status === 'invalid')?.notes && (
                    <View
                      style={[
                        styles.historyNoteBox,
                        {
                          backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2',
                          borderColor: '#FCA5A5',
                        },
                      ]}
                    >
                      <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600' }}>
                        BFP Remarks:
                      </Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, marginTop: 2 }}>
                        {history.find((h) => h.status === 'invalid')?.notes}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                TIMELINE_STEPS.map((step, index) => {
                  const isComplete = index < currentStepIndex;
                  const isActive = index === currentStepIndex;
                  const isFuture = index > currentStepIndex;
                  const isLast = index === TIMELINE_STEPS.length - 1;
                  const StepIcon = step.Icon;
                  const entry = history.find((h) => h.status === step.key);
                  const timestamp = entry?.created_at ?? (step.key === 'pending' ? report.created_at : null);

                  return (
                    <View key={step.key} style={styles.timelineRow}>
                      {/* Left: Indicator & Connector Line */}
                      <View style={styles.indicatorCol}>
                        <View
                          style={[
                            styles.dotWrapper,
                            isActive
                              ? [
                                  styles.activeDot,
                                  {
                                    borderColor: step.key === 'resolved' ? '#34C759' : '#F4622B',
                                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                                    shadowColor: step.key === 'resolved' ? '#34C759' : '#F4622B',
                                  },
                                ]
                              : isComplete
                              ? [styles.completeDot, { backgroundColor: '#34C759' }]
                              : [
                                  styles.futureDot,
                                  {
                                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E5EA',
                                    backgroundColor: isDark ? '#1C1C1E' : '#F8F9FA',
                                  },
                                ],
                          ]}
                        >
                          {isActive ? (
                            step.key === 'resolved' ? (
                              <CheckCircle2 size={22} color="#34C759" strokeWidth={2.4} />
                            ) : (
                              <StepIcon size={20} color="#F4622B" strokeWidth={2.4} />
                            )
                          ) : isComplete ? (
                            <Check size={16} color="#FFFFFF" strokeWidth={3} />
                          ) : (
                            <StepIcon size={14} color="#8E8E93" strokeWidth={2} />
                          )}
                        </View>

                        {!isLast && (
                          <View
                            style={[
                              styles.connectorLine,
                              {
                                backgroundColor: isComplete || (isActive && step.key === 'resolved')
                                  ? '#34C759'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.1)'
                                  : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}
                          />
                        )}
                      </View>

                      {/* Right: Step Content */}
                      <View
                        style={[
                          styles.stepContentCol,
                          { paddingBottom: isLast ? 0 : spacing.lg },
                        ]}
                      >
                        {isActive ? (
                          /* ── EMPHASIZED CURRENT STATUS (Big & Open, No Rectangle) ── */
                          <View style={styles.activeContentCol}>
                            <View style={styles.activeHeaderRow}>
                              <Text style={[styles.activeStepTitle, { color: colors.textPrimary }]}>
                                {step.label}
                              </Text>

                              <View
                                style={[
                                  styles.activeBadge,
                                  {
                                    backgroundColor: step.key === 'resolved' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(244, 98, 43, 0.1)',
                                    borderColor: step.key === 'resolved' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(244, 98, 43, 0.3)',
                                  },
                                ]}
                              >
                                {step.key === 'resolved' ? (
                                  <Check size={11} color="#34C759" strokeWidth={3} />
                                ) : (
                                  <View
                                    style={[styles.pulsingDot, { backgroundColor: '#F4622B' }]}
                                  />
                                )}
                                <Text style={[styles.activeBadgeText, { color: step.key === 'resolved' ? '#34C759' : '#F4622B' }]}>
                                  {step.key === 'resolved' ? 'Resolved' : 'Current Status'}
                                </Text>
                              </View>
                            </View>

                            <Text
                              style={[styles.activeStepDesc, { color: colors.textSecondary }]}
                            >
                              {entry?.notes?.trim()
                                ? entry.notes.trim()
                                : step.defaultDescription}
                            </Text>

                            {timestamp ? (
                              <Text style={[styles.activeTimestamp, { color: colors.textMuted }]}>
                                Updated {formatIncidentDateTime(timestamp)}
                              </Text>
                            ) : null}
                          </View>
                        ) : isComplete ? (
                          /* ── COMPLETED STEP (Clean with full height) ── */
                          <View style={styles.compactContentBox}>
                            <View style={styles.compactHeaderRow}>
                              <Text
                                style={[styles.compactStepTitle, { color: colors.textPrimary }]}>
                                {step.label}
                              </Text>
                              {timestamp ? (
                                <Text
                                  style={[styles.compactTimestamp, { color: colors.textMuted }]}>
                                  {formatIncidentDateTime(timestamp)}
                                </Text>
                              ) : null}
                            </View>

                            <Text
                              style={[styles.compactStepDesc, { color: colors.textSecondary }]}>
                              {entry?.notes?.trim()
                                ? entry.notes.trim()
                                : step.defaultDescription}
                            </Text>
                          </View>
                        ) : (
                          /* ── SUBDUED FUTURE STEP ── */
                          <View style={styles.futureContentBox}>
                            <Text style={[styles.futureStepTitle, { color: colors.textMuted }]}>
                              {step.label}
                            </Text>
                            <Text style={[styles.futureStepDesc, { color: colors.textMuted }]}>
                              {step.defaultDescription}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          </ScrollView>
        )}

        {/* ── Fullscreen Lightbox Modal ── */}
        {photoUri && (
          <PhotoLightboxModal
            visible={isPreviewOpen}
            imageSource={{ uri: photoUri }}
            title={locationName}
            subtitle={`#${referenceNo}`}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {},
  photoCard: {
    width: '100%',
    height: 210,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoZoomBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  photoZoomText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  coordText: {
    fontSize: 12,
    marginTop: 2,
  },
  dateText: {
    fontSize: 13,
  },
  descBox: {
    borderWidth: 1,
  },
  descLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  invalidBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  invalidIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  invalidTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  invalidDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  historyNoteBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  timelineRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 44,
    marginRight: 14,
  },
  dotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
  },
  completeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 3,
  },
  futureDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 3,
  },
  connectorLine: {
    width: 2.5,
    flex: 1,
    marginVertical: 4,
  },
  stepContentCol: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  /* Emphasized Active Status (Open, No Rectangle) */
  activeContentCol: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  activeStepTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activeStepDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  activeTimestamp: {
    fontSize: 12,
    fontWeight: '600',
  },
  /* Completed Step */
  compactContentBox: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  compactStepTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactTimestamp: {
    fontSize: 12,
  },
  compactStepDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  /* Subdued Future Step */
  futureContentBox: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  futureStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  futureStepDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImgContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalFullImg: {
    width: '100%',
    height: '100%',
  },
});