import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Plus, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { APP_CONFIG, getStorageImageUrl } from '../../constants/config';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { PhotoLightboxModal } from '../ui/PhotoLightboxModal';

interface EvidencePhoto {
  key: string;
  uri: string;
  caption?: string | null;
}

interface EvidenceGalleryProps {
  mainPhoto: string | null; // report_image path, the resident's original submission
  evidencePhotos: { evidence_id: number; image_path: string; caption: string | null }[];
  onAddEvidence: (localUri: string) => Promise<void>;
  canAdd?: boolean; // Whether the user is allowed to add new evidence
  showTitle?: boolean; // Defaults to false to avoid duplicate headers with SectionPill
}

/**
 * Horizontal scrollable gallery: the resident's original submission photo
 * first (labeled), followed by any additional evidence BFP personnel have
 * added. If canAdd is true, shows an "Add" tile to attach more.
 * Photos can be tapped to view full screen.
 */
export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  mainPhoto,
  evidencePhotos,
  onAddEvidence,
  canAdd = true,
  showTitle = false,
}) => {
  const { colors, spacing, radius, typography, isDark } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [isSourceDialogVisible, setIsSourceDialogVisible] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<EvidencePhoto | null>(null);

  const resolveUri = (path: string) => {
    return getStorageImageUrl(path) ?? path;
  };

  const photos: EvidencePhoto[] = [
    ...(mainPhoto ? [{ key: 'main', uri: resolveUri(mainPhoto), caption: null }] : []),
    ...evidencePhotos.map((e) => ({ key: String(e.evidence_id), uri: resolveUri(e.image_path), caption: e.caption })),
  ];

  const handleAddFromLibrary = async () => {
    setIsSourceDialogVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await uploadEvidence(result.assets[0].uri);
    }
  };

  const uploadEvidence = async (uri: string) => {
    setIsUploading(true);
    try {
      await onAddEvidence(uri);
    } catch {
      Alert.alert('Upload failed', 'Unable to attach this photo right now. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPress = () => {
    setIsSourceDialogVisible(true);
  };

  return (
    <View>
      {/* Full screen drag-and-zoom lightbox modal */}
      <PhotoLightboxModal
        visible={!!expandedPhoto}
        imageSource={expandedPhoto ? { uri: expandedPhoto.uri } : null}
        title={expandedPhoto?.key === 'main' ? 'Submission Photo' : 'Fire Scene Photo'}
        caption={expandedPhoto?.caption ?? undefined}
        onClose={() => setExpandedPhoto(null)}
      />

      <ConfirmationDialog
        visible={isSourceDialogVisible}
        type="info"
        title="Add Fire Scene Photo"
        message="Select an incident photo from your photo library to attach to this resolved incident report."
        confirmText="Choose Photo"
        cancelText="Cancel"
        icon={<ImageIcon size={28} color="#FFFFFF" strokeWidth={2.5} />}
        onConfirm={handleAddFromLibrary}
        onCancel={() => setIsSourceDialogVisible(false)}
        onClose={() => setIsSourceDialogVisible(false)}
      />
      {showTitle ? (
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginBottom: spacing.sm }}>
          {photos.length === 1 ? 'Fire Scene Photo (1)' : `Fire Scene Photos (${photos.length})`}
        </Text>
      ) : null}
      
      {photos.length === 0 && !canAdd ? (
        <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, fontStyle: 'italic' }}>
          No fire scene photos attached.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {photos.map((photo) => (
            <Pressable
              key={photo.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setExpandedPhoto(photo);
              }}
              style={({ pressed }) => [
                {
                  width: 140,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              {({ pressed }) => (
                <>
                  <View
                    style={[
                      styles.photo,
                      {
                        borderRadius: radius.md,
                        overflow: 'hidden',
                        backgroundColor: colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
                  </View>
                  {photo.caption ? (
                    <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>
                      {photo.caption}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          ))}

          {canAdd && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleAddPress();
              }}
              disabled={isUploading}
              style={({ pressed }) => [
                styles.addTile,
                {
                  borderRadius: radius.md,
                  borderColor: pressed ? colors.brandOrange : colors.border,
                  backgroundColor: pressed
                    ? (isDark ? '#221915' : '#FFF7F2')
                    : colors.surfaceElevated,
                  borderWidth: pressed ? 1.5 : 1,
                  transform: [{ scale: pressed && !isUploading ? 0.96 : 1 }],
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.brandOrange} />
              ) : (
                <>
                  <View style={[styles.addIconCircle, { backgroundColor: `${colors.brandOrange}1A` }]}>
                    <Plus size={18} color={colors.brandOrange} />
                  </View>
                  <Text style={{ color: colors.brandOrange, fontSize: typography.size.xs, fontWeight: '700', marginTop: 6 }}>
                    Add Photo
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  photo: { width: 140, height: 140 },
  addTile: {
    width: 140,
    height: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  modalCaption: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});