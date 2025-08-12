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
  analysisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
  },
  panel: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressItem: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 9,
    color: '#666',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF4542',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  strongProgress: {
    background: 'linear-gradient(153.76deg, #41D590 16.51%, #079600 86.43%)',
  },
  mediumProgress: {
    background: 'linear-gradient(153.76deg, #B7FFDD 16.51%, #6DA76A 86.43%)',
  },
  weakProgress: {
    background: 'linear-gradient(153.76deg, #F06338 16.51%, #F06338 86.43%)',
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#ddd',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4542',
  },
  metricsTable: {
    width: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#ddd',
  },
  metricLabel: {
    fontSize: 9,
    color: '#666',
  },
  metricValue: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

interface AnalysisSectionProps {
  strongCount: number;
  mediumCount: number;
  weakCount: number;
  strongPercentage: number;
  mediumPercentage: number;
  weakPercentage: number;
  totalCount: number;
  successRate: number;
  ratios: any;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  strongCount,
  mediumCount,
  weakCount,
  strongPercentage,
  mediumPercentage,
  weakPercentage,
  totalCount,
  successRate,
  ratios,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hair Follicle Count by Strength</Text>
      <View style={styles.analysisContainer}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Hair Count Distribution</Text>
          
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Strong Hair Follicles</Text>
              <Text style={styles.progressValue}>{strongCount}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, styles.strongProgress, { width: `${strongPercentage}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{strongPercentage.toFixed(1)}% of total</Text>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Medium Hair Follicles</Text>
              <Text style={styles.progressValue}>{mediumCount}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, styles.mediumProgress, { width: `${mediumPercentage}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{mediumPercentage.toFixed(1)}% of total</Text>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Weak Hair Follicles</Text>
              <Text style={styles.progressValue}>{weakCount}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, styles.weakProgress, { width: `${weakPercentage}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{weakPercentage.toFixed(1)}% of total</Text>
          </View>

          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalCount}</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Analysis Metrics</Text>
          <View style={styles.metricsTable}>
            <View style={styles.metricsRow}>
              <Text style={styles.metricLabel}>Terminal-Vellus Ratio</Text>
              <Text style={styles.metricValue}>{ratios.terminal_vellus || 'N/A'}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricLabel}>Strong-Medium Ratio</Text>
              <Text style={styles.metricValue}>{ratios.strong_medium || 'N/A'}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricLabel}>Triangle Success Rate</Text>
              <Text style={styles.metricValue}>{successRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricLabel}>Strong Follicle %</Text>
              <Text style={styles.metricValue}>{strongPercentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricLabel}>Medium Follicle %</Text>
              <Text style={styles.metricValue}>{mediumPercentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricLabel}>Weak Follicle %</Text>
              <Text style={styles.metricValue}>{weakPercentage.toFixed(1)}%</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
