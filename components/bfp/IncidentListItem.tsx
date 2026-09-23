import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BFPIncident } from '../../services/api/bfpModels';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { formatRelativeDate } from '../../utils/formatters';
import { APP_CONFIG } from '../../constants/config';
import { InteractiveCard } from './InteractiveCard';

export const IncidentListItem: React.FC<{ incident: BFPIncident; from?: 'dashboard' | 'incidents' }> = ({ incident, from = 'incidents' }) => {
  const { colors, spacing, radius, typography, isDark } = useTheme();
  const [locationName, setLocationName] = React.useState<string>(incident.barangay_name ?? 'Loading location…');

  React.useEffect(() => {
    let isMounted = true;
    import('../../utils/geocoding').then(({ reverseGeocode }) => {
      reverseGeocode(incident.latitude, incident.longitude).then((name) => {
        if (isMounted) {
          setLocationName(name !== 'Unknown area' ? name : (incident.barangay_name ?? 'Unknown location'));
        }
      });
    });
    return () => {
      isMounted = false;
    };
  }, [incident.latitude, incident.longitude, incident.barangay_name]);

  return (
    <InteractiveCard
      onPress={() => router.push({ pathname: '/(bfp)/incidents/[id]', params: { id: incident.report_id, from } })}
      style={[
        styles.card,
        { 
          backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
          borderRadius: radius.lg, 
          padding: spacing.md, 
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(0,0,0,0.055)',
        },
        isDark ? undefined : styles.shadowOuter,
      ]}
    >
      {incident.report_image ? (
        <Image
          source={{ uri: `${APP_CONFIG.API_BASE_URL}/${incident.report_image}` }}
          style={[styles.thumb, { borderRadius: radius.md }]}
        />
      ) : (
        <View style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]} />
      )}

      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.topRow}>
          <IncidentStatusBadge status={incident.status} size="sm" />
          {incident.severity_level ? <SeverityBadge severity={incident.severity_level} /> : null}
        </View>

        <View style={[styles.locationRow, { marginTop: spacing.sm }]}>
          <MapPin size={13} color={colors.textSecondary} />
          <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '800', marginLeft: 4, flex: 1 }}>
            {locationName}
          </Text>
        </View>

        <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 }}>
          {incident.description || 'No description provided'}
        </Text>

        <View style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: incident.ai_fire_label === 'fire' ? '#FEE2E2' : incident.ai_fire_label === 'non_fire' ? '#DCFCE7' : colors.background }}>
          <Text style={{ color: incident.ai_fire_label === 'fire' ? '#991B1B' : incident.ai_fire_label === 'non_fire' ? '#166534' : colors.textMuted, fontSize: typography.size.xs, fontWeight: '700' }}>
            {incident.ai_fire_label === 'fire'
              ? `Fire detected${incident.ai_fire_confidence !== null && incident.ai_fire_confidence !== undefined ? ` · ${(incident.ai_fire_confidence * 100).toFixed(1)}% confidence` : ''}`
              : incident.ai_fire_label === 'non_fire'
                ? `No fire detected${incident.ai_fire_confidence !== null && incident.ai_fire_confidence !== undefined ? ` · ${(incident.ai_fire_confidence * 100).toFixed(1)}% confidence` : ''}`
                : 'AI scan unavailable'}
          </Text>
        </View>

        <View style={[styles.locationRow, { marginTop: 6 }]}>
          <Clock size={12} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4, fontWeight: '500' }}>
            {formatRelativeDate(incident.created_at)} · {incident.reporter_name ?? 'Unknown reporter'}
          </Text>
        </View>
      </View>
    </InteractiveCard>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start' },
  thumb: { width: 64, height: 64 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  shadowOuter: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A2340',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});