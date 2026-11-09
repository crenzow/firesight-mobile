import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { CheckCircle2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';

export default function ReportSuccessScreen() {
  const navigation = useNavigation();
  const { colors, spacing, shadow, isDark } = useTheme();
  const { reportId, createdAt } = useLocalSearchParams<{ reportId?: string; createdAt?: string }>();

  const year = createdAt ? new Date(createdAt.replace(' ', 'T')).getFullYear() : new Date().getFullYear();
  const referenceNo = `FR-${year}-${(reportId ?? '0').padStart(4, '0')}`;

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.getParent()?.goBack();
  };

  const handleViewReport = () => {
    if (!reportId) {
      handleDone();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.getParent()?.goBack();
    setTimeout(() => {
      router.push({
        pathname: '/(resident)/reports/[id]',
        params: { id: reportId, from: '/(resident)/home' },
      } as any);
    }, 150);
  };

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.screen, { paddingHorizontal: spacing.xl }]}>
        {/* Main Content Area */}
        <View style={styles.centerCol}>
          {/* Layered Success Rings */}
          <View style={[styles.outerRing, { backgroundColor: `${colors.success}14` }]}>
            <View style={[styles.innerRing, { backgroundColor: `${colors.success}26` }]}>
              <CheckCircle2 size={36} color={colors.success} strokeWidth={2.4} />
            </View>
          </View>

          {/* Heading */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>Report Submitted</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your emergency report has been routed to BFP Lian Fire Station.
          </Text>

          {/* Official Reference Card (Receipt) */}
          <View
            style={[
              styles.receiptCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                borderWidth: isDark ? 1 : 0,
              },
              !isDark && shadow.card,
            ]}
          >
            {/* Top row: Kicker */}
            <View style={styles.receiptTopRow}>
              <Text style={[styles.receiptKicker, { color: colors.textMuted }]}>DISPATCH REFERENCE</Text>
            </View>

            {/* Reference Number */}
            <Text style={[styles.referenceCode, { color: colors.brandOrange }]}>
              {referenceNo}
            </Text>

            {/* Divider */}
            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

            {/* Quiet Reassurance Note */}
            <View style={styles.reassuranceRow}>
              <Text style={[styles.reassuranceText, { color: colors.textSecondary }]}>
                Officers are reviewing your coordinates. Keep your phone reachable.
              </Text>
            </View>
          </View>

          {/* View Details Link */}
          {reportId ? (
            <Pressable
              onPress={handleViewReport}
              style={({ pressed }) => [
                styles.trackLink,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View submitted report details"
            >
              <Text style={[styles.trackLinkText, { color: colors.brandOrange }]}>
                View report timeline
              </Text>
              <ChevronRight size={14} color={colors.brandOrange} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>

        {/* Bottom Done Button */}
        <View style={styles.bottomBar}>
          <Button label="Done" onPress={handleDone} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  outerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  innerRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },
  receiptCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    marginTop: 28,
  },
  receiptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  referenceCode: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10,
    textAlign: 'center',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  reassuranceRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  trackLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  bottomBar: {
    width: '100%',
    paddingTop: 10,
  },
});
