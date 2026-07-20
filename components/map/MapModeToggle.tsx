import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle, Flame } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface MapModeToggleProps {
  mode: 'risk' | 'incidents';
  onChange: (mode: 'risk' | 'incidents') => void;
}

export const MapModeToggle: React.FC<MapModeToggleProps> = ({ mode, onChange }) => {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.brandNavy, borderRadius: radius.md, padding: 4 }]}>
      {(
        [
          { key: 'risk' as const, label: 'Risk Map', icon: AlertTriangle },
          { key: 'incidents' as const, label: 'Incidents', icon: Flame },
        ]
      ).map(({ key, label, icon: Icon }) => {
        const isActive = mode === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.brandOrange : 'transparent',
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Icon size={14} color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} />
            <Text
              style={{
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                fontSize: typography.size.xs,
                fontWeight: '700',
                marginLeft: 6,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});