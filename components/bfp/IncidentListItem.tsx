import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Flame, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { BFPIncident } from '../../services/api/bfpModels';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { formatIncidentDateTime } from '../../utils/formatters';
import { getStorageImageUrl } from '../../constants/config';
import { reverseGeocode, getCachedGeocode } from '../../utils/geocoding';

interface IncidentListItemProps {
  incident: BFPIncident;
  from?: 'dashboard' | 'incidents';
}

const IncidentListItemComponent: React.FC<IncidentListItemProps> = ({ incident, from = 'incidents' }) => {
  const { colors, typography, isDark } = useTheme();
  const cached = getCachedGeocode(incident.latitude, incident.longitude);
  const [locationName, setLocationName] = React.useState<string>(
    () => cached || incident.barangay_name || 'Loading location…'
  );

  React.useEffect(() => {
    let isMounted = true;
    if (cached) {
      setLocationName(cached);
      return;
    }
    if (incident.latitude && incident.longitude) {
      reverseGeocode(incident.latitude, incident.longitude).then((name) => {
        if (isMounted && name && name !== 'Unknown area') {
          setLocationName(name);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [incident.latitude, incident.longitude, cached]);

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const pressedBg = isDark ? '#221915' : '#F9FAFB';
  const normalBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';
  const pressedBorder = colors.brandOrange;

  const isFire = incident.ai_fire_label === 'fire';
  const isNonFire = incident.ai_fire_label === 'non_fire';
  const confidencePercent = incident.ai_fire_confidence != null
    ? Math.round(incident.ai_fire_confidence * 100)
    : null;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push({ pathname: '/(bfp)/incidents/[id]', params: { id: incident.report_id, from } });
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? pressedBg : cardBg,
          borderColor: pressed ? pressedBorder : normalBorder,
          borderWidth: pressed ? 1.5 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <>
          {/* Left Thumbnail (72x72 Apple squircle) */}
          {incident.report_image ? (
            <Image
              source={{ uri: getStorageImageUrl(incident.report_image) ?? '' }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumb,
                styles.thumbPlaceholder,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#EEF2F8',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                },
              ]}
            >
              <Flame
                size={22}
                color={pressed ? colors.brandOrange : (isDark ? 'rgba(255,255,255,0.4)' : colors.brandNavy)}
                strokeWidth={2}
              />
            </View>
          )}

          {/* Right Content */}
          <View style={styles.contentCol}>
            {/* Zone 1: Status Badge + Clean Timestamp on the right */}
            <View style={styles.topRow}>
              <IncidentStatusBadge status={incident.status} size="sm" />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatIncidentDateTime(incident.created_at)}
              </Text>
            </View>

            {/* Zone 2: Location Title + Chevron */}
            <View style={styles.locationRow}>
              <MapPin size={13.5} color={colors.brandOrange} />
              <Text
                numberOfLines={1}
                style={[
                  styles.locationTitle,
                  { color: colors.textPrimary, fontSize: typography.size.sm },
                ]}
              >
                {locationName}
              </Text>
              <ChevronRight
                size={15}
                color={pressed ? colors.brandOrange : colors.textMuted}
                style={{ marginLeft: 4 }}
              />
            </View>

            {/* Zone 3: Description snippet */}
            {incident.description ? (
              <Text
                numberOfLines={1}
                style={[styles.descText, { color: colors.textSecondary }]}
              >
                {incident.description}
              </Text>
            ) : null}

            {/* Zone 4: Apple-style Refined AI Pill */}
            <View
              style={[
                styles.aiPill,
                {
                  backgroundColor: isDark
                    ? isFire
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isNonFire
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)'
                    : isFire
                    ? '#FEF2F2'
                    : isNonFire
                    ? '#F0FDF4'
                    : '#F9FAFB',
                  borderColor: isDark
                    ? isFire
                      ? 'rgba(239, 68, 68, 0.3)'
                      : isNonFire
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(255, 255, 255, 0.08)'
                    : isFire
                    ? '#FECACA'
                    : isNonFire
                    ? '#BBF7D0'
                    : '#E5E7EB',
                },
              ]}
            >
              <View
                style={[
                  styles.aiDot,
                  {
                    backgroundColor: isFire
                      ? '#DC2626'
                      : isNonFire
                      ? '#16A34A'
                      : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.aiText,
                  {
                    color: isFire
                      ? (isDark ? '#F87171' : '#B91C1C')
                      : isNonFire
                      ? (isDark ? '#4ADE80' : '#15803D')
                      : colors.textMuted,
                  },
                ]}
              >
                {isFire
                  ? `AI Verified Fire${confidencePercent !== null ? ` (${confidencePercent}%)` : ''}`
                  : isNonFire
                  ? `No Fire Detected${confidencePercent !== null ? ` (${confidencePercent}%)` : ''}`
                  : 'AI Scan Pending'}
              </Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
};

export const IncidentListItem = React.memo(IncidentListItemComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 18,
    marginBottom: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contentCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
    marginLeft: 4,
    flex: 1,
  },
  descText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 6,
  },
  aiDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  aiText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});