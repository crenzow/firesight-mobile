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
  const { colors, spacing, typography, radius, isDark } = useTheme();

  if (!visible) return null;

  const getGradientColors = (): [string, string] => {
    switch (type) {
      case 'danger':
      case 'error':
        return [colors.danger, '#C53030'];
      case 'success':
        return [colors.success, '#168048'];
      case 'info':
      case 'confirm':
      default:
        // Matches the primary confirm/save button color exactly
        return [colors.brandOrange, colors.brandOrangeDeep];
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
    if (type === 'success') return 'success';
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
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: pressed ? colors.brandOrange : colors.surfaceElevated,
                  transform: [{ scale: pressed ? 0.90 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
            >
              {({ pressed }) => (
                <X size={16} color={pressed ? '#FFFFFF' : colors.textMuted} />
              )}
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
                  variant="ghost"
                  style={{
                    borderWidth: 1.5,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F3F4F6',
                    borderRadius: 14,
                  }}
                  disabled={loading}
                />
              </View>
            )}

            <View style={styles.buttonFlex}>
              <Button
                label={defaultConfirmText()}
                onPress={onConfirm}
                variant={getConfirmButtonVariant()}
                style={{
                  borderRadius: 14,
                  shadowColor:
                    type === 'danger' || type === 'error'
                      ? colors.danger
                      : type === 'success'
                      ? colors.success
                      : colors.brandOrange,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 2,
                }}
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
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
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
