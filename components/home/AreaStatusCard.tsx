import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { RiskLevel } from '../../services/api/models';
import { APP_CONFIG } from '../../constants/config';

interface AreaStatusCardProps {
  barangayName: string;
  riskLevel: RiskLevel;
  incidentsThisMonth: number;
  municipality?: string;
  province?: string;
  isExternal?: boolean;
  registeredLocation?: string;
  scopeLabel?: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  mild:     { label: 'Mild Risk',     color: '#EAB308' },
  moderate: { label: 'Moderate Risk', color: '#F4622B' },
  high:     { label: 'High Risk',     color: '#EF4444' },
};

function normalizeRiskLevel(level?: string): RiskLevel {
  if (level === 'high' || level === 'critical') return 'high';
  if (level === 'moderate') return 'moderate';
  return 'mild';
}

export const AreaStatusCard: React.FC<AreaStatusCardProps> = ({
  barangayName,
  riskLevel,
  incidentsThisMonth,
  municipality,
  province,
  isExternal = false,
  registeredLocation,
  scopeLabel,
}) => {
  const { isDark, shadow } = useTheme();
  const risk = RISK_CONFIG[normalizeRiskLevel(riskLevel)];
  const locality = `${municipality ?? APP_CONFIG.DEFAULT_MUNICIPALITY}, ${province ?? APP_CONFIG.DEFAULT_PROVINCE}`;
  const eyebrowText = scopeLabel ?? (isExternal ? 'PILOT COVERAGE' : 'AREA STATUS');

  return (
    <View style={[styles.shadow, !isDark && shadow.card]}>
      <View
        style={[
          styles.card,
          {
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          },
        ]}
      >
        <LinearGradient
          colors={['#0F1C3F', '#1B2A5A', 'rgba(244,98,43,0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Section label & pilot indicator */}
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>{eyebrowText}</Text>
          {isExternal && (
            <View style={styles.pilotPill}>
              <Text style={styles.pilotPillText}>BFP LIAN PILOT</Text>
            </View>
          )}
        </View>

        {/* Body row: risk status left, location right */}
        <View style={styles.bodyRow}>
          <View style={styles.riskBlock}>
            <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
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
            {isExternal
              ? ` fire incident${incidentsThisMonth !== 1 ? 's' : ''} recorded across Lian this month`
              : ` fire incident${incidentsThisMonth !== 1 ? 's' : ''} recorded in your barangay this month`}
          </Text>
        </View>

        {/* Non-Lian registered resident indicator */}
        {isExternal && registeredLocation && (
          <View style={styles.registeredHomeRow}>
            <MapPin size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.registeredHomeText} numberOfLines={1}>
              Registered Home: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{registeredLocation}</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 18,
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
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    overflow: 'hidden',
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.38)',
  },
  pilotPill: {
    backgroundColor: 'rgba(244, 98, 43, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(244, 98, 43, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pilotPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F4622B',
    letterSpacing: 0.6,
  },

  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  /* Left: risk status */
  riskBlock: {
    flex: 1,
    paddingRight: 16,
  },
  riskLabel: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
  },

  /* Right: location */
  locationBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
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
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  incidentCount: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  registeredHomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  registeredHomeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '500',
  },
});
