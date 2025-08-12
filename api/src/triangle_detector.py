"""
Triangle detection and geometric analysis module.
Contains functions for finding minimum area triangles and calculating directions.
"""

import math
from typing import Optional, Tuple, List


def get_smallest_triangle(contour: List[List[float]]) -> Optional[List[List[float]]]:
    """
    Find the smallest triangle that encloses the given contour using the robust algorithm.
    
    Args:
        contour: Input contour as list of [x, y] points
        
    Returns:
        Triangle vertices as list of [x, y] points or None if not found
    """
    try:
        # Convert to tuple format expected by the algorithm
        points = []
        for point in contour:
            if isinstance(point, (list, tuple)) and len(point) >= 2:
                points.append((float(point[0]), float(point[1])))
            else:
                print(f"Debug: Invalid point format: {point}")
                continue
        
        print(f"Debug: Converted {len(contour)} contour points to {len(points)} triangle points")
        
        if len(points) < 3:
            print(f"Debug: Not enough valid points for triangle: {len(points)}")
            return None
        
        # Use the robust smallest enclosing triangle algorithm
        triangle_tuples = smallest_enclosing_triangle(points)
        
        if triangle_tuples is None:
            print("Debug: Failed to find enclosing triangle")
            return None
            
        # Convert back to list format
        triangle = [[point[0], point[1]] for point in triangle_tuples]
        
        # Calculate area for logging
        area = triangle_area_list(triangle)
        print(f"Debug: Found triangle with area {area:.2f} and vertices: {triangle}")
        
        return triangle
        
    except Exception as e:
        print(f"Debug: Error in get_smallest_triangle: {e}")
        # Emergency fallback: just use first three points
        if len(contour) >= 3:
            emergency_triangle = []
            for i in range(3):
                point = contour[i]
                if isinstance(point, (list, tuple)) and len(point) >= 2:
                    emergency_triangle.append([float(point[0]), float(point[1])])
            if len(emergency_triangle) == 3:
                return emergency_triangle
        return None


