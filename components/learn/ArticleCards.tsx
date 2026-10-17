import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Flame, ShieldAlert, BookOpen, Sparkles, ArrowRight, Bookmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { FireEducationArticle } from '../../services/api/models';
import { getArticleImageSource } from '../../constants/educationImages';
import { useBookmarks } from '../../hooks/useBookmarks';

const CATEGORY_ICON = {
  prevention: Flame,
  emergency_response: ShieldAlert,
  awareness: BookOpen,
} as const;

const CATEGORY_LABEL = {
  prevention: 'PREVENTION',
  emergency_response: 'EMERGENCY',
  awareness: 'AWARENESS',
} as const;

const CATEGORY_GRADIENT = {
  prevention: ['#F97316', '#EA580C'],
  emergency_response: ['#EF4444', '#DC2626'],
  awareness: ['#6366F1', '#4F46E5'],
} as const;

export const FeaturedArticleCard: React.FC<{ article: FireEducationArticle }> = ({ article }) => {
  const { colors, spacing, radius, typography } = useTheme();
  const { isBookmarked } = useBookmarks();
  const isSaved = isBookmarked(article.content_id);
  const imageSource = getArticleImageSource(article.image_path);

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/learn/${article.content_id}`)}
      style={({ pressed }) => [
        styles.featuredWrapper,
        {
          borderColor: pressed ? colors.brandOrange : colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      {({ pressed }) => (
        <View style={styles.featuredCard}>
          {imageSource ? (
            <>
              <Image
                source={imageSource}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(10, 19, 48, 0.45)', 'rgba(10, 19, 48, 0.78)', 'rgba(10, 19, 48, 0.96)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
              />
            </>
          ) : (
            <LinearGradient
              colors={['#0A1330', '#132147', '#25254A', '#452622']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
            />
          )}

          {/* Top meta row */}
          <View style={styles.featuredTopRow}>
            <View style={[styles.featuredBadge, { backgroundColor: colors.brandOrange }]}>
              <Sparkles size={11} color="#FFFFFF" />
              <Text style={styles.featuredBadgeText}>FEATURED GUIDE</Text>
            </View>

            {isSaved && (
              <View style={styles.readTimeRow}>
                <Bookmark size={12} color={colors.brandOrange} fill={colors.brandOrange} />
                <Text style={styles.readTimeText}>Saved</Text>
              </View>
            )}
          </View>

          {/* Title & Summary */}
          <Text style={styles.featuredTitle}>{article.title}</Text>
          <Text style={styles.featuredSummary} numberOfLines={2}>
            {article.summary}
          </Text>

          {/* Bottom Action Row */}
          <View style={styles.featuredBottomRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>
                {CATEGORY_LABEL[article.category] ?? 'SAFETY'}
              </Text>
            </View>

            <View
              style={[
                styles.readActionBtn,
                {
                  backgroundColor: pressed ? colors.brandOrangeDeep : colors.brandOrange,
                },
              ]}
            >
              <Text style={styles.readActionText}>Read Guide</Text>
              <ArrowRight size={13} color="#FFFFFF" />
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export const ArticleListItem: React.FC<{ article: FireEducationArticle }> = ({ article }) => {
  const { colors, spacing, radius, typography, isDark } = useTheme();
  const { isBookmarked } = useBookmarks();
  const isSaved = isBookmarked(article.content_id);
  const Icon = CATEGORY_ICON[article.category] ?? BookOpen;
  const gradient = CATEGORY_GRADIENT[article.category as keyof typeof CATEGORY_GRADIENT] ?? ['#F97316', '#EA580C'];
  const imageSource = getArticleImageSource(article.image_path);

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/learn/${article.content_id}`)}
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: pressed ? (isDark ? '#1F1713' : '#FFF7F2') : colors.surfaceElevated,
          borderColor: pressed ? colors.brandOrange : colors.border,
          borderWidth: pressed ? 1.5 : 1,
          borderRadius: 20,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      {({ pressed }) => (
        <>
          {/* Article Thumbnail or Category Squircle */}
          {imageSource ? (
            <Image
              source={imageSource}
              style={[styles.thumbnailImg, { borderRadius: 14 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.squircleWrap}>
              <LinearGradient
                colors={gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 15 }]}
              />
              <Icon size={20} color="#FFFFFF" />
            </View>
          )}

          {/* Content */}
          <View style={styles.itemContent}>
            <Text style={[styles.itemCategory, { color: colors.brandOrange }]}>
              {CATEGORY_LABEL[article.category] ?? 'GENERAL'}
            </Text>
            <Text
              style={[styles.itemTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {article.title}
            </Text>
            {isSaved && (
              <View style={styles.metaRow}>
                <Bookmark size={11} color={colors.brandOrange} fill={colors.brandOrange} />
                <Text style={[styles.metaText, { color: colors.brandOrange, marginLeft: 4 }]}>Saved</Text>
              </View>
            )}
          </View>

          {/* Chevron Circle */}
          <View
            style={[
              styles.chevronCircle,
              {
                backgroundColor: pressed ? colors.brandOrange : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'),
                borderColor: pressed ? colors.brandOrange : colors.border,
              },
            ]}
          >
            <ChevronRight size={15} color={pressed ? '#FFFFFF' : colors.textMuted} />
          </View>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  featuredWrapper: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#0A1330',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  featuredCard: {
    padding: 20,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0A1330',
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readTimeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 27,
  },
  featuredSummary: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  categoryPill: {
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryPillText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  readActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  squircleWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#0F172A',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});