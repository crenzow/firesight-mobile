import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import {
  Camera,
  Settings,
  Trash2,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { cctvService, ResidentCctv, SaveCctvPayload } from '../../services/api/cctvService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
const LANDSCAPE_WIDTH = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
const LANDSCAPE_HEIGHT = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);

export default function ResidentCctvScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, isDark } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cctv, setCctv] = useState<ResidentCctv | null>(null);

  // Config Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('My Home CCTV');
  const [cameraIp, setCameraIp] = useState('');
  const [rtspPort, setRtspPort] = useState('554');
  const [streamPath, setStreamPath] = useState('stream2');
  const [rtspUser, setRtspUser] = useState('');
  const [rtspPass, setRtspPass] = useState('');
  const [customRtspUrl, setCustomRtspUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Stream reload key
  const [streamKey, setStreamKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /** Load camera configuration */
  const loadCctv = useCallback(async () => {
    try {
      const res = await cctvService.get();
      if (res.has_camera && res.camera) {
        setCctv(res.camera);
        setName(res.camera.name || 'My Home CCTV');
        setCameraIp(res.camera.camera_ip || '');
        setRtspPort(String(res.camera.rtsp_port || 554));
        setStreamPath(res.camera.stream_path || 'stream2');
        setRtspUser(res.camera.rtsp_username || '');
        setCustomRtspUrl(res.camera.custom_rtsp_url || '');
        setUseCustomUrl(Boolean(res.camera.custom_rtsp_url));
        setNotificationsEnabled(res.camera.notifications_enabled);
      } else {
        setCctv(null);
      }
    } catch {
      // Offline / network glitch
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCctv();
  }, [loadCctv]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setStreamKey((k) => k + 1);
    loadCctv();
  };

  const handleOpenConfigModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!useCustomUrl && !cameraIp.trim()) {
      Alert.alert('Required Field', 'Please enter your camera IP address (e.g. 192.168.1.34).');
      return;
    }
    if (useCustomUrl && !customRtspUrl.trim()) {
      Alert.alert('Required Field', 'Please enter your custom RTSP stream URL.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: SaveCctvPayload = {
        name: name.trim() || 'My Home CCTV',
        notifications_enabled: notificationsEnabled,
      };

      if (useCustomUrl) {
        payload.custom_rtsp_url = customRtspUrl.trim();
        payload.camera_ip = undefined;
      } else {
        payload.camera_ip = cameraIp.trim();
        payload.rtsp_port = parseInt(rtspPort, 10) || 554;
        payload.stream_path = streamPath.trim() || 'stream2';
        payload.rtsp_username = rtspUser.trim() || undefined;
        if (rtspPass.trim()) {
          payload.rtsp_password = rtspPass.trim();
        }
        payload.custom_rtsp_url = undefined;
      }

      const res = await cctvService.save(payload);
      if (res.has_camera && res.camera) {
        setCctv(res.camera);
        setStreamKey((k) => k + 1);
        setIsModalOpen(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err: any) {
      Alert.alert('Unable to Save', err?.message || 'Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await cctvService.remove();
      setCctv(null);
      setShowDeleteModal(false);
      setIsModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Unable to Remove', 'Failed to remove camera. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  /** Return to prior screen (e.g. notifications, profile, or home) */
  const handleBack = useCallback(() => {
    if (from) {
      if (from.startsWith('/(resident)/')) {
        router.replace(from as any);
      } else if (from.startsWith('/')) {
        router.replace(`/(resident)${from}` as any);
      } else {
        router.replace(`/(resident)/${from}` as any);
      }
    } else {
      router.replace('/(resident)/profile');
    }
  }, [from]);

  /** Hardware / system back button listener */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isFullscreen) {
          setIsFullscreen(false);
          return true;
        }
        if (isModalOpen) {
          setIsModalOpen(false);
          return true;
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          return true;
        }
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack, isFullscreen, isModalOpen, showDeleteModal])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader
        title="CCTV Camera"
        onBack={handleBack}
        rightElement={
          cctv ? (
            <Pressable
              onPress={handleOpenConfigModal}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerActionBtn,
                {
                  backgroundColor: pressed ? colors.brandOrange : 'rgba(255, 255, 255, 0.12)',
                  borderColor: pressed ? colors.brandOrange : 'rgba(255, 255, 255, 0.2)',
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Camera Settings"
            >
              <Settings size={18} color={colors.textInverse} />
            </Pressable>
          ) : undefined
        }
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.brandOrange} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading camera feed...</Text>
          </View>
        ) : !cctv ? (
          /* Empty State — No Camera Configured */
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg }}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.brandOrange} />}
          >
            <Card padding={spacing.xl} style={{ alignItems: 'center', marginTop: spacing.md }}>
              <View style={[styles.iconChip, { backgroundColor: isDark ? 'rgba(238, 70, 70, 0.15)' : '#FEE2E2' }]}>
                <Camera size={34} color={colors.brandOrange} />
              </View>

              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Home Fire Monitoring CCTV
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Connect your home IP or security camera (RTSP) to monitor in real-time. FireSight's YOLO AI engine will detect flames and smoke, overlaying bounding boxes and sending you immediate push alerts.
              </Text>

              <Button
                label="Set Up My Camera"
                onPress={handleOpenConfigModal}
                icon={<Camera size={18} color="#FFFFFF" />}
                style={{ width: '100%', marginTop: spacing.sm }}
              />
            </Card>
          </ScrollView>
        ) : (
          /* Camera Configured — Live Video Stream (Previous State) */
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.brandOrange} />}
          >
            {/* Camera Header Card */}
            <Card padding={spacing.md} style={{ marginBottom: spacing.md }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={[styles.cameraName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {cctv.name}
                  </Text>
                </View>

                <View style={styles.statusPillsRow}>
                  <View style={[styles.livePill, { backgroundColor: '#EF4444' }]}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.livePillText}>LIVE FEED</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setStreamKey((k) => k + 1);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.7 : 1 }]}
                    accessibilityLabel="Reload Stream"
                  >
                    <RefreshCw size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* Embedded Video Stream (WebView for seamless MJPEG with Bounding Boxes) */}
              <View style={[styles.videoContainer, { borderColor: colors.border }]}>
                <WebView
                  key={streamKey}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body, html { width: 100%; height: 100%; background: #0b0f19; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                            img { width: 100%; height: 100%; object-fit: contain; }
                          </style>
                        </head>
                        <body>
                          <img src="${cctv.stream_url}" alt="Live Stream Feed" onerror="this.onerror=null; this.src='about:blank'; document.body.innerHTML='<div style=\\'color:#94a3b8; font-family:sans-serif; text-align:center; padding:24px; font-size:13px;\\'>Connecting to Camera Feed...<br><span style=\\'font-size:11px; color:#64748b;\\'>Ensure camera is powered on and stream service is running.</span></div>';" />
                        </body>
                      </html>
                    `,
                  }}
                  style={{ flex: 1, backgroundColor: '#0b0f19' }}
                  javaScriptEnabled
                  allowsInlineMediaPlayback
                  scrollEnabled={false}
                  originWhitelist={['*']}
                />

                {/* Floating Expand Overlay Button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setIsFullscreen(true);
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.videoExpandBtn,
                    { opacity: pressed ? 0.7 : 0.95 },
                  ]}
                  accessibilityLabel="Expand to Fullscreen"
                >
                  <Maximize2 size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            </Card>
          </ScrollView>
        )}

        {/* ── Fullscreen Video Stream Modal ── */}
        {cctv && (
          <Modal
            visible={isFullscreen}
            animationType="fade"
            statusBarTranslucent
            hardwareAccelerated
            onRequestClose={() => setIsFullscreen(false)}
          >
            <View style={styles.fullscreenLandscapeContainer}>
              <StatusBar hidden={isFullscreen} />
              <View
                style={[
                  styles.fullscreenRotatedBox,
                  { width: LANDSCAPE_WIDTH, height: LANDSCAPE_HEIGHT },
                ]}
              >
                <WebView
                  key={`fullscreen-${streamKey}`}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body, html { width: 100%; height: 100%; background: #000000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                            img { width: 100%; height: 100%; object-fit: contain; }
                          </style>
                        </head>
                        <body>
                          <img src="${cctv.stream_url}" alt="Live Stream Feed" />
                        </body>
                      </html>
                    `,
                  }}
                  style={{ flex: 1, backgroundColor: '#000000' }}
                  javaScriptEnabled
                  allowsInlineMediaPlayback
                  scrollEnabled={false}
                  originWhitelist={['*']}
                />

                {/* Floating Top Controls Overlay */}
                <SafeAreaView style={styles.fullscreenTopOverlay} edges={['top']}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setIsFullscreen(false);
                    }}
                    hitSlop={12}
                    style={({ pressed }) => [
                      styles.fullscreenIconBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    accessibilityLabel="Exit Fullscreen"
                  >
                    <Minimize2 size={20} color="#FFFFFF" />
                  </Pressable>

                  <View style={[styles.livePill, { backgroundColor: '#EF4444' }]}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.livePillText}>LIVE FEED</Text>
                  </View>

                  <Pressable
                    onPress={() => setStreamKey((k) => k + 1)}
                    hitSlop={12}
                    style={({ pressed }) => [
                      styles.fullscreenIconBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    accessibilityLabel="Reload Stream"
                  >
                    <RefreshCw size={18} color="#FFFFFF" />
                  </Pressable>
                </SafeAreaView>
              </View>
            </View>
          </Modal>
        )}

        {/* ── Camera Configuration / Edit Screen Modal ── */}
        <Modal
          visible={isModalOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Standard SecondaryHeader matching all other screens */}
            <SecondaryHeader
              title={cctv ? 'Edit CCTV Camera' : 'Configure CCTV Camera'}
              onBack={() => setIsModalOpen(false)}
            />

            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
              <ScrollView
                contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Input
                  label="Camera Name"
                  placeholder="e.g. Living Room Camera"
                  value={name}
                  onChangeText={setName}
                  required
                />

                <View style={styles.toggleRow}>
                  <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                    Use Full Custom RTSP URL
                  </Text>
                  <Switch
                    value={useCustomUrl}
                    onValueChange={setUseCustomUrl}
                    trackColor={{ false: colors.border, true: colors.brandOrange }}
                  />
                </View>

                {useCustomUrl ? (
                  <Input
                    label="Custom RTSP Stream URL"
                    placeholder="rtsp://user:pass@192.168.1.34:554/stream2"
                    value={customRtspUrl}
                    onChangeText={setCustomRtspUrl}
                    helperText="Full RTSP URL with credentials for your IP camera or NVR"
                    required
                  />
                ) : (
                  <>
                    <Input
                      label="Camera Local IP Address"
                      placeholder="192.168.1.34"
                      value={cameraIp}
                      onChangeText={setCameraIp}
                      keyboardType="numeric"
                      helperText="Ensure camera is on the same Wi-Fi / local network"
                      required
                    />

                    <View style={styles.twoColRow}>
                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Input
                          label="RTSP Port"
                          placeholder="554"
                          value={rtspPort}
                          onChangeText={setRtspPort}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Input
                          label="Stream Path"
                          placeholder="stream2"
                          value={streamPath}
                          onChangeText={setStreamPath}
                          helperText="Substream (e.g. stream2)"
                        />
                      </View>
                    </View>

                    <Input
                      label="Camera Username (Optional)"
                      placeholder="admin or camera user"
                      value={rtspUser}
                      onChangeText={setRtspUser}
                      autoCapitalize="none"
                    />

                    <PasswordInput
                      label="Camera Password (Optional)"
                      placeholder={cctv?.has_password ? '••••••••' : 'Enter camera password'}
                      value={rtspPass}
                      onChangeText={setRtspPass}
                      hideToggleWhenEmpty
                    />
                  </>
                )}

                <View style={{ marginTop: spacing.xl }}>
                  <Button
                    label={isSaving ? 'Connecting & Saving...' : 'Save Camera Configuration'}
                    onPress={handleSaveConfig}
                    loading={isSaving}
                    icon={<Camera size={18} color="#FFFFFF" />}
                  />

                  {cctv ? (
                    <Button
                      label="Remove Camera"
                      variant="outline"
                      onPress={() => setShowDeleteModal(true)}
                      icon={<Trash2 size={16} color={colors.danger} />}
                      style={{ borderColor: colors.danger, marginTop: spacing.md }}
                    />
                  ) : null}
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        {/* ── Confirmation Dialog for Delete ── */}
        <ConfirmationDialog
          visible={showDeleteModal}
          type="danger"
          title="Remove CCTV Camera"
          message="Are you sure you want to remove this camera? AI fire monitoring will be stopped."
          confirmText="Remove Camera"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={isDeleting}
          icon={<Trash2 size={26} color="#FFFFFF" strokeWidth={2.5} />}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  iconChip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
  },
  videoContainer: {
    width: '100%',
    height: 230,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#0b0f19',
    position: 'relative',
  },
  videoExpandBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullscreenLandscapeContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullscreenRotatedBox: {
    transform: [{ rotate: '90deg' }],
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fullscreenTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  fullscreenIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  twoColRow: {
    flexDirection: 'row',
  },
});


