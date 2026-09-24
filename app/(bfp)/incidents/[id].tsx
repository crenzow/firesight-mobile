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
} from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { GlassHeader } from '../../../components/glass/GlassHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SelectField } from '../../../components/ui/SelectField';
import { IncidentStatusBadge } from '../../../components/bfp/IncidentStatusBadge';
import { SeverityBadge, SeverityLevel } from '../../../components/bfp/SeverityBadge';
import { StatusStepper } from '../../../components/bfp/StatusStepper';
import { EvidenceGallery } from '../../../components/bfp/EvidenceGallery';
import { IncidentLocationMap, MapType, GPSUpdate } from '../../../components/bfp/IncidentLocationMap';
import { incidentService } from '../../../services/api/incidentService';
import { BFPIncident, BFPIncidentStatusHistoryEntry, IncidentType } from '../../../services/api/bfpModels';
import { BFPIncidentStatus } from '../../../components/bfp/IncidentStatusBadge';
import { formatFullDate, formatTime } from '../../../utils/formatters';
import { FIRE_STATION } from '../../../constants/fireStation';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';

const SEVERITY_OPTIONS: SeverityLevel[] = ['low', 'moderate', 'high', 'critical'];
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

// ─── Map Type Selector ────────────────────────────────────────────────────────
const MAP_TYPE_OPTIONS: { key: MapType; label: string; icon: React.ReactNode }[] = [
  { key: 'road',      label: 'Road',      icon: null },
  { key: 'satellite', label: 'Satellite', icon: null },
];

