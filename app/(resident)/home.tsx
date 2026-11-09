import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AreaStatusCard } from '../../components/home/AreaStatusCard';
import { QuickActionsRow } from '../../components/home/QuickActionsRow';
import { ReportListItem } from '../../components/home/ReportListItem';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { reportService } from '../../services/api/reportService';
import { announcementService } from '../../services/api';
import { AreaStatus, CommunityReport, Announcement } from '../../services/api/models';

export default function HomeScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();

  const [areaStatus, setAreaStatus] = useState<AreaStatus | null>(null);
  const [recentReports, setRecentReports] = useState<CommunityReport[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [status, reports, announcements] = await Promise.allSettled([
        reportService.getAreaStatus(),
        reportService.getMyReports(3),
        announcementService.list(),
      ]);

      if (status.status === 'fulfilled') setAreaStatus(status.value);
      if (reports.status === 'fulfilled') setRecentReports(reports.value);
      if (announcements.status === 'fulfilled') {
        const newest = [...(announcements.value ?? [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setLatestAnnouncement(newest ?? null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();

      // Poll every 20s while focused so advisory and area status update live
      const timer = setInterval(() => {
        loadData();
      }, 20000);

      return () => clearInterval(timer);
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    refreshNotifications();
  };

  const barangayName = areaStatus?.barangay_name ?? user?.address?.barangay_name ?? 'Your Barangay';
  const isExternal =
    areaStatus?.is_external ??
    (user?.address?.municipality ? user.address.municipality.toLowerCase() !== 'lian' : false);

  const handleOpenRiskMap = () => {
    router.navigate({
      pathname: '/(resident)/map',
      params: isExternal ? {} : { focus: barangayName },
    } as any);
  };

  const handleStartReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/(report)/capture');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: 110,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandOrange}
            />
          }
        >
          {/* Area Status Hero */}
          <AreaStatusCard
            barangayName={barangayName}
            riskLevel={areaStatus?.risk_level ?? 'mild'}
            incidentsThisMonth={areaStatus?.incidents_this_month ?? 0}
            municipality={areaStatus?.municipality ?? user?.address?.municipality}
            province={areaStatus?.province ?? user?.address?.province}
            isExternal={isExternal}
            registeredLocation={
              areaStatus?.registered_municipality
                ? `${areaStatus.registered_municipality}${areaStatus.registered_province ? `, ${areaStatus.registered_province}` : ''}`
                : user?.address?.municipality
                ? `${user.address.municipality}${user.address.province ? `, ${user.address.province}` : ''}`
                : undefined
            }
            scopeLabel={areaStatus?.scope_label}
            onPress={handleOpenRiskMap}
          />

          {/* Quick Actions */}
          <View style={{ marginTop: spacing.xl }}>
            <QuickActionsRow latestAnnouncement={latestAnnouncement} isLoading={isLoading} />
          </View>

          {/* Recent Reports */}
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader
              title="My Recent Reports"
              actionLabel="See all"
              onAction={() =>
                router.push({ pathname: '/(resident)/reports', params: { from: '/(resident)/home' } } as any)
              }
            />

            {/* Contained Elevated Card matching BFP Card System */}
            <Card padding={0}>
              {isLoading ? (
                <View style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
                  {[0, 1].map((n) => (
                    <View
                      key={n}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                      }}
                    >
                      <Skeleton width={60} height={60} borderRadius={14} />
                      <View style={{ flex: 1, marginLeft: 13, justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Skeleton width={70} height={18} borderRadius={6} />
                          <Skeleton width={50} height={12} borderRadius={4} />
                        </View>
                        <Skeleton width="80%" height={15} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton width="50%" height={12} borderRadius={4} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : recentReports.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: `${colors.brandOrange}1A` }]}>
                    <FileText size={22} color={colors.brandOrange} strokeWidth={2} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No reports yet</Text>
                  <Text
                    style={[
                      styles.emptyHelper,
                      { color: colors.textMuted, fontSize: typography.size.sm },
                    ]}
                  >
                    Fire reports you submit will appear here so you can track their status.
                  </Text>
                  <Pressable
                    onPress={handleStartReport}
                    style={({ pressed }) => [
                      styles.emptyAction,
                      {
                        backgroundColor: pressed ? colors.brandOrange : `${colors.brandOrange}1A`,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Report a fire"
                  >
                    {({ pressed }) => (
                      <>
                        <Plus size={14} color={pressed ? '#FFFFFF' : colors.brandOrange} strokeWidth={2.5} />
                        <Text style={[styles.emptyActionText, { color: pressed ? '#FFFFFF' : colors.brandOrange }]}>
                          Report a fire
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                recentReports.map((report, index) => (
                  <View key={report.report_id}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: colors.border,
                            marginLeft: 14 + 60 + 13,
                          },
                        ]}
                      />
                    )}
                    <ReportListItem
                      report={report}
                      paddingHorizontal={14}
                      isFirst={index === 0}
                      isLast={index === recentReports.length - 1}
                      from="/(resident)/home"
                    />
                  </View>
                ))
              )}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 12,
  },
  emptyHelper: {
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 4,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
