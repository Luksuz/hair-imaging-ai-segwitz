import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#ddd',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a3c5e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 1,
  },
  reportTitle: {
    textAlign: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a3c5e',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
});

interface ReportHeaderProps {
  reportDate: string;
  analysisId: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ reportDate, analysisId }) => {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>HF</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>Hair Follicle Analysis System</Text>
          <Text style={styles.companySubtitle}>Advanced Trichoscopy & AI-Powered Detection</Text>
          <Text style={styles.companySubtitle}>Generated on: {reportDate}</Text>
          <Text style={styles.companySubtitle}>Analysis ID: {analysisId}</Text>
        </View>
      </View>
      
      <View style={styles.reportTitle}>
        <Text style={styles.title}>Hair Follicle Analysis Report</Text>
        <Text style={styles.subtitle}>Comprehensive Follicle Detection & Directional Analysis</Text>
      </View>
    </>
  );
};
