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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4542',
    textAlign: 'center',
  },
});

interface MainStatsProps {
  totalCount: number;
  successfulTriangles: number;
  successRate: number;
  avgConfidence: number;
}

export const MainStats: React.FC<MainStatsProps> = ({
  totalCount,
  successfulTriangles,
  successRate,
  avgConfidence,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Analysis Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Hair Follicles</Text>
          <Text style={styles.statValue}>{totalCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Successful Triangles</Text>
          <Text style={styles.statValue}>{successfulTriangles}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Success Rate</Text>
          <Text style={styles.statValue}>{successRate.toFixed(1)}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Confidence</Text>
          <Text style={styles.statValue}>{avgConfidence.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
};
