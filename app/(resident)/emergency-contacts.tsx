import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Phone,
  Flame,
  Shield,
  HeartPulse,
  LifeBuoy,
  PhoneCall,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { contactService } from '../../services/api';
import { EmergencyContact } from '../../services/api/models';

type ContactCategory = 'all' | 'fire' | 'police' | 'medical' | 'disaster';

const CATEGORY_META = {
  fire: {
    label: 'FIRE',
    Icon: Flame,
    color: '#EF4444',
    bgGradient: ['#EF4444', '#DC2626'] as [string, string],
  },
  police: {
    label: 'POLICE',
    Icon: Shield,
    color: '#3B82F6',
    bgGradient: ['#3B82F6', '#2563EB'] as [string, string],
  },
  medical: {
    label: 'MEDICAL',
    Icon: HeartPulse,
    color: '#10B981',
    bgGradient: ['#10B981', '#059669'] as [string, string],
  },
  disaster: {
    label: 'DISASTER',
    Icon: LifeBuoy,
    color: '#F59E0B',
    bgGradient: ['#F59E0B', '#D97706'] as [string, string],
  },
  other: {
    label: 'GENERAL',
    Icon: Phone,
    color: '#8B5CF6',
    bgGradient: ['#8B5CF6', '#7C3AED'] as [string, string],
  },
} as const;

// Comprehensive emergency directory pre-loaded so hotlines are always accessible offline
const FALLBACK_CONTACTS: EmergencyContact[] = [
  {
    contact_id: 1,
    name: 'Bureau of Fire Protection',
    category: 'fire',
    phone_number: '160',
    description: 'National fire emergency hotline',
    is_primary: true,
  },
  {
    contact_id: 5,
    name: 'BFP Lian Fire Station',
    category: 'fire',
    phone_number: '(043) 778-1234',
    description: 'Lian, Batangas local fire station',
    is_primary: false,
  },
  {
    contact_id: 2,
    name: 'National Emergency Hotline',
    category: 'disaster',
    phone_number: '911',
    description: 'Police, fire, and medical emergencies',
    is_primary: false,
  },
  {
    contact_id: 6,
    name: 'Lian Municipal Police Station',
    category: 'police',
    phone_number: '(043) 778-5678',
    description: 'Lian, Batangas local PNP station',
    is_primary: false,
  },
  {
    contact_id: 8,
    name: 'Lian MDRRMO',
    category: 'disaster',
    phone_number: '(043) 778-3456',
    description: 'Municipal Disaster Risk Reduction & Management',
    is_primary: false,
  },
  {
    contact_id: 3,
    name: 'Philippine Red Cross',
    category: 'medical',
    phone_number: '143',
    description: '24/7 medical & rescue response',
    is_primary: false,
  },
  {
    contact_id: 7,
    name: 'Lian Rural Health Unit',
    category: 'medical',
    phone_number: '(043) 778-9012',
    description: 'Lian, Batangas community health clinic',
    is_primary: false,
  },
  {
    contact_id: 4,
    name: 'NDRRMC Hotline',
    category: 'disaster',
    phone_number: '(02) 8911-5061',
    description: 'National disaster management office',
    is_primary: false,
  },
];

