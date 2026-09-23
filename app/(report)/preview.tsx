import React from 'react';
import { View, StyleSheet, Image, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { RefreshCcw, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useReportDraft } from '../../context/ReportDraftContext';
import { Button } from '../../components/ui/Button';

export default function PreviewScreen() {
  const { colors, spacing, typography } = useTheme();
  const { draft, updateDraft } = useReportDraft();
  const isFocused = useIsFocused();

  React.useEffect(() => {
    if (isFocused && !draft.photoUri) {
      router.replace('/(report)/capture');
    }
  }, [draft.photoUri, isFocused]);

  if (!draft.photoUri) {
    return null;
  }

  const handleRetake = () => {
    updateDraft({ photoUri: null });
    router.back();
  };

  const handleProceed = () => {
    router.push('/(report)/location');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: draft.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={handleRetake} style={styles.retakeButton}>
            <RefreshCcw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: typography.size.sm }}>
              Retake
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Photo Captured</Text>
            <Text style={styles.instructionsText}>
              Next, you'll need to pin the exact location of the incident on the map.
            </Text>
          </View>
          <Button
            label="Next: Pin Location"
            onPress={handleProceed}
            icon={<MapPin size={18} color="#FFFFFF" />}
            iconPosition="left"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomBar: { width: '100%' },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  instructionsText: { color: '#CCCCCC', fontSize: 13, lineHeight: 18 },
});
