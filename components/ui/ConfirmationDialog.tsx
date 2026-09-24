import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, AlertTriangle, Info, LogOut, X, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';

export type DialogType = 'success' | 'confirm' | 'danger' | 'info' | 'error';

export interface ConfirmationDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  showCancel?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  type = 'confirm',
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  loading = false,
  icon,
  showCancel = true,
}) => {
  const { colors, spacing, typography, radius } = useTheme();

  if (!visible) return null;

  const getGradientColors = (): [string, string] => {
    switch (type) {
      case 'success':
        return ['#10B981', '#059669'];
      case 'danger':
      case 'error':
        return ['#EF4444', '#DC2626'];
      case 'info':
        return ['#3B82F6', '#2563EB'];
      case 'confirm':
      default:
        return ['#FF6B00', '#E05D00'];
    }
  };

  const renderIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return <Check size={28} color="#FFFFFF" strokeWidth={2.5} />;
      case 'danger':
      case 'error':
        return <AlertTriangle size={28} color="#FFFFFF" strokeWidth={2.5} />;
      case 'info':
        return <Info size={28} color="#FFFFFF" strokeWidth={2.5} />;
      case 'confirm':
      default:
        return <ShieldAlert size={28} color="#FFFFFF" strokeWidth={2.5} />;
    }
  };

  const getConfirmButtonVariant = () => {
    if (type === 'danger' || type === 'error') return 'danger';
    return 'primary';
  };

  const defaultConfirmText = () => {
    if (confirmText) return confirmText;
    if (type === 'success') return 'Continue';
    if (type === 'danger') return 'Delete';
    return 'Confirm';
  };

  const isSingleButton = !showCancel && type === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose ?? onCancel ?? onConfirm}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Icon Badge */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              {renderIcon()}
            </LinearGradient>
          </View>

          {/* Close button if optional */}
          {(onClose || onCancel) && (
            <Pressable
              onPress={onClose ?? onCancel}
              hitSlop={12}
              style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Title & Description */}
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: typography.size.lg },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.message,
              { color: colors.textMuted, fontSize: typography.size.sm },
            ]}
          >
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {showCancel && onCancel && (
              <View style={styles.buttonFlex}>
                <Button
                  label={cancelText}
                  onPress={onCancel}
                  variant="outline"
                  disabled={loading}
                />
              </View>
            )}

            <View style={styles.buttonFlex}>
              <Button
                label={defaultConfirmText()}
                onPress={onConfirm}
                variant={getConfirmButtonVariant()}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  buttonFlex: {
    flex: 1,
  },
});
