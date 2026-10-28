import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Trash2, X, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../ui/Button';

// -------------------------------------------------------------
// 1. Photo Options Modal (Camera vs Gallery vs Remove)
// -------------------------------------------------------------
export interface PhotoOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
  onRemovePhoto?: () => void;
  hasExistingPhoto?: boolean;
}

export const PhotoOptionsModal: React.FC<PhotoOptionsModalProps> = ({
  visible,
  onClose,
  onImageSelected,
  onRemovePhoto,
  hasExistingPhoto = false,
}) => {
  const { colors, spacing, radius, typography } = useTheme();

  if (!visible) return null;

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take a profile picture.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Bypasses Android's dark UCrop activity
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        onClose();
        onImageSelected(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  const handleChooseGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery access is needed to select a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Bypasses Android's dark UCrop activity
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        onClose();
        onImageSelected(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to access photos. Please try again.');
    }
  };

  const handleRemove = () => {
    onClose();
    if (onRemovePhoto) {
      onRemovePhoto();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border, padding: spacing.lg }]}>
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: '700' }}>
                Profile Photo
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 }}>
                Choose how to set your profile picture
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
              }}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  transform: [{ scale: pressed ? 0.90 : 1 }],
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Options */}
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            {/* Take Photo */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleTakePhoto();
              }}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: colors.brandOrange + '20' }]}>
                <Camera size={20} color={colors.brandOrange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: typography.size.base, fontWeight: '600' }}>
                  Take Photo
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
                  Use device camera to take a new picture
                </Text>
              </View>
            </Pressable>

            {/* Choose from Gallery */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleChooseGallery();
              }}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: colors.surfaceElevated }]}>
                <ImageIcon size={20} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: typography.size.base, fontWeight: '600' }}>
                  Choose from Gallery
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
                  Select an existing photo from your library
                </Text>
              </View>
            </Pressable>

            {/* Remove Photo */}
            {hasExistingPhoto && onRemovePhoto ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  handleRemove();
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor: pressed ? colors.danger + '15' : colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: colors.danger + '15' }]}>
                  <Trash2 size={20} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.danger, fontSize: typography.size.base, fontWeight: '600' }}>
                    Remove Photo
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
                    Reset to default initials avatar
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <View style={{ marginTop: spacing.xs }}>
              <Button label="Cancel" variant="outline" onPress={onClose} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

// -------------------------------------------------------------
// 2. Photo Preview & Confirm Modal
// -------------------------------------------------------------
export interface PhotoPreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onChooseAnother?: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  visible,
  imageUri,
  onClose,
  onConfirm,
  onChooseAnother,
  isLoading = false,
  title = 'Update Profile Photo',
  subtitle = 'Preview your photo before saving it to your account',
}) => {
  const { colors, spacing, radius, typography } = useTheme();

  if (!visible || !imageUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={isLoading ? undefined : onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: '700', textAlign: 'center' }}>
              {title}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginTop: 4 }}>
              {subtitle}
            </Text>
          </View>

          {/* Squircle Avatar Preview */}
          <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
            <View
              style={[
                styles.avatarPreviewWrap,
                {
                  borderColor: colors.brandOrange,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.avatarPreviewImage}
                resizeMode="cover"
              />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.sm }}>
              Formatted for your profile card
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Button
              label={isLoading ? 'Uploading...' : 'Save Photo'}
              onPress={onConfirm}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              label="Choose Another"
              variant="outline"
              onPress={onChooseAnother ?? onClose}
              disabled={isLoading}
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onClose}
              disabled={isLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
  },
  avatarPreviewWrap: {
    width: 130,
    height: 130,
    borderRadius: 36,
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
  },
});