export default function EmergencyContactsScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>(FALLBACK_CONTACTS);
  const [selectedFilter, setSelectedFilter] = useState<ContactCategory>('all');

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    contactService
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setContacts(data);
        }
      })
      .catch(() => {
        // Retain fallback contacts
      });
  }, []);

  const callNumber = (number: string, name: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Safe fallback
    }

    const cleanNumber = number.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Unable to place call', `Please dial ${number} manually for ${name}.`);
    });
  };

  const primary = contacts.find((c) => c.is_primary) ?? contacts[0];
  const otherContacts = contacts.filter((c) => c.contact_id !== primary?.contact_id);

  const localLianContacts = useMemo(
    () =>
      otherContacts.filter(
        (c) =>
          c.name.toLowerCase().includes('lian') &&
          (selectedFilter === 'all' || c.category === selectedFilter)
      ),
    [otherContacts, selectedFilter]
  );

  const nationalHotlines = useMemo(
    () =>
      otherContacts.filter(
        (c) =>
          !c.name.toLowerCase().includes('lian') &&
          (selectedFilter === 'all' || c.category === selectedFilter)
      ),
    [otherContacts, selectedFilter]
  );

  const filterTabs: { key: ContactCategory; label: string }[] = [
    { key: 'all', label: 'All Hotlines' },
    { key: 'fire', label: 'Fire' },
    { key: 'police', label: 'Police' },
    { key: 'medical', label: 'Medical' },
    { key: 'disaster', label: 'Disaster' },
  ];

  const renderContactCard = (item: EmergencyContact) => {
    const meta = CATEGORY_META[item.category] ?? CATEGORY_META.other;
    const Icon = meta.Icon;

    return (
      <Pressable
        key={item.contact_id}
        onPress={() => callNumber(item.phone_number, item.name)}
        style={({ pressed }) => [
          styles.contactCard,
          {
            backgroundColor: pressed ? (isDark ? '#1F1713' : '#FFF7F2') : colors.surfaceElevated,
            borderColor: pressed ? colors.brandOrange : colors.border,
            borderWidth: pressed ? 1.5 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Call ${item.name} at ${item.phone_number}`}
      >
        {({ pressed }) => (
          <View style={styles.cardInner}>
            {/* Category Squircle Icon */}
            <View style={styles.squircleWrap}>
              <LinearGradient
                colors={meta.bgGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Icon size={20} color="#FFFFFF" />
            </View>

            {/* Info details */}
            <View style={styles.infoCol}>
              <View style={styles.categoryPillRow}>
                <Text style={[styles.categoryTag, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.contactNumber, { color: colors.brandOrange }]}>
                {item.phone_number}
              </Text>
            </View>

            {/* Dedicated Dial Button */}
            <View
              style={[
                styles.dialCircle,
                {
                  backgroundColor: pressed ? colors.brandOrange : (isDark ? '#263450' : '#EFF6FF'),
                  borderColor: pressed ? colors.brandOrange : '#BFDBFE',
                },
              ]}
            >
              <PhoneCall size={16} color={pressed ? '#FFFFFF' : '#2563EB'} />
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Emergency Hotlines" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Primary Emergency Speed Dial Card (High-Urgency, Clean) ── */}
          {primary && (
            <Pressable
              onPress={() => callNumber(primary.phone_number, primary.name)}
              style={({ pressed }) => [
                styles.primaryEmergencyCard,
                {
                  backgroundColor: pressed ? colors.brandOrangeDeep : colors.brandOrange,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Call primary emergency hotline ${primary.name}`}
            >
              <View style={styles.primaryTopRow}>
                <View style={styles.primaryEyebrowRow}>
                  <Flame size={12} color="#FFFFFF" />
                  <Text style={styles.primaryEyebrowText}>IN CASE OF FIRE EMERGENCY</Text>
                </View>
              </View>

              <View style={styles.primaryMainRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryBigNumber}>{primary.phone_number}</Text>
                  <Text style={styles.primaryDeptName}>{primary.name}</Text>
                </View>

                <View style={styles.primaryCallBtn}>
                  <PhoneCall size={20} color={colors.brandOrange} />
                  <Text style={[styles.primaryCallBtnText, { color: colors.brandOrange }]}>CALL</Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* ── Filter Segmented Tabs ── */}
          <View style={styles.filterTabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {filterTabs.map((tab) => {
                const isActive = selectedFilter === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setSelectedFilter(tab.key)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? colors.brandOrange
                          : pressed
                          ? colors.brandOrange
                          : colors.surfaceElevated,
                        borderColor: isActive || pressed ? 'transparent' : colors.border,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isActive || pressed ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Section: Local Lian Batangas Stations ── */}
          {localLianContacts.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  LOCAL LIAN EMERGENCY SERVICES
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                  {localLianContacts.length} active
                </Text>
              </View>

              {localLianContacts.map(renderContactCard)}
            </View>
          )}

          {/* ── Section: National 24/7 Hotlines ── */}
          {nationalHotlines.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  NATIONAL EMERGENCY HOTLINES
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                  {nationalHotlines.length} active
                </Text>
              </View>

              {nationalHotlines.map(renderContactCard)}
            </View>
          )}


        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollBody: {
    padding: 16,
    paddingBottom: 36,
  },

  /* Primary Emergency Speed Dial Card */
  primaryEmergencyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  primaryEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryEyebrowText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  primaryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBigNumber: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  primaryDeptName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.95,
  },
  primaryCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryCallBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Filter Tabs */
  filterTabsWrapper: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },

  /* Sections */
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Contact Card */
  contactCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  squircleWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  categoryPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  contactName: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  contactNumber: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  dialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});