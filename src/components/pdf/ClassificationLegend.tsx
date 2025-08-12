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
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  strong: {
    background: 'linear-gradient(153.76deg, #41D590 16.51%, #079600 86.43%)',
  },
  intermediate: {
    background: 'linear-gradient(153.76deg, #B7FFDD 16.51%, #6DA76A 86.43%)',
  },
  medium: {
    background: 'linear-gradient(153.76deg, #FFB800 16.51%, #FF6A00 86.43%)',
  },
  weak: {
    background: 'linear-gradient(153.76deg, #F06338 16.51%, #F06338 86.43%)',
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  legendDescription: {
    fontSize: 8,
    color: '#666',
  },
});

export const ClassificationLegend: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hair Classification Guide</Text>
      <View style={styles.legendGrid}>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, styles.strong]} />
          <View style={styles.legendText}>
            <Text style={styles.legendLabel}>&gt; 90 μm</Text>
            <Text style={styles.legendDescription}>Large Terminal Hair</Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, styles.intermediate]} />
          <View style={styles.legendText}>
            <Text style={styles.legendLabel}>60-90 μm</Text>
            <Text style={styles.legendDescription}>Intermediate Terminal Hair</Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, styles.medium]} />
          <View style={styles.legendText}>
            <Text style={styles.legendLabel}>30-60 μm</Text>
            <Text style={styles.legendDescription}>Small Terminal Hair</Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, styles.weak]} />
          <View style={styles.legendText}>
            <Text style={styles.legendLabel}>&lt; 30 μm</Text>
            <Text style={styles.legendDescription}>Vellus / Miniaturized Hair</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
