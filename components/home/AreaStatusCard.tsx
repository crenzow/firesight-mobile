import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { RiskLevel } from '../../services/api/models';

interface AreaStatusCardProps {
  barangayName: string;
  riskLevel: RiskLevel;
  incidentsThisMonth: number;
  advisoryText?: string;
}

const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'Normal',
  moderate: 'Elevated Risk',
  high: 'High Risk',
};

export const AreaStatusCard: React.FC<AreaStatusCardProps> = ({
  barangayName,
  riskLevel,
  incidentsThisMonth,
  advisoryText,
}) => {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const riskColor = riskLevel === 'high' ? colors.danger : riskLevel === 'moderate' ? colors.warning : colors.success;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.lg },
        shadow.card,
      ]}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.textMuted, fontSize: typography.size.xs }]}>
            AREA STATUS · {barangayName.toUpperCase()}
          </Text>
          <View style={[styles.riskRow, { marginTop: spacing.xs }]}>
            <AlertTriangle size={16} color={riskColor} />
            <Text style={[styles.riskLabel, { color: riskColor, fontSize: typography.size.md, marginLeft: 6 }]}>
              {RISK_LABEL[riskLevel]}
            </Text>
          </View>
          {advisoryText ? (
            <Text style={[styles.advisory, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 }]}>
              {advisoryText}
            </Text>
          ) : null}
        </View>

        <View style={styles.incidentBox}>
          <Text style={[styles.incidentLabel, { color: colors.textMuted, fontSize: typography.size.xs }]}>
            INCIDENTS
          </Text>
          <Text style={[styles.incidentCount, { color: colors.brandOrange, fontSize: typography.size.xxl }]}>
            {incidentsThisMonth}
          </Text>
          <Text style={[styles.incidentLabel, { color: colors.textMuted, fontSize: typography.size.xs }]}>
            this month
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLabel: {
    fontWeight: '700',
  },
  advisory: {
    lineHeight: 16,
    maxWidth: 220,
  },
  incidentBox: {
    alignItems: 'flex-end',
  },
  incidentLabel: {
    fontWeight: '600',
  },
  incidentCount: {
    fontWeight: '800',
  },
});