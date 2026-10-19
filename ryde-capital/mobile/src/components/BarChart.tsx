import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../theme/tokens';

export interface BarDataPoint {
  label: string;
  value: number;
  isCurrent?: boolean;
}

export interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  style?: ViewStyle;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 140,
  style,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 100);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((item, index) => {
          const barHeight = Math.max(16, (item.value / maxValue) * (height - 20));
          return (
            <View key={index} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: item.isCurrent ? colors.amber : colors.darkTeal,
                  },
                ]}
              />
              <Text style={styles.dayLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 38,
    borderRadius: 12,
  },
  dayLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BarChart;
