import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Plus, X, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BFPPersonnelItem, formatOfficerWithRank } from '../../services/api/bfpModels';
import { incidentService } from '../../services/api/incidentService';

export const ALL_FIRE_TRUCKS = [
  { id: 'Fire Truck 1', name: 'Fire Truck 1' },
  { id: 'Fire Truck 2', name: 'Fire Truck 2' },
  { id: 'Fire Truck 3', name: 'Fire Truck 3' },
];

interface DispatchModalProps {
  visible: boolean;
  incidentTitle: string;
  onClose: () => void;
  onConfirm: (payload: { trucks: string[]; personnelIds: number[] }) => Promise<void>;
  isSubmitting?: boolean;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  visible,
  incidentTitle,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { colors, radius, spacing, typography, isDark } = useTheme();
  const { user } = useAuth();

  // Selected state
  const [selectedOfficers, setSelectedOfficers] = useState<BFPPersonnelItem[]>([]);
  const [selectedTrucks, setSelectedTrucks] = useState<string[]>(['Fire Truck 1']); // Default to primary truck

  // Picker modal states
  const [showOfficerPicker, setShowOfficerPicker] = useState(false);
  const [showTruckPicker, setShowTruckPicker] = useState(false);

  // Available station personnel
  const [personnelList, setPersonnelList] = useState<BFPPersonnelItem[]>([]);
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Build current user officer item if logged in
  const currentUserOfficer: BFPPersonnelItem | null =
    user && user.role === 'bfp_personnel'
      ? {
          user_id: user.user_id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          rank: user.personnel_details?.rank || 'FO1',
          full_title: `${user.personnel_details?.rank || 'FO1'} ${user.first_name} ${user.last_name}`.trim(),
          station_assigned: user.personnel_details?.station_assigned || 'BFP Lian Fire Station',
        }
      : null;

  // Fetch station personnel on modal open
  useEffect(() => {
    if (!visible) return;
    setIsLoadingPersonnel(true);
    incidentService
      .getBfpPersonnel()
      .then((res) => {
        const list = res || [];
        setPersonnelList(list);
        // Sync logged-in user with official roster entry if found
        if (user && user.role === 'bfp_personnel') {
          const match = list.find((p) => p.user_id === user.user_id);
          if (match) {
            setSelectedOfficers((prev) => {
              if (prev.length === 0 || prev.some((o) => o.user_id === user.user_id)) {
                return [match, ...prev.filter((o) => o.user_id !== user.user_id)];
              }
              return prev;
            });
          }
        }
      })
      .catch(() => {
        setPersonnelList([]);
      })
      .finally(() => {
        setIsLoadingPersonnel(false);
      });
  }, [visible, user]);

  // Reset or initialize on reopen with current user pre-selected
  useEffect(() => {
    if (visible) {
      setSelectedOfficers(currentUserOfficer ? [currentUserOfficer] : []);
      setSelectedTrucks(['Fire Truck 1']);
      setShowOfficerPicker(false);
      setShowTruckPicker(false);
      setSearchQuery('');
    }
  }, [visible]);

  // Officer actions
  const handleAddOfficer = (officer: BFPPersonnelItem) => {
    Haptics.selectionAsync().catch(() => {});
    if (!selectedOfficers.some((o) => o.user_id === officer.user_id)) {
      setSelectedOfficers((prev) => [...prev, officer]);
    }
    setShowOfficerPicker(false);
  };

  const handleRemoveOfficer = (userId: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedOfficers((prev) => prev.filter((o) => o.user_id !== userId));
  };

