import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  FileText,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BFPIncidentStatus, STATUS_ORDER } from './IncidentStatusBadge';

// ─── Stage metadata ────────────────────────────────────────────────────────────
const STAGES: {
  key: BFPIncidentStatus;
  label: string;
  sublabel: string;
  actionLabel: string;
  icon: (color: string, size: number) => React.ReactNode;
}[] = [
  {
    key: 'pending',
    label: 'Reported',
    sublabel: 'Awaiting BFP verification',
    actionLabel: '',
    icon: (color, size) => <FileText size={size} color={color} />,
  },
  {
    key: 'accepted',
    label: 'Accepted',
    sublabel: 'Incident confirmed as genuine',
    actionLabel: 'Mark as Accepted',
    icon: (color, size) => <ShieldCheck size={size} color={color} />,
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    sublabel: 'Fire truck en route to scene',
    actionLabel: 'Dispatch Units',
    icon: (color, size) => <Truck size={size} color={color} />,
  },
  {
    key: 'resolved',
    label: 'Resolved',
    sublabel: 'Incident contained and closed',
    actionLabel: 'Mark as Resolved',
    icon: (color, size) => <CheckCircle2 size={size} color={color} />,
  },
];

interface StatusStepperProps {
  status: BFPIncidentStatus;
  onAdvance: (nextStatus: BFPIncidentStatus) => void;
  disabled?: boolean;
}

/**
 * Vertical card-based status stepper.
 *
 * Each stage is a full-width row showing:
 *   • A coloured icon badge (done / active / upcoming)
 *   • Stage label + description
 *   • A CTA button only on the immediate *next* stage
 *
 * Tapping only the next stage advances — skipping is intentionally prevented
 * to maintain a clean status-history audit trail.
 *
 * 'invalid' is a separate terminal action handled elsewhere.
 */
export const StatusStepper: React.FC<StatusStepperProps> = ({ status, onAdvance, disabled }) => {
  const { colors, spacing, typography } = useTheme();

  if (status === 'invalid') return null;

  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <View>
      {STAGES.map((stage, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isNext = index === currentIndex + 1;
        const isUpcoming = index > currentIndex + 1;
        const isLast = index === STAGES.length - 1;

        // Icon appearance
        const iconBg = isDone
          ? `${colors.success}18`
          : isCurrent
            ? `${colors.brandOrange}18`
            : isNext
              ? `${colors.info}15`
              : `${colors.border}80`;

        const iconColor = isDone
          ? colors.success
          : isCurrent
            ? colors.brandOrange
            : isNext
              ? colors.info
              : colors.textMuted;

        // Label color
        const labelColor = isDone || isCurrent
          ? colors.textPrimary
          : isNext
            ? colors.textSecondary
            : colors.textMuted;

        const subColor = isDone || isCurrent
          ? colors.textSecondary
          : colors.textMuted;

        return (
          <View key={stage.key}>
            <View
              style={[
                styles.stageRow,
                {
                  paddingVertical: spacing.md,
                  opacity: isUpcoming ? 0.45 : 1,
                },
              ]}
            >
              {/* Timeline column */}
              <View style={styles.timelineCol}>
                {/* Icon badge */}
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: iconBg,
                      borderWidth: isCurrent ? 2 : isNext ? 1.5 : 0,
                      borderColor: isCurrent
                        ? colors.brandOrange
                        : isNext
                          ? `${colors.info}60`
                          : 'transparent',
                    },
                  ]}
                >
                  {stage.icon(iconColor, 18)}
                </View>

                {/* Connector line */}
                {!isLast ? (
                  <View
                    style={[
                      styles.connectorLine,
                      {
                        backgroundColor: isDone
                          ? colors.success
                          : isCurrent
                            ? `${colors.brandOrange}40`
                            : colors.border,
                      },
                    ]}
                  />
                ) : null}
              </View>

              {/* Content column */}
              <View style={[styles.contentCol, { paddingBottom: isLast ? 0 : spacing.md }]}>
                {/* Header row */}
                <View style={styles.labelRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.labelWithBadge}>
                      <Text
                        style={{
                          color: labelColor,
                          fontSize: typography.size.sm,
                          fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                        }}
                      >
                        {stage.label}
                      </Text>

                      {/* CURRENT badge */}
                      {isCurrent ? (
                        <View style={[styles.currentBadge, { backgroundColor: `${colors.brandOrange}20`, borderColor: `${colors.brandOrange}40` }]}>
                          <View style={[styles.currentDot, { backgroundColor: colors.brandOrange }]} />
                          <Text style={{ color: colors.brandOrange, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                            CURRENT
                          </Text>
                        </View>
                      ) : isDone ? (
                        <View style={[styles.currentBadge, { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}30` }]}>
                          <Text style={{ color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                            ✓ DONE
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={{ color: subColor, fontSize: typography.size.xs, marginTop: 2, lineHeight: 17 }}>
                      {stage.sublabel}
                    </Text>
                  </View>
                </View>

                {/* Action button — only on the immediate next stage */}
                {isNext ? (
                  <Pressable
                    onPress={() => !disabled && onAdvance(stage.key)}
                    disabled={disabled}
                    style={({ pressed }) => [
                      styles.actionButton,
                      {
                        backgroundColor: pressed ? colors.brandOrangeDeep : colors.brandOrange,
                        opacity: disabled ? 0.55 : 1,
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: '800', letterSpacing: 0.3 }}>
                      {stage.actionLabel}
                    </Text>
                    <ChevronRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Timeline left column
  timelineCol: {
    width: 48,
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginTop: 6,
    borderRadius: 1,
  },

  // Content right column
  contentCol: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 9, // aligns text with center of 40px icon
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },

  // Status mini-badges
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  currentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // CTA button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
});