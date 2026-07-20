import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Phone, BookOpen, Megaphone } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

const ACTIONS = [
  { key: 'contacts', label: 'Emergency\nContacts', icon: Phone, route: '/(resident)/emergency-contacts' },
  { key: 'education', label: 'Fire\nEducation', icon: BookOpen, route: '/(resident)/learn' },
  { key: 'announcements', label: 'Announce-\nments', icon: Megaphone, route: '/(resident)/announcements' },
] as const;

export const QuickActionsRow: React.FC = () => {
  const { colors, spacing, radius, typography, shadow } = useTheme();

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.md, marginBottom: spacing.sm }]}>
        Quick Actions
      </Text>
      <View style={styles.row}>
        {ACTIONS.map(({ key, label, icon: Icon, route }) => (
          <Pressable
            key={key}
            onPress={() => router.push(route as never)}
            style={[
              styles.action,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, paddingVertical: spacing.md },
              shadow.card,
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${colors.brandOrange}1A` }]}>
              <Icon size={20} color={colors.brandOrange} />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: spacing.xs }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: '700' },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
});