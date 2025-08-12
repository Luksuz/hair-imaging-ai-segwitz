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
  confidenceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 20,
  },
  confidenceCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  strongDot: {
    background: 'linear-gradient(153.76deg, #41D590 16.51%, #079600 86.43%)',
  },
  mediumDot: {
    background: 'linear-gradient(153.76deg, #B7FFDD 16.51%, #6DA76A 86.43%)',
  },
  weakDot: {
    background: 'linear-gradient(153.76deg, #F06338 16.51%, #F06338 86.43%)',
  },
  confidenceTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  confidenceStats: {
    fontSize: 9,
  },
  statLine: {
    marginBottom: 3,
    flexDirection: 'row',
  },
  statLabel: {
    flex: 1,
    color: '#666',
  },
  statValue: {
    fontWeight: 'bold',
  },
});

interface ConfidenceStatsProps {
  confidenceStats: any;
  strongCount: number;
  mediumCount: number;
  weakCount: number;
}

export const ConfidenceStats: React.FC<ConfidenceStatsProps> = ({
  confidenceStats,
  strongCount,
  mediumCount,
  weakCount,
}) => {
  const strong = confidenceStats.strong || {};
  const medium = confidenceStats.medium || {};
  const weak = confidenceStats.weak || {};

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Detection Confidence Statistics</Text>
      <View style={styles.confidenceGrid}>
        <View style={styles.confidenceCard}>
          <View style={styles.confidenceHeader}>
            <View style={[styles.colorDot, styles.strongDot]} />
            <Text style={styles.confidenceTitle}>Strong Hair Follicles</Text>
          </View>
          <View style={styles.confidenceStats}>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Average:</Text>
              <Text style={styles.statValue}>{((strong.average || 0) * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Range:</Text>
              <Text style={styles.statValue}>
                {((strong.min || 0) * 100).toFixed(1)}% - {((strong.max || 0) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Count:</Text>
              <Text style={styles.statValue}>{strongCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.confidenceCard}>
          <View style={styles.confidenceHeader}>
            <View style={[styles.colorDot, styles.mediumDot]} />
            <Text style={styles.confidenceTitle}>Medium Hair Follicles</Text>
          </View>
          <View style={styles.confidenceStats}>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Average:</Text>
              <Text style={styles.statValue}>{((medium.average || 0) * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Range:</Text>
              <Text style={styles.statValue}>
                {((medium.min || 0) * 100).toFixed(1)}% - {((medium.max || 0) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Count:</Text>
              <Text style={styles.statValue}>{mediumCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.confidenceCard}>
          <View style={styles.confidenceHeader}>
            <View style={[styles.colorDot, styles.weakDot]} />
            <Text style={styles.confidenceTitle}>Weak Hair Follicles</Text>
          </View>
          <View style={styles.confidenceStats}>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Average:</Text>
              <Text style={styles.statValue}>{((weak.average || 0) * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Range:</Text>
              <Text style={styles.statValue}>
                {((weak.min || 0) * 100).toFixed(1)}% - {((weak.max || 0) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Count:</Text>
              <Text style={styles.statValue}>{weakCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