  const openOfficerPicker = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowOfficerPicker(true);
    if (personnelList.length === 0) {
      setIsLoadingPersonnel(true);
      incidentService
        .getBfpPersonnel()
        .then((res) => {
          setPersonnelList(res || []);
        })
        .catch(() => {
          setPersonnelList([]);
        })
        .finally(() => {
          setIsLoadingPersonnel(false);
        });
    }
  };

  // Truck actions
  const handleAddTruck = (truckName: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (!selectedTrucks.includes(truckName)) {
      setSelectedTrucks((prev) => [...prev, truckName]);
    }
    setShowTruckPicker(false);
  };

  const handleRemoveTruck = (truckName: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedTrucks((prev) => prev.filter((t) => t !== truckName));
  };

  const canDispatch = selectedTrucks.length >= 1 && selectedOfficers.length >= 1 && !isSubmitting;

  const handleConfirm = () => {
    if (!canDispatch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onConfirm({
      trucks: selectedTrucks,
      personnelIds: selectedOfficers.map((o) => o.user_id),
    });
  };

  // Available trucks not yet selected
  const availableTrucks = ALL_FIRE_TRUCKS.filter((t) => !selectedTrucks.includes(t.name));

  // Filtered officers for the picker
  const filteredPersonnel = personnelList.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    const isAlreadySelected = selectedOfficers.some((o) => o.user_id === p.user_id);
    if (isAlreadySelected) return false;
    if (!query) return true;
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.rank && p.rank.toLowerCase().includes(query)) ||
      (p.full_title && p.full_title.toLowerCase().includes(query))
    );
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              borderRadius: radius.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.base, flex: 1 }]}>
                Dispatch Response Units
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={[
                  styles.closeButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
                ]}
              >
                <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* ── 1. RESPONDING CREW SECTION (FIRST) ────────────────────────── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                RESPONDING CREW
              </Text>
              {selectedOfficers.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                  <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
                    {selectedOfficers.length} {selectedOfficers.length === 1 ? 'Officer' : 'Officers'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardsContainer}>
              {selectedOfficers.map((officer) => {
                const officerTitle = formatOfficerWithRank(officer.name, officer.rank);
                return (
                  <View
                    key={officer.user_id}
                    style={[
                      styles.selectionCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text style={[styles.selectionCardText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {officerTitle}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveOfficer(officer.user_id)}
                      hitSlop={8}
                      style={styles.cardRemoveButton}
                    >
                      <X size={15} color={colors.textMuted} strokeWidth={2.2} />
                    </Pressable>
                  </View>
                );
              })}

              <Pressable
                onPress={openOfficerPicker}
                style={({ pressed }) => [
                  styles.addSlotButton,
                  {
                    borderColor: pressed ? colors.brandOrange : colors.border,
                    backgroundColor: pressed ? (isDark ? 'rgba(244, 98, 43, 0.1)' : '#FFF7ED') : 'transparent',
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Plus size={14} color={colors.brandOrange} strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={[styles.addSlotText, { color: colors.brandOrange }]}>Add Officer</Text>
              </Pressable>
            </View>

            {selectedOfficers.length === 0 && (
              <Text style={[styles.warningText, { color: colors.danger }]}>
                Please select responding crew.
              </Text>
            )}

            {/* ── 2. FIRE TRUCKS SECTION (SECOND) ───────────────────────── */}
            <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                FIRE TRUCKS
              </Text>
              {selectedTrucks.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                  <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
                    {selectedTrucks.length} {selectedTrucks.length === 1 ? 'Truck' : 'Trucks'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardsContainer}>
              {selectedTrucks.map((truckName) => (
                <View
                  key={truckName}
                  style={[
                    styles.selectionCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text style={[styles.selectionCardText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {truckName}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveTruck(truckName)}
                    hitSlop={8}
                    style={styles.cardRemoveButton}
                  >
                    <X size={15} color={colors.textMuted} strokeWidth={2.2} />
                  </Pressable>
                </View>
              ))}

              {availableTrucks.length > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setShowTruckPicker(true);
                  }}
                  style={({ pressed }) => [
                    styles.addSlotButton,
                    {
                      borderColor: pressed ? colors.brandOrange : colors.border,
                      backgroundColor: pressed ? (isDark ? 'rgba(244, 98, 43, 0.1)' : '#FFF7ED') : 'transparent',
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Plus size={14} color={colors.brandOrange} strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={[styles.addSlotText, { color: colors.brandOrange }]}>Add Fire Truck</Text>
                </Pressable>
              )}
            </View>

            {selectedTrucks.length === 0 && (
              <Text style={[styles.warningText, { color: colors.danger }]}>
                Please select fire truck.
              </Text>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View style={styles.buttonRow}>
              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                style={[
                  styles.cancelButton,
                  {
                    borderColor: colors.border,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                disabled={!canDispatch}
                style={({ pressed }) => [
                  styles.confirmButton,
                  {
                    backgroundColor: colors.brandOrange,
                    borderRadius: radius.md,
                    opacity: !canDispatch ? 0.45 : pressed ? 0.9 : 1,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Dispatch</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* ── SUB-MODAL: TRUCK PICKER ────────────────────────────────────────── */}
      <Modal visible={showTruckPicker} transparent animationType="fade" onRequestClose={() => setShowTruckPicker(false)}>
        <View style={styles.subModalOverlay}>
          <View
            style={[
              styles.subModalContainer,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: radius.xl,
              },
            ]}
          >
            <View style={[styles.subModalHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>Select Fire Truck</Text>
              <Pressable
                onPress={() => setShowTruckPicker(false)}
                hitSlop={8}
                style={[
                  styles.closeButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
                ]}
              >
                <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}>
              {availableTrucks.map((truck) => (
                <Pressable
                  key={truck.id}
                  onPress={() => handleAddTruck(truck.name)}
                  style={({ pressed }) => [
                    styles.pickerItem,
                    {
                      backgroundColor: pressed ? 'rgba(244, 98, 43, 0.1)' : colors.surfaceElevated,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingVertical: 4 }}>
                    <Text style={[styles.pickerItemName, { color: colors.textPrimary }]}>{truck.name}</Text>
                  </View>
                  <Plus size={16} color={colors.brandOrange} strokeWidth={2.5} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── SUB-MODAL: OFFICER PICKER ──────────────────────────────────────── */}
      <Modal visible={showOfficerPicker} transparent animationType="fade" onRequestClose={() => setShowOfficerPicker(false)}>
        <View style={styles.subModalOverlay}>
          <View
            style={[
              styles.subModalContainer,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: radius.xl,
                maxHeight: '80%',
              },
            ]}
          >
            <View style={[styles.subModalHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>Select Responding Officer</Text>
              <Pressable
                onPress={() => setShowOfficerPicker(false)}
                hitSlop={8}
                style={[
                  styles.closeButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
                ]}
              >
                <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Search Box */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Search size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search officer name or rank..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCapitalize="none"
              />
            </View>

            {isLoadingPersonnel ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.brandOrange} />
                <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 13 }}>Loading station crew...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}>
                {filteredPersonnel.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 12, fontSize: 13 }}>
                      {searchQuery ? 'No matching officers found.' : 'No personnel loaded.'}
                    </Text>
                    <Pressable
                      onPress={openOfficerPicker}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ color: colors.brandOrange, fontSize: 12, fontWeight: '700' }}>Retry Loading</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredPersonnel.map((person) => {
                    const officerTitle = formatOfficerWithRank(person.name, person.rank);
                    return (
                      <Pressable
                        key={person.user_id}
                        onPress={() => handleAddOfficer(person)}
                        style={({ pressed }) => [
                          styles.pickerItem,
                          {
                            backgroundColor: pressed ? 'rgba(244, 98, 43, 0.1)' : colors.surfaceElevated,
                            borderColor: colors.border,
                            borderRadius: radius.md,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, paddingVertical: 4 }}>
                          <Text style={[styles.pickerItemName, { color: colors.textPrimary }]}>
                            {officerTitle}
                          </Text>
                        </View>
                        <Plus size={16} color={colors.brandOrange} strokeWidth={2.5} />
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    width: '100%',
  },
  selectionCardText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  cardRemoveButton: {
    padding: 4,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
    minHeight: 42,
  },
  addSlotText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    height: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Sub-modal styles (uniform with main modal)
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalContainer: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  subModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    width: '100%',
    minHeight: 44,
    marginBottom: 4,
  },
  pickerItemName: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
});
