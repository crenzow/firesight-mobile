import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { CheckCircle2, ShieldCheck, Truck, BellRing } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';

const NEXT_STEPS = [
  { icon: ShieldCheck, text: 'BFP personnel has been alerted' },
  { icon: Truck, text: 'Units will be dispatched if accepted' },
  { icon: BellRing, text: "You'll receive status updates via alerts" },
];

export default function ReportSuccessScreen() {
  const navigation = useNavigation();
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { reportId, createdAt } = useLocalSearchParams<{ reportId?: string; createdAt?: string }>();

  const year = createdAt ? new Date(createdAt.replace(' ', 'T')).getFullYear() : new Date().getFullYear();
  const referenceNo = `FR-${year}-${(reportId ?? '0').padStart(4, '0')}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.brandNavy }} edges={['top', 'bottom']}>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.success}22` }]}>
          <CheckCircle2 size={48} color={colors.success} />
        </View>

        <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xl, marginTop: spacing.lg }]}>
          Report Submitted
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.xs },
          ]}
        >
          Your fire report has been sent to the Bureau of Fire Protection.
        </Text>

        <View style={[styles.refChip, { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, marginTop: spacing.md }]}>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>Reference No.</Text>
          <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '800', marginTop: 2 }}>
            {referenceNo}
          </Text>
        </View>

        <View
          style={[
            styles.stepsCard,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl },
            shadow.card,
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700', marginBottom: spacing.sm }}>
            What happens next
          </Text>
          {NEXT_STEPS.map(({ icon: Icon, text }, index) => (
            <View key={text} style={[styles.stepRow, index > 0 && { marginTop: spacing.sm }]}>
              <View style={[styles.stepIcon, { backgroundColor: `${colors.brandOrange}14` }]}>
                <Icon size={14} color={colors.brandOrange} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginLeft: spacing.sm, flex: 1 }}>
                {text}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl, width: '100%' }}>
          <Button label="Done" onPress={() => navigation.getParent()?.goBack()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800' },
  subtitle: { textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  refChip: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  stepsCard: { width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});