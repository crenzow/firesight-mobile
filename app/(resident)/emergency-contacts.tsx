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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { Skeleton } from '../../components/ui/Skeleton';
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

export default function EmergencyContactsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, shadow, isDark } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ContactCategory>('all');

  const handleBack = useCallback(() => {
    if (from && (from.includes('notification') || from === '/(resident)/notifications')) {
      router.replace('/(resident)/notifications');
    } else {
      router.replace('/(resident)/home');
    }
  }, [from]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  const loadContacts = useCallback(async () => {
    try {
      const data = await contactService.list();
      if (Array.isArray(data)) {
        setContacts(data);
      }
    } catch {
      // Non-fatal — resident can pull to refresh
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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
            backgroundColor: pressed ? (isDark ? '#1F1713' : '#F9FAFB') : (isDark ? colors.surfaceElevated : '#FFFFFF'),
            borderColor: pressed ? colors.brandOrange : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent'),
            borderWidth: 1.5,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          !isDark && shadow.card,
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
      <SecondaryHeader title="Emergency Hotlines" onBack={handleBack} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadContacts();
              }}
              tintColor={colors.brandOrange}
            />
          }
        >
          {/* ── Primary Emergency Speed Dial Card (High-Urgency, Clean) ── */}
          {isLoading ? (
            <View
              style={[
                styles.primaryEmergencySkeleton,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                },
                !isDark && shadow.card,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Skeleton width={14} height={14} borderRadius={7} />
                <Skeleton width={160} height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 6 }}>
                  <Skeleton width={140} height={32} borderRadius={6} />
                  <Skeleton width={180} height={14} borderRadius={4} />
                </View>
                <Skeleton width={68} height={42} borderRadius={16} />
              </View>
            </View>
          ) : primary ? (
            <Pressable
              onPress={() => callNumber(primary.phone_number, primary.name)}
              style={({ pressed }) => [
                styles.primaryEmergencyCard,
                {
                  backgroundColor: pressed ? colors.brandOrangeDeep : colors.brandOrange,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
                !isDark && shadow.card,
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
          ) : null}

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

          {/* ── Skeletons during Loading ── */}
          {isLoading ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <Skeleton width={180} height={13} borderRadius={4} />
              </View>

              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.contactCard,
                    {
                      backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      marginBottom: 10,
                    },
                    !isDark && shadow.card,
                  ]}
                >
                  <View style={styles.cardInner}>
                    <Skeleton width={44} height={44} borderRadius={14} />
                    <View style={{ flex: 1, marginLeft: 14, gap: 6 }}>
                      <Skeleton width={50} height={10} borderRadius={4} />
                      <Skeleton width={140} height={15} borderRadius={4} />
                      <Skeleton width={90} height={13} borderRadius={4} />
                    </View>
                    <Skeleton width={38} height={38} borderRadius={19} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <>
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

              {localLianContacts.length === 0 && nationalHotlines.length === 0 && (
                <View
                  style={[
                    styles.emptyCard,
                    {
                      backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    },
                    !isDark && shadow.card,
                  ]}
                >
                  <Phone size={36} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Hotlines Found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    No emergency contacts matched this category filter.
                  </Text>
                </View>
              )}
            </>
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
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  primaryEmergencySkeleton: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
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
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  squircleWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});