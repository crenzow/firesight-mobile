import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { reportService } from '../../../services/api/reportService';
import { CommunityReport } from '../../../services/api/models';
import { ReportListItem } from '../../../components/home/ReportListItem';
import { Skeleton } from '../../../components/ui/Skeleton';

export default function MyReportsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, radius, isDark } = useTheme();

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refreshing = false) => {
    try {
      const data = await reportService.getMyReports();
      setReports(data);
    } finally {
      setIsLoading(false);
      if (refreshing) setIsRefreshing(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (from && (from.includes('profile') || from === '/(resident)/profile')) {
      router.replace('/(resident)/profile');
    } else {
      router.replace('/(resident)/home');
    }
  }, [from]);

  useFocusEffect(
    useCallback(() => {
      load();

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [load, handleBack])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Custom secondary header matching Announcements & Emergency Contacts */}
      <SecondaryHeader title="My Reports" onBack={handleBack} />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>

        {isLoading ? (
          <View style={{ paddingTop: spacing.xs }}>
            {[0, 1, 2, 3].map((n) => (
              <View key={n}>
                {n > 0 && (
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: colors.border,
                        marginLeft: spacing.lg + 60 + spacing.md,
                      },
                    ]}
                  />
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: spacing.lg,
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
              </View>
            ))}
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIcon, { backgroundColor: `${colors.brandOrange}15`, borderRadius: radius.full }]}>
                <ClipboardList size={32} color={colors.brandOrange} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginTop: spacing.md }}>
                No Reports Yet
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Reports you submit through the app will appear here for tracking.
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingTop: spacing.xs,
              paddingBottom: spacing.xxxl,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.brandOrange}
              />
            }
          >
            {/* Seamless Feed blending into background */}
            <View style={styles.edgeToEdgeContainer}>
              {reports.map((report, index) => (
                <View key={report.report_id}>
                  {index > 0 && (
                    <View
                      style={[
                        styles.divider,
                        {
                          backgroundColor: colors.border,
                          marginLeft: spacing.lg + 60 + spacing.md,
                        },
                      ]}
                    />
                  )}
                  <ReportListItem
                    report={report}
                    paddingHorizontal={spacing.lg}
                    from="/(resident)/reports"
                    listFrom={from}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  subheader: {
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyBox: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  edgeToEdgeContainer: {
    width: '100%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
