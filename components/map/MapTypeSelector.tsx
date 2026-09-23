import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Layers, Globe } from 'lucide-react-native';

export type MapType = 'standard' | 'satellite';

interface Props {
  mapType: MapType;
  onChange: (type: MapType) => void;
}

const ITEMS: { key: MapType; label: string; Icon: typeof Layers }[] = [
  { key: 'standard', label: 'Default', Icon: Layers },
  { key: 'satellite', label: 'Satellite', Icon: Globe },
];

export function MapTypeSelector({ mapType, onChange }: Props) {
  const { colors, shadow } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, shadow.card]}>
      {ITEMS.map((item, index) => {
        const isActive = mapType === item.key;
        return (
          <React.Fragment key={item.key}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <Pressable
              onPress={() => onChange(item.key)}
              style={[
                styles.btn,
                isActive && { backgroundColor: `${colors.brandOrange}12` },
              ]}
            >
              <item.Icon
                size={18}
                color={isActive ? colors.brandOrange : colors.textMuted}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? colors.brandOrange : colors.textMuted },
                  isActive && styles.labelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
  },
  btn: {
    width: 60,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '700',
  },
});
