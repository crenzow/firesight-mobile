import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { CategoryFilterTabs, LearnCategory } from '../../../components/learn/CategoryFilterTabs';
import { FeaturedArticleCard, ArticleListItem } from '../../../components/learn/ArticleCards';
import { educationService } from '../../../services/api';
import { FireEducationArticle } from '../../../services/api/models';

// Shown instantly and whenever the network call fails, so the Learn tab is
// never empty for a resident on a poor connection.
const FALLBACK_ARTICLES: FireEducationArticle[] = [
  {
    content_id: 1,
    title: 'Philippines Fire Season Safety Guide 2026',
    category: 'prevention',
    summary: 'Essential fire prevention practices for Filipino households during the dry season.',
    body: 'Detailed guidance on preparing homes and communities for the dry season, covering electrical safety, cooking safety, and community-level prevention measures.',
    image_path: null,
    read_minutes: 8,
    is_featured: true,
  },
  {
    content_id: 2,
    title: 'Kitchen Fire Safety',
    category: 'prevention',
    summary: 'Most house fires start in the kitchen. Learn how to prevent cooking fires.',
    body: 'Never leave cooking unattended, keep flammable materials away from the stove, and know how to respond if a small grease fire starts.',
    image_path: null,
    read_minutes: 4,
    is_featured: false,
  },
  {
    content_id: 3,
    title: 'Electrical Safety at Home',
    category: 'prevention',
    summary: 'Overloaded circuits and faulty wiring are leading causes of residential fires.',
    body: 'Avoid overloading outlets, replace frayed cords, and have an electrician inspect wiring in older homes.',
    image_path: null,
    read_minutes: 5,
    is_featured: false,
  },
  {
    content_id: 4,
    title: 'What To Do During a Fire',
    category: 'emergency_response',
    summary: 'Know the R.A.C.E. and P.A.S.S. procedures for fire emergencies.',
    body: 'R.A.C.E. (Rescue, Alarm, Contain, Extinguish/Evacuate) and P.A.S.S. (Pull, Aim, Squeeze, Sweep) are core procedures every household should memorize.',
    image_path: null,
    read_minutes: 5,
    is_featured: false,
  },
  {
    content_id: 5,
    title: 'Understanding Barangay Fire Risk Levels',
    category: 'awareness',
    summary: 'How FireSight calculates Low, Moderate, and High risk levels for your barangay.',
    body: 'Risk levels are generated from historical incident data and demographic density, helping residents understand why their barangay is flagged at a particular risk level.',
    image_path: null,
    read_minutes: 4,
    is_featured: false,
  },
];

export default function LearnScreen() {
  const { colors, spacing, typography } = useTheme();
  const [articles, setArticles] = useState<FireEducationArticle[]>(FALLBACK_ARTICLES);
  const [category, setCategory] = useState<LearnCategory>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = () => {
    educationService
      .list()
      .then((data) => data.length > 0 && setArticles(data))
      .catch(() => {
        // Keep fallback articles — the Learn tab should never render empty.
      })
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    load();
  }, []);

  const featured = useMemo(() => articles.find((a) => a.is_featured), [articles]);
  const filtered = useMemo(
    () =>
      articles.filter((a) => a.content_id !== featured?.content_id && (category === 'all' || a.category === category)),
    [articles, category, featured]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                load();
              }}
              tintColor={colors.brandOrange}
            />
          }
        >
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: '800' }}>
            Fire Education
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: 2 }}>
            Safety tips & prevention guides
          </Text>

          {featured && category === 'all' ? (
            <View style={{ marginTop: spacing.lg }}>
              <FeaturedArticleCard article={featured} />
            </View>
          ) : null}

          <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
            <CategoryFilterTabs active={category} onChange={setCategory} />
          </View>

          {filtered.map((article) => (
            <ArticleListItem key={article.content_id} article={article} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}