export type Detection = {
  points: { x: number; y: number }[];
  class: string;
  confidence?: number;
  detection_id?: string;
};

export function extractDetectionsFromWorkflow(response: unknown, confidenceThreshold = 0.4): Detection[] {
  try {
    // Newer serverless workflow format: { outputs: [ { predictions: { image, predictions: [...] } } ] }
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const outputs = (response as any).outputs;
      if (Array.isArray(outputs) && outputs.length > 0) {
        const preds = outputs[0]?.predictions?.predictions;
        if (Array.isArray(preds)) {
          return preds
            .filter((p: any) => (p?.confidence ?? 0) >= confidenceThreshold)
            .map((p: any) => ({
              points: Array.isArray(p?.points)
                ? p.points.map((q: any) => ({ x: Number(q.x), y: Number(q.y) }))
                : [],
              class: String(p?.class ?? "unknown"),
              confidence: typeof p?.confidence === "number" ? p.confidence : undefined,
              detection_id: p?.detection_id,
            }));
        }
      }
    }

    // Older format: [ { predictions: { predictions: [...] } } ]
    if (Array.isArray(response) && response.length > 0) {
      const item = (response as any)[0];
      const predictions = item?.predictions?.predictions;
      if (!Array.isArray(predictions)) return [];
      return predictions
        .filter((p: any) => (p?.confidence ?? 0) >= confidenceThreshold)
        .map((p: any) => ({
          points: Array.isArray(p?.points)
            ? p.points.map((q: any) => ({ x: Number(q.x), y: Number(q.y) }))
            : [],
          class: String(p?.class ?? "unknown"),
          confidence: typeof p?.confidence === "number" ? p.confidence : undefined,
          detection_id: p?.detection_id,
        }));
    }
    return [];
  } catch (e) {
    console.error("extractDetectionsFromWorkflow error", e);
    return [];
  }
}

export function extractDetectionsAndImageSize(response: unknown, confidenceThreshold = 0.4): { detections: Detection[]; imageWidth?: number; imageHeight?: number } {
  try {
    // Handle Flask API response format
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const apiResponse = response as any;
      
      // Check if it's a Flask API response
      if (apiResponse.success && apiResponse.detections) {
        const detections = apiResponse.detections.map((det: any) => ({
          points: det.points || [],
          class: det.class || 'unknown',
          confidence: det.confidence || 0,
          detection_id: det.id
        }));
        
        const imageInfo = apiResponse.image_info;
        return { 
          detections, 
          imageWidth: imageInfo?.width, 
          imageHeight: imageInfo?.height 
        };
      }
      
      // Fallback to old Roboflow format
      const outputs = apiResponse.outputs;
      if (Array.isArray(outputs) && outputs.length > 0) {
        const image = outputs[0]?.predictions?.image;
        const detections = extractDetectionsFromWorkflow(response, confidenceThreshold);
        return { detections, imageWidth: image?.width, imageHeight: image?.height };
      }
    }
    return { detections: extractDetectionsFromWorkflow(response, confidenceThreshold) };
  } catch (e) {
    console.error('Error extracting detections:', e);
    return { detections: [] };
  }
}


