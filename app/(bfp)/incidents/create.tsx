import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { CalendarClock, Camera, MapPin, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { GlassHeader } from '../../../components/glass/GlassHeader';
import { GlassCard } from '../../../components/glass/GlassCard';
import { SelectField } from '../../../components/ui/SelectField';
import { Button } from '../../../components/ui/Button';
import { SeverityBadge, SeverityLevel } from '../../../components/bfp/SeverityBadge';
import { IncidentType } from '../../../services/api/bfpModels';
import { LIAN_BARANGAYS } from '../../../constants/barangays';
import { useLocation } from '../../../hooks/useLocation';
import { incidentService } from '../../../services/api/incidentService';

const INCIDENT_TYPES: { id: IncidentType; name: string }[] = [
  { id: 'residential_fire', name: 'Residential Fire' },
  { id: 'commercial_fire', name: 'Commercial Fire' },
  { id: 'vehicular_fire', name: 'Vehicular Fire' },
  { id: 'storage_fire', name: 'Storage Fire' },
  { id: 'rubbish_fire', name: 'Rubbish Fire' },
  { id: 'others', name: 'Others' },
];

const SEVERITY_OPTIONS: SeverityLevel[] = ['low', 'moderate', 'high', 'critical'];

export default function CreateManualIncidentScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { location, isLoading: isLocating, requestLocation } = useLocation();

  const [barangayId, setBarangayId] = useState<number | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);
  const [description, setDescription] = useState('');
  const [causeOfFire, setCauseOfFire] = useState('');
  const [casualties, setCasualties] = useState('0');
  const [notes, setNotes] = useState('');
  const [dataTime, setDataTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleBack = () => {
    if (from) {
      router.navigate(`/(bfp)/${from}` as any);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!barangayId) {
      Alert.alert('Missing barangay', 'Please select the barangay where this incident occurred.');
      return;
    }
    if (!location) {
      Alert.alert('Missing location', 'Please wait for GPS location to be detected, or try again.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please provide a brief description of the incident.');
      return;
    }
    if (!incidentType || !severity) {
      Alert.alert('Missing incident details', 'Please select the incident type and severity level.');
      return;
    }

    setIsSubmitting(true);
    try {
      await incidentService.createManual({
        barangay_id: barangayId,
        latitude: location.latitude,
        longitude: location.longitude,
        description: description.trim(),
        incident_type: incidentType,
        severity_level: severity,
        cause_of_fire: causeOfFire || undefined,
        casualties: Number(casualties) || 0,
        notes: notes || undefined,
        data_time: dataTime.toISOString(),
        photoUri: photoUri ?? undefined,
      });
      Alert.alert('Incident Recorded', 'The manual incident record has been created.', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (e: any) {
      Alert.alert(
        'Unable to save incident',
        e?.message ?? 'Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlassHeader title="Manual Incident Entry" subtitle="For incidents not reported via the app" showBack onBack={handleBack} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} keyboardShouldPersistTaps="handled">
        
        {/* Location GPS Card */}
        <GlassCard>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginBottom: 6 }}>
            LOCATION
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.brandOrange} />
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginLeft: 6, flex: 1 }}>
              {isLocating
                ? 'Detecting current location…'
                : location
                  ? `${location.latitude.toFixed(5)}°N, ${location.longitude.toFixed(5)}°E`
                  : 'Location unavailable'}
            </Text>
            <Pressable onPress={requestLocation} hitSlop={8}>
              <RefreshCw size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </GlassCard>

        {/* Dropdowns Section */}
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          <SelectField
            label="Barangay"
            required
            value={barangayId}
            options={LIAN_BARANGAYS}
            onSelect={(value) => setBarangayId(value as number)}
            placeholder="Select barangay"
          />

          <SelectField
            label="Incident Type"
            value={incidentType}
            options={INCIDENT_TYPES}
            onSelect={(value) => setIncidentType(value as IncidentType)}
            placeholder="Select incident type"
          />
        </View>

        {/* Severity Selection */}
        <FieldLabel text="SEVERITY" />
        <View style={styles.chipRow}>
          {SEVERITY_OPTIONS.map((level) => (
            <Pressable key={level} onPress={() => setSeverity(level)} style={{ opacity: severity === level ? 1 : 0.4, marginRight: spacing.sm, marginBottom: spacing.sm }}>
              <SeverityBadge severity={level} />
            </Pressable>
          ))}
        </View>

        {/* Date & Time Picker */}
        <FieldLabel text="DATE & TIME OF INCIDENT" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={() => {
              setPickerMode('date');
              setShowDatePicker(true);
            }}
            style={[styles.dateButton, { flex: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface }]}
          >
            <CalendarClock size={16} color={colors.textMuted} />
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginLeft: 8 }}>
              {dataTime.toLocaleDateString('en-PH', { dateStyle: 'medium' })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setPickerMode('time');
              setShowDatePicker(true);
            }}
            style={[styles.dateButton, { flex: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginLeft: 8 }}>
              {dataTime.toLocaleTimeString('en-PH', { timeStyle: 'short' })}
            </Text>
          </Pressable>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={dataTime}
            mode={pickerMode}
            display="default"
            maximumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) setDataTime(selected);
            }}
          />
        )}

        {/* Description & Incident Details */}
        <FieldLabel text="DESCRIPTION" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description of what happened…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm, minHeight: 70, textAlignVertical: 'top' }]}
        />

        <FieldLabel text="CAUSE OF FIRE (OPTIONAL)" />
        <TextInput
          value={causeOfFire}
          onChangeText={setCauseOfFire}
          placeholder="e.g. Unattended cooking"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm }]}
        />

        <FieldLabel text="CASUALTIES" />
        <TextInput
          value={casualties}
          onChangeText={setCasualties}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm }]}
        />

        <FieldLabel text="NOTES (OPTIONAL)" />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional findings, remarks…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm, minHeight: 70, textAlignVertical: 'top' }]}
        />

        <FieldLabel text="PHOTO (OPTIONAL)" />
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={[styles.photoPreview, { borderRadius: radius.md }]} />
        ) : (
          <Pressable
            onPress={handleAddPhoto}
            style={[styles.photoButton, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}
          >
            <Camera size={20} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>Attach Photo</Text>
          </Pressable>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save Incident Record" onPress={handleSubmit} loading={isSubmitting} />
        </View>
      </ScrollView>
    </View>
  );
}

const FieldLabel: React.FC<{ text: string }> = ({ text }) => {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginTop: spacing.lg, marginBottom: 6 }}>
      {text}
    </Text>
  );
};

const styles = StyleSheet.create({
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, padding: 12 },
  input: { borderWidth: 1.5, padding: 10, fontSize: 14 },
  photoButton: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', height: 100 },
  photoPreview: { width: '100%', height: 160 },
});