import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ClipboardList, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { reportService } from '../../../services/api/reportService';
import { CommunityReport } from '../../../services/api/models';
import { ReportListItem } from '../../../components/home/ReportListItem';
import { ShinyCard } from '../../../components/ui/ShinyCard';

export default function MyReportsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, radius, shadow } = useTheme();

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>

        {/* Page header */}
        <View style={[styles.pageHeader, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
          <Pressable 
            onPress={() => {
              if (from) {
                router.replace(from as any);
              } else {
                router.back();
              }
            }} 
            hitSlop={8} 
            style={{ marginRight: spacing.md }}
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: '800' }}>
              My Reports
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 }}>
              All incidents you've submitted
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brandOrange} />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => String(item.report_id)}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.brandOrange}
              />
            }
            contentContainerStyle={
              reports.length === 0
                ? styles.emptyContainer
                : { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xxxl }
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <ShinyCard padding={spacing.sm}>
                <ReportListItem report={item} />
              </ShinyCard>
            )}
            ListEmptyComponent={
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
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {},
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyBox: { alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
});
