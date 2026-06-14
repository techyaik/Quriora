import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MenuIconProps {
  color?: string;
  size?: number;
}

export const MenuIcon: React.FC<MenuIconProps> = ({ color = '#FFFFFF', size = 24 }) => {
  // We scale the widths of the lines proportionally based on size.
  // Standard size is 24, which maps to line widths: 20, 14, 8.
  const scale = size / 24;
  const lineWidths = [20 * scale, 14 * scale, 8 * scale];
  const lineHeight = 2.2 * scale;
  const spacing = 4.5 * scale;

  return (
    <View style={[styles.container, { width: size, height: size - 4 }]}>
      <View style={[styles.line, { width: lineWidths[0], height: lineHeight, backgroundColor: color }]} />
      <View style={[styles.line, { width: lineWidths[1], height: lineHeight, backgroundColor: color, marginVertical: spacing }]} />
      <View style={[styles.line, { width: lineWidths[2], height: lineHeight, backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  line: {
    borderRadius: 1.5,
  },
});
