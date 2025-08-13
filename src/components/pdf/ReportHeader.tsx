import React from 'react';
import { Text, View, StyleSheet, Svg, Defs, LinearGradient, Stop, Rect } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  headerBanner: {
    position: 'relative',
    height: 36,
    borderRadius: 8,
    marginBottom: 14,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
  },
  gradientSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%'
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
    textAlign: 'left',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
});

interface ReportHeaderProps {
  reportDate: string;
  analysisId: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ reportDate, analysisId }) => {
  return (
    <>
      <View style={styles.headerBanner}>
        {/* Gradient background via SVG to match requested style */}
        <Svg style={styles.gradientSvg} height={36}>
          <Defs>
            {/* Standard left-to-right linear gradient */}
            <LinearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FF4B4B" />
              <Stop offset="100%" stopColor="#FF3E37" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#headerGradient)" />
        </Svg>
        <Text style={styles.headerText}>Hair Follicle Segmentation & Analysis Report</Text>
      </View>
      
      <View style={styles.reportTitle}>
        <Text style={styles.title}>Report Details</Text>
        <Text style={styles.subtitle}>Generated on: {reportDate} · Analysis ID: {analysisId}</Text>
      </View>
    </>
  );
};
