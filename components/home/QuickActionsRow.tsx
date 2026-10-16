import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Phone, BookOpen, Megaphone, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { announcementService } from '../../services/api';
import { Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

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
] as const;

export const QuickActionsRow: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [latest, setLatest] = useState<Announcement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refresh the latest advisory every time Home regains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      announcementService
        .list()
        .then((items) => {
          if (!isMounted) return;
          const newest = [...(items ?? [])].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          setLatest(newest ?? null);
        })
        .catch(() => {
          // Non-fatal: card falls back to the empty state
        })
        .finally(() => {
          if (isMounted) setIsLoaded(true);
        });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Premium solid pressed states: no alpha blending bugs on Android
  const normalBg = colors.surface;
  const pressedBg = isDark ? '#221915' : '#FFF7F2';
  const normalBorder = colors.border;
  const pressedBorder = colors.brandOrange;

  return (
    <View>
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>QUICK ACTIONS</Text>

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
                borderWidth: pressed ? 1.5 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            {({ pressed }) => (
              <>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: pressed
                        ? colors.brandOrange
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#EEF2F8',
                    },
                  ]}
                >
                  <Icon
                    size={19}
                    color={pressed ? '#FFFFFF' : isDark ? '#FFFFFF' : colors.brandNavy}
                    strokeWidth={2}
                  />
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
            borderWidth: pressed ? 1.5 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={latest ? `Announcements. Latest: ${latest.title}` : 'Announcements'}
      >
        {({ pressed }) => (
          <>
            {/* Header: clearly says Announcements */}
            <View style={styles.advisoryHeader}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: pressed
                      ? colors.brandOrange
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#EEF2F8',
                  },
                ]}
              >
                <Megaphone
                  size={18}
                  color={pressed ? '#FFFFFF' : isDark ? '#FFFFFF' : colors.brandNavy}
                  strokeWidth={2}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.advisoryHeading, { color: colors.textPrimary }]}>
                  Announcements
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  BFP Lian Fire Station
                </Text>
              </View>
              <View style={styles.viewAll}>
                <Text style={[styles.viewAllText, { color: colors.brandOrange }]}>View all</Text>
                <ChevronRight size={14} color={colors.brandOrange} strokeWidth={2.5} />
              </View>
            </View>

            {/* Latest post preview */}
            <View style={[styles.latestBox, { borderTopColor: colors.border }]}>
              {latest ? (
                <>
                  <View style={styles.latestMetaRow}>
                    <View style={[styles.dot, { backgroundColor: colors.brandOrange }]} />
                    <Text style={[styles.kicker, { color: colors.brandOrange }]}>LATEST</Text>
                    <Text style={[styles.latestTime, { color: colors.textMuted }]}>
                      · {formatRelativeDate(latest.created_at)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.advisoryTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {latest.title}
                  </Text>
                  <Text
                    style={[styles.advisoryBody, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {latest.content}
                  </Text>
                </>
              ) : (
                <Text
                  style={[styles.advisoryBody, { color: colors.textSecondary, marginTop: 0 }]}
                >
                  {isLoaded
                    ? 'No active advisories right now.'
                    : 'Loading latest announcement…'}
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  kicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  latestTime: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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