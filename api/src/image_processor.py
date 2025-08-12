"""
Image processing and inference module.
Handles Roboflow inference and detection processing.
"""

import cv2
import numpy as np
from typing import Optional, Tuple, List
from inference_sdk import InferenceHTTPClient

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
                                
                                detection = {
                                    'points': pred.get("points", []),
                                    'confidence': confidence,
                                    'class': pred.get("class", "unknown"),
                                    'detection_id': pred.get("detection_id", ""),
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
    
    def process_detections(self, image: np.ndarray, detections: List[dict]) -> Tuple[np.ndarray, List[dict]]:
        """
        Process detections with segmentation points and draw triangles and arrows.
        
        Args:
            image: Input image as numpy array
            detections: List of detection dictionaries with 'points' arrays
            
        Returns:
            Tuple of (processed_image, analysis_results)
        """
        processed_image = image.copy()
        analysis_results = []
        
        print(f"Debug: Processing {len(detections)} detections")
        
        for i, detection in enumerate(detections):
            try:
                # Get segmentation points
                points = detection.get('points', [])
                if not points:
                    print(f"Debug: Detection {i} has no points, skipping")
                    continue
                
                # Convert points to numpy array format for OpenCV
                # Points are in format [{"x": x1, "y": y1}, {"x": x2, "y": y2}, ...]
                contour_points = []
                for point in points:
                    if isinstance(point, dict) and 'x' in point and 'y' in point:
                        contour_points.append([int(point['x']), int(point['y'])])
                
                if len(contour_points) < MIN_CONTOUR_POINTS:
                    print(f"Debug: Detection {i} has only {len(contour_points)} points, need at least {MIN_CONTOUR_POINTS}")
                    continue
                
                # Convert to OpenCV contour format
                contour = np.array(contour_points, dtype=np.int32).reshape(-1, 1, 2)
                
                print(f"Debug: Processing detection {i} with {len(contour_points)} contour points")
                
                # Find smallest triangle
                triangle = get_smallest_triangle(contour)
                
                if triangle is not None:
                    # Find shortest side and apex
                    middle_point, apex = find_shortest_side_and_apex(triangle)
                    
                    if middle_point is not None and apex is not None:
                        # Prepare class information for visualization
                        class_info = {
                            'class_name': get_hair_strand_class_name(detection.get('class', 'unknown')),
                            'confidence': detection.get('confidence', 0.0)
                        }
                        
                        # Draw visualization elements
                        processed_image = draw_visualization_elements(
                            processed_image, triangle, middle_point, apex, contour, class_info
                        )
                        
                        # Store analysis results
                        result = {
                            'detection_id': detection.get('detection_id', f'det_{i}'),
                            'detection_index': i,
                            'triangle': triangle.tolist() if triangle is not None else None,
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
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        
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