import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, BackHandler, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Clock, Flame, ShieldAlert, BookOpen, PhoneCall, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { educationService } from '../../../services/api';
import { FireEducationArticle } from '../../../services/api/models';
import { getArticleImageSource } from '../../../constants/educationImages';

const CATEGORY_LABEL = {
  prevention: 'FIRE PREVENTION',
  emergency_response: 'EMERGENCY PROTOCOL',
  awareness: 'COMMUNITY AWARENESS',
} as const;

const CATEGORY_ICON = {
  prevention: Flame,
  emergency_response: ShieldAlert,
  awareness: BookOpen,
} as const;

const CATEGORY_GRADIENT = {
  prevention: ['#F97316', '#EA580C'],
  emergency_response: ['#EF4444', '#DC2626'],
  awareness: ['#6366F1', '#4F46E5'],
} as const;

const FALLBACK_ARTICLES: FireEducationArticle[] = [
  {
    content_id: 1,
    title: 'Philippines Fire Season Safety Guide 2026',
    category: 'prevention',
    summary: 'Essential fire prevention practices for Filipino households during the dry season.',
    body: 'During the dry summer months in the Philippines, high temperatures and low humidity dramatically increase fire hazards. Key household measures include:\n\n1. Inspect Electrical Wiring: Regularly check appliance cords, eliminate octopus connections, and avoid overloading wall outlets.\n\n2. LPG Tank Maintenance: Always check hose clamps and regulators with soapy water to detect any gas leaks. Store tanks in well-ventilated areas away from direct heat.\n\n3. Cooking Precautions: Never leave stovetops unattended while cooking. Keep flammable towels, curtains, and packaging materials at least one meter away from flames.\n\n4. Community Firebreaks: Clear dry leaves, trash, and overgrown brush around property perimeters to stop rapid ground fire propagation.',
    image_path: 'uploads/education/fire_season_safety.jpg',
    read_minutes: 8,
    is_featured: true,
  },
  {
    content_id: 2,
    title: 'Kitchen Fire Safety',
    category: 'prevention',
    summary: 'Most house fires start in the kitchen. Learn how to prevent cooking fires.',
    body: 'Kitchen fires account for nearly half of all residential fire occurrences. Stay protected by following these cardinal rules:\n\n• Never throw water on a grease fire. Smother grease fires by carefully sliding a metal lid over the pan and turning off the burner.\n\n• Maintain clean exhaust hoods and stove surfaces to prevent oil accumulation.\n\n• Teach children to maintain a three-foot safety zone around hot cooking equipment.\n\n• Keep a working dry-chemical fire extinguisher or baking soda within reach.',
    image_path: 'uploads/education/kitchen_fire_safety.jpg',
    read_minutes: 4,
    is_featured: false,
  },
  {
    content_id: 3,
    title: 'Electrical Safety at Home',
    category: 'prevention',
    summary: 'Overloaded circuits and faulty wiring are leading causes of residential fires.',
    body: 'Faulty electrical systems are one of the most common causes of structure fires in the Philippines. Protect your home with these guidelines:\n\n• Unplug unused electronics and chargers to eliminate phantom power loads and overheating hazards.\n\n• Never run cords under carpets or through doorways where foot traffic can damage insulation.\n\n• Look for warning signs: flickering lights, warm switch plates, or recurring breaker trips necessitate immediate licensed electrician inspection.',
    image_path: 'uploads/education/electrical_safety.jpg',
    read_minutes: 5,
    is_featured: false,
  },
  {
    content_id: 4,
    title: 'What To Do During a Fire',
    category: 'emergency_response',
    summary: 'Know the R.A.C.E. and P.A.S.S. procedures for fire emergencies.',
    body: 'In a fire emergency, quick decisive action saves lives. Remember the two standard emergency acronyms:\n\n1. R.A.C.E. Protocol:\n• R - RESCUE: Remove anyone in immediate danger.\n• A - ALARM: Call BFP Lian or emergency hotlines immediately and alert neighbors.\n• C - CONTAIN: Close doors and windows behind you to slow flame and smoke progression.\n• E - EVACUATE: Evacuate using the nearest safe exit. Crawl low under smoke.\n\n2. P.A.S.S. Extinguisher Technique:\n• P - Pull the safety pin.\n• A - Aim at the base of the fire, not the flames.\n• S - Squeeze the handle lever steadily.\n• S - Sweep side to side until extinguished.',
    image_path: 'uploads/education/evacuation_procedure.jpg',
    read_minutes: 5,
    is_featured: false,
  },
  {
    content_id: 5,
    title: 'Understanding Barangay Fire Risk Levels',
    category: 'awareness',
    summary: 'How FireSight calculates Mild, Moderate, and High risk levels for your barangay.',
    body: 'FireSight uses data intelligence to keep communities safe. Barangay fire risk levels are classified into three actionable tiers:\n\n• Mild Risk (Yellow): Normal seasonal conditions with low historical incident density. Standard safety vigilance recommended.\n\n• Moderate Risk (Orange): Elevated risk factors present, such as dry spells or moderate density. Residents should check home safety equipment and remain alert.\n\n• High Risk (Red): Critical risk conditions with high vulnerability or recent incidents. Heightened vigilance, clear access lanes, and immediate report readiness required.',
    image_path: 'uploads/education/barangay_risk_levels.jpg',
    read_minutes: 4,
    is_featured: false,
  },
];

