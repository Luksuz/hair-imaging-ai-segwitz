"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ReportHeader } from './ReportHeader';
import { MainStats } from './MainStats';
import { ClassificationLegend } from './ClassificationLegend';
import { ChartsSection } from './ChartsSection';
import { AnalysisSection } from './AnalysisSection';
import { ConfidenceStats } from './ConfidenceStats';
import { AnalysisSummary } from './AnalysisSummary';
import { TopInfo } from './TopInfo';

// Define styles using StyleSheet API
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    lineHeight: 1.1,
  },
  pageBreak: {
    marginTop: 30,
  },
});

interface PDFReportProps {
  analysisReport: any;
  imageInfo?: any;
}

export const PDFReport: React.FC<PDFReportProps> = ({ analysisReport, imageInfo }) => {
  // Prepare data for PDF components
  const reportData = {
    reportDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    analysisId: Math.random().toString(36).substr(2, 8).toUpperCase(),
    totalCount: analysisReport?.total_count || 0,
    strongCount: analysisReport?.class_counts?.strong || 0,
    mediumCount: analysisReport?.class_counts?.medium || 0,
    weakCount: analysisReport?.class_counts?.weak || 0,
    strongPercentage: analysisReport?.class_percentages?.strong || 0,
    mediumPercentage: analysisReport?.class_percentages?.medium || 0,
    weakPercentage: analysisReport?.class_percentages?.weak || 0,
    triangleAnalysis: analysisReport?.triangle_analysis || {},
    confidenceStats: analysisReport?.confidence_stats || {},
    ratios: analysisReport?.ratios || {},
  };

  const successfulTriangles = reportData.triangleAnalysis.successful_triangles || 0;
  const successRate = reportData.triangleAnalysis.success_rate || 0;
  const avgConfidence = (reportData.confidenceStats.overall?.average || 0) * 100;
  const imageWidth = imageInfo?.width || analysisReport?.image_info?.width;
  const imageHeight = imageInfo?.height || analysisReport?.image_info?.height;

  // Determine dominant type
  const counts = {
    strong: reportData.strongCount,
    medium: reportData.mediumCount,
    weak: reportData.weakCount
  };
  const dominantType = Object.keys(counts).reduce((a, b) => counts[a as keyof typeof counts] > counts[b as keyof typeof counts] ? a : b);
  const dominantCount = counts[dominantType as keyof typeof counts];
  const dominantPercentage = reportData.totalCount > 0 ? (dominantCount / reportData.totalCount * 100) : 0;

  // Confidence quality assessment
  let confidenceQuality = "poor";
  if (avgConfidence >= 80) confidenceQuality = "excellent";
  else if (avgConfidence >= 60) confidenceQuality = "good";
  else if (avgConfidence >= 40) confidenceQuality = "moderate";

  return (
    <Document>
      {/* Page 1 */}
      <Page size="A4" style={styles.page}>
        <ReportHeader 
          reportDate={reportData.reportDate}
          analysisId={reportData.analysisId}
        />
        <TopInfo 
          reportDate={reportData.reportDate}
          totalDetections={reportData.totalCount}
          successRate={successRate}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
        />
        
        <MainStats 
          totalCount={reportData.totalCount}
          successfulTriangles={successfulTriangles}
          successRate={successRate}
          avgConfidence={avgConfidence}
        />
        
        <ClassificationLegend />
        
        <ChartsSection 
          strongCount={reportData.strongCount}
          mediumCount={reportData.mediumCount}
          weakCount={reportData.weakCount}
          totalCount={reportData.totalCount}
        />
        
        <AnalysisSection 
          strongCount={reportData.strongCount}
          mediumCount={reportData.mediumCount}
          weakCount={reportData.weakCount}
          strongPercentage={reportData.strongPercentage}
          mediumPercentage={reportData.mediumPercentage}
          weakPercentage={reportData.weakPercentage}
          totalCount={reportData.totalCount}
          successRate={successRate}
          ratios={reportData.ratios}
        />
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={styles.page}>
        <ConfidenceStats 
          confidenceStats={reportData.confidenceStats}
          strongCount={reportData.strongCount}
          mediumCount={reportData.mediumCount}
          weakCount={reportData.weakCount}
        />
        
        <AnalysisSummary 
          totalCount={reportData.totalCount}
          successfulTriangles={successfulTriangles}
          dominantType={dominantType}
          dominantCount={dominantCount}
          dominantPercentage={dominantPercentage}
          avgConfidence={avgConfidence}
          confidenceQuality={confidenceQuality}
        />
      </Page>
    </Document>
  );
};
