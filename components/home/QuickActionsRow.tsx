import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Phone, BookOpen, Megaphone, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../ui/Card';

const TOP_ACTIONS = [
  {
    key: 'contacts',
    label: 'Emergency Contacts',
    subtitle: 'BFP & MDRRMO & more',
    icon: Phone,
    color: '#6D5BD0',
    lightBg: 'rgba(109, 91, 208, 0.1)',
    darkBg: 'rgba(109, 91, 208, 0.22)',
    route: '/(resident)/emergency-contacts',
  },
  {
    key: 'education',
    label: 'Fire Safety Education',
    subtitle: 'Learn prevention basics',
    icon: BookOpen,
    color: '#F97316',
    lightBg: 'rgba(249, 115, 22, 0.1)',
    darkBg: 'rgba(249, 115, 22, 0.22)',
    route: '/(resident)/learn',
  },
] as const;

const ANNOUNCEMENT_ACTION = {
  key: 'announcements',
  label: 'Announcements',
  subtitle: 'View area advisories',
  icon: Megaphone,
  color: '#2563EB',
  lightBg: 'rgba(37, 99, 235, 0.1)',
  darkBg: 'rgba(37, 99, 235, 0.22)',
  route: '/(resident)/announcements',
};

export const QuickActionsRow: React.FC = () => {
  const { colors, spacing, typography, isDark } = useTheme();

  return (
    <View>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textPrimary, fontSize: typography.size.md, marginBottom: spacing.sm },
        ]}
      >
        Quick Actions
      </Text>

      {/* Top Row: Emergency Contacts & Fire Safety Education */}
      <View style={[styles.row, { gap: spacing.sm }]}>
        {TOP_ACTIONS.map(({ key, label, subtitle, icon: Icon, route, color, lightBg, darkBg }) => (
          <Pressable
            key={key}
            onPress={() => router.push(route as never)}
            style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.82 : 1 }]}
          >
            <Card padding={16} style={{ flex: 1 }}>
              <View style={styles.tileHeader}>
                <View style={[styles.iconWrap, { backgroundColor: isDark ? darkBg : lightBg }]}>
                  <Icon size={18} color={color} />
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>

              <View style={styles.tileText}>
                <Text
                  style={[styles.tileLabel, { color: colors.textPrimary, fontSize: typography.size.sm }]}
                >
                  {label}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.tileSub, { color: colors.textSecondary, fontSize: typography.size.xs }]}
                >
                  {subtitle}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Bottom Row: Full-width Announcements Card extending to match the end of Fire Safety Education */}
      <Pressable
        onPress={() => router.push(ANNOUNCEMENT_ACTION.route as never)}
        style={({ pressed }) => [{ width: '100%', marginTop: spacing.sm, opacity: pressed ? 0.82 : 1 }]}
      >
        <Card padding={16} style={{ width: '100%' }}>
          <View style={styles.tileHeader}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDark ? ANNOUNCEMENT_ACTION.darkBg : ANNOUNCEMENT_ACTION.lightBg,
                },
              ]}
            >
              <ANNOUNCEMENT_ACTION.icon size={18} color={ANNOUNCEMENT_ACTION.color} />
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>

          <View style={styles.tileText}>
            <Text style={[styles.tileLabel, { color: colors.textPrimary, fontSize: typography.size.sm }]}>
              {ANNOUNCEMENT_ACTION.label}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.tileSub, { color: colors.textSecondary, fontSize: typography.size.xs }]}
            >
              {ANNOUNCEMENT_ACTION.subtitle}
            </Text>
          </View>
        </Card>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: '700' },

  row: {
    flexDirection: 'row',
  },

  tileHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  tileText: {
    width: '100%',
  },

  tileLabel: {
    fontWeight: '700',
  },

  tileSub: {
    marginTop: 4,
    lineHeight: 16,
  },
});