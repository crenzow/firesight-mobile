import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

/**
 * NOTE ON DATA MODEL: the database's `community_report.status` enum
 * currently only has ('pending','accepted','resolved','invalid') — no
 * 'dispatched'. This component/type already models the full workflow you
 * described (Reported → Accepted → Dispatched → Resolved), anticipating
 * a small migration:
 *
 *   ALTER TABLE community_report
 *     MODIFY status ENUM('pending','accepted','dispatched','resolved','invalid')
 *     DEFAULT 'pending';
 *
 * Until that migration runs, 'dispatched' simply won't come back from the
 * API yet — everything else works unchanged.
 */
export type BFPIncidentStatus = 'pending' | 'accepted' | 'dispatched' | 'resolved' | 'invalid';

export const STATUS_ORDER: BFPIncidentStatus[] = ['pending', 'accepted', 'dispatched', 'resolved'];

const STATUS_LABELS: Record<BFPIncidentStatus, string> = {
  pending: 'Reported',
  accepted: 'Accepted',
  dispatched: 'Dispatched',
  resolved: 'Resolved',
  invalid: 'Invalid',
};

export const IncidentStatusBadge: React.FC<{
  status: BFPIncidentStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'md' }) => {
  const { colors, radius, typography } = useTheme();

  const color =
    status === 'resolved'
      ? colors.success
      : status === 'dispatched'
      ? colors.brandOrange
      : status === 'accepted'
      ? colors.info
      : status === 'invalid'
      ? colors.textMuted
      : colors.warning;

  const label = STATUS_LABELS[status] || STATUS_LABELS.pending;
  const isSm = size === 'sm';
  const fontSize = isSm ? typography.size.xs : typography.size.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}18`,
          borderRadius: radius.full,
          paddingHorizontal: isSm ? 9 : 11,
          paddingVertical: isSm ? 3.5 : 5,
        },
      ]}
    >
      <Text style={{ color, fontSize, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
