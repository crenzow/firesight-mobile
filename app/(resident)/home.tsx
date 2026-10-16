import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, usePathname, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AreaStatusCard } from '../../components/home/AreaStatusCard';
import { QuickActionsRow } from '../../components/home/QuickActionsRow';
import { ReportListItem } from '../../components/home/ReportListItem';
import { reportService } from '../../services/api/reportService';
import { announcementService } from '../../services/api';
import { AreaStatus, CommunityReport, Announcement } from '../../services/api/models';

export default function HomeScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const pathname = usePathname();

  const [areaStatus, setAreaStatus] = useState<AreaStatus | null>(null);
  const [recentReports, setRecentReports] = useState<CommunityReport[]>([]);
  const [latestAdvisory, setLatestAdvisory] = useState<Announcement | null>(null);
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
      if (announcements.status === 'fulfilled' && announcements.value.length > 0) {
        setLatestAdvisory(announcements.value[0]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    refreshNotifications();
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
          <View>
            <AreaStatusCard
              barangayName={areaStatus?.barangay_name ?? user?.address?.barangay_name ?? 'Your Barangay'}
              riskLevel={areaStatus?.risk_level ?? 'mild'}
              incidentsThisMonth={areaStatus?.incidents_this_month ?? 0}
              municipality={areaStatus?.municipality ?? user?.address?.municipality}
              province={areaStatus?.province ?? user?.address?.province}
              isExternal={areaStatus?.is_external ?? (user?.address?.municipality ? user.address.municipality.toLowerCase() !== 'lian' : false)}
              registeredLocation={
                areaStatus?.registered_municipality
                  ? `${areaStatus.registered_municipality}${areaStatus.registered_province ? `, ${areaStatus.registered_province}` : ''}`
                  : user?.address?.municipality
                  ? `${user.address.municipality}${user.address.province ? `, ${user.address.province}` : ''}`
                  : undefined
              }
              scopeLabel={areaStatus?.scope_label}
            />
          </View>

          {/* Quick Actions */}
          <View style={{ marginTop: spacing.xl }}>
            <QuickActionsRow />
          </View>

          {/* Recent Reports */}
          <View style={{ marginTop: spacing.xl }}>
            <View style={[styles.sectionHeader, { marginBottom: 8, paddingHorizontal: 4 }]}>
              <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted }]}>
                MY RECENT REPORTS
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: '/(resident)/reports', params: { from: pathname } } as any)}
                style={({ pressed }) => [
                  styles.seeAllRow,
                  {
                    backgroundColor: pressed ? colors.brandOrange : 'transparent',
                    paddingHorizontal: pressed ? 8 : 4,
                    paddingVertical: 2,
                    borderRadius: 12,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
                hitSlop={8}
                accessibilityRole="button"
              >
                {({ pressed }) => (
                  <>
                    <Text style={{ color: pressed ? '#FFFFFF' : colors.brandOrange, fontSize: 13, fontWeight: '700' }}>
                      See all
                    </Text>
                    <ChevronRight size={13} color={pressed ? '#FFFFFF' : colors.brandOrange} strokeWidth={2.5} />
                  </>
                )}
              </Pressable>
            </View>

            {/* Contained Inset Card matching Announcements */}
            <View
              style={[
                styles.reportsCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {isLoading ? (
                <View style={styles.stateBox}>
                  <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>Loading…</Text>
                </View>
              ) : recentReports.length === 0 ? (
                <View style={styles.stateBox}>
                  <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 }}>
                    No reports yet. Tap the report button below to submit an incident.
                  </Text>
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
                            marginLeft: 14 + 48 + 12,
                          },
                        ]}
                      />
                    )}
                    <ReportListItem report={report} paddingHorizontal={14} />
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reportsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  stateBox: { padding: 22, alignItems: 'center' },
});