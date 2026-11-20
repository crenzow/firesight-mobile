import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  MapPin,
  Clock,
  User,
  Check,
  Maximize2,
  X,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { LinkedReportItem } from '../../services/api/bfpModels';
import { formatTime } from '../../utils/formatters';
import { getStorageImageUrl } from '../../constants/config';
import { IncidentStatusBadge } from './IncidentStatusBadge';

interface NearbyDuplicatesCardProps {
  candidates: LinkedReportItem[];
  onLinkSelected: (selectedIds: number[]) => Promise<void> | void;
  linking?: boolean;
}

export const NearbyDuplicatesCard: React.FC<NearbyDuplicatesCardProps> = ({
  candidates,
  onLinkSelected,
  linking = false,
}) => {
  const { colors, typography, isDark, shadow } = useTheme();
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    candidates.map((c) => c.report_id)
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!candidates || candidates.length === 0) {
    return null;
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.report_id));
    }
  };

  const handleLink = async () => {
    if (selectedIds.length === 0 || linking) return;
    await onLinkSelected(selectedIds);
  };

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }, shadow.card]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Nearby Duplicate Reports ({candidates.length})
          </Text>
        </View>

        {candidates.length > 1 && (
          <Pressable onPress={toggleAll} style={styles.selectToggle} hitSlop={6}>
            <Text style={[styles.selectToggleText, { color: colors.brandOrange }]}>
              {selectedIds.length === candidates.length ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Candidate List */}
      <View style={styles.list}>
        {candidates.map((item) => {
          const isSelected = selectedIds.includes(item.report_id);
          const photoUrl = item.report_image
            ? getStorageImageUrl(item.report_image)
            : item.evidence_photos && item.evidence_photos.length > 0
            ? getStorageImageUrl(item.evidence_photos[0].image_path)
            : null;

          return (
            <Pressable
              key={item.report_id}
              onPress={() => toggleSelect(item.report_id)}
              style={[
                styles.itemCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                  borderColor: isSelected
                    ? colors.brandOrange
                    : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : '#E5E7EB',
                },
              ]}
            >
              {/* Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isSelected ? colors.brandOrange : 'transparent',
                    borderColor: isSelected ? colors.brandOrange : colors.textMuted,
                  },
                ]}
              >
                {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>

              {/* Photo Thumbnail */}
              {photoUrl ? (
                <Pressable onPress={() => setPreviewImage(photoUrl)} style={styles.thumbWrapper}>
                  <Image source={{ uri: photoUrl }} style={styles.thumb} resizeMode="cover" />
                  <View style={styles.thumbZoom}>
                    <Maximize2 size={9} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.thumb,
                    styles.thumbPlaceholder,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6' },
                  ]}
                >
                  <FileText size={16} color={colors.textMuted} />
                </View>
              )}

              {/* Details */}
              <View style={styles.itemDetails}>
                <View style={styles.itemTopRow}>
                  <Text style={[styles.itemRef, { color: colors.textPrimary }]}>
                    Report#{item.report_id}
                  </Text>
                  <IncidentStatusBadge status={item.status} size="sm" />
                </View>

                {item.distance_meters !== null && (
                  <View style={styles.distanceRow}>
                    <MapPin size={10.5} color={colors.textMuted} />
                    <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                      {item.distance_meters}m away
                    </Text>
                  </View>
                )}

                <View style={styles.itemMetaRow}>
                  <User size={10} color={colors.textMuted} />
                  <Text style={[styles.itemMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.reporter_name || 'Resident'}
                  </Text>
                  <Clock size={10} color={colors.textMuted} style={{ marginLeft: 6 }} />
                  <Text style={[styles.itemMetaText, { color: colors.textMuted }]}>
                    {item.created_at ? formatTime(item.created_at) : ''}
                  </Text>
                </View>

                {item.description ? (
                  <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    "{item.description}"
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Action Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleLink}
          disabled={selectedIds.length === 0 || linking}
          style={[
            styles.linkButton,
            {
              backgroundColor: selectedIds.length === 0
                ? (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB')
                : colors.brandOrange,
              opacity: linking ? 0.7 : 1,
            },
          ]}
        >
          {linking ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
          ) : null}
          <Text
            style={[
              styles.linkButtonText,
              { color: selectedIds.length === 0 ? colors.textMuted : '#FFFFFF' },
            ]}
          >
            {selectedIds.length === 0
              ? 'Select Reports to Link'
              : `Link Selected (${selectedIds.length}) as Duplicates`}
          </Text>
        </Pressable>
      </View>

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalCloseButton} onPress={() => setPreviewImage(null)}>
              <X size={22} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
            <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 22,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  selectToggle: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  selectToggleText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  list: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 9,
    gap: 10,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 7,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbZoom: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 2,
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRef: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemMetaText: {
    fontSize: 11,
    maxWidth: 120,
  },
  itemDesc: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 10,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  linkButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  modalImage: {
    width: '92%',
    height: '75%',
  },
});
