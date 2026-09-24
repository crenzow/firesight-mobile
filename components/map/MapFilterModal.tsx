import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, RotateCcw, Filter, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { RiskLevel } from '../../services/api/models';

interface MapFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedRisk: 'all' | RiskLevel;
  onSelectRisk: (risk: 'all' | RiskLevel) => void;
  onReset: () => void;
}

export const MapFilterModal: React.FC<MapFilterModalProps> = ({
  visible,
  onClose,
  selectedRisk,
  onSelectRisk,
  onReset,
}) => {
  const { colors, typography } = useTheme();

  const riskOptions: { key: 'all' | RiskLevel; label: string; color?: string }[] = [
    { key: 'all', label: 'All Risk Levels' },
    { key: 'critical', label: 'Critical Risk', color: '#EF4444' },
    { key: 'high', label: 'High Risk', color: '#F97316' },
    { key: 'moderate', label: 'Moderate Risk', color: '#EAB308' },
    { key: 'low', label: 'Low Risk', color: '#2FA65A' },
  ];

  const hasActiveFilters = selectedRisk !== 'all';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconWrapper}>
                  <Filter size={18} color={colors.brandOrange} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Filter Risk Level
                </Text>
              </View>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Risk Level Filter Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ShieldAlert size={16} color={colors.brandOrange} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Select Risk Level
                  </Text>
                </View>
                <View style={styles.chipRow}>
                  {riskOptions.map((opt) => {
                    const isSelected = selectedRisk === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => onSelectRisk(opt.key)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected
                              ? opt.color || colors.brandOrange
                              : colors.background,
                            borderColor: isSelected ? 'transparent' : colors.border,
                          },
                        ]}
                      >
                        {opt.color && !isSelected && (
                          <View style={[styles.dot, { backgroundColor: opt.color }]} />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {isSelected && <Check size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {hasActiveFilters && (
                <Pressable
                  onPress={onReset}
                  style={[styles.resetBtn, { borderColor: colors.border }]}
                >
                  <RotateCcw size={16} color={colors.textSecondary} />
                  <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={[styles.applyBtn, { backgroundColor: colors.brandOrange }]}
              >
                <Text style={styles.applyText}>Apply Filter</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    maxHeight: '60%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 98, 43, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
