import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Check,
  ChevronRight,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BFPIncidentStatus, STATUS_ORDER } from './IncidentStatusBadge';
import { BFPIncidentStatusHistoryEntry } from '../../services/api/bfpModels';
import { formatFullDate, formatTime } from '../../utils/formatters';

interface StageDefinition {
  key: BFPIncidentStatus;
  label: string;
  defaultDescription: string;
  actionLabel: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const STAGES: StageDefinition[] = [
  {
    key: 'pending',
    label: 'Reported',
    defaultDescription: 'Incident report received and awaiting station assessment.',
    actionLabel: 'Verify Incident',
    Icon: Clock,
  },
  {
    key: 'accepted',
    label: 'Accepted',
    defaultDescription: 'Incident confirmed by station. Response units mobilizing.',
    actionLabel: 'Mark as Accepted',
    Icon: ShieldCheck,
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    defaultDescription: 'Fire responder units have been dispatched and are en route.',
    actionLabel: 'Dispatch Units',
    Icon: Truck,
  },
  {
    key: 'resolved',
    label: 'Resolved',
    defaultDescription: 'Incident controlled, contained, and marked resolved.',
    actionLabel: 'Mark as Resolved',
    Icon: CheckCircle2,
  },
];

interface StatusStepperProps {
  status: BFPIncidentStatus;
  history?: BFPIncidentStatusHistoryEntry[];
  createdAt?: string | null;
  onAdvance: (nextStatus: BFPIncidentStatus) => void;
  disabled?: boolean;
}

/**
 * Premium Apple-style Response Status Timeline for BFP personnel.
 * Modeled after the Resident status timeline for complete visual and UX harmony.
 */
export const StatusStepper: React.FC<StatusStepperProps> = ({
  status,
  history,
  createdAt,
  onAdvance,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();
  const safeHistory = Array.isArray(history) ? history : [];

  if (status === 'invalid') {
    const invalidEntry = safeHistory.find((h) => h.status === 'invalid');
    return (
      <View style={styles.invalidBox}>
        <View style={[styles.invalidIconCircle, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }]}>
          <XCircle size={30} color="#DC2626" />
        </View>
        <Text style={[styles.invalidTitle, { color: colors.textPrimary }]}>
          Report Marked as Invalid
        </Text>
        <Text style={[styles.invalidDesc, { color: colors.textSecondary }]}>
          This report was investigated and closed as an invalid or false report.
        </Text>
        {invalidEntry?.notes ? (
          <View
            style={[
              styles.historyNoteBox,
              {
                backgroundColor: isDark ? 'rgba(220,38,38,0.08)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(220,38,38,0.2)' : '#FCA5A5',
              },
            ]}
          >
            <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700' }}>
              Officer Remarks:
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
              {invalidEntry.notes}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <View style={styles.container}>
      {STAGES.map((stage, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isNext = index === currentIndex + 1;
        const isUpcoming = index > currentIndex + 1;
        const isLast = index === STAGES.length - 1;
        const StepIcon = stage.Icon;

        // Find relevant history entry
        const entry = safeHistory.slice().reverse().find((h) => h.status === stage.key);
        const timestamp = entry?.created_at ?? (stage.key === 'pending' ? createdAt : null);

        return (
          <View key={stage.key} style={styles.timelineRow}>
            {/* Left: Indicator & Connector Line */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.dotWrapper,
                  isCurrent
                    ? [
                        styles.activeDot,
                        {
                          borderColor: stage.key === 'resolved' ? '#34C759' : '#F4622B',
                          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                          shadowColor: stage.key === 'resolved' ? '#34C759' : '#F4622B',
                        },
                      ]
                    : isDone
                    ? [styles.completeDot, { backgroundColor: '#34C759' }]
                    : isNext
                    ? [
                        styles.nextDot,
                        {
                          borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#C7C7CC',
                          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        },
                      ]
                    : [
                        styles.futureDot,
                        {
                          borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E5EA',
                          backgroundColor: isDark ? '#1C1C1E' : '#F8F9FA',
                        },
                      ],
                ]}
              >
                {isCurrent ? (
                  stage.key === 'resolved' ? (
                    <CheckCircle2 size={22} color="#34C759" strokeWidth={2.4} />
                  ) : (
                    <StepIcon size={20} color="#F4622B" strokeWidth={2.4} />
                  )
                ) : isDone ? (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                ) : isNext ? (
                  <StepIcon size={14} color="#8E8E93" strokeWidth={2} />
                ) : (
                  <View style={[styles.futureInnerDot, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
                )}
              </View>

              {!isLast ? (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: isDone || (isCurrent && stage.key === 'resolved')
                        ? '#34C759'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                />
              ) : null}
            </View>

            {/* Right: Stage Content */}
            <View
              style={[
                styles.stepContentCol,
                { paddingBottom: isLast ? 4 : 22 },
              ]}
            >
              {isCurrent ? (
                /* ── ACTIVE CURRENT STATUS ── */
                <View style={styles.activeContentCol}>
                  <View style={styles.activeHeaderRow}>
                    <Text style={[styles.activeStepTitle, { color: colors.textPrimary }]}>
                      {stage.label}
                    </Text>

                    {stage.key === 'resolved' ? (
                      <View
                        style={[
                          styles.activeBadge,
                          {
                            backgroundColor: 'rgba(52, 199, 89, 0.1)',
                            borderColor: 'rgba(52, 199, 89, 0.3)',
                          },
                        ]}
                      >
                        <Check size={11} color="#34C759" strokeWidth={3} />
                        <Text style={[styles.activeBadgeText, { color: '#34C759' }]}>
                          Resolved
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.activeBadge}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.activeBadgeText}>Current Status</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.activeStepDesc, { color: colors.textSecondary }]}>
                    {entry?.notes?.trim() ? entry.notes.trim() : stage.defaultDescription}
                  </Text>

                  {timestamp ? (
                    <Text style={styles.activeTimestamp}>
                      Updated {formatFullDate(timestamp)} at {formatTime(timestamp)}
                      {entry?.changed_by_name ? ` · Officer ${entry.changed_by_name}` : ''}
                    </Text>
                  ) : null}
                </View>
              ) : isDone ? (
                /* ── COMPLETED STAGE ── */
                <View style={styles.compactContentBox}>
                  <View style={styles.compactHeaderRow}>
                    <Text style={[styles.compactStepTitle, { color: colors.textPrimary }]}>
                      {stage.label}
                    </Text>
                    {timestamp ? (
                      <Text style={styles.compactTimestamp}>
                        {formatTime(timestamp)}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={[styles.compactStepDesc, { color: colors.textSecondary }]}>
                    {entry?.notes?.trim() ? entry.notes.trim() : stage.defaultDescription}
                  </Text>

                  {entry?.changed_by_name ? (
                    <Text style={styles.officerTag}>
                      Confirmed by Officer {entry.changed_by_name}
                    </Text>
                  ) : null}
                </View>
              ) : isNext ? (
                /* ── NEXT STAGE (WITH ADVANCE ACTION) ── */
                <View style={styles.nextContentBox}>
                  <View style={styles.compactHeaderRow}>
                    <Text style={[styles.nextStepTitle, { color: colors.textPrimary }]}>
                      {stage.label}
                    </Text>
                  </View>

                  <Text style={styles.nextStepDesc}>
                    {stage.defaultDescription}
                  </Text>

                  {stage.actionLabel ? (
                    <Pressable
                      onPress={() => !disabled && onAdvance(stage.key)}
                      disabled={disabled}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: pressed ? '#D9521E' : '#F4622B',
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          opacity: disabled ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.actionButtonText}>
                        {stage.actionLabel}
                      </Text>
                      <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.8} style={{ marginLeft: 4 }} />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                /* ── UPCOMING FUTURE STAGE ── */
                <View style={styles.futureContentBox}>
                  <Text style={[styles.futureStepTitle, { color: colors.textMuted }]}>
                    {stage.label}
                  </Text>
                  <Text style={[styles.futureStepDesc, { color: colors.textMuted }]}>
                    {stage.defaultDescription}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 42,
    marginRight: 14,
  },
  dotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
  },
  completeDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginTop: 2,
  },
  nextDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 2,
  },
  futureDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginTop: 3,
  },
  futureInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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

  // Active status
  activeContentCol: {
    paddingTop: 1,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activeStepTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(244, 98, 43, 0.08)',
    borderColor: 'rgba(244, 98, 43, 0.25)',
    gap: 5,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4622B',
  },
  activeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#F4622B',
    letterSpacing: 0.2,
  },
  activeStepDesc: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 5,
  },
  activeTimestamp: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E8E93',
  },

  // Completed status
  compactContentBox: {
    paddingTop: 3,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  compactStepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  compactTimestamp: {
    fontSize: 11.5,
    color: '#8E8E93',
    fontWeight: '500',
  },
  compactStepDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  officerTag: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Next status
  nextContentBox: {
    paddingTop: 3,
  },
  nextStepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  nextStepDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#8E8E93',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 11,
    alignSelf: 'flex-start',
    shadowColor: '#F4622B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Future status
  futureContentBox: {
    paddingTop: 3,
  },
  futureStepTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  futureStepDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Invalid state
  invalidBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  invalidIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  invalidTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  invalidDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  historyNoteBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
});
