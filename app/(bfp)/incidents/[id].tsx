import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  ShieldX,
  Pencil,
  Check,
  X,
  Maximize2,
  Flame,
  MapPin,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  FileText,
  HeartPulse,
  ClipboardList,
  Clock,
  Navigation2,
  Crosshair,
  Building2,
  Map,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  Bell,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SelectField } from '../../../components/ui/SelectField';
import { IncidentStatusBadge } from '../../../components/bfp/IncidentStatusBadge';
import { AlarmLevel, ALARM_LEVEL_OPTIONS, ALARM_LEVEL_LABELS } from '../../../components/bfp/AlarmLevelBadge';
import { StatusStepper } from '../../../components/bfp/StatusStepper';
import { EvidenceGallery } from '../../../components/bfp/EvidenceGallery';
import { IncidentLocationMap, MapType, GPSUpdate, IncidentLocationMapRef } from '../../../components/bfp/IncidentLocationMap';
import { incidentService } from '../../../services/api/incidentService';
import { reverseGeocode } from '../../../utils/geocoding';
import { BFPIncident, BFPIncidentStatusHistoryEntry, IncidentType } from '../../../services/api/bfpModels';
import { BFPIncidentStatus } from '../../../components/bfp/IncidentStatusBadge';
import { formatFullDate, formatTime } from '../../../utils/formatters';
import { FIRE_STATION } from '../../../constants/fireStation';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { MapTypeModal } from '../../../components/map/MapTypeModal';

const INCIDENT_TYPE_OPTIONS: { id: IncidentType; name: string }[] = [
  { id: 'residential_fire', name: 'Residential Fire' },
  { id: 'commercial_fire', name: 'Commercial Fire' },
  { id: 'vehicular_fire', name: 'Vehicular Fire' },
  { id: 'storage_fire', name: 'Storage Fire' },
  { id: 'rubbish_fire', name: 'Rubbish Fire' },
  { id: 'others', name: 'Others' },
];

/** Statuses where route-to-incident nav is relevant */
const ROUTE_STATUSES: BFPIncidentStatus[] = ['dispatched', 'resolved'];

type RouteOrigin = 'station' | 'gps';

