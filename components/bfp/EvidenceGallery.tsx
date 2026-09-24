import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Modal, SafeAreaView, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Camera, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { APP_CONFIG } from '../../constants/config';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

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
}

/**
 * Horizontal scrollable gallery: the resident's original submission photo
 * first (labeled), followed by any additional evidence BFP personnel have
 * added. If canAdd is true, shows an "Add" tile to attach more.
 * Photos can be tapped to view full screen.
 */
export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ mainPhoto, evidencePhotos, onAddEvidence, canAdd = true }) => {
  const { colors, spacing, radius, typography } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [isSourceDialogVisible, setIsSourceDialogVisible] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<EvidencePhoto | null>(null);

  const photos: EvidencePhoto[] = [
    ...(mainPhoto ? [{ key: 'main', uri: `${APP_CONFIG.API_BASE_URL}/${mainPhoto}`, caption: 'Original submission' }] : []),
    ...evidencePhotos.map((e) => ({ key: String(e.evidence_id), uri: `${APP_CONFIG.API_BASE_URL}/${e.image_path}`, caption: e.caption })),
  ];

  const handleAddFromLibrary = async () => {
    setIsSourceDialogVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await uploadEvidence(result.assets[0].uri);
    }
  };

  const handleAddFromCamera = async () => {
    setIsSourceDialogVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to capture evidence.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await uploadEvidence(result.assets[0].uri);
    }
  };

  const uploadEvidence = async (uri: string) => {
    setIsUploading(true);
    try {
      await onAddEvidence(uri);
    } catch {
      Alert.alert('Upload failed', 'Unable to attach this evidence photo right now. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPress = () => {
    setIsSourceDialogVisible(true);
  };

  return (
    <View>
      {/* Full screen image modal */}
      <Modal visible={!!expandedPhoto} transparent={true} animationType="fade" onRequestClose={() => setExpandedPhoto(null)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setExpandedPhoto(null)} style={styles.closeBtn}>
                <X size={24} color="#FFF" />
              </Pressable>
            </View>
            {expandedPhoto && (
              <View style={styles.modalImageContainer}>
                <Image source={{ uri: expandedPhoto.uri }} style={styles.modalImage} resizeMode="contain" />
                {expandedPhoto.caption ? (
                  <Text style={styles.modalCaption}>{expandedPhoto.caption}</Text>
                ) : null}
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      <ConfirmationDialog
        visible={isSourceDialogVisible}
        type="info"
        title="Add Photo Evidence"
        message="Choose how you want to attach an investigation photo."
        confirmText="Take Photo"
        cancelText="Photo Library"
        icon={<Camera size={28} color="#FFFFFF" strokeWidth={2.5} />}
        onConfirm={handleAddFromCamera}
        onCancel={handleAddFromLibrary}
        onClose={() => setIsSourceDialogVisible(false)}
      />
      <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginBottom: spacing.sm }}>
        Evidence ({photos.length})
      </Text>
      
      {photos.length === 0 && !canAdd ? (
        <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, fontStyle: 'italic' }}>
          No evidence photos attached.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {photos.map((photo) => (
            <Pressable key={photo.key} style={{ width: 140 }} onPress={() => setExpandedPhoto(photo)}>
              <Image source={{ uri: photo.uri }} style={[styles.photo, { borderRadius: radius.md }]} />
              {photo.caption ? (
                <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>
                  {photo.caption}
                </Text>
              ) : null}
            </Pressable>
          ))}

          {canAdd && (
            <Pressable
              onPress={handleAddPress}
              disabled={isUploading}
              style={[
                styles.addTile,
                { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
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