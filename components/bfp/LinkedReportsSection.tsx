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
  Link2,
  MapPin,
  Clock,
  User,
  Maximize2,
  X,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { LinkedReportItem } from '../../services/api/bfpModels';
import { formatTime } from '../../utils/formatters';
import { getStorageImageUrl } from '../../constants/config';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { Card } from '../ui/Card';

interface LinkedReportsSectionProps {
  linkedReports: LinkedReportItem[];
  onUnlink: (relatedReportId: number) => Promise<void> | void;
  unlinkingId?: number | null;
}

export const LinkedReportsSection: React.FC<LinkedReportsSectionProps> = ({
  linkedReports,
  onUnlink,
  unlinkingId = null,
}) => {
  const { colors, typography, isDark } = useTheme();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!linkedReports || linkedReports.length === 0) {
    return null;
  }

  const confirmUnlink = (item: LinkedReportItem) => {
    onUnlink(item.report_id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Link2 size={13} color={colors.brandOrange} strokeWidth={2.5} />
        <Text style={styles.headerTitle}>
          LINKED DUPLICATE REPORTS ({linkedReports.length})
        </Text>
      </View>

      <Card padding={0}>
        {linkedReports.map((item, index) => {
          const photoUrl = item.report_image
            ? getStorageImageUrl(item.report_image)
            : item.evidence_photos && item.evidence_photos.length > 0
            ? getStorageImageUrl(item.evidence_photos[0].image_path)
            : null;
          const isLast = index === linkedReports.length - 1;
          const isUnlinking = unlinkingId === item.report_id;

          return (
            <View
              key={item.report_id}
              style={[
                styles.itemRow,
                !isLast && {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                },
              ]}
            >
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

              {/* Info */}
              <View style={styles.itemInfo}>
                <View style={styles.itemTopRow}>
                  <Text style={[styles.itemRef, { color: colors.textPrimary }]}>
                    Report#{item.report_id}
                  </Text>
                  <IncidentStatusBadge status={item.status} size="sm" />
                </View>

                {item.distance_meters !== null && (
                  <View style={styles.distanceRow}>
                    <MapPin size={11} color={colors.brandOrange} />
                    <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                      {item.distance_meters}m from primary scene
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

              {/* Unlink Action */}
              <Pressable
                onPress={() => confirmUnlink(item)}
                disabled={isUnlinking}
                style={({ pressed }) => [
                  styles.unlinkButton,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Unlink Report #${item.report_id}`}
              >
                {isUnlinking ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <X size={14} color="#EF4444" strokeWidth={2.4} />
                )}
              </Pressable>
            </View>
          );
        })}
      </Card>

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
    marginTop: 22,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  itemRef: {
    fontSize: 12,
    fontWeight: '700',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemMetaText: {
    fontSize: 11,
    maxWidth: 130,
  },
  itemDesc: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  unlinkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
