import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface SelectOption {
  id: number | string;
  name: string;
}

interface SelectFieldProps {
  label?: string;
  title?: string;
  required?: boolean;
  placeholder?: string;
  value: number | string | null;
  options: SelectOption[];
  onSelect: (id: any) => void;
  error?: string;
  allowClear?: boolean;
}

/**
 * Lightweight modal-based dropdown (avoids pulling in a native picker
 * dependency just for the Barangay selector). Follows the same visual
 * language as Input so it drops into forms seamlessly.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  title,
  required,
  placeholder = 'Select an option',
  value,
  options,
  onSelect,
  error,
  allowClear = false,
}) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((o) => o.id === value);
  const borderColor = error ? colors.danger : colors.border;
  const modalTitle = title || label || placeholder;
  const hasSelection = value !== null && value !== '' && value !== undefined;

  return (
    <View style={{ marginBottom: label ? spacing.lg : spacing.sm }}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.xs }]}>
          {label}
          {required ? <Text style={{ color: colors.brandOrange }}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setIsOpen(true);
        }}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            transform: [{ scale: pressed ? 0.985 : 1 }],
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: selected ? colors.textPrimary : colors.textMuted,
            fontSize: typography.size.base,
            flex: 1,
          }}
        >
          {selected ? selected.name : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <Text style={{ color: colors.danger, fontSize: typography.size.xs, marginTop: spacing.xs }}>{error}</Text>
      ) : null}

      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={() => setIsOpen(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]} edges={['bottom']}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border, padding: spacing.lg }]}>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: '700' }}>
                {modalTitle}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                {allowClear && hasSelection && (
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                      onSelect(null);
                      setIsOpen(false);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '700' }}>
                      Clear
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setIsOpen(false);
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [
                    {
                      transform: [{ scale: pressed ? 0.90 : 1 }],
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <X size={22} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onSelect(item.id);
                    setIsOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      backgroundColor: pressed
                        ? (item.id === value ? `${colors.brandOrange}15` : colors.surfaceElevated)
                        : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: typography.size.base }}>{item.name}</Text>
                  {item.id === value ? <Check size={18} color={colors.brandOrange} /> : null}
                </Pressable>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 50,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});