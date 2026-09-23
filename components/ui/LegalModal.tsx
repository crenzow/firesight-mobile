import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ShieldCheck, FileText, CheckCircle2, ArrowDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';

export type LegalDocType = 'terms' | 'privacy';

export interface LegalModalProps {
  visible: boolean;
  type: LegalDocType;
  onClose: () => void;
  onReadComplete?: () => void;
  alreadyRead?: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  type,
  onClose,
  onReadComplete,
  alreadyRead = false,
}) => {
  const { colors, spacing, typography } = useTheme();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(alreadyRead);

  useEffect(() => {
    if (visible) {
      setHasScrolledToBottom(alreadyRead);
    }
  }, [visible, type, alreadyRead]);

  if (!visible) return null;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if scrolled near bottom (30px threshold)
    const isEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 30;
    if (isEnd && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    onReadComplete?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              {isTerms ? (
                <FileText size={20} color={colors.brandOrange} />
              ) : (
                <ShieldCheck size={20} color={colors.brandOrange} />
              )}
              <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            contentContainerStyle={[styles.content, { padding: spacing.lg }]}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {isTerms ? (
              <>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.size.xs }]}>
                  LAST UPDATED: SEPTEMBER 2026 · FIRESIGHT SYSTEM
                </Text>

                <Section title="1. Acceptance of Terms">
                  By registering an account on FireSight, you agree to comply with all municipal fire safety regulations, emergency response procedures, and system policies enforced by the Bureau of Fire Protection (BFP).
                </Section>

                <Section title="2. Emergency & Incident Reporting">
                  FireSight is an emergency and safety management platform. Users are required to submit accurate and truthful information when filing incident reports. Intentional false reporting or hoax alarms is strictly prohibited under Philippine laws and local municipal ordinances.
                </Section>

                <Section title="3. User Responsibilities & Verification">
                  Residents must ensure their profile information—including full name, contact number, and barangay address—is accurate. Account credentials must remain confidential to prevent unauthorized reporting.
                </Section>

                <Section title="4. System Availability & Emergency Dispatch">
                  While FireSight strives for 24/7 reliability, emergency dispatch operations remain subject to cellular network availability, GPS accuracy, and station operational capacity.
                </Section>

                <Section title="5. Code of Conduct">
                  Users agree not to misuse emergency channels, upload inappropriate media, or tamper with system features. Violation of these terms may result in account suspension and law enforcement referral.
                </Section>

                <Section title="6. Amendments & Modifications">
                  FIRESIGHT reserves the right to update or modify these Terms of Service at any time. Continued usage of the application constitutes acceptance of updated terms.
                </Section>
              </>
            ) : (
              <>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.size.xs }]}>
                  LAST UPDATED: SEPTEMBER 2026 · FIRESIGHT SYSTEM
                </Text>

                <Section title="1. Information We Collect">
                  We collect personal identity data required for emergency verification and dispatch, including your full name, mobile number, barangay address, profile image, and real-time GPS location when filing a report.
                </Section>

                <Section title="2. How Information is Used">
                  Your data is strictly utilized to dispatch BFP emergency personnel, verify resident identities during incidents, send localized fire safety alerts, and improve municipal fire response times.
                </Section>

                <Section title="3. Data Security & Storage">
                  FireSight implements end-to-end transport encryption and secure server storage to protect your personal information against unauthorized access, disclosure, or alteration.
                </Section>

                <Section title="4. Information Sharing & Legal Compliance">
                  We do not sell, rent, or trade your personal data. Data is shared exclusively with authorized BFP personnel, emergency first responders, and municipal safety administrators for emergency operations.
                </Section>

                <Section title="5. Your Privacy Rights">
                  You have the right to inspect, update, or correct your personal profile information at any time via the Profile Settings section in the application.
                </Section>

                <Section title="6. Consent & Revocation">
                  By creating an account, you consent to the collection and processing of your information for emergency response purposes in accordance with the Data Privacy Act of 2012.
                </Section>
              </>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.border, padding: spacing.md }]}>
            {hasScrolledToBottom ? (
              <Button
                label="I Have Read & Agree"
                onPress={handleAccept}
                icon={<CheckCircle2 size={18} color="#FFFFFF" />}
              />
            ) : (
              <View style={styles.disabledContainer}>
                <View style={[styles.scrollHintRow, { marginBottom: spacing.xs }]}>
                  <ArrowDown size={14} color={colors.brandOrange} />
                  <Text style={[styles.scrollHintText, { color: colors.brandOrange }]}>
                    Scroll to the bottom of the document to accept
                  </Text>
                </View>
                <Button
                  label="Scroll Down to End"
                  disabled
                  variant="outline"
                  onPress={() => {}}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  subtitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  footer: {
    borderTopWidth: 1,
  },
  disabledContainer: {
    width: '100%',
  },
  scrollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scrollHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
