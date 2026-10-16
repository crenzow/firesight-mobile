import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, BookOpen } from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { AppHeader } from "../../../components/navigation/AppHeader";
import {
  CategoryFilterTabs,
  LearnCategory,
} from "../../../components/learn/CategoryFilterTabs";
import {
  FeaturedArticleCard,
  ArticleListItem,
} from "../../../components/learn/ArticleCards";
import { educationService } from "../../../services/api";
import { FireEducationArticle } from "../../../services/api/models";

// Shown instantly and whenever the network call fails, so the Learn tab is
// never empty for a resident on a poor connection.
const FALLBACK_ARTICLES: FireEducationArticle[] = [
  {
    content_id: 1,
    title: "Philippines Fire Season Safety Guide 2026",
    category: "prevention",
    summary:
      "Essential fire prevention practices for Filipino households during the dry season.",
    body: "Detailed guidance on preparing homes and communities for the dry season, covering electrical safety, cooking safety, and community-level prevention measures.",
    image_path: "uploads/education/fire_season_safety.jpg",
    read_minutes: 8,
    is_featured: true,
  },
  {
    content_id: 2,
    title: "Kitchen Fire Safety",
    category: "prevention",
    summary:
      "Most house fires start in the kitchen. Learn how to prevent cooking fires.",
    body: "Never leave cooking unattended, keep flammable materials away from the stove, and know how to respond if a small grease fire starts.",
    image_path: "uploads/education/kitchen_fire_safety.jpg",
    read_minutes: 4,
    is_featured: false,
  },
  {
    content_id: 3,
    title: "Electrical Safety at Home",
    category: "prevention",
    summary:
      "Overloaded circuits and faulty wiring are leading causes of residential fires.",
    body: "Avoid overloading outlets, replace frayed cords, and have an electrician inspect wiring in older homes.",
    image_path: "uploads/education/electrical_safety.jpg",
    read_minutes: 5,
    is_featured: false,
  },
  {
    content_id: 4,
    title: "What To Do During a Fire",
    category: "emergency_response",
    summary: "Know the R.A.C.E. and P.A.S.S. procedures for fire emergencies.",
    body: "R.A.C.E. (Rescue, Alarm, Contain, Extinguish/Evacuate) and P.A.S.S. (Pull, Aim, Squeeze, Sweep) are core procedures every household should memorize.",
    image_path: "uploads/education/evacuation_procedure.jpg",
    read_minutes: 5,
    is_featured: false,
  },
  {
    content_id: 5,
    title: "Understanding Barangay Fire Risk Levels",
    category: "awareness",
    summary:
      "How FireSight calculates Mild, Moderate, and High risk levels for your barangay.",
    body: "Risk levels are generated from historical incident data and demographic density, helping residents understand why their barangay is flagged at a particular risk level.",
    image_path: "uploads/education/barangay_risk_levels.jpg",
    read_minutes: 4,
    is_featured: false,
  },
];

export default function LearnScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const [articles, setArticles] =
    useState<FireEducationArticle[]>(FALLBACK_ARTICLES);
  const [category, setCategory] = useState<LearnCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = () => {
    educationService
      .list()
      .then((data) => data.length > 0 && setArticles(data))
      .catch(() => {})
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    load();
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const featured = useMemo(
    () => (!isSearching ? articles.find((a) => a.is_featured) : undefined),
    [articles, isSearching],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((a) => {
      const matchesCategory = category === "all" || a.category === category;
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q);

      if (isSearching) {
        return matchesCategory && matchesSearch;
      }
      return a.content_id !== featured?.content_id && matchesCategory && matchesSearch;
    });
  }, [articles, category, featured, searchQuery, isSearching]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
          }}
          showsVerticalScrollIndicator={false}
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
          {/* Header Title Section */}
          <View style={styles.headerSection}>
            <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
              Fire Safety Education
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Essential prevention tips, emergency procedures, and household guidelines.
            </Text>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search safety guides..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={[
                  styles.clearButton,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
                ]}
              >
                <X size={12} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Featured Hero Card (Shown only when not searching) */}
          {featured && (
            <View style={{ marginTop: spacing.lg }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  FEATURED TODAY
                </Text>
              </View>
              <FeaturedArticleCard article={featured} />
            </View>
          )}

          {/* Category Filter Tabs */}
          <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
            <CategoryFilterTabs active={category} onChange={setCategory} />
          </View>

          {/* List Section Header */}
          <View style={[styles.sectionHeaderRow, { marginBottom: 10 }]}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              {isSearching ? "SEARCH RESULTS" : "ALL GUIDES"}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
              </Text>
            </View>
          </View>

          {/* Articles List */}
          {filtered.length > 0 ? (
            filtered.map((article) => (
              <ArticleListItem key={article.content_id} article={article} />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <BookOpen size={36} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No guides found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {isSearching
                  ? `No guides matched "${searchQuery}". Try searching for keywords like "cooking", "wiring", or "procedure".`
                  : "No guides available in this category yet."}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 16,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});

