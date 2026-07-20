import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Phone, Flame, Shield, HeartPulse, LifeBuoy, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { contactService } from '../../services/api';
import { EmergencyContact } from '../../services/api/models';

const CATEGORY_ICON = { fire: Flame, police: Shield, medical: HeartPulse, disaster: LifeBuoy, other: MoreHorizontal } as const;

// Fallback shown instantly while the network call resolves / if it's offline —
// residents should never see a blank screen for hotline numbers.
const FALLBACK_CONTACTS: EmergencyContact[] = [
  { contact_id: -1, name: 'Bureau of Fire Protection', category: 'fire', phone_number: '160', description: 'National fire emergency hotline', is_primary: true },
  { contact_id: -2, name: 'National Emergency Hotline', category: 'disaster', phone_number: '911', description: 'Police, fire, medical emergencies', is_primary: false },
];

export default function EmergencyContactsScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>(FALLBACK_CONTACTS);

  useEffect(() => {
    contactService
      .list()
      .then((data) => data.length > 0 && setContacts(data))
      .catch(() => {
        // Keep fallback contacts — hotlines must always be reachable, even offline.
      });
  }, []);

  const primary = contacts.find((c) => c.is_primary) ?? contacts[0];
  const others = contacts.filter((c) => c.contact_id !== primary?.contact_id);

  const call = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Unable to place call', 'Please dial this number manually: ' + number)
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
          Emergency Contacts
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={others}
        keyExtractor={(item) => String(item.contact_id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          primary ? (
            <Pressable
              onPress={() => call(primary.phone_number)}
              style={[styles.primaryCard, { backgroundColor: colors.brandOrange, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg }]}
            >
              <Text style={{ color: '#FFF3EC', fontSize: typography.size.xs, fontWeight: '700', letterSpacing: 0.5 }}>
                IN CASE OF FIRE
              </Text>
              <View style={styles.primaryRow}>
                <Text style={{ color: '#FFFFFF', fontSize: typography.size.xxl, fontWeight: '800' }}>
                  {primary.phone_number}
                </Text>
                <View style={styles.callIconCircle}>
                  <Phone size={20} color={colors.brandOrange} />
                </View>
              </View>
              <Text style={{ color: '#FFF3EC', fontSize: typography.size.xs, marginTop: 2 }}>
                {primary.name} · Tap to call, free 24/7
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const Icon = CATEGORY_ICON[item.category];
          return (
            <Pressable
              onPress={() => call(item.phone_number)}
              style={[
                styles.row,
                { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
                shadow.card,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${colors.brandNavy}0D` }]}>
                <Icon size={18} color={colors.brandNavy} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.numberBlock}>
                <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '700' }}>
                  {item.phone_number}
                </Text>
                <Phone size={16} color={colors.brandOrange} />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
  primaryCard: {},
  primaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  callIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  numberBlock: { alignItems: 'flex-end', gap: 4 },
});