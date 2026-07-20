import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface SelectOption {
  id: number;
  name: string;
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: number | null;
  options: SelectOption[];
  onSelect: (id: number) => void;
  error?: string;
}

/**
 * Lightweight modal-based dropdown (avoids pulling in a native picker
 * dependency just for the Barangay selector). Follows the same visual
 * language as Input so it drops into forms seamlessly.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required,
  placeholder = 'Select an option',
  value,
  options,
  onSelect,
  error,
}) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((o) => o.id === value);
  const borderColor = error ? colors.danger : colors.border;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.xs }]}>
        {label}
        {required ? <Text style={{ color: colors.brandOrange }}> *</Text> : null}
      </Text>

      <Pressable
        onPress={() => setIsOpen(true)}
        style={[
          styles.field,
          { borderColor, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
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
                {label}
              </Text>
              <Pressable onPress={() => setIsOpen(false)} hitSlop={8}>
                <X size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                  }}
                  style={[styles.optionRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}
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