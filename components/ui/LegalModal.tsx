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
import { X, ShieldCheck, FileText, ArrowDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';

export type LegalDocType = 'terms' | 'privacy';
export type LegalModalMode = 'consent' | 'review';

export interface LegalModalProps {
  visible: boolean;
  type: LegalDocType;
  mode?: LegalModalMode;
  onClose: () => void;
  onReadComplete?: () => void;
  onDecline?: () => void;
  alreadyRead?: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  type,
  mode = 'consent',
  onClose,
  onReadComplete,
  onDecline,
  alreadyRead = false,
}) => {
  const { colors, spacing, typography } = useTheme();
  const isReview = mode === 'review';
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(isReview || alreadyRead);

  useEffect(() => {
    if (visible) {
      setHasScrolledToBottom(isReview || alreadyRead);
    }
  }, [visible, type, isReview, alreadyRead]);

  if (!visible) return null;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isReview) return;
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

  const handleDecline = () => {
    onDecline?.();
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
                <FileText size={22} color={colors.brandOrange} />
              ) : (
                <ShieldCheck size={22} color={colors.brandOrange} />
              )}
              <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            contentContainerStyle={[styles.content, { padding: spacing.lg }]}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Station Header Info */}
            <View style={[styles.metaHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metaStation, { color: colors.textPrimary }]}>
                Bureau of Fire Protection - Lian Fire Station
              </Text>
              <Text style={[styles.metaDate, { color: colors.textMuted }]}>
                Last updated: September 2026
              </Text>
            </View>

            {isTerms ? (
              <>
                <SectionItem number="1" title="Introduction and Scope of Service">
                  By creating an account or accessing FireSight, you agree to be bound by these Terms of Service. FireSight is an auxiliary municipal emergency dispatch and incident notification platform developed in coordination with the Bureau of Fire Protection (BFP) Lian Fire Station in Lian, Batangas.
                </SectionItem>

                <SectionItem number="2" title="Emergency Disclaimer and Direct Hotline Notice">
                  FireSight is designed to complement, not replace, primary emergency telephone channels. In the event of mobile network failures, cellular data congestion, or immediate life-threatening danger, residents must not rely solely on the application and are advised to contact the BFP Lian Fire Station emergency hotlines directly at (043) 703-1282 or 0915-602-2370.
                </SectionItem>

                <SectionItem number="3" title="Truthful Incident Reporting and False Alarm Penalties">
                  Users agree that every emergency fire report, uploaded media file, and geotagged coordinate represents an authentic, observed incident. Filing intentional false alarms, fabricated incident reports, or prank emergency filings is strictly prohibited and constitutes a criminal offense punishable under Republic Act No. 9514 (Fire Code of the Philippines), Presidential Decree No. 1727, and Article 154 of the Revised Penal Code by severe statutory fines and imprisonment.
                </SectionItem>

                <SectionItem number="4" title="User Account and Profile Integrity">
                  Residents must provide accurate, verified personal details during registration, including full legal name, Philippine mobile number, and registered Lian barangay address. Providing fictitious identities or lending account credentials to unauthorized parties is prohibited and subject to account deactivation.
                </SectionItem>

                <SectionItem number="5" title="Incident Media and Evidence Submissions">
                  All photographs uploaded during incident reporting must directly capture the fire hazard or emergency scene. Uploading copyrighted, irrelevant, defamatory, or tampered images is strictly prohibited and may be referred to law enforcement authorities.
                </SectionItem>

                <SectionItem number="6" title="Auxiliary Dispatch and Station Operational Disclaimers">
                  While FireSight provides instant dispatch transmission to Lian Fire Station, actual response and arrival times remain subject to weather conditions, road accessibility, traffic, and available firefighting units during simultaneous emergency operations in the municipality.
                </SectionItem>

                <SectionItem number="7" title="Account Termination and Modification of Terms">
                  The Bureau of Fire Protection Lian Fire Station reserves the right to suspend or deactivate accounts found misusing emergency channels or violating these terms. The station reserves the right to amend these guidelines to maintain community safety.
                </SectionItem>
              </>
            ) : (
              <>
                <SectionItem number="1" title="Personal Information Controller (PIC)">
                  The Bureau of Fire Protection (BFP) Lian Fire Station is designated as the Personal Information Controller (PIC) under Republic Act No. 10173 (Data Privacy Act of 2012). This policy governs the lawful collection, processing, and protection of resident personal data across the FireSight platform.
                </SectionItem>

                <SectionItem number="2" title="Information We Collect">
                  We collect only the personal information required to manage your account and verify emergency fire reports, specifically: (a) your account details, including your full legal name, Philippine mobile number, and email address, (b) your residential address within Lian, Batangas, (c) fire incident details you submit, including the fire location, your device GPS coordinates and accuracy at the time of reporting, optional written description, and the uploaded fire incident photo, and (d) your mobile device type and operating system version recorded with your login session to maintain account security.
                </SectionItem>

                <SectionItem number="3" title="Purpose of Data Processing">
                  Your information is used strictly for municipal fire safety and emergency response purposes: (a) verifying the identity and contact number of the reporter during an incident, (b) dispatching BFP Lian Fire Station firefighters and fire trucks to the exact verified location, (c) delivering in-app status updates on your submitted reports, and (d) preserving official fire incident records for municipal safety archives.
                </SectionItem>

                <SectionItem number="4" title="Data Sharing and Access">
                  Personal data is never sold, rented, or shared with commercial entities. Your information is accessed solely by authorized BFP Lian Fire Station duty personnel to respond to emergencies and manage station operations.
                </SectionItem>

                <SectionItem number="5" title="Data Security and Storage">
                  Your information is stored securely on servers accessed only by authenticated station personnel. Password credentials are protected using industry-standard cryptographic hashing and cannot be read in plaintext.
                </SectionItem>

                <SectionItem number="6" title="Data Retention and 30-Day Deletion Grace Period">
                  Residents may request account deletion at any time in Profile Settings. Once requested, your account is deactivated immediately and held for a 30-day grace period, allowing you to reactivate simply by signing back in. On the 31st day, your personal profile data is permanently deleted. To comply with public safety records, past submitted fire incident reports remain archived with personal identifiers removed.
                </SectionItem>

                <SectionItem number="7" title="Resident Privacy Rights and Station Contact">
                  Under Republic Act No. 10173, you have the right to access, review, and update your personal information directly within your Profile settings. For privacy inquiries, residents may contact the Bureau of Fire Protection Lian Fire Station located on J.P. Rizal St., Lian, Batangas.
                </SectionItem>
              </>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.border, padding: spacing.md }]}>
            {isReview ? (
              <Button
                label="Close"
                onPress={onClose}
              />
            ) : hasScrolledToBottom ? (
              <View style={styles.actionRow}>
                <View style={styles.declineCol}>
                  <Button
                    label="Decline"
                    variant="outline"
                    onPress={handleDecline}
                  />
                </View>
                <View style={styles.acceptCol}>
                  <Button
                    label="I Have Read & Agree"
                    onPress={handleAccept}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.disabledContainer}>
                <View style={[styles.scrollHintRow, { marginBottom: spacing.xs }]}>
                  <ArrowDown size={14} color={colors.brandOrange} />
                  <Text style={[styles.scrollHintText, { color: colors.brandOrange }]}>
                    Scroll to the bottom of the document to accept
                  </Text>
                </View>
                <View style={styles.actionRow}>
                  <View style={styles.declineCol}>
                    <Button
                      label="Decline"
                      variant="outline"
                      onPress={handleDecline}
                    />
                  </View>
                  <View style={styles.acceptCol}>
                    <Button
                      label="Scroll Down to End"
                      disabled
                      variant="outline"
                      onPress={() => {}}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const SectionItem: React.FC<{
  number: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.size.md,
          fontWeight: '700',
          marginBottom: 8,
          lineHeight: 22,
        }}
      >
        {number}. {title}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.size.base,
          lineHeight: 22,
        }}
      >
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
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 28,
  },
  metaHeader: {
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  metaStation: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaDate: {
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  declineCol: {
    flex: 1,
  },
  acceptCol: {
    flex: 1.5,
  },
});