// ─── Route Origin Selector (Apple iOS Segmented Control) ───────────────────────
const OriginSelector: React.FC<{
  value: RouteOrigin;
  onChange: (o: RouteOrigin) => void;
  gpsAvailable: boolean;
}> = ({ value, onChange, gpsAvailable }) => {
  const { isDark } = useTheme();

  const opts: {
    key: RouteOrigin;
    icon: any;
    label: string;
  }[] = [
    {
      key: 'station',
      icon: Building2,
      label: 'From Fire Station',
    },
    {
      key: 'gps',
      icon: Crosshair,
      label: 'From My Location',
    },
  ];

  return (
    <View
      style={[
        styles.iosSegmentedContainer,
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4' },
      ]}
    >
      {opts.map((opt) => {
        const active = value === opt.key;
        const disabled = opt.key === 'gps' && !gpsAvailable;
        const IconComp = opt.icon;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (!disabled && !active) {
                Haptics.selectionAsync().catch(() => {});
                onChange(opt.key);
              }
            }}
            style={({ pressed }) => [
              styles.iosSegmentBtn,
              active && styles.iosSegmentBtnActive,
              { opacity: disabled ? 0.35 : pressed && !active ? 0.7 : 1 },
            ]}
          >
            <IconComp
              size={14}
              color={active ? '#1C1C1E' : '#8E8E93'}
              strokeWidth={active ? 2.5 : 2}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.iosSegmentText,
                {
                  color: active ? '#1C1C1E' : '#8E8E93',
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionPill: React.FC<{ title: string; action?: React.ReactNode }> = ({
  title,
  action,
}) => {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderTitle}>
        {title}
      </Text>
      {action}
    </View>
  );
};

// ─── Info row (Apple clean grouped table style) ───────────────────────────────
const InfoRow: React.FC<{
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ label, value, isLast }) => {
  const { colors } = useTheme();
  const isLong = value.length > 32;

  return (
    <View
      style={[
        styles.infoRow,
        isLong && { flexDirection: 'column', alignItems: 'flex-start' },
      ]}
    >
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text
        style={[
          styles.infoRowValue,
          { color: colors.textPrimary },
          isLong && { marginTop: 4, textAlign: 'left' },
        ]}
      >
        {value}
      </Text>
      {!isLast && <View style={styles.infoRowDivider} />}
    </View>
  );
};

// ─── Field label for edit mode ─────────────────────────────────────────────────
const FieldLabel: React.FC<{ text: string }> = ({ text }) => {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text
      style={{
        color: colors.textMuted,
        fontSize: typography.size.xs,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: spacing.sm,
        letterSpacing: 0.6,
      }}
    >
      {text}
    </Text>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function IncidentDetailScreen() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const reportId = Number(id);
  const backRoute = from === 'dashboard' ? '/(bfp)/dashboard' : '/(bfp)/incidents';

  const [incident, setIncident] = useState<BFPIncident | null>(null);
  const [locationName, setLocationName] = useState<string>('Loading location…');
  const [history, setHistory] = useState<BFPIncidentStatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [dialog, setDialog] = useState<{
    type: 'success' | 'confirm' | 'danger' | 'info';
    title: string;
    message: string;
    confirmText: string;
    icon: React.ReactNode;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [causeOfFire, setCauseOfFire] = useState('');
  const [casualties, setCasualties] = useState('0');
  const [notes, setNotes] = useState('');
  const [alarmLevel, setAlarmLevel] = useState<AlarmLevel | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);

  // Route / Map state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<RouteOrigin>('station');
  const [mapType, setMapType] = useState<MapType>('road');
  const [isMapTypeModalOpen, setIsMapTypeModalOpen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  /** Route distance & duration metrics received from the map engine */
  const [routeMeta, setRouteMeta] = useState<{ distance: number; duration: number } | null>(null);

  /** Imperative ref to the active navigation map for 60fps/120fps direct sensor bridge */
  const navMapRef = useRef<IncidentLocationMapRef | null>(null);
  /** Ref holding the active expo-location subscription */
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const headingSub = useRef<Location.LocationSubscription | null>(null);
  /** Live GPS position fed into the map via injectJavaScript */
  const [currentGPS, setCurrentGPS] = useState<GPSUpdate | null>(null);
  /** Departure location locked at the start of navigation so WebView never reloads on GPS ticks */
  const navOriginRef = useRef<{ lat: number; lng: number } | null>(null);

  /**
   * Start/stop real GPS watch whenever navigation mode toggles.
   */
  useEffect(() => {
    if (!isNavigating) {
      locationSub.current?.remove();
      locationSub.current = null;
      headingSub.current?.remove();
      headingSub.current = null;
      setCurrentGPS(null);
      return;
    }
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Seed current position immediately from cache (0ms) so puck appears without waiting
      try {
        const cached = await Location.getLastKnownPositionAsync();
        if (cached) {
          setCurrentGPS({
            latitude: cached.coords.latitude,
            longitude: cached.coords.longitude,
            heading: cached.coords.heading,
            speed: cached.coords.speed,
            accuracy: cached.coords.accuracy,
          });
        }
      } catch (_) {}

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (loc) => {
          setCurrentGPS((prev) => ({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : (prev?.heading ?? null),
            speed: loc.coords.speed,
            accuracy: loc.coords.accuracy,
          }));
        }
      );
      locationSub.current = sub;

      // Real-time magnetometer compass heading subscription
      // High-frequency heading updates are piped directly to the map engine without triggering screen re-renders
      try {
        const hSub = await Location.watchHeadingAsync((h) => {
          const rawHeading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (rawHeading >= 0) {
            navMapRef.current?.updateHeading(rawHeading);
          }
        });
        headingSub.current = hSub;
      } catch (_) {}
    })();
    return () => {
      locationSub.current?.remove();
      locationSub.current = null;
      headingSub.current?.remove();
      headingSub.current = null;
    };
  }, [isNavigating]);

  // Instant optimistic navigation opening (0ms perceived latency like Google Maps)
  const openNavigation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRouteOrigin('gps');
    setIsMapFullscreen(true);

    const startLoc = currentGPS ? { lat: currentGPS.latitude, lng: currentGPS.longitude } : (userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null);
    navOriginRef.current = startLoc ?? { lat: FIRE_STATION.latitude, lng: FIRE_STATION.longitude };

    setIsNavigating(true);

    // Background location refresh without blocking UI transition
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setCurrentGPS({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            heading: lastKnown.coords.heading,
            speed: lastKnown.coords.speed,
            accuracy: lastKnown.coords.accuracy,
          });
        }
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (fresh) {
          setCurrentGPS({
            latitude: fresh.coords.latitude,
            longitude: fresh.coords.longitude,
            heading: fresh.coords.heading,
            speed: fresh.coords.speed,
            accuracy: fresh.coords.accuracy,
          });
        }
      } catch (_) {}
    })();
  }, [currentGPS, userLocation]);
  const handleOpenFullscreen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsMapFullscreen(true);
  }, []);
  const stopNavigation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsNavigating(false);
    navOriginRef.current = null;
  };
  const closeFullscreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsMapFullscreen(false);
    setIsNavigating(false);
  };
  const handleNavComplete = () => {
    Alert.alert('Arrived! 🏁', 'You have reached the incident location.');
    setIsNavigating(false);
  };

  // Fast initial GPS acquisition: last known location immediately (0ms), then fresh
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const cached = await Location.getLastKnownPositionAsync();
        if (cached) {
          setUserLocation({ latitude: cached.coords.latitude, longitude: cached.coords.longitude });
        }
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (location) {
          setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        }
      } catch (e) {
        // Silently fail
      }
    })();
  }, []);

  const load = useCallback(() => {
    if (!reportId) return;
    Promise.all([incidentService.getDetail(reportId), incidentService.getStatusHistory(reportId)])
      .then(([detail, historyData]) => {
        setIncident(detail);
        setHistory(Array.isArray(historyData) ? historyData : []);
        setCauseOfFire(detail.cause_of_fire ?? '');
        setCasualties(String(detail.casualties ?? 0));
        setNotes(detail.notes ?? '');
        setAlarmLevel((detail.alarm_level as AlarmLevel) ?? null);
        setIncidentType(detail.incident_type ?? null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [reportId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let isMounted = true;
    if (incident?.latitude && incident?.longitude) {
      reverseGeocode(incident.latitude, incident.longitude).then((name) => {
        if (isMounted) {
          setLocationName(name !== 'Unknown area' ? name : (incident.barangay_name ?? 'Unknown location'));
        }
      });
    } else if (incident) {
      setLocationName(incident.barangay_name ?? 'Unknown location');
    }
    return () => { isMounted = false; };
  }, [incident?.latitude, incident?.longitude, incident?.barangay_name]);

  // Derived: current routing origin coordinates
  // Live navigation routes from locked departure coordinates so the WebView doesn't reload on GPS ticks;
  // preview allows inspecting Fire Station or userLocation.
  const originCoords = isNavigating
    ? (navOriginRef.current ?? (userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : { lat: FIRE_STATION.latitude, lng: FIRE_STATION.longitude }))
    : (routeOrigin === 'gps'
      ? (userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null)
      : { lat: FIRE_STATION.latitude, lng: FIRE_STATION.longitude });

  const handleVerify = () => {
    setDialog({
      type: 'confirm',
      title: 'Verify Incident',
      message: 'Confirm this report as a genuine fire incident?',
      confirmText: 'Verify Incident',
      icon: <ShieldCheck size={28} color="#FFFFFF" strokeWidth={2.5} />,
      onConfirm: async () => {
        setIsActing(true);
        try {
          const updated = await incidentService.verify(reportId);
          setIncident(updated);
          load();
          setDialog(null);
        } catch {
          Alert.alert('Unable to verify', 'Please try again once the backend endpoint is available.');
        } finally { setIsActing(false); }
      },
    });
  };

  const handleMarkInvalid = () => {
    setDialog({
      type: 'danger',
      title: 'Mark as False Report',
      message: 'This will close the report as invalid and remove it from active response work.',
      confirmText: 'Mark Invalid',
      icon: <ShieldX size={28} color="#FFFFFF" strokeWidth={2.5} />,
      onConfirm: async () => {
        setIsActing(true);
        try {
          const updated = await incidentService.markInvalid(reportId, 'Unable to confirm active incident.');
          setIncident(updated);
          load();
          setDialog(null);
        } catch {
          Alert.alert('Unable to update', 'Please try again once the backend endpoint is available.');
        } finally { setIsActing(false); }
      },
    });
  };

  const handleAdvanceStatus = (nextStatus: BFPIncidentStatus) => {
    const statusLabel = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
    setDialog({
      type: nextStatus === 'resolved' ? 'success' : 'confirm',
      title: `${statusLabel} Incident`,
      message: `Move this incident to ${statusLabel.toLowerCase()} and notify the response team?`,
      confirmText: `Mark ${statusLabel}`,
      icon: nextStatus === 'resolved'
        ? <CheckCircle2 size={28} color="#FFFFFF" strokeWidth={2.5} />
        : <Navigation2 size={28} color="#FFFFFF" strokeWidth={2.5} />,
      onConfirm: async () => {
        setIsActing(true);
        try {
          const updated = await incidentService.updateStatus(reportId, nextStatus);
          setIncident(updated);
          load();
          setDialog(null);
        } catch {
          Alert.alert('Unable to update', 'Please try again once the backend endpoint is available.');
        } finally { setIsActing(false); }
      },
    });
  };

  const handleSaveDetails = async () => {
    setIsActing(true);
    try {
      const updated = await incidentService.updateDetails(reportId, {
        incident_type: incidentType || undefined,
        cause_of_fire: causeOfFire ? causeOfFire.trim() : undefined,
        casualties: casualties !== '' ? Number(casualties) || 0 : 0,
        notes: notes ? notes.trim() : undefined,
        alarm_level: alarmLevel,
      });
      setIncident(updated);
      setIsEditingDetails(false);
    } catch {
      Alert.alert('Unable to save', 'Please try again once the backend endpoint is available.');
    } finally { setIsActing(false); }
  };

  const handleAddEvidence = async (localUri: string) => {
    const result = await incidentService.addEvidence(reportId, localUri);
    setIncident((prev) =>
      prev
        ? {
            ...prev,
            evidence_photos: [
              ...(prev.evidence_photos ?? []),
              { evidence_id: Date.now(), image_path: result.image_path, caption: null },
            ],
          }
        : prev
    );
  };

  if (isLoading || !incident) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SecondaryHeader title="Incident" onBack={() => router.replace(backRoute as any)} />
        <View style={styles.center}>
          {isLoading ? (
            <ActivityIndicator color={colors.brandOrange} />
          ) : (
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>Incident not found.</Text>
          )}
        </View>
      </View>
    );
  }

  const showRoute = ROUTE_STATUSES.includes(incident.status);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader
        title={`Report #${incident.report_id}`}
        onBack={() => router.replace(backRoute as any)}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>

        {/* ── EXECUTIVE BRIEFING HERO CARD ────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 16 }}>
          <View style={styles.briefingCard}>
            {/* Top row: Incident Headline / Type + Status Badge */}
            <View style={styles.briefingHeaderRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.briefingTitle} numberOfLines={1}>
                  {INCIDENT_TYPE_OPTIONS.find((t) => t.id === incident.incident_type)?.name || 'Fire Incident'}
                </Text>
                <Text style={styles.briefingSubtitle} numberOfLines={1}>
                  {incident.created_at ? `${formatFullDate(incident.created_at)} · ${formatTime(incident.created_at)}` : ''}
                </Text>
              </View>
              <IncidentStatusBadge status={incident.status} />
            </View>

            {/* Description if present */}
            {incident.description ? (
              <Text style={styles.briefingDescription}>
                {incident.description}
              </Text>
            ) : null}

            {/* Location row */}
            {locationName ? (
              <View style={styles.briefingLocationRow}>
                <MapPin size={13} color="#8E8E93" strokeWidth={2} />
                <Text style={styles.briefingLocationText} numberOfLines={1}>
                  {locationName}
                </Text>
              </View>
            ) : null}

            {/* Subtle Apple Intelligence Vision Pill */}
            {incident.ai_fire_label ? (
              <View style={styles.briefingAiRow}>
                <Sparkles size={12} color="#8E8E93" strokeWidth={2} />
                <Text style={styles.briefingAiText}>
                  {incident.ai_fire_label === 'fire'
                    ? 'AI Vision Verified: Fire pattern detected'
                    : incident.ai_fire_label === 'non_fire'
                      ? 'AI Vision: No fire pattern detected'
                      : 'AI Vision analysis unavailable'}
                </Text>
                {incident.ai_fire_confidence !== null && incident.ai_fire_confidence !== undefined ? (
                  <Text style={styles.briefingAiConfidence}>
                    · {(incident.ai_fire_confidence * 100).toFixed(0)}% Match
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>

          {/* ── FIRE SCENE PHOTOS ───────────────────────────────── */}
          {(() => {
            const photoCount = (incident.report_image ? 1 : 0) + (incident.evidence_photos?.length ?? 0);
            const photoTitle = photoCount === 1 ? `FIRE SCENE PHOTO (${photoCount})` : `FIRE SCENE PHOTOS (${photoCount})`;
            return (
              <View>
                <SectionPill title={photoTitle} />
                <Card>
                  <EvidenceGallery
                    mainPhoto={incident.report_image}
                    evidencePhotos={incident.evidence_photos ?? []}
                    onAddEvidence={handleAddEvidence}
                    canAdd={incident.status === 'resolved'}
                  />
                </Card>
              </View>
            );
          })()}

          {/* ── REPORTER INFORMATION ─────────────────────────────── */}
          <View>
            <SectionPill title="REPORTER INFORMATION" />
            <Card padding={0}>
              <InfoRow
                label="Reported By"
                value={incident.reporter_name ?? 'Unknown'}
              />
              <InfoRow
                label="Contact Number"
                value={incident.contact_number || 'No contact provided'}
              />
              <InfoRow
                label="Reported At"
                value={incident.created_at ? `${formatFullDate(incident.created_at)} · ${formatTime(incident.created_at)}` : 'Unknown'}
                isLast={!incident.contact_number}
              />
              {incident.contact_number ? (
                <View style={{ padding: 14, paddingTop: 4 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      const { Linking } = require('react-native');
                      Linking.openURL(`tel:${incident.contact_number}`);
                    }}
                    style={({ pressed }) => [
                      styles.callButton,
                      {
                        backgroundColor: '#34C759',
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <Phone size={15} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.callButtonText}>
                      Call Reporter
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          </View>

          {/* ── LOCAL OFFICIALS ──────────────────────────────────── */}
          {incident.barangay_contacts && incident.barangay_contacts.length > 0 ? (
            <View>
              <SectionPill title="LOCAL OFFICIALS" />
              <Card padding={0}>
                {incident.barangay_contacts.map((contact, idx) => {
                  const isLast = idx === incident.barangay_contacts!.length - 1;
                  return (
                    <View key={idx}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                        {/* Details */}
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '700',
                              color: isDark ? '#FFFFFF' : '#1C1C1E',
                              letterSpacing: -0.2,
                            }}
                            numberOfLines={1}
                          >
                            {contact.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: '500',
                              color: '#8E8E93',
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {contact.role}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: isDark ? '#AEAEB2' : '#3A3A3C',
                              marginTop: 4,
                              letterSpacing: 0.2,
                            }}
                            numberOfLines={1}
                          >
                            {contact.phone_number}
                          </Text>
                        </View>
                        
                        {/* Call Button */}
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                            const { Linking } = require('react-native');
                            Linking.openURL(`tel:${contact.phone_number}`);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Call ${contact.name}`}
                          style={({ pressed }) => [
                            styles.officialCallBtn,
                            {
                              backgroundColor: '#34C759',
                              transform: [{ scale: pressed ? 0.92 : 1 }],
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Phone size={16} color="#FFFFFF" strokeWidth={2.4} />
                        </Pressable>
                      </View>
                      
                      {!isLast && <View style={[styles.infoRowDivider, { backgroundColor: 'rgba(0,0,0,0.06)' }]} />}
                    </View>
                  );
                })}
              </Card>
            </View>
          ) : null}

          {/* ── VERIFY / FALSE REPORT ACTIONS ────────────────────── */}
          {incident.status === 'pending' ? (
            <View style={[styles.actionsRow, { marginTop: 20 }]}>
              <View style={{ flex: 1 }}>
                <Button label="Verify Incident" onPress={handleVerify} loading={isActing} icon={<ShieldCheck size={16} color="#FFFFFF" />} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Mark False" variant="danger" onPress={handleMarkInvalid} loading={isActing} icon={<ShieldX size={16} color="#FFFFFF" />} />
              </View>
            </View>
          ) : null}

          {/* ── RESPONSE STATUS STEPPER ──────────────────────────── */}
          {incident.status !== 'invalid' && incident.status !== 'pending' ? (
            <View>
              <SectionPill title="RESPONSE STATUS" />
              <Card>
                <StatusStepper
                  status={incident.status}
                  history={history}
                  createdAt={incident.created_at}
                  onAdvance={handleAdvanceStatus}
                  disabled={isActing}
                />
              </Card>
            </View>
          ) : null}

          {/* ── ROUTE TO INCIDENT (dispatched+ only) ─────────────── */}
          {showRoute ? (
            <View>
              <SectionPill title="ROUTE TO INCIDENT" />

              {/* Origin selector */}
              <OriginSelector
                value={routeOrigin}
                onChange={setRouteOrigin}
                gpsAvailable={userLocation != null}
              />

              {/* Mini map preview */}
              <View style={{ marginTop: spacing.sm }}>
                <Card padding={0} style={{ overflow: 'hidden' }}>
                  <Pressable
                    onPress={handleOpenFullscreen}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Expand map to fullscreen"
                    accessibilityHint="Opens interactive fullscreen route map"
                    style={({ pressed }) => [
                      styles.mapPreviewTouchTarget,
                      { opacity: pressed ? 0.94 : 1 },
                    ]}
                  >
                    <View style={{ height: 210 }} pointerEvents="none">
                      <IncidentLocationMap
                        latitude={incident.latitude}
                        longitude={incident.longitude}
                        originLat={originCoords?.lat}
                        originLng={originCoords?.lng}
                        originLabel={routeOrigin === 'station' ? 'Fire Station' : 'My Location'}
                        mapType={mapType}
                      />
                    </View>

                    {/* Floating origin indicator pill (top-left) */}
                    <View style={styles.previewOriginBadge}>
                      {routeOrigin === 'station' ? (
                        <Building2 size={11} color="#1C1C1E" strokeWidth={2.2} />
                      ) : (
                        <Crosshair size={11} color="#1C1C1E" strokeWidth={2.2} />
                      )}
                      <Text style={styles.previewOriginText}>
                        {routeOrigin === 'station' ? 'Station Route' : 'GPS Route'}
                      </Text>
                    </View>

                    {/* Expand affordance badge (top-right) */}
                    <View style={styles.expandAffordanceBadge}>
                      <Maximize2 size={11} color="#1C1C1E" strokeWidth={2.4} />
                      <Text style={styles.expandAffordanceText}>Expand</Text>
                    </View>
                  </Pressable>

                  {/* Map footer with layer toggle and start nav CTA */}
                  <View
                    style={[
                      styles.mapFooter,
                      {
                        borderTopColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setIsMapTypeModalOpen(true);
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Change map type"
                      style={({ pressed }) => [
                        styles.previewMapTypeBtn,
                        {
                          backgroundColor: colors.background,
                          borderRadius: radius.full,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <Layers size={13} color="#8E8E93" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: colors.textSecondary,
                          marginLeft: 6,
                        }}
                      >
                        {mapType === 'satellite' ? 'Satellite' : 'Road'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={openNavigation}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Start navigation"
                      style={({ pressed }) => [
                        styles.miniStartNavBtn,
                        {
                          backgroundColor: colors.brandOrange,
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      <Navigation2 size={13} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.miniStartNavBtnText}>
                        Navigate
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              </View>

              {/* Station info pill */}
              {routeOrigin === 'station' ? (
                <View style={[styles.stationInfoPill, { backgroundColor: '#FFFFFF', borderColor: 'rgba(0, 0, 0, 0.06)' }]}>
                  <View style={styles.stationInfoIconBox}>
                    <Building2 size={16} color="#8E8E93" strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 11 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                      {FIRE_STATION.name}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                      {FIRE_STATION.address}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.stationInfoPill, { backgroundColor: '#FFFFFF', borderColor: 'rgba(0, 0, 0, 0.06)' }]}>
                  <View style={styles.stationInfoIconBox}>
                    <Crosshair size={16} color="#8E8E93" strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 11 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                      Real-Time GPS Location
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                      {userLocation ? `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}` : 'Acquiring GPS fix…'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : null}

          {/* ── INCIDENT DETAILS (available after resolution) ────── */}
          {incident.status === 'resolved' ? (
          <View>
            <SectionPill
              title="INCIDENT DETAILS"
              action={
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsEditingDetails((v) => !v);
                  }}
                  style={({ pressed }) => [
                    styles.editPill,
                    {
                      backgroundColor: isEditingDetails
                        ? 'rgba(52, 199, 89, 0.12)'
                        : 'rgba(0, 0, 0, 0.05)',
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  {isEditingDetails ? (
                    <Check size={12} color="#34C759" strokeWidth={2.4} />
                  ) : (
                    <Pencil size={12} color="#1C1C1E" strokeWidth={2.4} />
                  )}
                  <Text
                    style={{
                      color: isEditingDetails ? '#34C759' : '#1C1C1E',
                      fontSize: 11,
                      fontWeight: '700',
                      marginLeft: 4,
                    }}
                  >
                    {isEditingDetails ? 'Done' : 'Edit'}
                  </Text>
                </Pressable>
              }
            />

            {isEditingDetails ? (
              <Card padding={spacing.md}>
                <FieldLabel text="INCIDENT TYPE" />
                <SelectField
                  value={incidentType}
                  options={INCIDENT_TYPE_OPTIONS}
                  onSelect={(value) => setIncidentType(value as IncidentType)}
                  placeholder="Select incident type"
                />

                <FieldLabel text="ALARM LEVEL" />
                <SelectField
                  value={alarmLevel}
                  options={ALARM_LEVEL_OPTIONS}
                  onSelect={(value) => setAlarmLevel(value as AlarmLevel)}
                  placeholder="Select alarm level"
                />

                <FieldLabel text="CAUSE OF FIRE" />
                <TextInput
                  value={causeOfFire}
                  onChangeText={setCauseOfFire}
                  placeholder="e.g. Faulty electrical wiring"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  scrollEnabled={false}
                  style={[
                    styles.input,
                    styles.autoExpandingInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      backgroundColor: colors.background,
                    },
                  ]}
                />

                <FieldLabel text="CASUALTIES" />
                <TextInput
                  value={casualties}
                  onChangeText={setCasualties}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      backgroundColor: colors.background,
                    },
                  ]}
                />

                <FieldLabel text="NOTES" />
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional findings, remarks, building damages…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  scrollEnabled={false}
                  style={[
                    styles.input,
                    styles.autoExpandingInput,
                    styles.notesInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
                <View style={{ marginTop: spacing.md }}>
                  <Button label="Save Changes" onPress={handleSaveDetails} loading={isActing} />
                </View>
              </Card>
            ) : (
              <Card padding={0}>
                <InfoRow 
                  label="Incident Type" 
                  value={INCIDENT_TYPE_OPTIONS.find((t) => t.id === incident.incident_type)?.name || incident.incident_type || 'Unspecified'} 
                />
                <InfoRow 
                  label="Alarm Level" 
                  value={incident.alarm_level ? (ALARM_LEVEL_LABELS[incident.alarm_level as AlarmLevel] || incident.alarm_level) : 'Unspecified'} 
                />
                <InfoRow
                  label="Cause of Fire"
                  value={incident.cause_of_fire || 'Not yet determined'}
                />
                <InfoRow
                  label="Casualties"
                  value={String(incident.casualties ?? 0)}
                />
                <InfoRow
                  label="Notes"
                  value={incident.notes || 'No additional notes'}
                  isLast
                />
              </Card>
            )}
          </View>
          ) : null}

          {/* ── STATUS HISTORY TIMELINE ──────────────────────────── */}
          {Array.isArray(history) && history.length > 0 ? (
            <View>
              <SectionPill title="STATUS HISTORY" />
              <Card padding={0}>
                {history.map((entry, index) => {
                  const isLatest = index === history.length - 1;
                  const isLastInList = index === history.length - 1;
                  return (
                    <View
                      key={entry.history_id}
                      style={[
                        styles.historyRow,
                        { paddingVertical: 14, paddingHorizontal: 16 },
                      ]}
                    >
                      <View style={styles.timelineDotWrapper}>
                        <View
                          style={[
                            styles.timelineDot,
                            {
                              backgroundColor: isLatest ? colors.brandOrange : '#C7C7CC',
                            },
                          ]}
                        />
                        {!isLastInList ? (
                          <View style={[styles.timelineLine, { backgroundColor: 'rgba(0, 0, 0, 0.08)' }]} />
                        ) : null}
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <IncidentStatusBadge status={entry.status} size="sm" />
                          <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '500' }}>
                            {formatTime(entry.created_at)}
                          </Text>
                        </View>
                        {entry.notes ? (
                          <View style={styles.historyNotesBox}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                              {entry.notes}
                            </Text>
                          </View>
                        ) : null}
                        <Text style={{ color: '#8E8E93', fontSize: 11, marginTop: 4 }}>
                          {formatFullDate(entry.created_at)}
                          {entry.changed_by_name ? ` · Officer ${entry.changed_by_name}` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* ── FULLSCREEN MAP MODAL ─────────────────────────────────── */}
      <Modal visible={isMapFullscreen} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>

          {/* Full-bleed map */}
          <View style={{ flex: 1 }}>
            <IncidentLocationMap
              ref={navMapRef}
              latitude={incident.latitude}
              longitude={incident.longitude}
              originLat={originCoords?.lat}
              originLng={originCoords?.lng}
              originLabel={isNavigating || routeOrigin === 'gps' ? 'My Location' : 'Fire Station'}
              mapType={mapType}
              isNavigating={isNavigating}
              currentGPS={currentGPS}
              onNavigationComplete={handleNavComplete}
              onRouteMeta={setRouteMeta}
            />
          </View>

          {/* ── Floating TOP bar: Apple Maps-style floating island cards ── */}
          <View style={[styles.fsHeader, { paddingTop: Platform.OS === 'ios' ? 52 : 36 }]}>
            <View
              style={[
                styles.fsHeaderCard,
                {
                  backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <View
                style={[
                  styles.fsIconBadge,
                  { backgroundColor: isNavigating ? colors.brandOrange : `${colors.brandOrange}18` },
                ]}
              >
                <Navigation2 size={14} color={isNavigating ? '#FFFFFF' : colors.brandOrange} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.fsTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {isNavigating ? 'Live Navigation' : 'Route Overview'}
                </Text>
                {!isNavigating ? (
                  <Text style={[styles.fsSub, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    Destination · {incident.barangay_name ? `Brgy. ${incident.barangay_name}` : 'Incident Location'}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Right floating actions column: Close (X) above Map Type (Layers) */}
            <View style={styles.fsHeaderRightCol}>
              <Pressable
                onPress={() => {
                  if (isNavigating) {
                    stopNavigation();
                  } else {
                    closeFullscreen();
                  }
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isNavigating ? 'Exit live navigation' : 'Close map'}
                style={({ pressed }) => [
                  styles.fsActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <X size={20} color={colors.textPrimary} />
              </Pressable>

              {!isNavigating ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsMapTypeModalOpen(true);
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Map type selector"
                  style={({ pressed }) => [
                    styles.fsActionBtn,
                    {
                      backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Layers size={20} color={colors.textPrimary} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* ── Floating BOTTOM controls (Route Overview only; hidden during active navigation to avoid redundancy) ── */}
          {isNavigating ? null : (
            <View
              style={[
                styles.fsControls,
                {
                  backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : 'rgba(255, 255, 255, 0.94)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)',
                },
              ]}
            >
              {/* Route Duration & Distance Telemetry (Apple Maps style) */}
              <View style={styles.fsRouteMetricsRow}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.fsDurationText, { color: colors.textPrimary }]}>
                    {routeMeta ? (routeMeta.duration < 60 ? '< 1 min' : `${Math.ceil(routeMeta.duration / 60)} min`) : 'Calculating…'}
                  </Text>
                  {routeMeta ? (
                    <Text style={[styles.fsDistanceText, { color: colors.textSecondary }]}>
                      ({routeMeta.distance < 1000 ? `${Math.round(routeMeta.distance)} m` : `${(routeMeta.distance / 1000).toFixed(1)} km`})
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Segmented Origin Toggle (Apple iOS Segmented Control) */}
              <View
                style={[
                  styles.fsOriginToggle,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                  },
                ]}
              >
                {([
                  { key: 'station', label: 'From Fire Station', icon: Building2 },
                  { key: 'gps',     label: 'From My Location',  icon: Crosshair },
                ] as const).map((o) => {
                  const active = routeOrigin === o.key;
                  const disabled = o.key === 'gps' && !userLocation;
                  const IconComp = o.icon;
                  return (
                    <Pressable
                      key={o.key}
                      onPress={() => {
                        if (!disabled && routeOrigin !== o.key) {
                          Haptics.selectionAsync().catch(() => {});
                          setRouteMeta(null);
                          setRouteOrigin(o.key);
                        }
                      }}
                      style={[
                        styles.fsOriginBtn,
                        active && {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0.2 : 0.08,
                          shadowRadius: 4,
                          elevation: 2,
                        },
                        { opacity: disabled ? 0.35 : 1 },
                      ]}
                    >
                      <IconComp
                        size={14}
                        color={
                          active
                            ? (isDark ? '#FFFFFF' : colors.brandOrange)
                            : (isDark ? 'rgba(255, 255, 255, 0.5)' : colors.textMuted)
                        }
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <Text
                        style={{
                          color: active
                            ? (isDark ? '#FFFFFF' : colors.textPrimary)
                            : (isDark ? 'rgba(255, 255, 255, 0.5)' : colors.textSecondary),
                          fontSize: 12.5,
                          fontWeight: active ? '700' : '600',
                          marginLeft: 6,
                        }}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Prominent Start Live Navigation Action Button */}
              <Pressable
                onPress={openNavigation}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Start live navigation"
                style={({ pressed }) => [
                  styles.fsStartNavBtnFull,
                  {
                    backgroundColor: colors.brandOrange,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                ]}
              >
                <Navigation2 size={17} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.fsStartNavBtnText}>
                  Start Live Navigation
                </Text>
              </Pressable>
            </View>
          )}

          {/* Map Type Modal inside fullscreen view */}
          <MapTypeModal
            visible={isMapTypeModalOpen}
            onClose={() => setIsMapTypeModalOpen(false)}
            mapType={mapType === 'satellite' ? 'satellite' : 'standard'}
            onChange={(t) => {
              setMapType(t === 'standard' ? 'road' : 'satellite');
              setIsMapTypeModalOpen(false);
            }}
          />
        </View>
      </Modal>

      {/* Map Type Modal for mini-preview when outside fullscreen */}
      <MapTypeModal
        visible={isMapTypeModalOpen && !isMapFullscreen}
        onClose={() => setIsMapTypeModalOpen(false)}
        mapType={mapType === 'satellite' ? 'satellite' : 'standard'}
        onChange={(t) => {
          setMapType(t === 'standard' ? 'road' : 'satellite');
          setIsMapTypeModalOpen(false);
        }}
      />

      <ConfirmationDialog
        visible={dialog !== null}
        type={dialog?.type}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmText={dialog?.confirmText}
        icon={dialog?.icon}
        loading={isActing}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Executive Briefing Card
  briefingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1C3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  briefingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  briefingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  briefingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  briefingDescription: {
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 21,
    color: '#3A3A3C',
    marginTop: 12,
  },
  briefingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 5,
  },
  briefingLocationText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#636366',
    flex: 1,
  },
  briefingAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    gap: 6,
  },
  briefingAiText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636366',
  },
  briefingAiConfidence: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },

  // iOS Native Segmented Control
  iosSegmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
  },
  iosSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  iosSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iosSegmentText: {
    fontSize: 12.5,
    marginLeft: 6,
    letterSpacing: -0.2,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Edit pill
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  infoRowLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  infoRowValue: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'right',
    flexShrink: 1,
  },
  infoRowDivider: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },

  // Reporter & Officials
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  officialAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12 },

  // Origin selector
  originRow: { flexDirection: 'row' },
  originCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  originIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originActiveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Station info pill
  stationInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  stationInfoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationInfoTitle: {
    color: '#1C1C1E',
    fontSize: 13,
    fontWeight: '700',
  },
  stationInfoSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 1,
  },

  // Map preview card
  mapPreviewTouchTarget: {
    position: 'relative',
    overflow: 'hidden',
  },
  previewOriginBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  previewOriginText: {
    color: '#101827',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  expandAffordanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  expandAffordanceText: {
    color: '#101827',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Map footer
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewMapTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 28, 63, 0.05)',
  },
  previewMapTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 6,
  },
  miniStartNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    shadowColor: '#F4622B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
  },
  miniStartNavBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  mapTypeInlineRow: {
    flexDirection: 'row',
    padding: 3,
  },
  mapTypeInlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  fullscreenTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 10,
  },

  // Edit mode
  input: {
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 21,
  },
  autoExpandingInput: {
    minHeight: 48,
    textAlignVertical: 'center',
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // History
  historyRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDotWrapper: { alignItems: 'center', width: 16, marginTop: 3 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  historyNotesBox: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 28, 63, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },

  // Fullscreen modal
  fsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    pointerEvents: 'box-none',
  },
  fsHeaderCard: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 10,
  },
  fsIconBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fsTitle: { color: '#101827', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  fsSub: { color: '#5B6479', fontSize: 11, marginTop: 1, fontWeight: '500' },
  fsHeaderRightCol: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  fsActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fsControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 18,
    left: 16,
    right: 16,
    padding: 16,
    gap: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#0F1C3F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  fsRouteMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  fsDurationText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  fsDistanceText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  fsRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    gap: 5,
  },
  fsRouteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fsOriginToggle: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 4,
    backgroundColor: '#F1F5F9',
  },
  fsOriginBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 18,
  },
  fsStartNavBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    shadowColor: '#F4622B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  fsStartNavBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
});