const MapTypeSelector: React.FC<{ value: MapType; onChange: (t: MapType) => void }> = ({ value, onChange }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.mapTypePill}>
      {MAP_TYPE_OPTIONS.map((opt, i) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.mapTypeBtn,
              i === 0 && { borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
              i === MAP_TYPE_OPTIONS.length - 1 && { borderTopRightRadius: 20, borderBottomRightRadius: 20 },
              { backgroundColor: active ? colors.brandOrange : 'rgba(15,28,63,0.75)' },
            ]}
          >
            <Text style={{ color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '700' }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

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
      title: 'Fire Station',
      sub: 'BFP Lian Batangas',
    },
    {
      key: 'gps',
      icon: <Crosshair size={18} color={value === 'gps' ? colors.brandOrange : colors.textMuted} />,
      title: 'My Location',
      sub: gpsAvailable ? 'Using device GPS' : 'GPS unavailable',
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
            onPress={() => !disabled && onChange(opt.key)}
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
  const { colors, spacing, typography, radius } = useTheme();
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
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);

  // Route / Map state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<RouteOrigin>('station');
  const [mapType, setMapType] = useState<MapType>('road');
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
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 5,
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

  const openNavigation = () => {
    setIsMapFullscreen(true);
    setIsNavigating(true);
  };
  const stopNavigation = () => setIsNavigating(false);
  const closeFullscreen = () => {
    setIsMapFullscreen(false);
    setIsNavigating(false);
  };
  const handleNavComplete = () => {
    Alert.alert('Arrived! 🏁', 'You have reached the incident location.');
    setIsNavigating(false);
  };

  // Request GPS once
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
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
        setSeverity(detail.severity_level ?? null);
        setIncidentType(detail.incident_type ?? null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [reportId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let isMounted = true;
    if (incident?.latitude && incident?.longitude) {
      import('../../../utils/geocoding').then(({ reverseGeocode }) => {
        reverseGeocode(incident.latitude, incident.longitude).then((name) => {
          if (isMounted) {
            setLocationName(name !== 'Unknown area' ? name : (incident.barangay_name ?? 'Unknown location'));
          }
        });
      });
    } else if (incident) {
      setLocationName(incident.barangay_name ?? 'Unknown location');
    }
    return () => { isMounted = false; };
  }, [incident?.latitude, incident?.longitude, incident?.barangay_name]);

  // Derived: current routing origin coordinates
  const originCoords = routeOrigin === 'station'
    ? { lat: FIRE_STATION.latitude, lng: FIRE_STATION.longitude }
    : userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : null;

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
    if (!incidentType || !severity) {
      Alert.alert('Missing incident details', 'Please select the incident type and severity level before saving.');
      return;
    }
    setIsActing(true);
    try {
      const updated = await incidentService.updateDetails(reportId, {
        incident_type: incidentType,
        cause_of_fire: causeOfFire || undefined,
        casualties: Number(casualties) || 0,
        notes: notes || undefined,
        severity_level: severity,
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
        <GlassHeader title="Incident" showBack onBack={() => router.replace(backRoute as any)} />
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
      <GlassHeader
        title={`Report #${incident.report_id}`}
        subtitle={locationName}
        showBack
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
            {incident.severity_level ? <SeverityBadge severity={incident.severity_level} /> : null}
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
                <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>{formatFullDate(incident.created_at)}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg }}>

          {/* ── EVIDENCE GALLERY ─────────────────────────────────── */}
          <View style={{ marginTop: spacing.md }}>
            <SectionPill icon={<Flame size={12} color={colors.brandOrange} />} title="EVIDENCE" />
            <Card>
              <EvidenceGallery
                mainPhoto={incident.report_image}
                evidencePhotos={incident.evidence_photos ?? []}
                onAddEvidence={handleAddEvidence}
                canAdd={incident.status === 'resolved'}
              />
            </Card>
          </View>

          {/* ── REPORTER INFORMATION ─────────────────────────────── */}
          <View style={{ marginTop: spacing.xl }}>
            <SectionPill icon={<User size={12} color={colors.brandOrange} />} title="REPORTER INFORMATION" />
            <Card padding={0}>
              <InfoRow icon={<User size={16} color={colors.brandNavy} />} label="Reported By" value={incident.reporter_name ?? 'Unknown'} />
              <InfoRow
                icon={<Phone size={16} color={colors.brandNavy} />}
                label="Contact Number"
                value={incident.contact_number || 'No contact provided'}
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
                  <View style={{ height: 200 }}>
                    <IncidentLocationMap
                      latitude={incident.latitude}
                      longitude={incident.longitude}
                      originLat={originCoords?.lat}
                      originLng={originCoords?.lng}
                      originLabel={routeOrigin === 'station' ? 'Fire Station' : 'My Location'}
                      mapType={mapType}
                    />
                  </View>

                  {/* Map footer: type switcher + fullscreen */}
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
                    {/* Type tabs */}
                    <View style={[styles.mapTypeInlineRow, { backgroundColor: colors.background, borderRadius: radius.full }]}>
                      {(['road', 'satellite'] as MapType[]).map((t) => {
                        const active = t === mapType;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => setMapType(t)}
                            style={[
                              styles.mapTypeInlineBtn,
                              {
                                backgroundColor: active ? colors.brandOrange : 'transparent',
                                borderRadius: radius.full,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: active ? '#FFFFFF' : colors.textMuted,
                                textTransform: 'capitalize',
                              }}
                            >
                              {t}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Map view button */}
                    <Pressable
                      onPress={() => setIsMapFullscreen(true)}
                      style={[styles.fullscreenTrigger, { backgroundColor: `${colors.brandNavy}12` }]}
                    >
                      <Maximize2 size={14} color={colors.textSecondary} />
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginLeft: 5 }}>
                        Expand
                      </Text>
                    </Pressable>
                  </View>

                  {/* Navigate CTA */}
                  <Pressable
                    onPress={openNavigation}
                    style={[styles.navigateBtn, { backgroundColor: colors.brandOrange }]}
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
                  label="Incident Type"
                  value={incidentType}
                  options={INCIDENT_TYPE_OPTIONS}
                  onSelect={(value) => setIncidentType(value as IncidentType)}
                  placeholder="Select incident type"
                />

                <FieldLabel text="SEVERITY" />
                <View style={styles.severityOptionsRow}>
                  {SEVERITY_OPTIONS.map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setSeverity(level)}
                      style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
                    >
                      <View style={{ opacity: severity === level ? 1 : 0.35 }}>
                        <SeverityBadge severity={level} />
                      </View>
                    </Pressable>
                  ))}
                </View>

                <FieldLabel text="CAUSE OF FIRE" />
                <TextInput
                  value={causeOfFire}
                  onChangeText={setCauseOfFire}
                  placeholder="e.g. Faulty electrical wiring"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background }]}
                />

                <FieldLabel text="CASUALTIES" />
                <TextInput
                  value={casualties}
                  onChangeText={setCasualties}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background }]}
                />

                <FieldLabel text="NOTES" />
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional findings, remarks…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background, minHeight: 80, textAlignVertical: 'top' }]}
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
        <View style={{ flex: 1, backgroundColor: '#080E28' }}>

          {/* Full-bleed map */}
          <View style={{ flex: 1 }}>
            <IncidentLocationMap
              latitude={incident.latitude}
              longitude={incident.longitude}
              originLat={originCoords?.lat}
              originLng={originCoords?.lng}
              originLabel={routeOrigin === 'station' ? 'Fire Station' : 'My Location'}
              mapType={mapType}
              isNavigating={isNavigating}
              currentGPS={currentGPS}
              onNavigationComplete={handleNavComplete}
            />
          </View>

          {/* ── Floating TOP bar: always visible ── */}
          <View style={[styles.fsHeader, { paddingTop: Platform.OS === 'ios' ? 52 : 32 }]}>
            <View style={styles.fsHeaderLeft}>
              <View style={[
                styles.fsIconBadge,
                { backgroundColor: isNavigating ? colors.brandOrange : 'rgba(255,255,255,0.12)' },
              ]}>
                <Navigation2 size={14} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.fsTitle}>
                  {isNavigating ? 'Navigating…' : 'Route to Incident'}
                </Text>
                <Text style={styles.fsSub}>
                  {routeOrigin === 'station' ? FIRE_STATION.name : 'My Location'} → #{incident.report_id}
                </Text>
              </View>
            </View>
            <Pressable onPress={closeFullscreen} style={styles.fsCloseBtn}>
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* ── Floating BOTTOM controls ── */}
          {isNavigating ? (
            <View style={[styles.fsNavControls, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}>
              <Pressable
                onPress={stopNavigation}
                style={styles.fsStopBtn}
              >
                <StopCircle size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginLeft: 8 }}>
                  Stop Navigation
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.fsControls, { paddingBottom: Platform.OS === 'ios' ? 36 : 20 }]}>
              <View style={[styles.fsOriginToggle, { backgroundColor: 'rgba(8,14,40,0.88)' }]}>
                {(['station', 'gps'] as RouteOrigin[]).map((o) => {
                  const active = routeOrigin === o;
                  const disabled = o === 'gps' && !userLocation;
                  const label = o === 'station' ? '🚒 Fire Station' : '📍 My Location';
                  return (
                    <Pressable
                      key={o}
                      onPress={() => !disabled && setRouteOrigin(o)}
                      style={[
                        styles.fsOriginBtn,
                        { backgroundColor: active ? colors.brandOrange : 'transparent', opacity: disabled ? 0.35 : 1 },
                      ]}
                    >
                      <Text style={{ color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700' }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.fsBottomRow}>
                <MapTypeSelector value={mapType} onChange={setMapType} />
                <Pressable
                  onPress={openNavigation}
                  style={[styles.fsStartNavBtn, { backgroundColor: colors.brandOrange }]}
                >
                  <PlayCircle size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>
                    Navigate
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

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

  // Map footer
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
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
  severityOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  input: { borderWidth: 1.5, padding: 10, fontSize: 14, marginBottom: 4 },

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,15,35,0.82)',
  },
  fsHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  fsIconBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fsTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  fsSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
  fsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
    backgroundColor: 'rgba(8,14,40,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  fsNavControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(8,14,40,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  fsStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(225,66,69,0.85)',
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fsOriginToggle: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    alignSelf: 'center',
  },
  fsOriginBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  fsStartNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
  },

  // Floating map type pill (fullscreen)
  mapTypePill: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapTypeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
});