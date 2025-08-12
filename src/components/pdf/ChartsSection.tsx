import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a3c5e',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#1a3c5e',
    paddingBottom: 2,
    marginBottom: 10,
  },
  chartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  barChart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  bar: {
    width: 30,
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 10,
  },
  strongBar: {
    background: 'linear-gradient(153.76deg, #41D590 16.51%, #079600 86.43%)',
  },
  mediumBar: {
    background: 'linear-gradient(153.76deg, #B7FFDD 16.51%, #6DA76A 86.43%)',
  },
  weakBar: {
    background: 'linear-gradient(153.76deg, #F06338 16.51%, #F06338 86.43%)',
  },
  barValue: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  barLabel: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 2,
  },
  totalText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

interface ChartsSectionProps {
  strongCount: number;
  mediumCount: number;
  weakCount: number;
  totalCount: number;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  strongCount,
  mediumCount,
  weakCount,
  totalCount,
}) => {
  // Calculate bar heights (max 100 points for the available space)
  const maxCount = Math.max(strongCount, mediumCount, weakCount) || 1;
  const strongHeight = Math.max((strongCount / maxCount) * 100, 10);
  const mediumHeight = Math.max((mediumCount / maxCount) * 100, 10);
  const weakHeight = Math.max((weakCount / maxCount) * 100, 10);

  // Calculate estimated widths (placeholder logic)
  const strongWidth = strongCount * 85; // Assume ~85μm average for strong
  const mediumWidth = mediumCount * 45; // Assume ~45μm average for medium
  const weakWidth = weakCount * 20;     // Assume ~20μm average for weak
  const totalWidth = strongWidth + mediumWidth + weakWidth;

  const maxWidth = Math.max(strongWidth, mediumWidth, weakWidth) || 1;
  const strongWidthHeight = Math.max((strongWidth / maxWidth) * 100, 10);
  const mediumWidthHeight = Math.max((mediumWidth / maxWidth) * 100, 10);
  const weakWidthHeight = Math.max((weakWidth / maxWidth) * 100, 10);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distribution Analysis</Text>
      <View style={styles.chartsContainer}>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Hair Count per cm²</Text>
          <View style={styles.barChart}>
            <View style={styles.bar}>
              <View style={[styles.barFill, styles.strongBar, { height: strongHeight }]}>
                <Text style={styles.barValue}>{strongCount}</Text>
              </View>
              <Text style={styles.barLabel}>Strong</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, styles.mediumBar, { height: mediumHeight }]}>
                <Text style={styles.barValue}>{mediumCount}</Text>
              </View>
              <Text style={styles.barLabel}>Medium</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, styles.weakBar, { height: weakHeight }]}>
                <Text style={styles.barValue}>{weakCount}</Text>
              </View>
              <Text style={styles.barLabel}>Weak</Text>
            </View>
          </View>
          <Text style={styles.totalText}>Total: {totalCount}</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sum of Hair Width per cm²</Text>
          <View style={styles.barChart}>
            <View style={styles.bar}>
              <View style={[styles.barFill, styles.strongBar, { height: strongWidthHeight }]}>
                <Text style={styles.barValue}>{strongWidth}</Text>
              </View>
              <Text style={styles.barLabel}>Strong</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, styles.mediumBar, { height: mediumWidthHeight }]}>
                <Text style={styles.barValue}>{mediumWidth}</Text>
              </View>
              <Text style={styles.barLabel}>Medium</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, styles.weakBar, { height: weakWidthHeight }]}>
                <Text style={styles.barValue}>{weakWidth}</Text>
              </View>
              <Text style={styles.barLabel}>Weak</Text>
            </View>
          </View>
          <Text style={styles.totalText}>Total: {totalWidth} μm</Text>
        </View>
      </View>
    </View>
  );
};
