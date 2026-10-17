import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  BackHandler,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  PhoneCall,
  ZoomIn,
  ShieldAlert,
  Flame,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { educationService, contactService } from '../../../services/api';
import { FireEducationArticle, EmergencyContact } from '../../../services/api/models';
import { getArticleImageSource } from '../../../constants/educationImages';
import { EditorialContent } from '../../../components/learn/EditorialContent';
import { PhotoLightboxModal } from '../../../components/learn/PhotoLightboxModal';
import { TextSizeModal, TextSizeStep } from '../../../components/learn/TextSizeModal';
import { useBookmarks } from '../../../hooks/useBookmarks';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';

const CATEGORY_LABEL = {
  prevention: 'FIRE PREVENTION',
  emergency_response: 'EMERGENCY',
  awareness: 'COMMUNITY AWARENESS',
} as const;

const CATEGORY_ICON = {
  prevention: Flame,
  emergency_response: ShieldAlert,
  awareness: BookOpen,
} as const;

const HEADER_TITLE: Record<string, string> = {
  prevention: 'Prevention Guide',
  emergency_response: 'Emergency',
  awareness: 'Community Advisory',
};

function formatArticleDate(dateString?: string): string {
  if (!dateString) return '2026';
  try {
    const cleaned = dateString.replace(' ', 'T');
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return '2026';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '2026';
  }
}

