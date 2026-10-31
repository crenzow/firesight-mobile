import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
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
import { Skeleton } from "../../../components/ui/Skeleton";
import { educationService } from "../../../services/api";
import { FireEducationArticle } from "../../../services/api/models";
import { useBookmarks } from "../../../hooks/useBookmarks";

export default function LearnScreen() {
  const { colors, spacing, typography, shadow, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - spacing.lg * 2;
  const [articles, setArticles] = useState<FireEducationArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<LearnCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  const { bookmarkedIds } = useBookmarks();

  const load = useCallback((silent = false) => {
    if (!silent) {
      setIsLoading(articles.length === 0);
    }
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
  }, [articles.length]);

  useFocusEffect(
    useCallback(() => {
      load(true);

      // Auto-refresh every 15 seconds while screen is focused so database updates appear live
      const timer = setInterval(() => {
        load(true);
      }, 15000);

      const onBackPress = () => {
        if (searchQuery.trim().length > 0) {
          setSearchQuery("");
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [load, searchQuery])
  );

  const isSearching = searchQuery.trim().length > 0;
  const isSavedTab = category === "saved";

  // Hide featured card/carousel when searching or viewing saved tab
  const featuredArticles = useMemo(
    () => (!isSearching && !isSavedTab ? articles.filter((a) => a.is_featured) : []),
    [articles, isSearching, isSavedTab],
  );

  const featuredIds = useMemo(
    () => new Set(featuredArticles.map((a) => a.content_id)),
    [featuredArticles],
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
      return !featuredIds.has(a.content_id) && matchesCategory && matchesSearch;
    });
  }, [articles, category, featuredIds, searchQuery, isSearching, isSavedTab, bookmarkedIds]);

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

          {/* Elevated Editorial Search Card */}
          <View
            style={[
              styles.searchCard,
              {
                backgroundColor: isDark ? colors.surfaceElevated : "#FFFFFF",
                borderColor: isSearchFocused
                  ? colors.brandOrange
                  : isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
              },
              !isDark && shadow.card,
            ]}
          >
            <Search
              size={18}
              color={isSearchFocused ? colors.brandOrange : colors.textMuted}
              strokeWidth={2.2}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.textPrimary,
                  fontSize: typography.size.sm,
                  marginLeft: spacing.sm,
                },
              ]}
              placeholder="Search safety guides..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSearchQuery("");
                }}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.clearBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
              >
                <View
                  style={[
                    styles.clearCircle,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.15)",
                    },
                  ]}
                >
                  <X size={11} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </Pressable>
            ) : null}
          </View>

          {/* Featured Hero Card or Carousel (Shown only when not searching and not on Saved tab) */}
          {featuredArticles.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  {featuredArticles.length > 1 ? "FEATURED GUIDES" : "FEATURED TODAY"}
                </Text>
                {featuredArticles.length > 1 && (
                  <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={[styles.countText, { color: colors.brandOrange, fontWeight: "700" }]}>
                      {activeFeaturedIndex + 1} of {featuredArticles.length}
                    </Text>
                  </View>
                )}
              </View>

              {featuredArticles.length === 1 ? (
                <FeaturedArticleCard article={featuredArticles[0]} />
              ) : (
                <>
                  <ScrollView
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={cardWidth + spacing.md}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    onScroll={(e) => {
                      const x = e.nativeEvent.contentOffset.x;
                      const idx = Math.round(x / (cardWidth + spacing.md));
                      if (idx !== activeFeaturedIndex && idx >= 0 && idx < featuredArticles.length) {
                        setActiveFeaturedIndex(idx);
                      }
                    }}
                    scrollEventThrottle={16}
                  >
                    {featuredArticles.map((article, idx) => (
                      <View
                        key={article.content_id}
                        style={{
                          width: cardWidth,
                          marginRight: idx < featuredArticles.length - 1 ? spacing.md : 0,
                        }}
                      >
                        <FeaturedArticleCard article={article} />
                      </View>
                    ))}
                  </ScrollView>

                  {/* Pagination Dots */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 12,
                    }}
                  >
                    {featuredArticles.map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: i === activeFeaturedIndex ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor:
                            i === activeFeaturedIndex
                              ? colors.brandOrange
                              : isDark
                              ? "rgba(255,255,255,0.2)"
                              : "rgba(0,0,0,0.15)",
                        }}
                      />
                    ))}
                  </View>
                </>
              )}
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
            <View>
              {[1, 2, 3].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.skeletonCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB",
                    },
                    !isDark && shadow.card,
                  ]}
                >
                  <Skeleton width={48} height={48} borderRadius={14} />
                  <View style={styles.skeletonContent}>
                    <Skeleton width={64} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width="88%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="55%" height={12} borderRadius={4} />
                  </View>
                  <Skeleton width={30} height={30} borderRadius={15} />
                </View>
              ))}
            </View>
          ) : filtered.length > 0 ? (
            filtered.map((article) => (
              <ArticleListItem key={article.content_id} article={article} />
            ))
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : "#FFFFFF",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "transparent",
                },
                !isDark && shadow.card,
              ]}
            >
              {isSavedTab ? (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.brandOrange}15` }]}>
                    <Bookmark size={28} color={colors.brandOrange} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No saved guides yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Tap the bookmark icon in the top bar of any guide to save it for quick offline reference.
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
                    <BookOpen size={28} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No guides found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {isSearching
                      ? `No guides matched "${searchQuery}".`
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
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  clearCircle: {
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
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
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
