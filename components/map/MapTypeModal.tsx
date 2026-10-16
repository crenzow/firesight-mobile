import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { MapType } from './MapTypeSelector';

interface MapTypeModalProps {
  visible: boolean;
  onClose: () => void;
  mapType: MapType;
  onChange: (type: MapType) => void;
}

export const MapTypeModal: React.FC<MapTypeModalProps> = ({
  visible,
  onClose,
  mapType,
  onChange,
}) => {
  const { colors } = useTheme();

  const handleSelect = (type: MapType) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(type);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            {/* Grab Handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Map type</Text>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Map Type Options */}
            <View style={styles.optionsRow}>
              {/* Default Option */}
              <Pressable
                onPress={() => handleSelect('standard')}
                style={styles.optionItem}
              >
                <View
                  style={[
                    styles.thumbnailWrap,
                    mapType === 'standard' && styles.thumbnailActive,
                  ]}
                >
                  <Svg width={74} height={74} viewBox="0 0 74 74">
                    {/* Ocean / Water */}
                    <Rect width="74" height="74" fill="#8FD5F6" />
                    {/* Landmass curve */}
                    <Path
                      d="M 12 74 Q 28 54 22 34 Q 18 18 36 12 Q 50 6 74 8 L 74 74 Z"
                      fill="#A4E7B4"
                    />
                    {/* Shoreline */}
                    <Path
                      d="M 12 74 Q 28 54 22 34 Q 18 18 36 12 Q 50 6 74 8"
                      stroke="#FEE69C"
                      strokeWidth="3.5"
                      fill="none"
                    />
                    {/* Stream */}
                    <Path
                      d="M 74 16 Q 48 22 42 40"
                      stroke="#8FD5F6"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    {/* Road */}
                    <Path
                      d="M 4 70 L 74 20"
                      stroke="#FFFFFF"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 4 70 L 74 20"
                      stroke="#6B829E"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 36 48 L 56 74"
                      stroke="#FFFFFF"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 36 48 L 56 74"
                      stroke="#94A3B8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: mapType === 'standard' ? '#2563EB' : colors.textPrimary },
                    mapType === 'standard' && styles.optionLabelActive,
                  ]}
                >
                  Default
                </Text>
              </Pressable>

              {/* Satellite Option */}
              <Pressable
                onPress={() => handleSelect('satellite')}
                style={styles.optionItem}
              >
                <View
                  style={[
                    styles.thumbnailWrap,
                    mapType === 'satellite' && styles.thumbnailActive,
                  ]}
                >
                  <Svg width={74} height={74} viewBox="0 0 74 74">
                    {/* Dark satellite terrain */}
                    <Rect width="74" height="74" fill="#283A26" />
                    <Path d="M 0 48 Q 24 34 14 74 Z" fill="#1C2E1A" />
                    <Path d="M 48 0 Q 74 24 74 0 Z" fill="#20341E" />
                    {/* Highways */}
                    <Path
                      d="M 74 8 Q 34 32 8 74"
                      stroke="#52555B"
                      strokeWidth="15"
                      fill="none"
                    />
                    <Path
                      d="M 74 8 Q 34 32 8 74"
                      stroke="#3C3F44"
                      strokeWidth="11"
                      fill="none"
                    />
                    <Path
                      d="M 74 8 Q 34 32 8 74"
                      stroke="#E2E8F0"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      fill="none"
                    />
                    {/* Highway ramp */}
                    <Path
                      d="M 40 74 Q 46 28 74 26"
                      stroke="#60646C"
                      strokeWidth="7"
                      fill="none"
                    />
                    <Path
                      d="M 40 74 Q 46 28 74 26"
                      stroke="#E2E8F0"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      fill="none"
                    />
                  </Svg>
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: mapType === 'satellite' ? '#2563EB' : colors.textPrimary },
                    mapType === 'satellite' && styles.optionLabelActive,
                  ]}
                >
                  Satellite
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingLeft: 4,
  },
  optionItem: {
    alignItems: 'center',
    gap: 8,
  },
  thumbnailWrap: {
    width: 74,
    height: 74,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#2563EB',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  optionLabelActive: {
    fontWeight: '700',
  },
});
