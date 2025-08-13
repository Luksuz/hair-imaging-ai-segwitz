import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#111827',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  statTitle: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statValueAccent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16A34A',
  },
});

interface TopInfoProps {
  reportDate: string;
  totalDetections: number;
  successRate: number; // 0-100
  imageWidth?: number;
  imageHeight?: number;
}

export const TopInfo: React.FC<TopInfoProps> = ({
  reportDate,
  totalDetections,
  successRate,
  imageWidth,
  imageHeight,
}) => {
  const resolution = imageWidth && imageHeight ? `${imageWidth} × ${imageHeight} pixels` : 'Unknown';
  const imageSizePixels = imageWidth && imageHeight ? `${imageWidth * imageHeight} pixels` : 'Unknown';

  return (
    <View style={styles.container}>
      {/* Information card with two columns */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Report Date:</Text>
            <Text style={styles.value}>{reportDate}</Text>
            <Text style={styles.label}>Analysis Type:</Text>
            <Text style={styles.value}>Hair Follicle Segmentation & Triangle Detection</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Image Resolution:</Text>
            <Text style={styles.value}>{resolution}</Text>
            <Text style={styles.label}>Image Size:</Text>
            <Text style={styles.value}>{imageSizePixels}</Text>
          </View>
        </View>
      </View>

      {/* Two stat cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total Detections</Text>
          <Text style={styles.statValue}>{totalDetections}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Analysis Success Rate</Text>
          <Text style={styles.statValueAccent}>{successRate.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
};


