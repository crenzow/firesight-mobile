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
import { IncidentLocationMap, MapType, GPSUpdate } from '../../../components/bfp/IncidentLocationMap';
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

// ─── Route Origin Selector ────────────────────────────────────────────────────
const OriginSelector: React.FC<{
  value: RouteOrigin;
  onChange: (o: RouteOrigin) => void;
  gpsAvailable: boolean;
}> = ({ value, onChange, gpsAvailable }) => {
  const { colors, spacing } = useTheme();

  const opts: { key: RouteOrigin; icon: React.ReactNode; title: string; sub: string }[] = [
    {
      key: 'station',
      icon: <Building2 size={18} color={value === 'station' ? colors.brandOrange : colors.textMuted} />,
      title: 'From Fire Station',
      sub: 'Station → Incident',
    },
    {
      key: 'gps',
      icon: <Crosshair size={18} color={value === 'gps' ? colors.brandOrange : colors.textMuted} />,
      title: 'From My Location',
      sub: gpsAvailable ? 'Current GPS → Incident' : 'GPS unavailable',
    },
  ];

  return (
    <View style={[styles.originRow, { gap: spacing.sm }]}>
      {opts.map((opt) => {
        const active = value === opt.key;
        const disabled = opt.key === 'gps' && !gpsAvailable;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (!disabled) {
                Haptics.selectionAsync().catch(() => {});
                onChange(opt.key);
              }
            }}
            style={[
              styles.originCard,
              {
                flex: 1,
                borderColor: active ? colors.brandOrange : colors.border,
                borderWidth: active ? 2 : 1,
                backgroundColor: active ? `${colors.brandOrange}10` : colors.surface,
                opacity: disabled ? 0.4 : 1,
              },
            ]}
          >
            <View style={[styles.originIcon, { backgroundColor: active ? `${colors.brandOrange}18` : `${colors.brandNavy}10` }]}>
              {opt.icon}
            </View>
            <Text style={{ color: active ? colors.brandOrange : colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 6 }}>
              {opt.title}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
              {opt.sub}
            </Text>
            {active ? (
              <View style={[styles.originActiveDot, { backgroundColor: colors.brandOrange }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── Section pill header ──────────────────────────────────────────────────────
const SectionPill: React.FC<{ icon: React.ReactNode; title: string; action?: React.ReactNode }> = ({
  icon,
  title,
  action,
}) => {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={[styles.sectionPillRow, { marginBottom: spacing.sm }]}>
      <View style={[styles.sectionPillLeft, { backgroundColor: `${colors.brandOrange}1A` }]}>
        {icon}
        <Text
          style={{
            color: colors.brandOrange,
            fontSize: typography.size.xs,
            fontWeight: '800',
            marginLeft: 6,
            letterSpacing: 0.6,
          }}
        >
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
};

// ─── Icon info row ─────────────────────────────────────────────────────────────
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ icon, label, value, isLast }) => {
  const { colors, typography, spacing } = useTheme();
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        { paddingVertical: spacing.md },
      ]}
    >
      <View style={[styles.infoRowIcon, { backgroundColor: `${colors.brandNavy}14` }]}>{icon}</View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '500' }}>
          {value}
        </Text>
      </View>
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

  /** Ref holding the active expo-location subscription */
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  /** Live GPS position fed into the map via injectJavaScript */
  const [currentGPS, setCurrentGPS] = useState<GPSUpdate | null>(null);

  /**
   * Start/stop real GPS watch whenever navigation mode toggles.
   */
  useEffect(() => {
    if (!isNavigating) {
      locationSub.current?.remove();
      locationSub.current = null;
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
          setCurrentGPS({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
            accuracy: loc.coords.accuracy,
          });
        }
      );
      locationSub.current = sub;
    })();
    return () => {
      locationSub.current?.remove();
      locationSub.current = null;
    };
  }, [isNavigating]);

  // Instant optimistic navigation opening (0ms perceived latency like Google Maps)
  const openNavigation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRouteOrigin('gps');
    setIsMapFullscreen(true);
    setIsNavigating(true);

    // Background location refresh without blocking UI transition
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setUserLocation({ latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude });
        }
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (fresh) {
          setUserLocation({ latitude: fresh.coords.latitude, longitude: fresh.coords.longitude });
        }
      } catch (_) {}
    })();
  }, []);
  const handleOpenFullscreen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsMapFullscreen(true);
  }, []);
  const stopNavigation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsNavigating(false);
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
        setHistory(historyData);
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
  // Live navigation ALWAYS routes from current user location; preview allows inspecting Fire Station
  const originCoords = (isNavigating || routeOrigin === 'gps')
    ? (userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null)
    : { lat: FIRE_STATION.latitude, lng: FIRE_STATION.longitude };

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
        subtitle={locationName}
        onBack={() => router.replace(backRoute as any)}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>

        {/* ── HERO STATUS BAND ────────────────────────────────────── */}
        <LinearGradient
          colors={['#F4622B18', '#F4622B06', 'transparent']}
          style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}
        >
          <View style={styles.heroBadgeRow}>
            <IncidentStatusBadge status={incident.status} />
          </View>

          {incident.description ? (
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 21, marginTop: spacing.md }}>
              {incident.description}
            </Text>
          ) : null}

          <View style={{ marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: incident.ai_fire_label === 'fire' ? '#FEE2E2' : incident.ai_fire_label === 'non_fire' ? '#DCFCE7' : colors.background }}>
            <Text style={{ color: incident.ai_fire_label === 'fire' ? '#991B1B' : incident.ai_fire_label === 'non_fire' ? '#166534' : colors.textMuted, fontSize: typography.size.xs, fontWeight: '700' }}>
              {incident.ai_fire_label === 'fire'
                ? `Fire detected${incident.ai_fire_confidence !== null && incident.ai_fire_confidence !== undefined ? ` · ${(incident.ai_fire_confidence * 100).toFixed(1)}% confidence` : ''}`
                : incident.ai_fire_label === 'non_fire'
                  ? `No fire detected${incident.ai_fire_confidence !== null && incident.ai_fire_confidence !== undefined ? ` · ${(incident.ai_fire_confidence * 100).toFixed(1)}% confidence` : ''}`
                  : 'AI scan unavailable'}
            </Text>
          </View>

          <View style={[styles.metaStrip, { marginTop: spacing.md }]}>
            {locationName ? (
              <View style={styles.metaChip}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>{locationName}</Text>
              </View>
            ) : null}
            {incident.created_at ? (
              <View style={[styles.metaChip, { marginLeft: spacing.md }]}>
                <Calendar size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>
                  {formatFullDate(incident.created_at)} · {formatTime(incident.created_at)}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg }}>

          {/* ── FIRE SCENE PHOTOS ───────────────────────────────── */}
          {(() => {
            const photoCount = (incident.report_image ? 1 : 0) + (incident.evidence_photos?.length ?? 0);
            const photoTitle = photoCount === 1 ? `FIRE SCENE PHOTO (${photoCount})` : `FIRE SCENE PHOTOS (${photoCount})`;
            return (
              <View style={{ marginTop: spacing.md }}>
                <SectionPill icon={<Flame size={12} color={colors.brandOrange} />} title={photoTitle} />
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
          <View style={{ marginTop: spacing.xl }}>
            <SectionPill icon={<User size={12} color={colors.brandOrange} />} title="REPORTER INFORMATION" />
            <Card padding={0}>
              <InfoRow icon={<User size={16} color={colors.brandNavy} />} label="Reported By" value={incident.reporter_name ?? 'Unknown'} />
              <InfoRow
                icon={<Phone size={16} color={colors.brandNavy} />}
                label="Contact Number"
                value={incident.contact_number || 'No contact provided'}
              />
              <InfoRow
                icon={<Clock size={16} color={colors.brandNavy} />}
                label="Reported At"
                value={incident.created_at ? `${formatFullDate(incident.created_at)} · ${formatTime(incident.created_at)}` : 'Unknown'}
                isLast={!incident.contact_number}
              />
              {incident.contact_number ? (
                <View style={{ padding: spacing.md, paddingTop: 0 }}>
                  <Pressable
                    onPress={() => {
                      const { Linking } = require('react-native');
                      Linking.openURL(`tel:${incident.contact_number}`);
                    }}
                    style={[styles.callButton, { backgroundColor: colors.success, borderRadius: radius.md }]}
                  >
                    <Phone size={14} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: '700', marginLeft: 6 }}>
                      Call Reporter
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          </View>

          {/* ── LOCAL OFFICIALS ──────────────────────────────────── */}
          {incident.barangay_contacts && incident.barangay_contacts.length > 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <SectionPill icon={<ShieldCheck size={12} color={colors.brandOrange} />} title="LOCAL OFFICIALS" />
              <Card padding={0}>
                {incident.barangay_contacts.map((contact, idx) => {
                  const isLast = idx === incident.barangay_contacts!.length - 1;
                  return (
                    <View key={idx}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
                        {/* Avatar / Icon */}
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandNavy + '15', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} color={colors.brandNavy} />
                        </View>
                        
                        {/* Details */}
                        <View style={{ flex: 1, marginLeft: spacing.md, marginRight: spacing.sm }}>
                          <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.brandNavy }} numberOfLines={1}>
                            {contact.name}
                          </Text>
                          <Text style={{ fontSize: typography.size.sm, color: colors.brandNavy, marginTop: 2 }} numberOfLines={1}>
                            {contact.role}
                          </Text>
                          <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 }}>
                            {contact.phone_number}
                          </Text>
                        </View>
                        
                        {/* Call Button */}
                        <Pressable
                          onPress={() => {
                            const { Linking } = require('react-native');
                            Linking.openURL(`tel:${contact.phone_number}`);
                          }}
                          style={({ pressed }) => ({
                            width: 44, height: 44, borderRadius: 22,
                            backgroundColor: colors.success,
                            alignItems: 'center', justifyContent: 'center',
                            opacity: pressed ? 0.8 : 1,
                            shadowColor: colors.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2
                          })}
                        >
                          <Phone size={20} color="#FFFFFF" />
                        </Pressable>
                      </View>
                      
                      {!isLast && <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg }} />}
                    </View>
                  );
                })}
              </Card>
            </View>
          ) : null}

          {/* ── VERIFY / FALSE REPORT ACTIONS ────────────────────── */}
          {incident.status === 'pending' ? (
            <View style={[styles.actionsRow, { marginTop: spacing.xl }]}>
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
            <View style={{ marginTop: spacing.xl }}>
              <SectionPill icon={<Navigation2 size={12} color={colors.brandOrange} />} title="RESPONSE STATUS" />
              <Card>
                <StatusStepper status={incident.status} onAdvance={handleAdvanceStatus} disabled={isActing} />
              </Card>
            </View>
          ) : null}

          {/* ── ROUTE TO INCIDENT (dispatched+ only) ─────────────── */}
          {showRoute ? (
            <View style={{ marginTop: spacing.xl }}>
              <SectionPill
                icon={<Map size={12} color={colors.brandOrange} />}
                title="ROUTE TO INCIDENT"
              />

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
                    <View style={{ height: 200 }} pointerEvents="none">
                      <IncidentLocationMap
                        latitude={incident.latitude}
                        longitude={incident.longitude}
                        originLat={originCoords?.lat}
                        originLng={originCoords?.lng}
                        originLabel={routeOrigin === 'station' ? 'Fire Station' : 'My Location'}
                        mapType={mapType}
                      />
                    </View>

                    {/* Expand affordance badge */}
                    <View style={styles.expandAffordanceBadge}>
                      <Maximize2 size={12} color="#FFFFFF" />
                      <Text style={styles.expandAffordanceText}>Tap to expand</Text>
                    </View>
                  </Pressable>

                  {/* Map footer: layer type modal trigger */}
                  <View
                    style={[
                      styles.mapFooter,
                      {
                        padding: spacing.md,
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
                      <Layers size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: colors.textSecondary,
                          marginLeft: 6,
                        }}
                      >
                        Change Map Type
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.textMuted,
                          marginLeft: 4,
                        }}
                      >
                        · {mapType === 'satellite' ? 'Satellite' : 'Road'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Navigate CTA */}
                  <Pressable
                    onPress={openNavigation}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Start navigation"
                    style={({ pressed }) => [
                      styles.navigateBtn,
                      {
                        backgroundColor: colors.brandOrange,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <PlayCircle size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginLeft: 8, letterSpacing: 0.3 }}>
                      Start Navigation
                    </Text>
                  </Pressable>
                </Card>
              </View>

              {/* Station info pill */}
              {routeOrigin === 'station' ? (
                <View style={[styles.stationInfoPill, { backgroundColor: `${colors.brandNavy}10`, borderColor: `${colors.brandNavy}20` }]}>
                  <Building2 size={13} color={colors.brandNavy} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                      {FIRE_STATION.name}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {FIRE_STATION.address}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.stationInfoPill, { backgroundColor: `${colors.success}0F`, borderColor: `${colors.success}22` }]}>
                  <Crosshair size={13} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700', marginLeft: 8 }}>
                    {userLocation ? `GPS · ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}` : 'Acquiring GPS…'}
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* ── INCIDENT DETAILS (available after resolution) ────── */}
          {incident.status === 'resolved' ? (
          <View style={{ marginTop: spacing.xl }}>
            <SectionPill
              icon={<ClipboardList size={12} color={colors.brandOrange} />}
              title="INCIDENT DETAILS"
              action={
                <Pressable
                  onPress={() => setIsEditingDetails((v) => !v)}
                  style={[
                    styles.editPill,
                    {
                      backgroundColor: isEditingDetails
                        ? `${colors.success}1A`
                        : `${colors.brandOrange}1A`,
                    },
                  ]}
                >
                  {isEditingDetails ? (
                    <Check size={12} color={colors.success} />
                  ) : (
                    <Pencil size={12} color={colors.brandOrange} />
                  )}
                  <Text
                    style={{
                      color: isEditingDetails ? colors.success : colors.brandOrange,
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
                  icon={<Flame size={16} color={colors.brandNavy} />} 
                  label="Incident Type" 
                  value={INCIDENT_TYPE_OPTIONS.find((t) => t.id === incident.incident_type)?.name || incident.incident_type || 'Unspecified'} 
                />
                <InfoRow 
                  icon={<Bell size={16} color={colors.brandNavy} />} 
                  label="Alarm Level" 
                  value={incident.alarm_level ? (ALARM_LEVEL_LABELS[incident.alarm_level as AlarmLevel] || incident.alarm_level) : 'Unspecified'} 
                />

                <InfoRow icon={<AlertTriangle size={16} color={colors.brandNavy} />} label="Cause of Fire" value={incident.cause_of_fire || 'Not yet determined'} />
                <InfoRow icon={<HeartPulse size={16} color={colors.brandNavy} />} label="Casualties" value={String(incident.casualties ?? 0)} />
                <InfoRow icon={<FileText size={16} color={colors.brandNavy} />} label="Notes" value={incident.notes || 'No additional notes'} isLast />
              </Card>
            )}
          </View>
          ) : null}

          {/* ── STATUS HISTORY TIMELINE ──────────────────────────── */}
          {history.length > 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <SectionPill icon={<Clock size={12} color={colors.brandOrange} />} title="STATUS HISTORY" />
              <Card padding={0}>
                {history.map((entry, index) => {
                  const isLast = index === history.length - 1;
                  return (
                    <View
                      key={entry.history_id}
                      style={[
                        styles.historyRow,
                        { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={styles.timelineDotWrapper}>
                        <View style={[styles.timelineDot, { backgroundColor: isLast ? colors.brandOrange : colors.success }]} />
                        {!isLast ? <View style={[styles.timelineLine, { backgroundColor: colors.border }]} /> : null}
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <IncidentStatusBadge status={entry.status} size="sm" />
                        {entry.notes ? (
                          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 }}>
                            {entry.notes}
                          </Text>
                        ) : null}
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 3 }}>
                          {formatFullDate(entry.created_at)} · {formatTime(entry.created_at)}
                          {entry.changed_by_name ? ` · ${entry.changed_by_name}` : ''}
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
              latitude={incident.latitude}
              longitude={incident.longitude}
              originLat={originCoords?.lat}
              originLng={originCoords?.lng}
              originLabel={isNavigating || routeOrigin === 'gps' ? 'My Location' : 'Fire Station'}
              mapType={mapType}
              isNavigating={isNavigating}
              currentGPS={currentGPS}
              onNavigationComplete={handleNavComplete}
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
                onPress={closeFullscreen}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close map"
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

          {/* ── Floating BOTTOM controls: Apple Maps-style floating island card ── */}
          {isNavigating ? (
            <View style={[styles.fsNavControls, { paddingBottom: Platform.OS === 'ios' ? 36 : 22 }]}>
              <Pressable
                onPress={stopNavigation}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Stop Navigation"
                style={({ pressed }) => [
                  styles.fsStopBtn,
                  { opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <StopCircle size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginLeft: 8 }}>
                  Stop Navigation
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.fsControls,
                {
                  backgroundColor: isDark ? 'rgba(21, 26, 48, 0.96)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <View style={styles.fsControlsHeader}>
                <Text style={[styles.fsControlsHeaderTitle, { color: colors.textMuted }]}>SHOWING ROUTE TO INCIDENT</Text>
              </View>

              <View
                style={[
                  styles.fsOriginToggle,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                  },
                ]}
              >
                {([
                  { key: 'station', label: '🚒 From Fire Station' },
                  { key: 'gps',     label: '📍 From My Location' },
                ] as const).map((o) => {
                  const active = routeOrigin === o.key;
                  const disabled = o.key === 'gps' && !userLocation;
                  return (
                    <Pressable
                      key={o.key}
                      onPress={() => {
                        if (!disabled) {
                          Haptics.selectionAsync().catch(() => {});
                          setRouteOrigin(o.key);
                        }
                      }}
                      style={[
                        styles.fsOriginBtn,
                        {
                          backgroundColor: active ? colors.brandOrange : 'transparent',
                          opacity: disabled ? 0.35 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active
                            ? '#FFFFFF'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.7)'
                            : colors.textSecondary,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={openNavigation}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Start live navigation"
                style={({ pressed }) => [
                  styles.fsStartNavBtnFull,
                  {
                    backgroundColor: colors.brandOrange,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <PlayCircle size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginLeft: 8, letterSpacing: 0.3 }}>
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

  // Hero
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaStrip: { flexDirection: 'row', flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center' },

  // Section pill
  sectionPillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionPillLeft: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },

  // Edit pill
  editPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  infoRowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Reporter
  callButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12 },

  // Origin selector
  originRow: { flexDirection: 'row' },
  originCard: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  originIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  // Map preview card
  mapPreviewTouchTarget: {
    position: 'relative',
    overflow: 'hidden',
  },
  expandAffordanceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  expandAffordanceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Map footer
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewMapTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  timelineDotWrapper: { alignItems: 'center', width: 16, marginTop: 2 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },

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
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  fsControlsHeader: {
    alignItems: 'center',
    marginBottom: -2,
  },
  fsControlsHeaderTitle: {
    color: '#8992A6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fsNavControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 22,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fsStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(225, 66, 69, 0.94)',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#E14245',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fsOriginToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  fsOriginBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 18,
  },
  fsStartNavBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 50,
    shadowColor: '#F4622B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
});