export default function LearnArticleScreen() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<FireEducationArticle | null>(null);
  const [allArticles, setAllArticles] = useState<FireEducationArticle[]>([]);
  const [hotlineContacts, setHotlineContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSizeStep, setFontSizeStep] = useState<TextSizeStep>(1);
  const [textSizeModalVisible, setTextSizeModalVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = article ? isBookmarked(article.content_id) : false;

  const imageSource = getArticleImageSource(article?.image_path);

  useEffect(() => {
    if (imageSource && typeof imageSource === 'object' && 'uri' in imageSource && imageSource.uri) {
      Image.getSize(
        imageSource.uri,
        (w, h) => {
          if (w > 0 && h > 0) {
            setImageAspectRatio(w / h);
          }
        },
        () => {
          setImageAspectRatio(16 / 9);
        }
      );
    } else {
      setImageAspectRatio(null);
    }
  }, [imageSource]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.navigate('/(resident)/learn');
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    educationService
      .getById(Number(id))
      .then((data) => {
        setArticle(data || null);
      })
      .catch(() => {
        setArticle(null);
      })
      .finally(() => setIsLoading(false));

    // Fetch full list for "Up Next" recommendations
    educationService
      .list()
      .then((list) => {
        if (list && list.length > 0) {
          setAllArticles(list);
        }
      })
      .catch(() => {});

    // Fetch official BFP hotlines from emergency contacts database
    contactService
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          const lianFire = data.filter(
            (c) => c.category === 'fire' && c.name.toLowerCase().includes('lian')
          );
          if (lianFire.length > 0) {
            setHotlineContacts(lianFire);
          } else {
            const anyFire = data.filter((c) => c.category === 'fire' || c.is_primary);
            setHotlineContacts(anyFire.slice(0, 2));
          }
        }
      })
      .catch(() => {});
  }, [id]);

  // Compute next recommended article
  const nextArticle = useMemo(() => {
    if (!article || allArticles.length <= 1) return null;
    const currentIndex = allArticles.findIndex((a) => a.content_id === article.content_id);
    if (currentIndex >= 0 && currentIndex < allArticles.length - 1) {
      return allArticles[currentIndex + 1];
    }
    return allArticles[0]?.content_id !== article.content_id ? allArticles[0] : null;
  }, [article, allArticles]);

  const headerTitle = article ? (HEADER_TITLE[article.category] ?? 'Safety Advisory') : 'Safety Advisory';

  // Proportional font sizing based on selected slider step
  const headlineFontSize = [22, 24, 26.5, 29][fontSizeStep];
  const headlineLineHeight = [28, 30, 33, 36][fontSizeStep];
  const summaryFontSize = [14.5, 16, 18, 20][fontSizeStep];
  const summaryLineHeight = [22, 24, 26, 28][fontSizeStep];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader
        title={headerTitle}
        onBack={() => router.navigate('/(resident)/learn')}
        rightElement={
          <View style={styles.headerRightCluster}>
            {/* Font Size Settings Button */}
            <Pressable
              onPress={() => setTextSizeModalVisible(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerActionBtn,
                fontSizeStep !== 1 && {
                  backgroundColor: colors.brandOrange,
                  borderColor: colors.brandOrange,
                },
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Adjust Text Size"
            >
              <Text style={styles.fontSizeIndicator}>Aa</Text>
            </Pressable>

            {/* Bookmark Button */}
            {article && (
              <Pressable
                onPress={() => toggleBookmark(article.content_id)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerActionBtn,
                  bookmarked && {
                    backgroundColor: colors.brandOrange,
                    borderColor: colors.brandOrange,
                  },
                  { transform: [{ scale: pressed ? 0.92 : 1 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? 'Saved to bookmarks' : 'Bookmark guide'}
              >
                <Bookmark
                  size={16}
                  color="#FFFFFF"
                  fill={bookmarked ? '#FFFFFF' : 'none'}
                />
              </Pressable>
            )}
          </View>
        }
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brandOrange} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: 12, fontWeight: '500' }}>
              Loading safety guide…
            </Text>
          </View>
        ) : !article ? (
          <View style={styles.center}>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
              Guide not found.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Category Eyebrow */}
            <View style={styles.eyebrowRow}>
              <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF0E5' }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.brandOrange }]}>
                  {CATEGORY_LABEL[article.category] ?? 'SAFETY GUIDE'}
                </Text>
              </View>
            </View>

            {/* 2. Editorial Headline */}
            <Text
              style={[
                styles.editorialHeadline,
                {
                  color: colors.textPrimary,
                  fontSize: headlineFontSize,
                  lineHeight: headlineLineHeight,
                },
              ]}
            >
              {article.title}
            </Text>

            {/* 3. Lead Standfirst / Deck Summary */}
            <Text
              style={[
                styles.standfirstText,
                {
                  color: isDark ? '#94A3B8' : '#475569',
                  fontSize: summaryFontSize,
                  lineHeight: summaryLineHeight,
                },
              ]}
            >
              {article.summary}
            </Text>

            {/* 4. Publisher Byline */}
            <View style={styles.bylineRow}>
              <View style={[styles.bylineDot, { backgroundColor: colors.brandOrange }]} />
              <Text style={[styles.bylineText, { color: colors.textMuted }]}>
                Bureau of Fire Protection · Lian Fire Station · {formatArticleDate(article.created_at)}
              </Text>
            </View>

            {/* 5. Cinematic Photo Hero (Squircle 24px) */}
            <View style={styles.mediaContainer}>
              {imageSource ? (
                <Pressable
                  onPress={() => setLightboxVisible(true)}
                  style={({ pressed }) => [
                    styles.heroImageWrap,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="Tap to view image fullscreen"
                >
                  <Image
                    source={imageSource}
                    style={[
                      styles.heroImage,
                      imageAspectRatio
                        ? { aspectRatio: imageAspectRatio }
                        : { height: 220 },
                    ]}
                    resizeMode="contain"
                  />
                  <View style={styles.zoomPill}>
                    <ZoomIn size={12} color="#FFFFFF" />
                    <Text style={styles.zoomPillText}>Tap to view</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={[styles.heroImageWrap, { height: 180 }]}>
                  <LinearGradient
                    colors={['#0A1330', '#132147', '#25254A', '#452622']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
              )}
            </View>

            {/* 6. Editorial Body Content */}
            <EditorialContent content={article.body} fontSizeStep={fontSizeStep} />

            {/* 7. "UP NEXT" Contextual Recommendation Card */}
            {nextArticle && (
              <View style={styles.upNextSection}>
                <Text style={[styles.upNextEyebrow, { color: colors.textMuted }]}>
                  UP NEXT IN SAFETY
                </Text>
                <Pressable
                  onPress={() => router.push(`/(resident)/learn/${nextArticle.content_id}`)}
                  style={({ pressed }) => [
                    styles.upNextCard,
                    {
                      backgroundColor: pressed
                        ? isDark
                          ? '#1F1713'
                          : '#FFF7F2'
                        : colors.surfaceElevated,
                      borderColor: pressed ? colors.brandOrange : colors.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Read next: ${nextArticle.title}`}
                >
                  <View style={styles.upNextContent}>
                    <Text style={[styles.upNextCategory, { color: colors.brandOrange }]}>
                      {CATEGORY_LABEL[nextArticle.category] ?? 'SAFETY GUIDE'}
                    </Text>
                    <Text
                      style={[styles.upNextTitle, { color: colors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {nextArticle.title}
                    </Text>
                    <Text style={[styles.upNextMeta, { color: colors.textMuted }]}>
                      Recommended follow-up
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.upNextChevronWrap,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ChevronRight size={16} color={colors.brandOrange} />
                  </View>
                </Pressable>
              </View>
            )}

            {/* 8. Apple Health "Medical ID" Style Emergency SOS Card */}
            <View
              style={[
                styles.sosCard,
                {
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sosHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sosStationTitle, { color: colors.textPrimary }]}>
                    BFP Lian Fire Station
                  </Text>
                  <Text style={[styles.sosStationSubtitle, { color: colors.textMuted }]}>
                    24/7 Fire Suppression & Emergency Rescue
                  </Text>
                </View>
              </View>

              {hotlineContacts.length > 0 ? (
                <View style={styles.sosButtonsWrap}>
                  {hotlineContacts.map((contact) => {
                    const cleanNumber = contact.phone_number.replace(/[^\d+]/g, '');
                    const labelMatch = contact.name.match(/\(([^)]+)\)/);
                    const typeLabel = labelMatch ? labelMatch[1] : '';
                    const buttonText = typeLabel
                      ? `Call ${typeLabel}: ${contact.phone_number}`
                      : `Call: ${contact.phone_number}`;

                    return (
                      <Pressable
                        key={contact.contact_id}
                        onPress={() => Linking.openURL(`tel:${cleanNumber}`)}
                        style={({ pressed }) => [
                          styles.sosButton,
                          {
                            backgroundColor: pressed ? '#DC2626' : '#EF4444',
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${contact.name} at ${contact.phone_number}`}
                      >
                        <PhoneCall size={15} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.sosButtonText}>{buttonText}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Fullscreen Photo Lightbox Modal */}
      <PhotoLightboxModal
        visible={lightboxVisible}
        imageSource={imageSource}
        title={article?.title}
        onClose={() => setLightboxVisible(false)}
      />

      {/* Interactive Text Size Stepped Slider Modal */}
      <TextSizeModal
        visible={textSizeModalVisible}
        step={fontSizeStep}
        onChange={setFontSizeStep}
        onClose={() => setTextSizeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fontSizeIndicator: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  /* Eyebrow & Meta */
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  readMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* Headline & Standfirst */
  editorialHeadline: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 12,
  },
  standfirstText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.1,
    marginBottom: 14,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  bylineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bylineText: {
    fontSize: 11.5,
    fontWeight: '500',
  },

  /* Media Container */
  mediaContainer: {
    marginBottom: 16,
  },
  heroImageWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  heroImage: {
    width: '100%',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  zoomPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Up Next Section */
  upNextSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  upNextEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  upNextContent: {
    flex: 1,
    marginRight: 12,
  },
  upNextCategory: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  upNextTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 4,
  },
  upNextMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  upNextChevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Apple Health style Emergency SOS Card */
  sosCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosStationTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sosStationSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  sosButtonsWrap: {
    gap: 8,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});