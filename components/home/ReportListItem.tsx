import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Flame, ChevronRight, Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { CommunityReport } from '../../services/api/models';
import { StatusBadge } from './StatusBadge';
import { formatRelativeDate, formatTime } from '../../utils/formatters';
import { APP_CONFIG, getStorageImageUrl } from '../../constants/config';
import { reverseGeocode, getCachedGeocode } from '../../utils/geocoding';

interface ReportListItemProps {
  report: CommunityReport;
  paddingHorizontal?: number;
}

const ReportListItemComponent: React.FC<ReportListItemProps> = ({ report, paddingHorizontal }) => {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const cached = getCachedGeocode(report.latitude, report.longitude);
  const [locationName, setLocationName] = useState<string>(
    () => cached || report.barangay_name || 'Loading location…'
  );

  const horizontalPadding = paddingHorizontal ?? spacing.md;

  useEffect(() => {
    let isMounted = true;
    if (cached) {
      setLocationName(cached);
      return;
    }
    if (report.latitude && report.longitude) {
      reverseGeocode(report.latitude, report.longitude).then((name) => {
        if (isMounted && name && name !== 'Unknown area') {
          setLocationName(name);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [report.latitude, report.longitude, cached]);

  const hasPhoto = !!report.report_image && !imageError;
  const photoUri = getStorageImageUrl(report.report_image);

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/reports/${report.report_id}`)}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: 13,
          paddingHorizontal: horizontalPadding,
          backgroundColor: pressed
            ? (isDark ? '#221915' : '#FFF7F2')
            : 'transparent',
        },
      ]}
    >
      {({ pressed }) => (
        <>
          {/* Photo Thumbnail or Fallback Icon */}
          {hasPhoto ? (
            <Image
              source={{ uri: photoUri ?? undefined }}
              style={[
                styles.thumbnail,
                {
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceElevated,
                  borderColor: pressed ? colors.brandOrange : 'transparent',
                  borderWidth: pressed ? 1.5 : 0,
                },
              ]}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.iconFallback,
                {
                  borderRadius: radius.md,
                  backgroundColor: pressed
                    ? colors.brandOrange
                    : isDark
                    ? 'rgba(244, 98, 43, 0.12)'
                    : 'rgba(244, 98, 43, 0.08)',
                  borderColor: pressed
                    ? colors.brandOrange
                    : isDark
                    ? 'rgba(244, 98, 43, 0.25)'
                    : 'rgba(244, 98, 43, 0.15)',
                },
              ]}
            >
              <Flame size={20} color={pressed ? '#FFFFFF' : colors.brandOrange} />
            </View>
          )}

          {/* Main Details */}
          <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
            <View style={styles.topRow}>
              <Text
                style={[styles.barangay, { color: colors.textPrimary, fontSize: typography.size.sm }]}
                numberOfLines={1}
              >
                {locationName}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[styles.description, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 2 }]}
            >
              {report.description || 'No description provided'}
            </Text>

            <View style={styles.bottomRow}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={[styles.date, { color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }]}>
                {formatRelativeDate(report.created_at)} · {formatTime(report.created_at)}
              </Text>
            </View>
          </View>

          {/* Status Badge & Arrow */}
          <View style={styles.rightCol}>
            <StatusBadge status={report.status} />
            <ChevronRight size={15} color={pressed ? colors.brandOrange : colors.textMuted} style={{ marginTop: 6 }} />
          </View>
        </>
      )}
    </Pressable>
  );
};

export const ReportListItem = React.memo(ReportListItemComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
  },
  iconFallback: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  barangay: {
    fontWeight: '700',
    flex: 1,
  },
  description: {
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
});