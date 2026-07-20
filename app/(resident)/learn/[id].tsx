import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { educationService } from '../../../services/api';
import { FireEducationArticle } from '../../../services/api/models';

const CATEGORY_LABEL = { prevention: 'PREVENTION', emergency_response: 'EMERGENCY RESPONSE', awareness: 'AWARENESS' } as const;

export default function LearnArticleScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<FireEducationArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    educationService
      .getById(Number(id))
      .then(setArticle)
      .catch(() => {
        // Leave article null — UI below shows a graceful "not found" state.
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.md }]}>Article</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading || !article ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
            {isLoading ? 'Loading article…' : 'Article not found.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <View style={[styles.categoryBadge, { backgroundColor: `${colors.brandOrange}14`, borderRadius: radius.full }]}>
            <Text style={{ color: colors.brandOrange, fontSize: typography.size.xs, fontWeight: '800' }}>
              {CATEGORY_LABEL[article.category]}
            </Text>
          </View>

          <Text style={{ color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: '800', marginTop: spacing.md }}>
            {article.title}
          </Text>

          <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
            <Clock size={13} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }}>
              {article.read_minutes} min read
            </Text>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.size.base,
              lineHeight: 24,
              marginTop: spacing.lg,
            }}
          >
            {article.body}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
});