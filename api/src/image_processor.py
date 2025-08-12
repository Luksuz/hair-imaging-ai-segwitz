"""
Image processing and inference module.
Handles Roboflow inference and detection processing.
"""

from typing import Optional, Tuple, List
from inference_sdk import InferenceHTTPClient
from PIL import Image

from .config import DEFAULT_API_URL, TEMP_IMAGE_PATH, MIN_CONTOUR_POINTS
from .triangle_detector import get_smallest_triangle, find_shortest_side_and_apex
from .utils import draw_arrow, draw_visualization_elements, get_hair_strand_class_name


class ImageProcessor:
    """
    Handles image processing, inference, and detection processing.
    """
    
    def __init__(self, api_key: str, api_url: str = DEFAULT_API_URL):
        """
        Initialize the ImageProcessor with Roboflow client.
        
        Args:
            api_key: Roboflow API key
            api_url: Roboflow API URL
        """
        self.client = InferenceHTTPClient(
            api_url=api_url,
            api_key=api_key
        )
    
    def run_workflow(self, image_path: str, workspace_name: str, workflow_id: str, 
                    confidence: float = 0.4, use_cache: bool = True):
        """
        Run workflow on an image using the specified workspace and workflow.
        
        Args:
            image_path: Path to the image file
            workspace_name: Roboflow workspace name
            workflow_id: Roboflow workflow ID
            confidence: Confidence threshold for detections
            use_cache: Whether to cache workflow definition for 15 minutes
            
        Returns:
            List of detections with segmentation data
        """
        # Run workflow
        workflow_result = self.client.run_workflow(
            workspace_name=workspace_name,
            workflow_id=workflow_id,
            images={
                "image": image_path
            },
            use_cache=use_cache
        )
        
        # Extract and process workflow results directly
        try:
            detections = self._extract_detections_from_workflow(workflow_result, confidence)
            return detections
        except Exception as e:
            # Provide debugging information
            print(f"Debug: Workflow result structure: {type(workflow_result)}")
            if isinstance(workflow_result, dict):
                print(f"Debug: Workflow result keys: {list(workflow_result.keys())}")
            elif isinstance(workflow_result, list):
                print(f"Debug: Workflow result is list with {len(workflow_result)} items")
                if len(workflow_result) > 0:
                    print(f"Debug: First item type: {type(workflow_result[0])}")
                    if isinstance(workflow_result[0], dict):
                        print(f"Debug: First item keys: {list(workflow_result[0].keys())}")
            raise ValueError(f"Failed to process workflow result. Error: {e}. Result type: {type(workflow_result)}")

    def _extract_detections_from_workflow(self, workflow_result, confidence_threshold: float = 0.4):
        """
        Extract detections from workflow response and filter by confidence.
        
        Args:
            workflow_result: Raw workflow response from Roboflow
            confidence_threshold: Minimum confidence threshold
            
        Returns:
            List of detection dictionaries with segmentation points
        """
        detections = []
        
        try:
            # Handle workflow response structure: [{"predictions": {"predictions": [...]}}]
            if isinstance(workflow_result, list) and len(workflow_result) > 0:
                result_item = workflow_result[0]
                if isinstance(result_item, dict) and "predictions" in result_item:
                    predictions_data = result_item["predictions"]
                    if isinstance(predictions_data, dict) and "predictions" in predictions_data:
                        predictions_list = predictions_data["predictions"]
                        
                        # Process each prediction
                        for pred in predictions_list:
                            if isinstance(pred, dict):
                                confidence = pred.get("confidence", 0.0)
                                
                                # Robust polygon extraction
                                points = self._extract_points_from_prediction(pred)
                                
                                det_id = pred.get("detection_id") or pred.get("id") or f"det_{len(detections)}"
                                detection = {
                                    'points': points,
                                    'confidence': confidence,
                                    'class': pred.get("class", "unknown"),
                                    'detection_id': det_id,
                                    'bbox': {
                                        'x': pred.get("x", 0),
                                        'y': pred.get("y", 0),
                                        'width': pred.get("width", 0),
                                        'height': pred.get("height", 0)
                                    }
                                }
                                detections.append(detection)
            
            print(f"Debug: Extracted {len(detections)} detections above confidence {confidence_threshold}")
            return detections
            
        except Exception as e:
            print(f"Debug: Error extracting detections: {e}")
            print(f"Debug: Workflow result structure: {workflow_result}")
            raise

    def _extract_inference_from_workflow(self, workflow_result):
        """
        Legacy method - kept for backward compatibility.
        Now redirects to the new workflow detection extraction.
        """
        # This method is now deprecated in favor of _extract_detections_from_workflow
        return workflow_result
    
    def process_detections(self, image, detections: List[dict]) -> Tuple[any, List[dict]]:
        """
        Process detections with segmentation points and calculate triangles.
        
        Args:
            image: PIL Image object
            detections: List of detection dictionaries with 'points' arrays
            
        Returns:
            Tuple of (processed_image, analysis_results)
        """
        # We will draw arrows on a copy of the PIL image and return it
        processed_image = image.copy()
        analysis_results = []
        
        print(f"Debug: Processing {len(detections)} detections")
        
        for i, detection in enumerate(detections):
            try:
                # Get segmentation points (already normalized by _extract_detections_from_workflow)
                points = detection.get('points', [])
                if not points:
                    print(f"Debug: Detection {i} has no points, attempting bbox fallback")
                    # Fallback: approximate polygon from bbox
                    bbox = detection.get('bbox', {})
                    x, y = bbox.get('x', 0), bbox.get('y', 0)
                    w, h = bbox.get('width', 0), bbox.get('height', 0)
                    if w and h:
                        half_w, half_h = w / 2.0, h / 2.0
                        rect_points = [
                            {'x': x - half_w, 'y': y - half_h},
                            {'x': x + half_w, 'y': y - half_h},
                            {'x': x + half_w, 'y': y + half_h},
                            {'x': x - half_w, 'y': y + half_h},
                        ]
                        points = rect_points
                        print(f"Debug: Using bbox fallback with 4 points for detection {i}")
                    else:
                        print(f"Debug: Detection {i} has neither points nor bbox; skipping")
                        continue
                
                # Convert points to list format for pure Python processing
                # Points are in format [{"x": x1, "y": y1}, {"x": x2, "y": y2}, ...]
                contour_points = []
                for point in points:
                    if isinstance(point, dict) and 'x' in point and 'y' in point:
                        contour_points.append([float(point['x']), float(point['y'])])
                    elif isinstance(point, (list, tuple)) and len(point) >= 2:
                        contour_points.append([float(point[0]), float(point[1])])
                
                if len(contour_points) < MIN_CONTOUR_POINTS:
                    print(f"Debug: Detection {i} has only {len(contour_points)} points, need at least {MIN_CONTOUR_POINTS}")
                    continue
                
                print(f"Debug: Processing detection {i} with {len(contour_points)} contour points")
                
                # Find smallest triangle
                print(f"Debug: Calling get_smallest_triangle with {len(contour_points)} points for detection {i}")
                triangle = get_smallest_triangle(contour_points)
                
                if triangle is not None:
                    print(f"Debug: Triangle found for detection {i}: {triangle}")
                    # Find shortest side and apex
                    middle_point, apex = find_shortest_side_and_apex(triangle)
                    print(f"Debug: Arrow points for detection {i}: start={middle_point}, end={apex}")
                    
                    if middle_point is not None and apex is not None:
                        # Prepare class information for visualization
                        class_info = {
                            'class_name': get_hair_strand_class_name(detection.get('class', 'unknown')),
                            'confidence': detection.get('confidence', 0.0)
                        }
                        
                        # Draw visualization elements
                        processed_image = draw_visualization_elements(
                            processed_image, triangle, middle_point, apex, contour_points, class_info
                        )
                        
                        # Store analysis results
                        det_id = detection.get('detection_id') or detection.get('id') or f'det_{i}'
                        result = {
                            'detection_id': det_id,
                            'detection_index': i,
                            'triangle_vertices': triangle,  # Store as list directly
                            'arrow_start': middle_point,    # Arrow starts from middle of shortest side
                            'arrow_end': apex,              # Arrow points to apex
                            'triangle': triangle,           # Keep for backward compatibility
                            'middle_point': middle_point,
                            'apex': apex,
                            'contour_points': len(contour_points),
                            'confidence': detection.get('confidence', 0.0),
                            'class': detection.get('class', 'unknown'),
                            'bbox': detection.get('bbox', {})
                        }
                        
                        analysis_results.append(result)
                        print(f"Debug: Successfully processed detection {i}, class: {result['class']}, confidence: {result['confidence']:.3f}")
                    else:
                        print(f"Debug: Could not find valid triangle geometry for detection {i}")
                else:
                    print(f"Debug: Could not find triangle for detection {i}")
                    
            except Exception as e:
                print(f"Debug: Error processing detection {i}: {e}")
                continue
        
        print(f"Debug: Successfully processed {len(analysis_results)} detections with triangles")
        return processed_image, analysis_results

    def _extract_points_from_prediction(self, pred: dict) -> List[dict]:
        """Extract polygon points from a Roboflow prediction dict in a robust way.
        Returns a list of {'x': float, 'y': float}.
        Supported shapes: 'points' (list of dicts), 'polygon' (flat list),
        'segmentation' (nested points), 'segments' (list of polygons)."""
        try:
            # Case 1: points already provided as list of dicts
            pts = pred.get('points')
            if isinstance(pts, list) and pts and isinstance(pts[0], dict):
                return [{'x': float(p['x']), 'y': float(p['y'])} for p in pts if 'x' in p and 'y' in p]

            # Case 2: points provided as list of [x, y]
            if isinstance(pts, list) and pts and isinstance(pts[0], (list, tuple)):
                out = []
                for p in pts:
                    if isinstance(p, (list, tuple)) and len(p) >= 2:
                        out.append({'x': float(p[0]), 'y': float(p[1])})
                if out:
                    return out

            # Case 3: polygon as flat list [x1, y1, x2, y2, ...]
            poly = pred.get('polygon') or pred.get('poly')
            if isinstance(poly, list) and len(poly) >= 6:
                it = iter(poly)
                return [{'x': float(x), 'y': float(y)} for x, y in zip(it, it)]

            # Case 4: segmentation with nested points
            seg = pred.get('segmentation') or pred.get('mask') or pred.get('points_polygon')
            if isinstance(seg, dict):
                seg_pts = seg.get('points') or seg.get('polygon')
                if isinstance(seg_pts, list):
                    out = []
                    for p in seg_pts:
                        if isinstance(p, dict) and 'x' in p and 'y' in p:
                            out.append({'x': float(p['x']), 'y': float(p['y'])})
                        elif isinstance(p, (list, tuple)) and len(p) >= 2:
                            out.append({'x': float(p[0]), 'y': float(p[1])})
                    if out:
                        return out

            # Case 5: segments as list of polygons — pick the longest
            segments = pred.get('segments') or pred.get('polygons')
            if isinstance(segments, list):
                best = []
                for seg_pts in segments:
                    candidate = []
                    if isinstance(seg_pts, list):
                        for p in seg_pts:
                            if isinstance(p, dict) and 'x' in p and 'y' in p:
                                candidate.append({'x': float(p['x']), 'y': float(p['y'])})
                            elif isinstance(p, (list, tuple)) and len(p) >= 2:
                                candidate.append({'x': float(p[0]), 'y': float(p[1])})
                    if len(candidate) > len(best):
                        best = candidate
                if best:
                    return best

        except Exception as e:
            print(f"Debug: _extract_points_from_prediction error: {e}")

        # Default: no points
        return []
    
    def process_image_file(self, image_path: str, workspace_name: str, workflow_id: str, 
                          confidence: float = 0.4, use_cache: bool = True):
        """
        Complete pipeline: load image, run workflow, and process results.
        
        Args:
            image_path: Path to the image file
            workspace_name: Roboflow workspace name
            workflow_id: Roboflow workflow ID
            confidence: Confidence threshold
            use_cache: Whether to cache workflow definition
            
        Returns:
            Tuple of (processed_image, analysis_results, detections_list)
        """
        # Load image with PIL
        try:
            image = Image.open(image_path)
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as e:
            raise ValueError(f"Could not load image from {image_path}: {e}")
        
        # Run workflow
        detections = self.run_workflow(image_path, workspace_name, workflow_id, use_cache=False)
        
        # Process detections
        processed_image, analysis_results = self.process_detections(image, detections)
        
        return processed_image, analysis_results, detections


def save_temp_image(image, temp_path: str = TEMP_IMAGE_PATH) -> str:
    """
    Save a PIL Image to a temporary file for inference.
    
    Args:
        image: PIL Image object
        temp_path: Path to save the temporary image
        
    Returns:
        Path to the saved temporary image
    """
    image.save(temp_path)
    return temp_path 