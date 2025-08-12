"""
Triangle detection and geometric analysis module.
Contains functions for finding minimum area triangles and calculating directions.
"""

import cv2
import numpy as np
from typing import Optional, Tuple


def get_smallest_triangle(contour: np.ndarray) -> Optional[np.ndarray]:
    """
    Find the smallest triangle that encloses the given contour using OpenCV's minEnclosingTriangle.
    
    Args:
        contour: Input contour as numpy array
        
    Returns:
        Triangle vertices as numpy array of shape (3, 2) or None if not found
    """
    try:
        # Convert contour to the required format for OpenCV: (N, 1, 2) as float32
        if contour.dtype != np.float32:
            points = contour.astype(np.float32)
        else:
            points = contour.copy()
        
        # Ensure the shape is correct for cv2.minEnclosingTriangle
        if len(points.shape) == 3 and points.shape[1] == 1:
            # Already in correct shape (N, 1, 2)
            pass
        elif len(points.shape) == 2 and points.shape[1] == 2:
            # Reshape from (N, 2) to (N, 1, 2)
            points = points.reshape(-1, 1, 2)
        else:
            print(f"Debug: Unexpected contour shape: {points.shape}")
            return None
        
        if len(points) < 3:
            print(f"Debug: Not enough points for triangle: {len(points)}")
            return None
        
        # Use OpenCV's optimized minimum enclosing triangle function
        area, triangle = cv2.minEnclosingTriangle(points)
        
        if area <= 0:
            print(f"Debug: Invalid triangle area: {area}")
            return None
            
        # Convert triangle from (3, 1, 2) to (3, 2) format
        triangle_vertices = triangle.reshape(3, 2)
        
        print(f"Debug: Found triangle with area {area:.2f}")
        return triangle_vertices
        
    except Exception as e:
        print(f"Debug: Error in get_smallest_triangle: {e}")
        return None


def find_shortest_side_and_apex(triangle: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
    """
    Find the shortest side of the triangle and its opposite apex.
    
    Args:
        triangle: Triangle vertices as numpy array of shape (3, 2)
        
    Returns:
        Tuple of (middle_point, apex) where:
        - middle_point: Middle point of shortest side
        - apex: The vertex opposite to shortest side
    """
    if triangle is None or len(triangle) != 3:
        return None, None
    
    # Calculate side lengths
    side_lengths = []
    for i in range(3):
        p1 = triangle[i]
        p2 = triangle[(i + 1) % 3]
        length = np.linalg.norm(p2 - p1)
        side_lengths.append((length, i, p1, p2))
    
    # Find shortest side
    shortest = min(side_lengths, key=lambda x: x[0])
    _, side_idx, p1, p2 = shortest
    
    # Calculate middle point of shortest side
    middle_point = (p1 + p2) / 2
    
    # Find apex (the point not on the shortest side)
    apex_idx = (side_idx + 2) % 3  # The opposite vertex
    apex = triangle[apex_idx]
    
    return middle_point, apex


def calculate_triangle_properties(triangle: np.ndarray) -> dict:
    """
    Calculate various properties of a triangle.
    
    Args:
        triangle: Triangle vertices as numpy array of shape (3, 2)
        
    Returns:
        Dictionary with triangle properties
    """
    if triangle is None or len(triangle) != 3:
        return {}
    
    # Calculate side lengths
    sides = []
    for i in range(3):
        p1 = triangle[i]
        p2 = triangle[(i + 1) % 3]
        length = np.linalg.norm(p2 - p1)
        sides.append(length)
    
    # Calculate area
    area = abs(np.cross(triangle[1] - triangle[0], triangle[2] - triangle[0])) / 2
    
    # Calculate perimeter
    perimeter = sum(sides)
    
    # Calculate centroid
    centroid = np.mean(triangle, axis=0)
    
    return {
        'area': area,
        'perimeter': perimeter,
        'sides': sides,
        'shortest_side': min(sides),
        'longest_side': max(sides),
        'centroid': centroid
    } 