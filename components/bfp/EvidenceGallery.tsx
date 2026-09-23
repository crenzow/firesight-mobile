import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { APP_CONFIG } from '../../constants/config';

interface EvidencePhoto {
  key: string;
  uri: string;
  caption?: string | null;
}

interface EvidenceGalleryProps {
  mainPhoto: string | null; // report_image path, the resident's original submission
  evidencePhotos: { evidence_id: number; image_path: string; caption: string | null }[];
  onAddEvidence: (localUri: string) => Promise<void>;
}

/**
 * Horizontal scrollable gallery: the resident's original submission photo
 * first (labeled), followed by any additional evidence BFP personnel have
 * added, followed by an "Add" tile to attach more via camera or library.
 */
export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ mainPhoto, evidencePhotos, onAddEvidence }) => {
  const { colors, spacing, radius, typography } = useTheme();
  const [isUploading, setIsUploading] = useState(false);

  const photos: EvidencePhoto[] = [
    ...(mainPhoto ? [{ key: 'main', uri: `${APP_CONFIG.API_BASE_URL}/${mainPhoto}`, caption: 'Original submission' }] : []),
    ...evidencePhotos.map((e) => ({ key: String(e.evidence_id), uri: `${APP_CONFIG.API_BASE_URL}/${e.image_path}`, caption: e.caption })),
  ];

  const handleAddFromLibrary = async () => {
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
    Alert.alert('Add Evidence', 'Choose a source', [
      { text: 'Take Photo', onPress: handleAddFromCamera },
      { text: 'Choose from Library', onPress: handleAddFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View>
      <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginBottom: spacing.sm }}>
        Evidence ({photos.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {photos.map((photo) => (
          <View key={photo.key} style={{ width: 140 }}>
            <Image source={{ uri: photo.uri }} style={[styles.photo, { borderRadius: radius.md }]} />
            {photo.caption ? (
              <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>
                {photo.caption}
              </Text>
            ) : null}
          </View>
        ))}

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
      </ScrollView>
    </View>
  );
};

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
});