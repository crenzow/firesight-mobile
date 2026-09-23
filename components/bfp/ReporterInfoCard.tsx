import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { User, Phone } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from '../glass/GlassCard';

interface ReporterInfoCardProps {
  reporterName: string | null;
  contactNumber: string | null;
}

export const ReporterInfoCard: React.FC<ReporterInfoCardProps> = ({ reporterName, contactNumber }) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <GlassCard>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.brandNavy}14` }]}>
          <User size={18} color={colors.brandNavy} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700' }}>
            REPORTED BY
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700', marginTop: 2 }}>
            {reporterName ?? 'Unknown'}
          </Text>
          {contactNumber ? (
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 1 }}>
              {contactNumber}
            </Text>
          ) : null}
        </View>
        {contactNumber ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${contactNumber}`)}
            style={[styles.callButton, { backgroundColor: colors.success, borderRadius: radius.full }]}
          >
            <Phone size={16} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  callButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});