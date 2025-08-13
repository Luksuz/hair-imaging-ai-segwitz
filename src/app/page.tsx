"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { extractDetectionsAndImageSize, type Detection } from "@/lib/workflow";
import { computeApproxMinimalTriangle, shortestSideMidAndApex } from "@/lib/triangle";
import { HAIR_STRAND_COLORS, mapClassNameToStrength } from "@/lib/colors";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from '@/components/pdf/PDFReport';

function HomeContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [overlay, setOverlay] = useState<{ detections: Detection[]; imageWidth?: number; imageHeight?: number } | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [showDetectionsList, setShowDetectionsList] = useState(true);
  const [detectionSortBy, setDetectionSortBy] = useState<'confidence' | 'class'>("confidence");
  const [expandedDetections, setExpandedDetections] = useState<string[]>([]);
  const [cropHistory, setCropHistory] = useState<string[]>([]);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, name: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isOriginalExpanded, setIsOriginalExpanded] = useState(false);
  const [isProcessedExpanded, setIsProcessedExpanded] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const authToken = localStorage.getItem('hair_follicle_auth');
    if (!authToken) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, [router]);

  // Handle preview URL for uploaded files
  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewSrc(url);
    setOriginalImageSrc(url);
    setCropHistory([]);
    
    // Get image info
    const img = new Image();
    img.onload = () => {
      setImageInfo({
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: selectedFile.name
      });
    };
    img.src = url;
    
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  // Load demo image via query param (but don't auto-process)
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl");
    if (imageUrl) {
      setSelectedFile(null);
      setPreviewSrc(imageUrl);
      setOriginalImageSrc(imageUrl);
      setCropHistory([]);
      
      // Get image info for demo images
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: imageUrl.split('/').pop() || 'demo_image.jpg'
        });
      };
      img.src = imageUrl;
      // Don't auto-process, wait for user to click process button
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Crop image function
  const cropImage = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cropSize = 0.8; // Crop to 80% of current size
        const newWidth = Math.floor(img.width * cropSize);
        const newHeight = Math.floor(img.height * cropSize);
        const offsetX = Math.floor((img.width - newWidth) / 2);
        const offsetY = Math.floor((img.height - newHeight) / 2);

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight, 0, 0, newWidth, newHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageSrc;
    });
  };

  // Handle crop button click
  const handleCrop = async () => {
    if (!previewSrc) return;
    
    const croppedImageSrc = await cropImage(previewSrc);
    setCropHistory([...cropHistory, previewSrc]);
    setPreviewSrc(croppedImageSrc);
    
    // Update image info
    const img = new Image();
    img.onload = () => {
      setImageInfo(prev => prev ? {
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight
      } : null);
    };
    img.src = croppedImageSrc;
  };

  // Handle undo crop
  const handleUndoCrop = () => {
    if (cropHistory.length === 0) return;
    
    const previousImage = cropHistory[cropHistory.length - 1];
    const newHistory = cropHistory.slice(0, -1);
    
    setCropHistory(newHistory);
    setPreviewSrc(previousImage);
    
    // Update image info
    const img = new Image();
    img.onload = () => {
      setImageInfo(prev => prev ? {
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight
      } : null);
    };
    img.src = previousImage;
  };

  const onProcess = async () => {
    const imageUrl = searchParams.get("imageUrl");
    
    // Check if we have either a selected file or a demo image URL
    if ((!selectedFile && !imageUrl && !previewSrc) || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setShowResults(false);
    
    try {
      let form: FormData;
      
      if (selectedFile && cropHistory.length === 0) {
        // Process original uploaded file
        form = new FormData();
        form.append("image", selectedFile);
      } else if (previewSrc) {
        // Process current preview (which might be cropped)
        const response = await fetch(previewSrc);
        const blob = await response.blob();
        const fileName = selectedFile?.name || imageUrl?.split('/').pop() || 'processed-image.jpg';
        const file = new File([blob], fileName, { type: blob.type });
        
        form = new FormData();
        form.append("image", file);
      } else if (imageUrl) {
        // Process demo image by downloading it first
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch demo image: ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], imageUrl.split('/').pop() || 'demo-image.jpg', { type: blob.type });
        
        form = new FormData();
        form.append("image", file);
      } else {
        throw new Error("No image to process");
      }
        
      // Call Next.js proxy route so we don't depend on CORS/envs in the browser
      const res = await fetch(`/api/roboflow`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResult(data);
      
      // Handle Flask API response
      if (data.success) {
        // Console log the triangles data for debugging
        console.log('=== FRONTEND DEBUG: TRIANGLES DATA ===');
        console.log('Full API Response:', data);
        console.log('Detections:', data.detections);
        console.log('Analysis Report:', data.analysis_report);
        console.log('Triangle Analysis:', data.analysis_report?.triangle_analysis);
        
        // Log triangle data for each detection
        if (data.detections) {
          console.log('Detection Triangle Details:');
          data.detections.forEach((detection: any, index: any) => {
            console.log(`Detection ${index}:`, {
              id: detection.id,
              class: detection.class,
              confidence: detection.confidence,
              hasTriangleVertices: !!detection.triangle_vertices,
              triangleVertices: detection.triangle_vertices,
              hasArrowStart: !!detection.arrow_start,
              hasArrowEnd: !!detection.arrow_end,
              arrowStart: detection.arrow_start,
              arrowEnd: detection.arrow_end
            });
          });
        }
        console.log('=== END FRONTEND DEBUG ===');
        
        const parsed = extractDetectionsAndImageSize(data, 0.3);
        setOverlay(parsed);
        setProcessedImageSrc(data.processed_image || previewSrc);
        setAnalysisReport(data.analysis_report);
        setShowResults(true);
      } else {
        throw new Error(data.error || 'Unknown error from API');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };



  // Reset to initial state
  const resetState = () => {
    setSelectedFile(null);
    setPreviewSrc(null);
    setProcessedImageSrc(null);
    setResult(null);
    setOverlay(null);
    setAnalysisReport(null);
    setShowResults(false);
    setError(null);
    setCropHistory([]);
    setOriginalImageSrc(null);
    setImageInfo(null);
  };

  // Background component
  const BackgroundElements = () => (
    <>
      {/* Background gradient elements */}
      <div 
        className="absolute pointer-events-none"
        style={{
          width: '816px',
          height: '816px',
          top: '-228px',
          left: '312px',
          opacity: 0.65,
          background: 'radial-gradient(circle, #FF4542 0%, rgba(255, 66, 61, 0.4) 30%, rgba(255, 66, 61, 0.1) 60%, rgba(255, 66, 61, 0) 100%)',
          filter: 'blur(120px)',
          borderRadius: '50%'
        }}
      ></div>
      <div 
        className="absolute pointer-events-none"
        style={{
          width: '816px',
          height: '816px',
          top: '20%',
          left: '100%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.5,
          background: 'radial-gradient(circle, #FF4542 0%, rgba(255, 66, 61, 0.25) 30%, rgba(255, 66, 61, 0.06) 60%, rgba(255, 66, 61, 0) 100%)',
          filter: 'blur(120px)',
          borderRadius: '100%'
        }}
      ></div>
       <div 
        className="absolute pointer-events-none"
        style={{
          width: '816px',
          height: '816px',
          top: '70%',
          left: '0%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.5,
          background: 'radial-gradient(circle, #FF4542 0%, rgba(255, 66, 61, 0.25) 30%, rgba(255, 66, 61, 0.06) 60%, rgba(255, 66, 61, 0) 100%)',
          filter: 'blur(120px)',
          borderRadius: '100%'
        }}
      ></div>
      {/* Background spiral image - left side */}
      <div className="absolute left-0 top-0 h-full pointer-events-none z-5">
        <img 
          src="/spiral.svg" 
          alt="" 
          className="h-full object-cover opacity-50"
          style={{ objectPosition: 'left center' }}
        />
      </div>
      {/* Background squiggle - right side */}
      <div className="absolute right-8 top-1/2 left-1/2 pointer-events-none z-5">
        <img 
          src="/squiggle.svg" 
          alt="" 
          className="w-48 h-auto opacity-60"
        />
      </div>
    </>
  );

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('hair_follicle_auth');
    router.push('/login');
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        <BackgroundElements />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render anything if not authenticated (will redirect to login)
  if (!isAuthenticated) {
    return null;
  }

  // Show results view
  if (showResults) {
  return (
      <main className="min-h-screen bg-black text-white relative overflow-hidden">
        <BackgroundElements />
        {/* Image Lightboxes */}
        <AnimatePresence>
          {isOriginalExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
              onClick={() => setIsOriginalExpanded(false)}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                src={previewSrc || ''}
                alt="Original Expanded"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setIsOriginalExpanded(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full grid place-items-center"
              >
                ✕
              </button>
            </motion.div>
          )}
          {isProcessedExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
              onClick={() => setIsProcessedExpanded(false)}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                src={processedImageSrc || previewSrc || ''}
                alt="Processed Expanded"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setIsProcessedExpanded(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full grid place-items-center"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Back button for results page */}
        <button
          onClick={resetState}
          className="absolute top-8 left-8 inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors z-20"
        >
          ← Back
        </button>
        
        {/* Logout button for results page */}
        <button
          onClick={handleLogout}
          className="absolute top-8 right-8 inline-flex items-center gap-2 text-neutral-400 hover:text-red-400 transition-colors z-20"
        >
          Logout →
        </button>
        
        <div className="mx-auto max-w-7xl px-8 py-12 relative z-10">
          {/* Left side content */}
          <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-16">
            {/* Left column - Title and Download */}
            <div className="flex flex-col justify-center">
              <h1 
                className="text-6xl font-bold leading-tight mb-8 bg-clip-text text-transparent"
                style={{
                  fontWeight: "bold",
                  fontSize: '56px',
                  lineHeight: '65px',
                  letterSpacing: '0%',
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.5) 100%)',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text'
                }}
              >
                Your Image<br/>
                has been<br/>
                successfully<br/>
                processed
              </h1>
              
              <p className="text-gray-400 text-lg mb-8 leading-relaxed"
               style={{
                fontSize: '16px',
                fontWeight: 'bold',
                lineHeight: '25px',
                letterSpacing: '0%',
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.5) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                You can now download your analysis report<br/>
                or review the processed image below.
              </p>
              
              {analysisReport ? (
                <button
                  onClick={async () => {
                    try {
                      const payload = {
                        detections: (result as any)?.detections || [],
                        analysis_report: analysisReport,
                        image_info: (result as any)?.image_info,
                        generated_on: new Date().toISOString(),
                        processed_image: processedImageSrc || (result as any)?.processed_image || previewSrc || null
                      };
                      // Call Next.js proxy which forwards to Flask
                      const res = await fetch(`/api/generate-pdf`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (!res.ok) throw new Error('PDF generation failed');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `hair_follicle_analysis_${new Date().toISOString().slice(0, 10)}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error(e);
                      alert('Failed to download PDF');
                    }
                  }}
                  className="inline-flex items-center gap-3 text-white font-bold py-2 px-8 rounded-4xl transition-colors w-fit"
                  style={{
                    background: 'linear-gradient(62.62deg, #FF4B4B -4.69%, #FF3E37 66.01%, #FFA9A9 105.86%)'
                  }}
                >
                  Download PDF
                  <span className="text-xl">↓</span>
                </button>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-3 bg-gray-500 text-white font-bold py-4 px-8 rounded-2xl w-fit opacity-50 cursor-not-allowed"
                >
                  Download PDF
                  <span className="text-xl">↓</span>
                </button>
              )}
            </div>

            {/* Right column - Image comparison */}
            <div className="space-y-4">
              {/* Image containers */}
              <div className="grid grid-cols-2 gap-6">
                {/* Uploaded Image */}
                <div className="relative">
                  <div className="absolute -top-8 left-0 text-white font-medium"
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    lineHeight: '25px',
                    letterSpacing: '0%',
                  }}>
                    Uploaded Image
                  </div>
                  <div className="relative bg-neutral-800 rounded-3xl overflow-hidden aspect-[4/5]">
                    {/* Expand/Close buttons */}
                    <button onClick={() => setIsOriginalExpanded(true)} className="absolute top-4 left-4 w-8 h-8 bg-black/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button onClick={() => setShowDetectionsList((v) => !v)} title="Toggle detections list" className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <img
                      src={previewSrc || ''}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Processed Image */}
                <div className="relative">
                  <div className="absolute -top-8 left-0 text-white font-medium"
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    lineHeight: '25px',
                    letterSpacing: '0%',
                  }}>
                    Processed Image
                  </div>
                  <div className="relative bg-neutral-800 rounded-3xl overflow-hidden aspect-[4/5]">
                    {/* Expand/Close buttons */}
                    <button onClick={() => setIsProcessedExpanded(true)} className="absolute top-4 left-4 w-8 h-8 bg-black/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button onClick={() => setIsProcessedExpanded(true)} className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <img
                      src={processedImageSrc || previewSrc || ''}
                      alt="Processed"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Image info */}
              <div className="text-left text-gray-400">
                Size: {analysisReport?.image_info?.width || 1745}×{analysisReport?.image_info?.height || 2080} | {selectedFile?.name || 'Uploaded file name here'}
              </div>
            </div>
          </div>

          {/* Analysis Report Section */}
          <div className="mt-20 rounded-4xl">
            <h2 className="text-2xl font-bold mb-8 ">Hair Follicle Analysis Report</h2>
            
            {analysisReport && (
              <div className="grid grid-cols-4 mb-16">
                {/* Total Hair Follicles */}
                <div className="bg-neutral-900  p-6 text-center">
                  <div className="text-gray-400 text-lg mb-2">Total Hair Follicles</div>
                  <div 
                    className="text-4xl font-bold bg-clip-text text-transparent"
                    style={{
                      fontSize: '34px',
                      fontWeight: 'bold',
                      lineHeight: '65px',
                      letterSpacing: '0%',
                      background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {analysisReport.total_count}
                  </div>
                </div>

                {/* Successful Triangles */}
                <div className="bg-neutral-900 p-6 text-center">
                  <div className="text-gray-400 text-lg mb-2">Successful Triangles</div>
                  <div 
                    className="text-4xl font-bold bg-clip-text text-transparent"
                    style={{
                      fontSize: '34px',
                      fontWeight: 'bold',
                      lineHeight: '65px',
                      letterSpacing: '0%',
                      background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {analysisReport.triangle_analysis.successful_triangles}
                  </div>
                </div>

                {/* Success Rate */}
                <div className="bg-neutral-900 p-6 text-center">
                  <div className="text-gray-400 text-lg mb-2">Success Rate</div>
                  <div 
                    className="text-4xl font-bold bg-clip-text text-transparent"
                    style={{
                      fontSize: '34px',
                      fontWeight: 'bold',
                      lineHeight: '65px',
                      letterSpacing: '0%',
                      background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {analysisReport.triangle_analysis.success_rate.toFixed(0)}%
                  </div>
                </div>

                {/* Avg Confidence */}
                <div className="bg-neutral-900 p-6 text-center">
                  <div className="text-gray-400 text-lg mb-2">Avg Confidence</div>
                  <div 
                    className="text-4xl font-bold bg-clip-text text-transparent"
                    style={{
                      fontSize: '34px',
                      fontWeight: 'bold',
                      lineHeight: '65px',
                      letterSpacing: '0%',
                      background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {(analysisReport.confidence_stats.overall.average * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Hair Classification Legend */}
            <div className="mb-8">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full"
                  style={{ background: 'linear-gradient(153.76deg, #41D590 16.51%, #079600 86.43%)' }}></div>
                  <div>
                    <div className="text-white font-medium">&gt; 90 μm</div>
                    <div className="text-gray-400 text-sm">Large Terminal Hair</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-400"></div>
                  <div>
                    <div className="text-white font-medium">60-90 μm</div>
                    <div className="text-gray-400 text-sm">Intermediate Terminal Hair</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full"
                  style={{ background: 'linear-gradient(153.76deg, #B7FFDD 16.51%, #6DA76A 86.43%)' }}></div>
                  <div>
                    <div className="text-white font-medium">30-60 μm</div>
                    <div className="text-gray-400 text-sm">Small Terminal Hair</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full"
                  style={{ background: 'linear-gradient(153.76deg, #F06338 16.51%, #F06338 86.43%)' }}></div>
                  <div>
                    <div className="text-white font-medium">&lt; 30 μm</div>
                    <div className="text-gray-400 text-sm">Vellus / Miniaturized Hair</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hair Count Charts */}
            {analysisReport && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-8 mb-12"
              >
                {/* Hair Count per cm² */}
                <div className="bg-neutral-900 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Hair Count per cm²
                    </h3>
                    <div className="text-red-400 font-bold"
                    style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      lineHeight: '25px',
                      letterSpacing: '0%',
                      background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                    >Total: {analysisReport.total_count}</div>
                  </div>
                  
                  {/* Stacked Bar Chart */}
                  <div className="relative">
                    <div className="flex items-center justify-center">
                      <div className="h-32 bg-neutral-800 rounded-lg overflow-hidden flex flex-col justify-end w-1/4">
                        {/* Strong (Green Gradient) */}
                        <div 
                          className="flex items-center"
                          style={{ 
                            height: `${(analysisReport.class_counts.strong / analysisReport.total_count) * 128}px`,
                            background: 'linear-gradient(180deg, #41D590 16.51%, #079600 86.43%)'
                          }}
                        />
                        {/* Medium (Orange) */}
                        <div 
                          className="flex items-center"
                          style={{ 
                            height: `${(analysisReport.class_counts.medium / analysisReport.total_count) * 128}px`,
                            background: 'linear-gradient(180deg, #FFB800 16.51%, #FF6A00 86.43%)'
                          }}
                        />
                        {/* Weak (Red) */}
                        <div 
                          className="flex items-center"
                          style={{ 
                            height: `${(analysisReport.class_counts.weak / analysisReport.total_count) * 128}px`,
                            background: 'linear-gradient(180deg, #F06338 16.51%, #F06338 86.43%)'
                          }}
                        />
                      </div>
                      {/* Numbers on right */}
                      <div className="flex flex-col justify-end h-32 ml-2">
                        <div className="h-[128px] flex flex-col justify-between py-1">
                          <span className="text-white font-bold text-sm">{analysisReport.class_counts.strong}</span>
                          <span className="text-white font-bold text-sm">{analysisReport.class_counts.medium}</span>
                          <span className="text-white font-bold text-sm">{analysisReport.class_counts.weak}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sum of Hair Width per cm² */}
                <div className="bg-neutral-900 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white"
                     style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >Sum of Hair Width per cm²</h3>
                    <div className="text-red-400 font-bold"
                    style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      lineHeight: '25px',
                      letterSpacing: '0%',
                      background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                    >Total: 10082 μm</div>
                  </div>
                  
                  {/* Stacked Bar Chart */}
                  <div className="relative">
                    <div className="flex justify-center">
                      <div className="h-32 bg-neutral-800 rounded-lg overflow-hidden flex flex-col justify-end w-1/4">
                        {/* Strong (Green) - Estimated width contribution */}
                        <div 
                          className="bg-green-500 flex items-center"
                          style={{ height: `${(analysisReport.class_counts.strong / analysisReport.total_count) * 128}px` }}
                        />
                        {/* Medium (Orange) */}
                        <div 
                          className="flex items-center"
                          style={{ 
                            height: `${(analysisReport.class_counts.medium / analysisReport.total_count) * 128}px`,
                            background: 'linear-gradient(180deg, #FFB800 16.51%, #FF6A00 86.43%)'
                          }}
                        />
                        {/* Weak (Red) */}
                        <div 
                          className="flex items-center"
                          style={{ 
                            height: `${(analysisReport.class_counts.weak / analysisReport.total_count) * 128}px`,
                            background: 'linear-gradient(180deg, #F06338 16.51%, #F06338 86.43%)'
                          }}
                        />
                      </div>
                      <div className="flex flex-col justify-end ml-2">
                        <div style={{height: `${(analysisReport.class_counts.strong / analysisReport.total_count) * 128}px`}} className="flex items-center">
                          <span className="text-white font-bold text-sm">{analysisReport.class_counts.strong}</span>
                        </div>
                        <div style={{height: `${(analysisReport.class_counts.medium / analysisReport.total_count) * 128}px`}} className="flex items-center">
                          <span className="text-white font-bold text-sm">{analysisReport.class_counts.medium}</span>
                        </div>
                        <div style={{height: `${(analysisReport.class_counts.weak / analysisReport.total_count) * 128}px`}} className="flex items-center">
                          <span className="text-white font-bold text-sm">{analysisReport.class_counts.weak}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hair Follicle Count by Strength */}
            <h2 className="text-4xl font-bold mb-8 text-center">Hair Follicle Count by Strength</h2>

            {analysisReport && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-2 gap-12"
              >
                {/* Hair Count Distribution */}
                <div className="bg-neutral-900 rounded-2xl p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white"
                     style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >Hair Count Distribution</h3>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Strong Hair Follicles */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Strong Hair Follicles</span>
                        <span className="text-red-400 font-bold text-xl"
                         style={{
                          fontSize: '22px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{analysisReport.class_counts.strong}</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3 mb-1">
                        <div 
                          className="h-3 rounded-full"
                          style={{ width: `${(analysisReport.class_counts.strong / analysisReport.total_count)* 100}%`,
                            background: 'linear-gradient(180deg, #41D590 16.51%, #079600 86.43%)'
                          }}
                        ></div>
                      </div>
                      <div className="text-gray-400 text-sm">{analysisReport.class_percentages.strong.toFixed(1)}% of total</div>
                    </div>

                    {/* Medium Hair Follicles */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Medium Hair Follicles</span>
                        <span className="text-red-400 font-bold text-xl"
                         style={{
                          fontSize: '22px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                        >{analysisReport.class_counts.medium}</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3 mb-1">
                        <div 
                          className="h-3 rounded-full"
                          style={{ width: `${(analysisReport.class_counts.medium / analysisReport.total_count) * 100}%`,
                            background: 'linear-gradient(180deg, #FFB800 16.51%, #FF6A00 86.43%)'
                          }}
                        ></div>
                      </div>
                      <div className="text-gray-400 text-sm">{analysisReport.class_percentages.medium.toFixed(1)}% of total</div>
                    </div>

                    {/* Weak Hair Follicles */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Weak Hair Follicles</span>
                        <span className="text-red-400 font-bold text-xl"
                         style={{
                          fontSize: '22px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{analysisReport.class_counts.weak}</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3 mb-1">
                        <div 
                          className="h-3 rounded-full"
                          style={{ width: `${(analysisReport.class_counts.weak / analysisReport.total_count) * 100}%`,
                            background: 'linear-gradient(180deg, #F06338 16.51%, #F06338 86.43%)'
                          }}
                        ></div>
                      </div>
                      <div className="text-gray-400 text-sm">{analysisReport.class_percentages.weak.toFixed(1)}% of total</div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-neutral-700">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-lg">Total</span>
                        <span className="text-red-400 font-bold text-2xl"
                         style={{
                          fontSize: '22px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                        >{analysisReport.total_count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Metrics */}
                <div className="bg-neutral-900 rounded-2xl p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white"
                     style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >Analysis Metrics</h3>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Terminal-Vellus Ratio */}
                    <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">No.</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="text-white">Terminal-Vellus Ratio</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                      <span className="text-white font-bold">{analysisReport.ratios.terminal_vellus}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>

                    {/* Strong-Medium Ratio */}
                    <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                      <div>
                        <span className="text-gray-400 text-sm">1.</span>
                        <span className="text-white ml-4">Strong-Medium Ratio</span>
                      </div>
                      <span className="text-white font-bold">{analysisReport.ratios.strong_medium}</span>
                    </div>

                    {/* Triangle Success Rate */}
                    <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                      <div>
                        <span className="text-gray-400 text-sm">2.</span>
                        <span className="text-white ml-4">Triangle Success Rate</span>
                      </div>
                      <span className="text-white font-bold">{analysisReport.triangle_analysis.success_rate.toFixed(1)}%</span>
                    </div>

                    {/* Strong Follicle % */}
                    <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                      <div>
                        <span className="text-gray-400 text-sm">3.</span>
                        <span className="text-white ml-4">Strong Follicle %</span>
                      </div>
                      <span className="text-white font-bold">{analysisReport.class_percentages.strong.toFixed(1)}%</span>
                    </div>

                    {/* Medium Follicle % */}
                    <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                      <div>
                        <span className="text-gray-400 text-sm">4.</span>
                        <span className="text-white ml-4">Medium Follicle %</span>
                      </div>
                      <span className="text-white font-bold">{analysisReport.class_percentages.medium.toFixed(1)}%</span>
                    </div>

                    {/* Weak Follicle % */}
                    <div className="flex justify-between items-center py-3">
                      <div>
                        <span className="text-gray-400 text-sm">5.</span>
                        <span className="text-white ml-4">Weak Follicle %</span>
                      </div>
                      <span className="text-white font-bold">{analysisReport.class_percentages.weak.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detection Confidence Statistics */}
            {analysisReport && (
              <div className="mt-16">
                <h2 className="text-4xl font-bold mb-8 text-center">Detection Confidence Statistics</h2>
                
                {/* Confidence Cards */}
                <div className="grid grid-cols-3 gap-8 mb-8">
                  {/* Strong Hair Follicles */}
                  <div className="bg-neutral-900 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-4 h-4 rounded-full"
                  style={{ background: 'linear-gradient(153.76deg, #41D590 16.51%, #079600 86.43%)' }}></div>
                      <h3 className="text-xl font-bold text-white">Strong Hair Follicles</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-400">Average: </span>
                        <span className="text-red-400 font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{(analysisReport.confidence_stats.strong.average * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Range: </span>
                        <span className="text-red-400 font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                            {(analysisReport.confidence_stats.strong.min * 100).toFixed(1)}% - {(analysisReport.confidence_stats.strong.max * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Count: </span>
                        <span className="text-white font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{analysisReport.confidence_stats.strong.count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medium Hair Follicles */}
                  <div className="bg-neutral-900 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-4 h-4 rounded-full"
                  style={{ background: 'linear-gradient(153.76deg, #B7FFDD 16.51%, #6DA76A 86.43%)' }}></div>
                      <h3 className="text-xl font-bold text-white">Medium Hair Follicles</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-400">Average: </span>
                        <span className="text-red-400 font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{(analysisReport.confidence_stats.medium.average * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Range: </span>
                        <span className="text-red-400 font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {(analysisReport.confidence_stats.medium.min * 100).toFixed(1)}% - {(analysisReport.confidence_stats.medium.max * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Count: </span>
                        <span className="text-white font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                        >{analysisReport.confidence_stats.medium.count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weak Hair Follicles */}
                  <div className="bg-neutral-900 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-4 h-4 rounded-full"
                  style={{ background: 'linear-gradient(153.76deg, #F06338 16.51%, #F06338 86.43%)' }}></div>
                      <h3 className="text-xl font-bold text-white">Weak Hair Follicles</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-400">Average: </span>
                        <span className="text-red-400 font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{(analysisReport.confidence_stats.weak.average * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Range: </span>
                        <span className="text-red-400 font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {(analysisReport.confidence_stats.weak.min * 100).toFixed(1)}% - {(analysisReport.confidence_stats.weak.max * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Count: </span>
                        <span className="text-white font-bold"
                         style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '25px',
                          letterSpacing: '0%',
                          background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                        >{analysisReport.confidence_stats.weak.count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div 
                  className="bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-2xl mb-8"
                  style={{
                    width: '1240px',
                    height: '103px',
                    gap: '12px',
                    opacity: 1,
                    paddingTop: '24px',
                    paddingRight: '28px',
                    paddingBottom: '24px',
                    paddingLeft: '28px',
                      boxShadow: 'inset 0 22px 84px rgba(255, 69, 66, 0.7), inset 0 -22px 42px rgba(255, 69, 66, 0.3)'
                  }}
                >
                  <h3 className="text-xl font-bold text-white mb-2">Analysis Summary:</h3>
                  <p className="text-gray-300">
                    Detected {analysisReport.total_count} hair follicles with {analysisReport.triangle_analysis.successful_triangles} successful directional analyses. 
                    The dominant hair type is <strong>weak</strong> with {analysisReport.class_counts.weak} follicles.
                  </p>
                </div>

                {/* Detailed Detection Breakdown */}
                {result && (result as any).detections && (
                  <div className="bg-neutral-900 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-2xl font-bold text-white">Detailed Detection Breakdown</h3>
                      <button 
                        onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                        className="w-8 h-8 bg-neutral-700 hover:bg-neutral-600 rounded-lg flex items-center justify-center transition-colors"
                        title={showDetailedBreakdown ? "Hide details" : "Show details"}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <label className="text-sm text-neutral-400">Sort:</label>
                        <select
                          value={detectionSortBy}
                          onChange={(e) => setDetectionSortBy(e.target.value as 'confidence' | 'class')}
                          className="bg-neutral-800 text-white text-sm rounded-md px-2 py-1 border border-neutral-700"
                        >
                          <option value="confidence">Confidence</option>
                          <option value="class">Class</option>
                        </select>
                        <button
                          onClick={() => setShowDetectionsList((v) => !v)}
                          className="px-2 py-1 text-sm bg-neutral-700 rounded-md hover:bg-neutral-600"
                        >
                          {showDetectionsList ? 'Hide list' : 'Show list'}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                    {showDetailedBreakdown && showDetectionsList && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6 overflow-hidden"
                      >
                        {[...((result as any).detections || [])]
                          .sort((a: any, b: any) => {
                            if (detectionSortBy === 'confidence') {
                              return (b.confidence || 0) - (a.confidence || 0);
                            }
                            const ac = (a.class || '').localeCompare(b.class || '');
                            return ac;
                          })
                          .slice(0, 10)
                          .map((detection: any, index: number) => (
                        <motion.div
                          key={detection.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.25 }}
                          className="border-b border-neutral-700 pb-6 last:border-b-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-bold text-white">Detection {index + 1}:</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Hair Strand:</span>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  mapClassNameToStrength(detection.class) === 'strong' ? 'bg-green-500' :
                                  mapClassNameToStrength(detection.class) === 'medium' ? 'bg-orange-400' : 'bg-red-500'
                                }`}></div>
                                <span className="text-white font-medium">{mapClassNameToStrength(detection.class)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1 text-sm">
                            <div>
                              <span className="text-gray-400">Detection ID: </span>
                              <span className="text-red-400 font-mono text-xs"
                               style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                lineHeight: '15px',
                                letterSpacing: '0%',
                                background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                              >{detection.id || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Contour Points: </span>
                              <span className="text-red-400 font-bold"
                               style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                lineHeight: '15px',
                                letterSpacing: '0%',
                                background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                              >{detection.points?.length || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Confidence: </span>
                              <span className="text-red-400 font-bold"
                               style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                lineHeight: '15px',
                                letterSpacing: '0%',
                                background: 'linear-gradient(356.64deg, #FF4644 23.92%, #FF9A98 58.75%, #FE4542 99.38%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                              >{((detection.confidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                        {(result as any).detections.length > 5 && (
                          <div className="text-center pt-4">
                            <button 
                              onClick={() => {
                                // This could be expanded to show all detections
                                console.log('Show more detections clicked');
                              }}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              Show {(result as any).detections.length - 5} more detections...
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="mt-12 text-center">
            <button
              onClick={resetState}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Upload
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Show fullscreen upload view when image is selected
  if (previewSrc && !showResults) {
    return (
      <main className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        <BackgroundElements />
        
        {/* Back button positioned at top left */}
        <button
          onClick={resetState}
          className="absolute top-8 left-8 inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors z-10"
        >
          ← Back
        </button>
        
        {/* Logout button for ready-to-process page */}
        <button
          onClick={handleLogout}
          className="absolute top-8 right-8 inline-flex items-center gap-2 text-neutral-400 hover:text-red-400 transition-colors z-10"
        >
          Logout →
        </button>

        <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Ready to Process</h1>
            <p className="text-neutral-400">Click the button below to analyze your image</p>
          </div>

          <div className="relative bg-neutral-800 rounded-2xl mb-4 mx-auto" style={{ width: '50vw', maxWidth: '800px' }}>
            <img
              src={previewSrc}
              alt="preview"
              className="w-full h-auto object-contain rounded-2xl mx-auto"
            />
            
            {/* Undo button - above crop button */}
            {cropHistory.length > 0 && (
              <button
                onClick={handleUndoCrop}
                className="absolute bottom-20 right-4 inline-flex items-center gap-2 bg-gray-600/80 hover:bg-gray-500/90 text-white px-4 py-2 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo
              </button>
            )}
            
            {/* Crop button and info - bottom right */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {/* Info button with tooltip */}
              <div className="relative group">
                <button className="p-2 bg-gray-600/80 hover:bg-gray-500/90 text-white rounded-full transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="font-semibold mb-1">Crop Logic:</div>
                  <div className="text-gray-300">
                    • Each crop removes 10% from all edges<br/>
                    • Centers the remaining 80% of the image<br/>
                    • Can be applied multiple times<br/>
                    • Use Undo to revert changes
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
              
              {/* Crop button */}
              <button
                onClick={handleCrop}
                className="inline-flex items-center gap-2 bg-gray-600/80 hover:bg-gray-500/90 text-white px-4 py-2 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Crop
              </button>
            </div>
          </div>

          {/* Image info */}
          <div className="text-center mb-8">
            {imageInfo && (
              <div className="text-neutral-400">
                <p className="text-sm">
                  <span className="font-medium">{imageInfo.name}</span>
                </p>
                <p className="text-xs">
                  Size: {imageInfo.width} × {imageInfo.height} pixels
                  {cropHistory.length > 0 && <span className="ml-2 text-orange-400">(Cropped {cropHistory.length}x)</span>}
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={onProcess}
              disabled={isProcessing || (!selectedFile && !searchParams.get("imageUrl"))}
              className="inline-flex items-center gap-3 px-10 py-3 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(62.62deg, #FF4B4B -4.69%, #FF3E37 66.01%, #FFA9A9 105.86%)'
              }}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Process Image'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Show initial upload view
  return (
    <main className="min-h-screen py-10 bg-black text-white relative overflow-hidden">
      <BackgroundElements />
      
      {/* Logout button for main upload page */}
      <button
        onClick={handleLogout}
        className="absolute top-8 right-8 inline-flex items-center gap-2 text-neutral-400 hover:text-red-400 transition-colors z-20"
      >
        Logout →
      </button>
      
      <div className="mx-auto max-w-6xl px-4 min-h-[80vh] flex flex-col justify-center relative z-10">
        {/* Main content section - always centered */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <section className="self-center">
            {/* Hero block */}
            <div className="rounded-3xl overflow-hidden w-[360px] h-[240px] bg-neutral-800 mb-6">
              <img src="/demo_images/tricho_0.png" alt="hero" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-[44px] leading-[1.05] font-extrabold text-white">
              Hair Follicle<br/>Segmentation &<br/>Triangle Detection
            </h1>
            <div className="flex items-center mt-3">

            <p className="text-neutral-300 mt-4 max-w-xl">
              Upload an image to perform segmentation using Roboflow and detect triangular patterns.
            </p>
            
            <div className="flex items-center">
              <img src="/free.svg" alt="Free" className="w-20 h-5" />
            </div>
            </div>
          </section>

          <section className="self-center">
            <p className="text-center text-white mb-6 text-2xl">Please upload an image or select a demo image to get started.</p>
            
            {/* Upload box */}
            <div className="rounded-3xl border border-white/20 bg-neutral-800/60 p-12 mb-8 min-h-[400px] flex flex-col items-center justify-center">
              <div className="flex justify-center mb-8">
                <label 
                  className="cursor-pointer inline-flex items-center justify-center px-12 py-4 font-bold text-white shadow-lg text-lg rounded-full"
                  style={{
                    background: 'linear-gradient(62.62deg, #FF4B4B -4.69%, #FF3E37 66.01%, #FFA9A9 105.86%)'
                  }}
                >
                  Upload Image
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              <div className="text-center text-neutral-300 text-lg mb-4">or drop a file,</div>
              <div className="text-center text-neutral-400 text-sm">Limit 200MB per file • PNG, JPG, JPEG, BMP, TIFF, TIF</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-neutral-400 mb-6 text-lg">Or</div>
              <a 
                href="/demo" 
                className="rounded-full bg-neutral-700/80 border border-white/20 px-12 py-4 font-bold text-white hover:bg-neutral-600/80 transition-colors text-lg inline-flex items-center gap-3"
              >
                🖼️ Choose Demo Image
              </a>
            </div>
          </section>
        </div>
    </div>
    </main>
  );

  function syncCanvasToImage(img: HTMLImageElement) {
    const cvs = canvasRef.current;
    if (!cvs) return;
    
    // Set canvas size to match the actual displayed image size
    const rect = img.getBoundingClientRect();
    cvs.width = rect.width;
    cvs.height = rect.height;
    cvs.style.width = rect.width + 'px';
    cvs.style.height = rect.height + 'px';
    
    if (overlay) drawIfReady(overlay, img);
  }

  function drawIfReady(parsed: { detections: Detection[]; imageWidth?: number; imageHeight?: number }, img?: HTMLImageElement) {
    const cvs = canvasRef.current;
    if (!cvs || parsed.detections.length === 0) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Get the actual image dimensions from Roboflow response
    const originalWidth = parsed.imageWidth;
    const originalHeight = parsed.imageHeight;
    
    if (!originalWidth || !originalHeight) {
      console.warn('Missing image dimensions from Roboflow response');
      return;
    }

    // Calculate the scaling and offset for the displayed image
    const canvasWidth = cvs.width;
    const canvasHeight = cvs.height;
    
    // The image might be scaled down to fit in the container with object-fit: contain
    // We need to calculate the actual scale and offset
    const scaleX = canvasWidth / originalWidth;
    const scaleY = canvasHeight / originalHeight;
    
    // Use the smaller scale to maintain aspect ratio (object-fit: contain behavior)
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate the offset to center the image
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    // No overlay drawing - display clean image only
    // Triangle calculations still happen in backend for analysis
  }

  function drawArrow(ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }, color: string) {
    const headLength = 8;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}

