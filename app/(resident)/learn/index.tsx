import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, BookOpen, Bookmark } from "lucide-react-native";
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
import { useBookmarks } from "../../../hooks/useBookmarks";

export default function LearnScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const [articles, setArticles] = useState<FireEducationArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<LearnCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { bookmarkedIds } = useBookmarks();

  const load = () => {
    educationService
      .list()
      .then((data) => {
        if (data && Array.isArray(data)) {
          setArticles(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsRefreshing(false);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const isSavedTab = category === "saved";

  // Hide featured card when searching or viewing saved tab
  const featured = useMemo(
    () => (!isSearching && !isSavedTab ? articles.find((a) => a.is_featured) : undefined),
    [articles, isSearching, isSavedTab],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((a) => {
      let matchesCategory = false;
      if (category === "all") {
        matchesCategory = true;
      } else if (category === "saved") {
        matchesCategory = bookmarkedIds.includes(a.content_id);
      } else {
        matchesCategory = a.category === category;
      }

      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q);

      if (isSearching || isSavedTab) {
        return matchesCategory && matchesSearch;
      }
      return a.content_id !== featured?.content_id && matchesCategory && matchesSearch;
    });
  }, [articles, category, featured, searchQuery, isSearching, isSavedTab, bookmarkedIds]);

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

          {/* Featured Hero Card (Shown only when not searching and not on Saved tab) */}
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
            <CategoryFilterTabs
              active={category}
              onChange={setCategory}
              savedCount={bookmarkedIds.length}
            />
          </View>

          {/* List Section Header */}
          <View style={[styles.sectionHeaderRow, { marginBottom: 10 }]}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              {isSearching
                ? "SEARCH RESULTS"
                : isSavedTab
                ? "SAVED GUIDES"
                : "ALL GUIDES"}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
              </Text>
            </View>
          </View>

          {/* Articles List */}
          {isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={colors.brandOrange} />
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 12, fontWeight: "500" }}>
                Loading safety guides…
              </Text>
            </View>
          ) : filtered.length > 0 ? (
            filtered.map((article) => (
              <ArticleListItem key={article.content_id} article={article} />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {isSavedTab ? (
                <>
                  <Bookmark size={36} color={colors.brandOrange} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No saved guides yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Tap the bookmark icon in the top bar of any guide to save it for quick offline reference.
                  </Text>
                </>
              ) : (
                <>
                  <BookOpen size={36} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No guides found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {isSearching
                      ? `No guides matched "${searchQuery}". Try searching for keywords like "cooking", "wiring", or "procedure".`
                      : "No guides available in this category yet."}
                  </Text>
                </>
              )}
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
