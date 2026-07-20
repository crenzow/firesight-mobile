import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Lightbulb } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AreaStatusCard } from '../../components/home/AreaStatusCard';
import { QuickActionsRow } from '../../components/home/QuickActionsRow';
import { AdvisoryBanner } from '../../components/home/AdvisoryBanner';
import { ReportListItem } from '../../components/home/ReportListItem';
import { reportService } from '../../services/api/reportService';
import { notificationService, announcementService } from '../../services/api';
import { AreaStatus, CommunityReport, Notification, Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

export default function HomeScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { user } = useAuth();

  const [areaStatus, setAreaStatus] = useState<AreaStatus | null>(null);
  const [recentReports, setRecentReports] = useState<CommunityReport[]>([]);
  const [latestAdvisory, setLatestAdvisory] = useState<Announcement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [status, reports, notifications, announcements] = await Promise.allSettled([
        reportService.getAreaStatus(),
        reportService.getMyReports(3),
        notificationService.list(),
        announcementService.list(),
      ]);

      if (status.status === 'fulfilled') setAreaStatus(status.value);
      if (reports.status === 'fulfilled') setRecentReports(reports.value);
      if (notifications.status === 'fulfilled') {
        setUnreadCount(notifications.value.filter((n: Notification) => !n.is_read).length);
      }
      if (announcements.status === 'fulfilled' && announcements.value.length > 0) {
        setLatestAdvisory(announcements.value[0]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader unreadCount={unreadCount} variant="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.brandOrange} />}
        >
          <Text style={[styles.greetingLabel, { color: colors.textMuted, fontSize: typography.size.xs }]}>
            GOOD {getTimeOfDayLabel()}
          </Text>
          <Text style={[styles.greetingName, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
            {user?.first_name ?? 'Resident'} {user?.last_name ?? ''}
          </Text>
          {user?.address ? (
            <Text style={[styles.addressLine, { color: colors.textSecondary, fontSize: typography.size.sm }]}>
              📍 {user.address.barangay_name ?? 'Brgy. Poblacion'}, {user.address.municipality}
            </Text>
          ) : null}

          <View style={{ marginTop: spacing.lg }}>
            <AreaStatusCard
              barangayName={areaStatus?.barangay_name ?? user?.address?.barangay_name ?? 'Your Barangay'}
              riskLevel={areaStatus?.risk_level ?? 'low'}
              incidentsThisMonth={areaStatus?.incidents_this_month ?? 0}
              advisoryText={areaStatus?.advisory_active ? 'Dry season fire advisory in effect' : undefined}
            />
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <QuickActionsRow />
          </View>

          {latestAdvisory ? (
            <View style={{ marginTop: spacing.xl }}>
              <AdvisoryBanner
                title={latestAdvisory.title}
                message={latestAdvisory.content}
                source="Bureau of Fire Protection"
                date={formatRelativeDate(latestAdvisory.created_at)}
              />
            </View>
          ) : null}

          <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.xs }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.md }]}>
              My Recent Reports
            </Text>
            <Pressable onPress={() => router.push('/(resident)/profile')} style={styles.seeAllRow}>
              <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '600' }}>
                See all
              </Text>
              <ChevronRight size={16} color={colors.brandOrange} />
            </Pressable>
          </View>

          <View
            style={[
              styles.reportsCard,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.md },
              shadow.card,
            ]}
          >
            {isLoading ? (
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, padding: spacing.sm }}>
                Loading your reports…
              </Text>
            ) : recentReports.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, padding: spacing.sm }}>
                You haven't submitted any reports yet. Tap the flame button below to report an incident.
              </Text>
            ) : (
              recentReports.map((report, index) => (
                <View
                  key={report.report_id}
                  style={index < recentReports.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                >
                  <ReportListItem report={report} />
                </View>
              ))
            )}
          </View>

          <View
            style={[
              styles.tipCard,
              { backgroundColor: colors.brandNavy, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl },
            ]}
          >
            <View style={styles.tipHeader}>
              <Lightbulb size={16} color={colors.brandOrange} />
              <Text style={[styles.tipEyebrow, { color: colors.brandOrange, fontSize: typography.size.xs, marginLeft: 6 }]}>
                DAILY SAFETY TIP
              </Text>
            </View>
            <Text style={[styles.tipTitle, { color: colors.textInverse, fontSize: typography.size.sm, marginTop: spacing.xs }]}>
              Never leave cooking unattended
            </Text>
            <Text style={[styles.tipBody, { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 }]}>
              Unattended cooking is the #1 cause of house fires in the Philippines.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getTimeOfDayLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'MORNING';
  if (hour < 18) return 'AFTERNOON';
  return 'EVENING';
}

const styles = StyleSheet.create({
  greetingLabel: { fontWeight: '700', letterSpacing: 1 },
  greetingName: { fontWeight: '800', marginTop: 2 },
  addressLine: { marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center' },
  reportsCard: {},
  tipCard: {},
  tipHeader: { flexDirection: 'row', alignItems: 'center' },
  tipEyebrow: { fontWeight: '700', letterSpacing: 0.5 },
  tipTitle: { fontWeight: '700' },
  tipBody: { lineHeight: 16 },
});