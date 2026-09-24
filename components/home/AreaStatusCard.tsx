import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import { RiskLevel } from '../../services/api/models';
import { APP_CONFIG } from '../../constants/config';

interface AreaStatusCardProps {
  barangayName: string;
  riskLevel: RiskLevel;
  incidentsThisMonth: number;
  advisoryText?: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; sublabel: string }> = {
  low:      { label: 'Normal',    color: '#2FA65A', sublabel: 'No active fire advisories' },
  moderate: { label: 'Elevated',  color: '#EAB308', sublabel: 'Elevated risk — stay alert' },
  high:     { label: 'High Risk', color: '#F97316', sublabel: 'Active advisory in effect' },
  critical: { label: 'Critical',  color: '#EF4444', sublabel: 'Immediate danger — evacuate if advised' },
};

export const AreaStatusCard: React.FC<AreaStatusCardProps> = ({
  barangayName,
  riskLevel,
  incidentsThisMonth,
  advisoryText,
}) => {
  const risk = RISK_CONFIG[riskLevel];
  const locality = `${APP_CONFIG.DEFAULT_MUNICIPALITY}, ${APP_CONFIG.DEFAULT_PROVINCE}`;

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#0F1C3F', '#1B2A5A', 'rgba(244,98,43,0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Section label */}
        <Text style={styles.eyebrow}>AREA STATUS</Text>

        {/* Body row: risk status left, location right */}
        <View style={styles.bodyRow}>
          <View style={styles.riskBlock}>
            <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
            <Text style={styles.sublabel}>{advisoryText ?? risk.sublabel}</Text>
          </View>

          <View style={styles.locationBlock}>
            <Text style={styles.barangayName}>{barangayName}</Text>
            <Text style={styles.locality}>{locality}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Incidents stat */}
        <View style={styles.incidentRow}>
          <Flame size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.incidentText}>
            <Text style={styles.incidentCount}>{incidentsThisMonth}</Text>
            {' '}fire incident{incidentsThisMonth !== 1 ? 's' : ''} recorded this month
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 24,
    backgroundColor: '#0F1C3F',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    overflow: 'hidden',
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.38)',
    marginBottom: 12,
  },

  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  /* Left: risk status */
  riskBlock: {
    flex: 1,
    paddingRight: 16,
  },
  riskLabel: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  sublabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 17,
  },

  /* Right: location */
  locationBlock: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 3,           // nudge to align with risk label cap-height
  },
  barangayName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  locality: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.38)',
    marginTop: 3,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginBottom: 12,
  },

  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  incidentText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  incidentCount: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});