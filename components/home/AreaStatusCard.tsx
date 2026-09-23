import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { RiskLevel } from '../../services/api/models';

interface AreaStatusCardProps {
  barangayName: string;
  riskLevel: RiskLevel;
  incidentsThisMonth: number;
  advisoryText?: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; sublabel: string }> = {
  low:      { label: 'Normal',       color: '#10B981', sublabel: 'No active advisories' },
  moderate: { label: 'Elevated',     color: '#F59E0B', sublabel: 'Exercise caution' },
  high:     { label: 'High Risk',    color: '#EF4444', sublabel: 'Active advisory in effect' },
};

export const AreaStatusCard: React.FC<AreaStatusCardProps> = ({
  barangayName,
  riskLevel,
  incidentsThisMonth,
  advisoryText,
}) => {
  const { colors, spacing, typography } = useTheme();
  const risk = RISK_CONFIG[riskLevel];

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        {/* Gradient background */}
        <LinearGradient
          colors={['#0F1C3F', '#1B2A5A', 'rgba(244,98,43,0.45)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Eyebrow */}
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowPill}>
            <ShieldCheck size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.eyebrowText}>AREA STATUS</Text>
          </View>
          <Text style={styles.barangayLabel}>{barangayName.toUpperCase()}</Text>
        </View>

        {/* Risk status row */}
        <View style={[styles.riskRow, { marginTop: spacing.sm }]}>
          <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
        </View>
        <Text style={styles.riskSublabel}>
          {advisoryText ?? risk.sublabel}
        </Text>

        {/* Stats row */}
        <View style={styles.statsStrip}>
          {/* Incidents this month */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{incidentsThisMonth}</Text>
            <Text style={styles.statLabel}>Incidents{'\n'}this month</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Risk level indicator */}
          <View style={styles.statItem}>
            <View style={[styles.riskDot, { backgroundColor: risk.color }]} />
            <Text style={styles.statLabel}>Risk{'\n'}Level</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Trend placeholder */}
          <View style={styles.statItem}>
            <TrendingUp size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statLabel}>Monitoring{'\n'}Active</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    backgroundColor: '#0F1C3F',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1C3F',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  card: {
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.8,
  },
  barangayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.6,
  },

  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  riskLabel: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  riskSublabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  riskDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});