export default function LearnArticleScreen() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<FireEducationArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const imageSource = getArticleImageSource(article?.image_path);

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
    educationService
      .getById(Number(id))
      .then((data) => {
        if (data) {
          setArticle(data);
        } else {
          const fallback = FALLBACK_ARTICLES.find((a) => a.content_id === Number(id));
          setArticle(fallback || null);
        }
      })
      .catch(() => {
        const fallback = FALLBACK_ARTICLES.find((a) => a.content_id === Number(id));
        setArticle(fallback || null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const Icon = article ? (CATEGORY_ICON[article.category] ?? BookOpen) : BookOpen;
  const gradient = article
    ? (CATEGORY_GRADIENT[article.category] ?? ['#F97316', '#EA580C'])
    : ['#F97316', '#EA580C'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Fire Guide" onBack={() => router.navigate('/(resident)/learn')} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.center}>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
              Loading article…
            </Text>
          </View>
        ) : !article ? (
          <View style={styles.center}>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
              Article not found.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Card */}
            <View style={styles.heroCardWrapper}>
              {imageSource ? (
                <>
                  <Image
                    source={imageSource}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(10, 19, 48, 0.45)', 'rgba(10, 19, 48, 0.78)', 'rgba(10, 19, 48, 0.96)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </>
              ) : (
                <LinearGradient
                  colors={['#0A1330', '#132147', '#25254A', '#452622']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}

              {/* Category & Read Time Row */}
              <View style={styles.heroMetaRow}>
                <View style={[styles.heroCategoryPill, { backgroundColor: colors.brandOrange }]}>
                  <Icon size={12} color="#FFFFFF" />
                  <Text style={styles.heroCategoryText}>
                    {CATEGORY_LABEL[article.category] ?? 'SAFETY GUIDE'}
                  </Text>
                </View>

                <View style={styles.heroReadRow}>
                  <Clock size={12} color="#94A3B8" />
                  <Text style={styles.heroReadText}>{article.read_minutes} min read</Text>
                </View>
              </View>

              {/* Article Headline */}
              <Text style={styles.heroTitle}>{article.title}</Text>
            </View>



            {/* Article Body Content */}
            <View style={styles.bodySection}>
              <Text
                style={[
                  styles.bodyText,
                  {
                    color: colors.textPrimary,
                    fontSize: typography.size.base,
                  },
                ]}
              >
                {article.body}
              </Text>
            </View>

            {/* Bottom Community Safety Banner */}
            <View
              style={[
                styles.safetyBanner,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.safetyBannerContent}>
                <Text style={[styles.safetyBannerTitle, { color: colors.textPrimary }]}>
                  Need Immediate Fire Assistance?
                </Text>
                <Text style={[styles.safetyBannerText, { color: colors.textSecondary }]}>
                  Contact the local Bureau of Fire Protection or report an incident directly via FireSight.
                </Text>
              </View>

              <Pressable
                onPress={() => router.push('/(resident)/emergency-contacts')}
                style={({ pressed }) => [
                  styles.emergencyBtn,
                  {
                    backgroundColor: pressed ? colors.brandOrangeDeep : colors.brandOrange,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <PhoneCall size={14} color="#FFFFFF" />
                <Text style={styles.emergencyBtnText}>Emergency Hotlines</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  scrollContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  heroCardWrapper: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroCategoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroReadText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 30,
  },

  /* Body Content */
  bodySection: {
    marginTop: 24,
    paddingHorizontal: 2,
  },
  bodyText: {
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  /* Safety Banner */
  safetyBanner: {
    marginTop: 32,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  safetyBannerContent: {
    gap: 4,
  },
  safetyBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  safetyBannerText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});