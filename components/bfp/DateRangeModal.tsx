import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, X, ArrowRight, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../ui/Button';

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onApply: (start: Date | null, end: Date | null) => void;
  onClear: () => void;
}

function formatDateDisplay(d: Date | null): string {
  if (!d) return 'Select date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  visible,
  onClose,
  startDate,
  endDate,
  onApply,
  onClear,
}) => {
  const { colors, spacing, shadow, isDark } = useTheme();

  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);

  const [pickingTarget, setPickingTarget] = useState<'start' | 'end' | null>(null);

  // Sync with incoming props when opening
  React.useEffect(() => {
    if (visible) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setPickingTarget(null);
    }
  }, [visible, startDate, endDate]);

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickingTarget(null);
    }
    if (event.type === 'set' && selectedDate) {
      if (pickingTarget === 'start') {
        const s = new Date(selectedDate);
        s.setHours(0, 0, 0, 0);
        setTempStart(s);
        // If start is after end, bump end to start
        if (tempEnd && s.getTime() > tempEnd.getTime()) {
          const newEnd = new Date(s);
          newEnd.setHours(23, 59, 59);
          setTempEnd(newEnd);
        }
      } else if (pickingTarget === 'end') {
        const e = new Date(selectedDate);
        e.setHours(23, 59, 59);
        setTempEnd(e);
        // If end is before start, pull start to end
        if (tempStart && e.getTime() < tempStart.getTime()) {
          const newStart = new Date(e);
          newStart.setHours(0, 0, 0, 0);
          setTempStart(newStart);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (tempStart && !tempEnd) {
      const e = new Date(tempStart);
      e.setHours(23, 59, 59);
      onApply(tempStart, e);
    } else if (!tempStart && tempEnd) {
      const s = new Date(tempEnd);
      s.setHours(0, 0, 0, 0);
      onApply(s, tempEnd);
    } else {
      onApply(tempStart, tempEnd);
    }
    onClose();
  };

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F9FAFB';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.card, { backgroundColor: cardBg }, !isDark && shadow.card]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCluster}>
              <View style={[styles.headerIconWrap, { backgroundColor: `${colors.brandOrange}18` }]}>
                <Calendar size={18} color={colors.brandOrange} strokeWidth={2.2} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Filter by Date Range</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <X size={18} color={colors.textMuted} strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* Date Range Inputs */}
          <Text style={[styles.sectionKicker, { color: colors.textMuted }]}>
            SPECIFY DATE RANGE
          </Text>
          <View style={styles.rangeRow}>
            {/* From Date Box */}
            <Pressable
              onPress={() => setPickingTarget('start')}
              style={[
                styles.dateBox,
                {
                  backgroundColor: inputBg,
                  borderColor: pickingTarget === 'start' ? colors.brandOrange : borderColor,
                },
              ]}
            >
              <Text style={[styles.dateBoxLabel, { color: colors.textMuted }]}>From</Text>
              <Text style={[styles.dateBoxValue, { color: colors.textPrimary }]}>
                {formatDateDisplay(tempStart)}
              </Text>
            </Pressable>

            <View style={styles.arrowWrap}>
              <ArrowRight size={14} color={colors.textMuted} strokeWidth={2} />
            </View>

            {/* To Date Box */}
            <Pressable
              onPress={() => setPickingTarget('end')}
              style={[
                styles.dateBox,
                {
                  backgroundColor: inputBg,
                  borderColor: pickingTarget === 'end' ? colors.brandOrange : borderColor,
                },
              ]}
            >
              <Text style={[styles.dateBoxLabel, { color: colors.textMuted }]}>To</Text>
              <Text style={[styles.dateBoxValue, { color: colors.textPrimary }]}>
                {formatDateDisplay(tempEnd)}
              </Text>
            </Pressable>
          </View>

          {/* Native Date Picker if open */}
          {pickingTarget !== null && (
            <DateTimePicker
              value={
                pickingTarget === 'start'
                  ? tempStart || new Date()
                  : tempEnd || tempStart || new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
          )}

          {/* Footer actions */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => {
                onClear();
                onClose();
              }}
              style={styles.clearBtn}
            >
              <Text style={[styles.clearBtnText, { color: colors.danger }]}>Clear Filter</Text>
            </Pressable>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Button label="Apply Range" onPress={handleConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  sectionKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  dateBoxLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dateBoxValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  arrowWrap: {
    paddingHorizontal: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 8,
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  clearBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
