// src/components/CustomDots.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CustomDotsProps {
  selected: boolean;
}

const CustomDots: React.FC<CustomDotsProps> = ({ selected }) => {
  return (
    <View
      style={[
        styles.dot,
        selected ? styles.selectedDot : styles.unselectedDot,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  selectedDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  unselectedDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default CustomDots;