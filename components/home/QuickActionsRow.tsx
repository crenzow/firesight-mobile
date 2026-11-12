import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Phone, BookOpen, Megaphone, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Skeleton } from '../ui/Skeleton';
import { SectionHeader } from '../ui/SectionHeader';
import { Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

/** Posts newer than this are flagged with a "NEW" tag. */
const NEW_ANNOUNCEMENT_WINDOW_MS = 48 * 60 * 60 * 1000;

const TILES = [
  {
    key: 'contacts',
    label: 'Emergency Contacts',
    icon: Phone,
    route: '/(resident)/emergency-contacts',
  },
  {
    key: 'education',
    label: 'Fire Safety Education',
    icon: BookOpen,
    route: '/(resident)/learn',
  },
] as const satisfies readonly {
  key: string;
  label: string;
  icon: typeof Phone;
  route: string;
}[];

interface QuickActionsRowProps {
  latestAnnouncement: Announcement | null;
  isLoading: boolean;
}

function isRecentAnnouncement(createdAt: string): boolean {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return false;
  }
  return Date.now() - createdTime < NEW_ANNOUNCEMENT_WINDOW_MS;
}

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ latestAnnouncement, isLoading }) => {
  const { colors, shadow, isDark } = useTheme();

  // Universal card design standard matching BFP:
  // Elevated surface, constant 1.5px border, squircle 18px radius, ambient shadow, and 0.985 tactile depression.
  const normalBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const pressedBg = isDark ? '#221915' : '#F9FAFB';
  const normalBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
  const pressedBorder = colors.brandOrange;

  /** Uniform icon chip: brand navy tint in light, subtle white tint in dark. */
  const chipBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#EEF2F8';
  const chipIcon = isDark ? '#FFFFFF' : colors.brandNavy;

  /** Soft tinted chip background for announcement accent. */
  const chipBackground = (accent: string) => `${accent}${isDark ? '2E' : '1A'}`;

  const showNewTag = !!latestAnnouncement && isRecentAnnouncement(latestAnnouncement.created_at);

  return (
    <View>
      <SectionHeader title="Quick Actions" />

      {/* Top row: two equal compact tiles */}
      <View style={styles.tileRow}>
        {TILES.map(({ key, label, icon: Icon, route }) => (
          <Pressable
            key={key}
            onPress={() => router.push(route as never)}
            style={({ pressed }) => [
              styles.card,
              styles.tile,
              {
                backgroundColor: pressed ? pressedBg : normalBg,
                borderColor: pressed ? pressedBorder : normalBorder,
                borderWidth: 1.5,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
              !isDark && shadow.card,
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            {({ pressed }) => (
              <>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: pressed ? colors.brandOrange : chipBg },
                  ]}
                >
                  <Icon size={19} color={pressed ? '#FFFFFF' : chipIcon} strokeWidth={2} />
                </View>
                <Text style={[styles.tileLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                  {label}
                </Text>
              </>
            )}
          </Pressable>
        ))}
      </View>

      {/* Bottom: wide Announcements card with the latest post */}
      <Pressable
        onPress={() => router.push('/(resident)/announcements' as never)}
        style={({ pressed }) => [
          styles.card,
          styles.advisory,
          {
            backgroundColor: pressed ? pressedBg : normalBg,
            borderColor: pressed ? pressedBorder : normalBorder,
            borderWidth: 1.5,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          !isDark && shadow.card,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          latestAnnouncement ? `Announcements. Latest: ${latestAnnouncement.title}` : 'Announcements'
        }
      >
        {({ pressed }) => (
          <>
            {/* Header: clearly says Announcements */}
            <View style={styles.advisoryHeader}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: pressed ? colors.brandOrange : chipBg },
                ]}
              >
                <Megaphone size={18} color={pressed ? '#FFFFFF' : chipIcon} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.advisoryHeading, { color: colors.textPrimary }]}>Announcements</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>BFP Lian Fire Station</Text>
              </View>
              <View style={styles.viewAll}>
                <Text style={[styles.viewAllText, { color: colors.brandOrange }]}>View all</Text>
                <ChevronRight size={14} color={colors.brandOrange} strokeWidth={2.5} />
              </View>
            </View>

            {/* Latest post preview */}
            <View style={[styles.latestBox, { borderTopColor: colors.border }]}>
              {latestAnnouncement ? (
                <>
                  <View style={styles.latestMetaRow}>
                    {showNewTag && (
                      <View style={[styles.newTag, { backgroundColor: chipBackground(colors.brandOrange) }]}>
                        <Text style={[styles.newTagText, { color: colors.brandOrange }]}>NEW</Text>
                      </View>
                    )}
                    <Text style={[styles.latestTime, { color: colors.textMuted }]}>
                      {formatRelativeDate(latestAnnouncement.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.advisoryTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {latestAnnouncement.title}
                  </Text>
                  <Text style={[styles.advisoryBody, { color: colors.textSecondary }]} numberOfLines={2}>
                    {latestAnnouncement.content}
                  </Text>
                </>
              ) : isLoading ? (
                <View style={{ gap: 6, marginTop: 2 }}>
                  <Skeleton width={110} height={12} borderRadius={4} />
                  <Skeleton width="90%" height={15} borderRadius={4} />
                  <Skeleton width="60%" height={12} borderRadius={4} />
                </View>
              ) : (
                <Text style={[styles.advisoryBody, { color: colors.textSecondary, marginTop: 0 }]}>
                  No active advisories right now.
                </Text>
              )}
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  tileLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisory: {
    marginTop: 10,
    padding: 16,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisoryHeading: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  latestBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  latestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  latestTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  advisoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 6,
  },
  advisoryBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
});
