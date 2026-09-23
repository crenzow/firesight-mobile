import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Clock, ChevronRight, Search, Flame, ShieldAlert, Lightbulb } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { FireEducationArticle } from '../../services/api/models';

const CATEGORY_ICON = { prevention: Search, emergency_response: Flame, awareness: ShieldAlert } as const;
const CATEGORY_LABEL = { prevention: 'PREVENTION', emergency_response: 'EMERGENCY RESPONSE', awareness: 'AWARENESS' } as const;
const CATEGORY_GRADIENT = {
  prevention: ['#F97316', '#FFB877'],
  emergency_response: ['#EF4444', '#F87171'],
  awareness: ['#6D5BD0', '#3B4CCA'],
} as const;

export const FeaturedArticleCard: React.FC<{ article: FireEducationArticle }> = ({ article }) => {
  const { colors, spacing, radius, typography, shadow } = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/learn/${article.content_id}`)}
      style={[
        styles.featured,
        { backgroundColor: colors.brandNavy, borderRadius: radius.lg, padding: spacing.lg },
        shadow.card,
      ]}
    >
      <View style={[styles.featuredBadge, { backgroundColor: colors.brandOrange, borderRadius: radius.full }]}>
        <Text style={styles.featuredBadgeText}>FEATURED</Text>
      </View>
      <Text style={{ color: colors.textInverse, fontSize: typography.size.lg, fontWeight: '800', marginTop: spacing.sm }}>
        {article.title}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: 4, lineHeight: 19 }}>
        {article.summary}
      </Text>
      <View style={[styles.metaRow, { marginTop: spacing.md }]}>
        <Clock size={12} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }}>
          {article.read_minutes} min read
        </Text>
      </View>
    </Pressable>
  );
};

export const ArticleListItem: React.FC<{ article: FireEducationArticle }> = ({ article }) => {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const Icon = CATEGORY_ICON[article.category] ?? Lightbulb;
  const gradient = CATEGORY_GRADIENT[article.category as keyof typeof CATEGORY_GRADIENT] ?? ['#64748B', '#0F1C3F'];

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/learn/${article.content_id}`)}
      style={[
        styles.row,
        { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
        shadow.card,
      ]}
    >
      <View style={styles.iconWrap}>
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Icon size={18} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={{ color: colors.brandOrange, fontSize: typography.size.xs, fontWeight: '700' }}>
          {CATEGORY_LABEL[article.category] ?? 'GENERAL'}
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700', marginTop: 2 }}>
          {article.title}
        </Text>
        <View style={styles.metaRow}>
          <Clock size={11} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }}>
            {article.read_minutes} min read
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  featured: {},
  featuredBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4 },
  featuredBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { 
    width: 40, 
    height: 40, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden'
  },
});