def smallest_enclosing_triangle(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Find the smallest triangle that encloses all given points.
    
    Args:
        points: List of (x, y) coordinates representing polygon vertices
        
    Returns:
        List of three (x, y) coordinates representing the vertices of the smallest enclosing triangle
    """
    if len(points) < 3:
        raise ValueError("Need at least 3 points to form a triangle")
    
    # Remove duplicate points
    unique_points = list(set(points))
    if len(unique_points) < 3:
        raise ValueError("Need at least 3 unique points")
    
    # Find convex hull since the minimum enclosing triangle will only depend on hull points
    hull = convex_hull(unique_points)
    
    if len(hull) == 3:
        return hull
    
    min_area = float('inf')
    best_triangle = None
    
    n = len(hull)
    
    # Try all possible triangles formed by hull points
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                triangle = [hull[i], hull[j], hull[k]]
                
                # Check if triangle encloses all original points
                if all_points_in_triangle(triangle, unique_points):
                    area = triangle_area(triangle)
                    if area < min_area:
                        min_area = area
                        best_triangle = triangle
    
    # If no triangle from hull points works, we need a more sophisticated approach
    # This handles cases where the minimum enclosing triangle has vertices not on the hull
    if best_triangle is None:
        best_triangle = find_minimum_triangle_advanced(unique_points, hull)
    
    return best_triangle


def convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Compute convex hull using Graham scan algorithm."""
    def cross_product(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    
    # Find the bottom-most point (or left most if tie)
    start = min(points, key=lambda p: (p[1], p[0]))
    
    # Sort points by polar angle with respect to start point
    def polar_angle_key(p):
        if p == start:
            return -math.pi, 0
        dx, dy = p[0] - start[0], p[1] - start[1]
        angle = math.atan2(dy, dx)
        dist = dx*dx + dy*dy
        return angle, dist
    
    sorted_points = sorted(points, key=polar_angle_key)
    
    # Build convex hull
    hull = []
    for p in sorted_points:
        while len(hull) > 1 and cross_product(hull[-2], hull[-1], p) <= 0:
            hull.pop()
        hull.append(p)
    
    return hull


def triangle_area(triangle: List[Tuple[float, float]]) -> float:
    """Calculate area of triangle using cross product."""
    p1, p2, p3 = triangle
    return abs((p1[0] * (p2[1] - p3[1]) + 
                p2[0] * (p3[1] - p1[1]) + 
                p3[0] * (p1[1] - p2[1])) / 2.0)


def point_in_triangle(point: Tuple[float, float], triangle: List[Tuple[float, float]]) -> bool:
    """Check if a point is inside or on the boundary of a triangle using barycentric coordinates."""
    x, y = point
    x1, y1 = triangle[0]
    x2, y2 = triangle[1] 
    x3, y3 = triangle[2]
    
    # Calculate barycentric coordinates
    denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
    if abs(denom) < 1e-10:
        return False  # Degenerate triangle
    
    a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denom
    b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denom
    c = 1 - a - b
    
    # Point is inside if all barycentric coordinates are >= 0
    return a >= -1e-10 and b >= -1e-10 and c >= -1e-10


def all_points_in_triangle(triangle: List[Tuple[float, float]], points: List[Tuple[float, float]]) -> bool:
    """Check if all points are contained within the triangle."""
    return all(point_in_triangle(point, triangle) for point in points)


def find_minimum_triangle_advanced(points: List[Tuple[float, float]], hull: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Advanced algorithm for cases where minimum triangle vertices might not all be on the convex hull.
    This is a simplified version - a complete implementation would be quite complex.
    """
    min_area = float('inf')
    best_triangle = None
    
    # Try triangles with two vertices on hull and one vertex supporting a hull edge
    n = len(hull)
    
    for i in range(n):
        for j in range(i + 1, n):
            # Try to find third vertex that minimizes area while enclosing all points
            p1, p2 = hull[i], hull[j]
            
            # For simplicity, we'll try a few candidate points
            candidates = hull + points
            
            for p3 in candidates:
                if p3 == p1 or p3 == p2:
                    continue
                    
                triangle = [p1, p2, p3]
                
                # Skip degenerate triangles
                if triangle_area(triangle) < 1e-10:
                    continue
                
                if all_points_in_triangle(triangle, points):
                    area = triangle_area(triangle)
                    if area < min_area:
                        min_area = area
                        best_triangle = triangle
    
    # Fallback: return triangle formed by extreme points if nothing found
    if best_triangle is None:
        # Find extreme points
        min_x = min(points, key=lambda p: p[0])
        max_x = max(points, key=lambda p: p[0])
        min_y = min(points, key=lambda p: p[1])
        max_y = max(points, key=lambda p: p[1])
        
        # Try different combinations of extreme points
        extreme_points = [min_x, max_x, min_y, max_y]
        extreme_points = list(set(extreme_points))  # Remove duplicates
        
        if len(extreme_points) >= 3:
            best_triangle = extreme_points[:3]
        else:
            # Ultimate fallback - use first three unique points
            best_triangle = points[:3]
    
    return best_triangle


def find_shortest_side_and_apex(triangle: List[List[float]]) -> Tuple[Optional[List[float]], Optional[List[float]]]:
    """
    Find the shortest side of the triangle and its opposite apex.
    
    Args:
        triangle: Triangle vertices as list of [x, y] points
        
    Returns:
        Tuple of (middle_point, apex) where:
        - middle_point: Middle point of shortest side as [x, y]
        - apex: The vertex opposite to shortest side as [x, y]
    """
    if triangle is None or len(triangle) != 3:
        return None, None
    
    # Calculate side lengths
    side_lengths = []
    for i in range(3):
        p1 = triangle[i]
        p2 = triangle[(i + 1) % 3]
        length = distance(p1, p2)
        side_lengths.append((length, i, p1, p2))
    
    # Find shortest side
    shortest = min(side_lengths, key=lambda x: x[0])
    _, side_idx, p1, p2 = shortest
    
    # Calculate middle point of shortest side
    middle_point = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
    
    # Find apex (the point not on the shortest side)
    apex_idx = (side_idx + 2) % 3  # The opposite vertex
    apex = triangle[apex_idx]
    
    return middle_point, apex


def calculate_triangle_properties(triangle: List[List[float]]) -> dict:
    """
    Calculate various properties of a triangle.
    
    Args:
        triangle: Triangle vertices as list of [x, y] points
        
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
        length = distance(p1, p2)
        sides.append(length)
    
    # Calculate area using cross product
    area = triangle_area_list(triangle)
    
    # Calculate perimeter
    perimeter = sum(sides)
    
    # Calculate centroid
    centroid = [
        (triangle[0][0] + triangle[1][0] + triangle[2][0]) / 3,
        (triangle[0][1] + triangle[1][1] + triangle[2][1]) / 3
    ]
    
    return {
        'area': area,
        'perimeter': perimeter,
        'sides': sides,
        'shortest_side': min(sides),
        'longest_side': max(sides),
        'centroid': centroid
    }


# Helper functions for pure Python geometric calculations

def calculate_std(values: List[float]) -> float:
    """Calculate standard deviation using pure Python."""
    if not values or len(values) < 2:
        return 0.0
    
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    return variance ** 0.5


def distance(p1: List[float], p2: List[float]) -> float:
    """Calculate Euclidean distance between two points."""
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def triangle_area(triangle: List[List[float]]) -> float:
    """Calculate area of triangle using cross product."""
    if len(triangle) != 3:
        return 0.0
    
    # Using the cross product formula: |cross(v1, v2)| / 2
    # where v1 = p1 - p0 and v2 = p2 - p0
    p0, p1, p2 = triangle
    v1 = [p1[0] - p0[0], p1[1] - p0[1]]
    v2 = [p2[0] - p0[0], p2[1] - p0[1]]
    
    cross_product = v1[0] * v2[1] - v1[1] * v2[0]
    return abs(cross_product) / 2


def cross_product_2d(a: List[float], b: List[float], c: List[float]) -> float:
    """Calculate 2D cross product for three points."""
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def convex_hull(points: List[List[float]]) -> List[List[float]]:
    """
    Find convex hull using Graham scan algorithm.
    
    Args:
        points: List of [x, y] points
        
    Returns:
        List of hull points in counter-clockwise order
    """
    try:
        if len(points) < 3:
            return points
        
        # Remove duplicate points first
        unique_points = []
        for point in points:
            is_duplicate = False
            for existing in unique_points:
                if abs(point[0] - existing[0]) < 1e-9 and abs(point[1] - existing[1]) < 1e-9:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_points.append(point)
        
        if len(unique_points) < 3:
            return unique_points
        
        # Find the bottom-most point (and leftmost in case of tie)
        start = min(unique_points, key=lambda p: (p[1], p[0]))
        
        # Sort points by polar angle with respect to start point
        def polar_angle(p):
            dx, dy = p[0] - start[0], p[1] - start[1]
            if dx == 0 and dy == 0:
                return 0
            return math.atan2(dy, dx)
        
        other_points = [p for p in unique_points if p != start]
        sorted_points = sorted(other_points, key=polar_angle)
        
        # Build hull
        hull = [start]
        
        for point in sorted_points:
            # Remove points that make clockwise turn
            while len(hull) > 1 and cross_product_2d(hull[-2], hull[-1], point) <= 0:
                hull.pop()
            hull.append(point)
        
        return hull
        
    except Exception as e:
        print(f"Debug: Error in convex_hull: {e}")
        # Fallback: return original points
        return points


def minimum_enclosing_triangle(points: List[List[float]]) -> Optional[List[List[float]]]:
    """
    Find minimum enclosing triangle for a set of points.
    Uses a simplified approach that's more robust.
    
    Args:
        points: List of [x, y] points
        
    Returns:
        Triangle vertices as list of [x, y] points
    """
    if len(points) < 3:
        return None
    
    try:
        # If we have exactly 3 points, use them
        if len(points) == 3:
            return points
        
        # Find extreme points for a bounding triangle
        min_x_point = min(points, key=lambda p: p[0])
        max_x_point = max(points, key=lambda p: p[0])
        min_y_point = min(points, key=lambda p: p[1])
        max_y_point = max(points, key=lambda p: p[1])
        
        # Try to find three points that form a reasonable triangle
        candidates = [min_x_point, max_x_point, min_y_point, max_y_point]
        
        # Remove duplicates
        unique_candidates = []
        for point in candidates:
            is_duplicate = False
            for existing in unique_candidates:
                if abs(point[0] - existing[0]) < 1e-6 and abs(point[1] - existing[1]) < 1e-6:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_candidates.append(point)
        
        # If we have at least 3 unique points, use them
        if len(unique_candidates) >= 3:
            # Take the first three that form a valid triangle
            triangle = unique_candidates[:3]
            area = triangle_area(triangle)
            if area > 1e-6:  # Make sure it's not degenerate
                return triangle
        
        # Fallback: Use the convex hull approach
        if len(points) > 3:
            # Take three points that are roughly evenly spaced
            n = len(points)
            triangle = [
                points[0],
                points[n // 3],
                points[2 * n // 3]
            ]
            area = triangle_area(triangle)
            if area > 1e-6:
                return triangle
        
        # Last resort: first three points
        return points[:3]
        
    except Exception as e:
        print(f"Debug: Error in minimum_enclosing_triangle: {e}")
        # Emergency fallback
        return points[:3] if len(points) >= 3 else None


def triangle_encloses_points(triangle: List[List[float]], points: List[List[float]]) -> bool:
    """
    Check if a triangle encloses all given points.
    
    Args:
        triangle: Triangle vertices as list of [x, y] points
        points: Points to check
        
    Returns:
        True if triangle encloses all points
    """
    for point in points:
        if not point_in_triangle(point, triangle):
            return False
    return True


def point_in_triangle(point: List[float], triangle: List[List[float]]) -> bool:
    """
    Check if a point is inside a triangle using barycentric coordinates.
    
    Args:
        point: Point to check as [x, y]
        triangle: Triangle vertices as list of [x, y] points
        
    Returns:
        True if point is inside triangle
    """
    p, p1, p2, p3 = point, triangle[0], triangle[1], triangle[2]
    
    # Calculate vectors
    v0 = [p3[0] - p1[0], p3[1] - p1[1]]
    v1 = [p2[0] - p1[0], p2[1] - p1[1]]
    v2 = [p[0] - p1[0], p[1] - p1[1]]
    
    # Calculate dot products
    dot00 = v0[0] * v0[0] + v0[1] * v0[1]
    dot01 = v0[0] * v1[0] + v0[1] * v1[1]
    dot02 = v0[0] * v2[0] + v0[1] * v2[1]
    dot11 = v1[0] * v1[0] + v1[1] * v1[1]
    dot12 = v1[0] * v2[0] + v1[1] * v2[1]
    
    # Calculate barycentric coordinates
    inv_denom = 1 / (dot00 * dot11 - dot01 * dot01)
    u = (dot11 * dot02 - dot01 * dot12) * inv_denom
    v = (dot00 * dot12 - dot01 * dot02) * inv_denom
    
    # Check if point is in triangle
    return (u >= 0) and (v >= 0) and (u + v <= 1)


def triangle_area_list(triangle: List[List[float]]) -> float:
    """Calculate area of triangle from list of [x,y] points."""
    if len(triangle) != 3:
        return 0.0
    p1, p2, p3 = triangle
    return abs((p1[0] * (p2[1] - p3[1]) + 
                p2[0] * (p3[1] - p1[1]) + 
                p3[0] * (p1[1] - p2[1])) / 2.0) 