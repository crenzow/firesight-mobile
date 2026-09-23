import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
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

const STATUS_META: Record<
  BFPIncidentStatus,
  { label: string; icon: (color: string, size: number) => React.ReactNode }
> = {
  pending:    { label: 'Reported',   icon: (c, s) => <Clock        size={s} color={c} /> },
  accepted:   { label: 'Accepted',   icon: (c, s) => <ShieldCheck  size={s} color={c} /> },
  dispatched: { label: 'Dispatched', icon: (c, s) => <Truck        size={s} color={c} /> },
  resolved:   { label: 'Resolved',   icon: (c, s) => <CheckCircle2 size={s} color={c} /> },
  invalid:    { label: 'Invalid',    icon: (c, s) => <XCircle      size={s} color={c} /> },
};

export const IncidentStatusBadge: React.FC<{ status: BFPIncidentStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const { colors, radius, typography } = useTheme();

  const color =
    status === 'resolved'   ? colors.success
    : status === 'dispatched' ? colors.brandOrange
    : status === 'accepted'   ? colors.info
    : status === 'invalid'    ? colors.textMuted
    : colors.warning;

  const meta = STATUS_META[status] || STATUS_META['pending'];
  const isSm = size === 'sm';
  const iconSize = isSm ? 11 : 13;
  const fontSize = isSm ? typography.size.xs : typography.size.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}18`,
          borderColor: `${color}35`,
          borderRadius: radius.full,
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 3 : 5,
        },
      ]}
    >
      {meta.icon(color, iconSize)}
      <Text style={{ color, fontSize, fontWeight: '700', marginLeft: 5 }}>
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
});