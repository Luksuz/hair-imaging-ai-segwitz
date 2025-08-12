"""
Utility functions for the Hair Follicle Segmentation app.
Contains drawing functions and other helper utilities.
"""

import cv2
import numpy as np
from typing import Tuple

from .config import (
    COLORS, TRIANGLE_THICKNESS, ARROW_THICKNESS, POINT_RADIUS, 
    CONTOUR_THICKNESS, ARROW_TIP_LENGTH
)


def draw_arrow(image: np.ndarray, start_point: np.ndarray, end_point: np.ndarray, 
               color: Tuple[int, int, int] = COLORS['arrow'], 
               thickness: int = ARROW_THICKNESS) -> np.ndarray:
    """
    Draw an arrow from start_point to end_point.
    
    Args:
        image: Input image
        start_point: Starting point of the arrow
        end_point: Ending point of the arrow
        color: BGR color tuple
        thickness: Line thickness
        
    Returns:
        Image with arrow drawn
    """
    start_point = tuple(map(int, start_point))
    end_point = tuple(map(int, end_point))
    
    # Draw the arrow
    cv2.arrowedLine(image, start_point, end_point, color, thickness, tipLength=ARROW_TIP_LENGTH)
    
    return image


def draw_triangle(image: np.ndarray, triangle: np.ndarray, 
                 color: Tuple[int, int, int] = COLORS['triangle'], 
                 thickness: int = TRIANGLE_THICKNESS) -> np.ndarray:
    """
    Draw a triangle on the image.
    
    Args:
        image: Input image
        triangle: Triangle vertices as numpy array
        color: BGR color tuple
        thickness: Line thickness
        
    Returns:
        Image with triangle drawn
    """
    cv2.polylines(image, [triangle.astype(np.int32)], True, color, thickness)
    return image


def draw_point(image: np.ndarray, point: np.ndarray, 
               color: Tuple[int, int, int], radius: int = POINT_RADIUS) -> np.ndarray:
    """
    Draw a point (filled circle) on the image.
    
    Args:
        image: Input image
        point: Point coordinates
        color: BGR color tuple
        radius: Circle radius
        
    Returns:
        Image with point drawn
    """
    cv2.circle(image, tuple(map(int, point)), radius, color, -1)
    return image


def draw_contour(image: np.ndarray, contour: np.ndarray, 
                color: Tuple[int, int, int] = COLORS['contour'], 
                thickness: int = CONTOUR_THICKNESS) -> np.ndarray:
    """
    Draw a contour on the image.
    
    Args:
        image: Input image
        contour: Contour points
        color: BGR color tuple
        thickness: Line thickness
        
    Returns:
        Image with contour drawn
    """
    cv2.polylines(image, [contour], True, color, thickness)
    return image


def draw_visualization_elements(image: np.ndarray, triangle: np.ndarray, 
                               middle_point: np.ndarray, apex: np.ndarray, 
                               contour: np.ndarray, class_info: dict = None) -> np.ndarray:
    """
    Draw visualization elements for a single detection - colored arrows only.
    
    Args:
        image: Input image
        triangle: Triangle vertices (used for calculations but not drawn)
        middle_point: Middle point of shortest side
        apex: Apex point
        contour: Original contour (not drawn)
        class_info: Dictionary with class information for color selection
        
    Returns:
        Image with colored arrow drawn
    """
    # Determine arrow color based on class
    from .config import HAIR_STRAND_COLORS
    
    arrow_color = HAIR_STRAND_COLORS['default']  # Default green
    
    if class_info:
        class_id = class_info.get('class_id', 0)
        class_name = class_info.get('class_name', '')
        
        # Try class ID first, then class name
        if class_id in HAIR_STRAND_COLORS:
            arrow_color = HAIR_STRAND_COLORS[class_id]
        elif class_name in HAIR_STRAND_COLORS:
            arrow_color = HAIR_STRAND_COLORS[class_name]
    
    # Draw colored arrow from middle of shortest side to apex
    image = draw_arrow_with_color(image, middle_point, apex, arrow_color)
    
    return image


def draw_arrow_with_color(image: np.ndarray, start_point: np.ndarray, end_point: np.ndarray, color: tuple) -> np.ndarray:
    """
    Draw an arrow with specified color.
    
    Args:
        image: Input image
        start_point: Starting point of the arrow
        end_point: End point of the arrow (tip)
        color: BGR color tuple
        
    Returns:
        Image with arrow drawn
    """
    from .config import ARROW_THICKNESS, ARROW_TIP_LENGTH
    
    start_point = tuple(map(int, start_point))
    end_point = tuple(map(int, end_point))
    
    # Draw arrow line and tip
    cv2.arrowedLine(
        image, 
        start_point, 
        end_point, 
        color, 
        ARROW_THICKNESS, 
        tipLength=ARROW_TIP_LENGTH
    )
    
    return image


def convert_bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """
    Convert BGR image to RGB for display in Streamlit.
    
    Args:
        image: BGR image array
        
    Returns:
        RGB image array
    """
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def convert_rgb_to_bgr(image: np.ndarray) -> np.ndarray:
    """
    Convert RGB image to BGR for OpenCV processing.
    
    Args:
        image: RGB image array
        
    Returns:
        BGR image array
    """
    if len(image.shape) == 3 and image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return image


def format_confidence(confidence: float) -> str:
    """
    Format confidence value as percentage string.
    
    Args:
        confidence: Confidence value (0-1)
        
    Returns:
        Formatted percentage string
    """
    return f"{confidence:.1%}"


def validate_workspace_name(workspace_name: str) -> bool:
    """
    Validate that workspace name is not empty.
    
    Args:
        workspace_name: Workspace name string
        
    Returns:
        True if valid, False otherwise
    """
    return bool(workspace_name and workspace_name.strip())


def validate_workflow_id(workflow_id: str) -> bool:
    """
    Validate that workflow ID is not empty.
    
    Args:
        workflow_id: Workflow ID string
        
    Returns:
        True if valid, False otherwise
    """
    return bool(workflow_id and workflow_id.strip())


def get_image_info(image: np.ndarray) -> dict:
    """
    Get basic information about an image.
    
    Args:
        image: Input image array
        
    Returns:
        Dictionary with image information
    """
    if image is None:
        return {}
    
    height, width = image.shape[:2]
    channels = image.shape[2] if len(image.shape) > 2 else 1
    
    return {
        'width': width,
        'height': height,
        'channels': channels,
        'shape': image.shape,
        'dtype': str(image.dtype)
    } 


def get_hair_strand_class_name(class_name: str) -> str:
    """
    Extract hair strand strength name from class name.
    
    Args:
        class_name: Class name from detection (e.g., "weak_follicle", "medium_follicle", "strong_follicle")
        
    Returns:
        Human-readable hair strand strength name (strong, medium, weak)
    """
    if not class_name:
        return "unknown"
    
    class_lower = class_name.lower()
    
    # Extract strength from follicle class names
    if "strong" in class_lower:
        return "strong"
    elif "medium" in class_lower:
        return "medium"
    elif "weak" in class_lower:
        return "weak"
    
    # Default fallback
    return "unknown" 


def generate_hair_analysis_report(detections: list, analysis_results: list, image_info: dict = None) -> dict:
    """
    Generate a comprehensive hair analysis report with statistics and distribution.
    
    Args:
        detections: List of detection dictionaries
        analysis_results: List of analysis result dictionaries
        image_info: Dictionary with image information (width, height, etc.)
        
    Returns:
        Dictionary containing comprehensive analysis statistics
    """
    if not detections:
        return {
            'total_count': 0,
            'class_distribution': {},
            'confidence_stats': {},
            'error': 'No detections found'
        }
    
    # Count hair strands by class
    class_counts = {'strong': 0, 'medium': 0, 'weak': 0}
    confidence_values = []
    class_confidences = {'strong': [], 'medium': [], 'weak': []}
    
    for detection in detections:
        confidence = detection.get('confidence', 0.0)
        confidence_values.append(confidence)
        
        # Determine class
        class_name = detection.get('class', '')
        
        # Map to hair strand type
        hair_class = get_hair_strand_class_name(class_name)
        
        if hair_class in class_counts:
            class_counts[hair_class] += 1
            class_confidences[hair_class].append(confidence)
    
    # Calculate total
    total_count = sum(class_counts.values())
    
    # Calculate percentages
    class_percentages = {}
    for class_type, count in class_counts.items():
        class_percentages[class_type] = (count / total_count * 100) if total_count > 0 else 0
    
    # Calculate confidence statistics
    confidence_stats = {
        'overall': {
            'average': float(np.mean(confidence_values)) if confidence_values else 0.0,
            'min': float(np.min(confidence_values)) if confidence_values else 0.0,
            'max': float(np.max(confidence_values)) if confidence_values else 0.0,
            'std': float(np.std(confidence_values)) if confidence_values else 0.0
        }
    }
    
    # Per-class confidence stats
    for class_type, confidences in class_confidences.items():
        if confidences:
            confidence_stats[class_type] = {
                'average': float(np.mean(confidences)),
                'min': float(np.min(confidences)),
                'max': float(np.max(confidences)),
                'count': len(confidences)
            }
        else:
            confidence_stats[class_type] = {
                'average': 0.0,
                'min': 0.0,
                'max': 0.0,
                'count': 0
            }
    
    # Calculate ratios
    strong_count = class_counts['strong']
    weak_count = class_counts['weak']
    medium_count = class_counts['medium']
    
    # Terminal-Vellus ratio (strong:weak)
    terminal_vellus_ratio = f"{strong_count}:{weak_count}" if weak_count > 0 else f"{strong_count}:0"
    
    # Strong-Medium ratio
    strong_medium_ratio = f"{strong_count}:{medium_count}" if medium_count > 0 else f"{strong_count}:0"
    
    # Calculate triangle success rate
    triangle_success_count = len(analysis_results)
    triangle_success_rate = (triangle_success_count / total_count * 100) if total_count > 0 else 0
    
    # Image statistics
    image_stats = {}
    if image_info:
        image_stats = {
            'width': image_info.get('width', 0),
            'height': image_info.get('height', 0),
            'total_pixels': image_info.get('width', 0) * image_info.get('height', 0)
        }
    
    return {
        'total_count': total_count,
        'class_counts': class_counts,
        'class_percentages': class_percentages,
        'confidence_stats': confidence_stats,
        'ratios': {
            'terminal_vellus': terminal_vellus_ratio,
            'strong_medium': strong_medium_ratio,
            'strong_percentage': class_percentages.get('strong', 0),
            'medium_percentage': class_percentages.get('medium', 0),
            'weak_percentage': class_percentages.get('weak', 0)
        },
        'triangle_analysis': {
            'successful_triangles': triangle_success_count,
            'success_rate': triangle_success_rate
        },
        'image_info': image_stats
    } 


def generate_hair_analysis_pdf(report: dict, image_info: dict = None) -> bytes:
    """
    Generate a PDF report for hair follicle analysis.
    
    Args:
        report: Hair analysis report dictionary
        image_info: Image information dictionary
        
    Returns:
        PDF report as bytes
    """
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing, Rect
    from reportlab.graphics.charts.piecharts import Pie
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.platypus.flowables import Flowable
    from io import BytesIO
    import datetime
    
    # Create a BytesIO buffer to hold the PDF
    buffer = BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1,  # Center alignment
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkblue,
        borderWidth=1,
        borderColor=colors.darkblue,
        borderPadding=5
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        spaceAfter=8,
        textColor=colors.black
    )
    
    # Story to hold all elements
    story = []
    
    # Title
    story.append(Paragraph("Hair Follicle Segmentation & Analysis Report", title_style))
    story.append(Spacer(1, 20))
    
    # Report metadata
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metadata_data = [
        ["Report Date:", current_time],
        ["Analysis Type:", "Hair Follicle Segmentation & Triangle Detection"],
        ["Total Detections:", str(report.get('total_count', 0))],
        ["Analysis Success Rate:", f"{report.get('triangle_analysis', {}).get('success_rate', 0):.1f}%"]
    ]
    
    if image_info:
        metadata_data.extend([
            ["Image Resolution:", f"{image_info.get('width', 0)} × {image_info.get('height', 0)} pixels"],
            ["Image Size:", f"{image_info.get('total_pixels', 0):,} pixels"]
        ])
    
    metadata_table = Table(metadata_data, colWidths=[2*inch, 3*inch])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(metadata_table)
    story.append(Spacer(1, 20))
    
    # Hair Count Summary
    story.append(Paragraph("Hair Follicle Count Summary", heading_style))
    story.append(Spacer(1, 12))
    
    class_counts = report.get('class_counts', {})
    class_percentages = report.get('class_percentages', {})
    
    count_data = [
        ["Hair Follicle Type", "Count", "Percentage", "Color Code"],
        ["Strong Hair Follicles", str(class_counts.get('strong', 0)), f"{class_percentages.get('strong', 0):.1f}%", "Green"],
        ["Medium Hair Follicles", str(class_counts.get('medium', 0)), f"{class_percentages.get('medium', 0):.1f}%", "Yellow"],
        ["Weak Hair Follicles", str(class_counts.get('weak', 0)), f"{class_percentages.get('weak', 0):.1f}%", "Red"],
        ["TOTAL", str(report.get('total_count', 0)), "100.0%", "-"]
    ]
    
    count_table = Table(count_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
    count_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('BACKGROUND', (0, 1), (-1, 1), colors.lightgreen),
        ('BACKGROUND', (0, 2), (-1, 2), colors.lightyellow),
        ('BACKGROUND', (0, 3), (-1, 3), colors.lightcoral),
    ]))
    
    story.append(count_table)
    story.append(Spacer(1, 20))
    
    # Analysis Metrics
    story.append(Paragraph("Analysis Metrics", heading_style))
    story.append(Spacer(1, 12))
    
    ratios = report.get('ratios', {})
    triangle_analysis = report.get('triangle_analysis', {})
    
    metrics_data = [
        ["Metric", "Value", "Description"],
        ["Terminal-Vellus Ratio", ratios.get('terminal_vellus', 'N/A'), "Strong:Weak hair follicle ratio"],
        ["Strong-Medium Ratio", ratios.get('strong_medium', 'N/A'), "Strong:Medium hair follicle ratio"],
        ["Triangle Success Rate", f"{triangle_analysis.get('success_rate', 0):.1f}%", "Successful directional analyses"],
        ["Strong Follicle %", f"{ratios.get('strong_percentage', 0):.1f}%", "Percentage of strong follicles"],
        ["Medium Follicle %", f"{ratios.get('medium_percentage', 0):.1f}%", "Percentage of medium follicles"],
        ["Weak Follicle %", f"{ratios.get('weak_percentage', 0):.1f}%", "Percentage of weak follicles"]
    ]
    
    metrics_table = Table(metrics_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(metrics_table)
    story.append(Spacer(1, 20))
    
    # Confidence Statistics
    story.append(Paragraph("Detection Confidence Statistics", heading_style))
    story.append(Spacer(1, 12))
    
    confidence_stats = report.get('confidence_stats', {})
    
    conf_data = [
        ["Hair Type", "Count", "Average Confidence", "Min Confidence", "Max Confidence"],
    ]
    
    for hair_type in ['strong', 'medium', 'weak']:
        conf_info = confidence_stats.get(hair_type, {})
        if conf_info.get('count', 0) > 0:
            conf_data.append([
                hair_type.capitalize(),
                str(conf_info.get('count', 0)),
                f"{conf_info.get('average', 0):.1%}",
                f"{conf_info.get('min', 0):.1%}",
                f"{conf_info.get('max', 0):.1%}"
            ])
        else:
            conf_data.append([hair_type.capitalize(), "0", "N/A", "N/A", "N/A"])
    
    # Overall statistics
    overall_conf = confidence_stats.get('overall', {})
    conf_data.append([
        "Overall",
        str(report.get('total_count', 0)),
        f"{overall_conf.get('average', 0):.1%}",
        f"{overall_conf.get('min', 0):.1%}",
        f"{overall_conf.get('max', 0):.1%}"
    ])
    
    conf_table = Table(conf_data, colWidths=[1.5*inch, 1*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    conf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
    ]))
    
    story.append(conf_table)
    story.append(Spacer(1, 20))
    
    # Summary and Interpretation
    story.append(Paragraph("Analysis Summary", heading_style))
    story.append(Spacer(1, 12))
    
    # Determine dominant hair type
    dominant_type = max(class_counts, key=class_counts.get) if class_counts else "unknown"
    dominant_count = class_counts.get(dominant_type, 0)
    
    summary_text = f"""
    <b>Clinical Findings:</b><br/>
    • Total hair follicles detected: {report.get('total_count', 0)}<br/>
    • Successful directional analyses: {triangle_analysis.get('successful_triangles', 0)} ({triangle_analysis.get('success_rate', 0):.1f}%)<br/>
    • Dominant hair follicle type: <b>{dominant_type.capitalize()}</b> ({dominant_count} follicles, {class_percentages.get(dominant_type, 0):.1f}%)<br/>
    • Terminal-Vellus ratio: {ratios.get('terminal_vellus', 'N/A')}<br/>
    • Average detection confidence: {overall_conf.get('average', 0):.1%}<br/><br/>
    
    <b>Interpretation:</b><br/>
    This analysis provides a quantitative assessment of hair follicle distribution and strength classification. 
    The color-coded directional arrows in the processed image indicate hair follicle orientation and strength, 
    with green representing strong follicles, yellow for medium strength, and red for weak follicles.
    """
    
    story.append(Paragraph(summary_text, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Footer
    footer_text = f"""
    <i>Report generated by Hair Follicle Segmentation & Triangle Detection System<br/>
    Generated on: {current_time}<br/>
    Analysis Method: Roboflow Workflow + OpenCV Triangle Detection</i>
    """
    
    story.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    
    # Get the value of the BytesIO buffer and return it
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data 


def crop_black_borders(image, threshold: int = 10) -> np.ndarray:
    """
    Remove rows and columns that are almost fully black from an image.
    
    Args:
        image: Input image as numpy array (BGR or RGB)
        threshold: Threshold for what constitutes "almost black" (0-255)
        
    Returns:
        Cropped image with black borders removed
    """
    try:
        # Convert to grayscale for border detection
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Find rows and columns that are not almost black
        row_means = np.mean(gray, axis=1)  # Average across width
        col_means = np.mean(gray, axis=0)  # Average across height
        
        # Find first and last non-black rows
        non_black_rows = np.where(row_means > threshold)[0]
        if len(non_black_rows) == 0:
            # If entire image is black, return original
            return image
        
        top_row = non_black_rows[0]
        bottom_row = non_black_rows[-1]
        
        # Find first and last non-black columns
        non_black_cols = np.where(col_means > threshold)[0]
        if len(non_black_cols) == 0:
            # If entire image is black, return original
            return image
        
        left_col = non_black_cols[0]
        right_col = non_black_cols[-1]
        
        # Crop the image
        cropped = image[top_row:bottom_row+1, left_col:right_col+1]
        
        # Ensure we don't return an empty image
        if cropped.shape[0] == 0 or cropped.shape[1] == 0:
            return image
            
        print(f"Debug: Cropped image from {image.shape} to {cropped.shape}")
        return cropped
        
    except Exception as e:
        print(f"Debug: Error cropping black borders: {e}")
        return image


def crop_black_borders_pil(image_array, threshold: int = 10):
    """
    Remove rows and columns that are almost fully black from an image array.
    
    Args:
        image_array: numpy array (BGR format from cv2)
        threshold: Threshold for what constitutes "almost black" (0-255)
        
    Returns:
        Cropped numpy array with black borders removed
    """
    try:
        # Crop using opencv function - image_array is already numpy array
        cropped_array = crop_black_borders(image_array, threshold)
        return cropped_array
        
    except Exception as e:
        print(f"Debug: Error cropping image: {e}")
        return image_array 


def get_demo_images() -> list:
    """
    Get list of demo images from the demo_images folder.
    
    Returns:
        List of demo image filenames
    """
    import os
    from .config import SUPPORTED_IMAGE_FORMATS
    
    demo_folder = "demo_images"
    demo_images = []
    
    if os.path.exists(demo_folder):
        for file in os.listdir(demo_folder):
            # Check if file has a supported image extension
            file_ext = file.lower().split('.')[-1]
            if file_ext in [fmt.lower() for fmt in SUPPORTED_IMAGE_FORMATS]:
                demo_images.append(file)
    
    return sorted(demo_images)


def load_demo_image(filename: str):
    """
    Load a demo image from the demo_images folder.
    
    Args:
        filename: Name of the demo image file
        
    Returns:
        numpy array (BGR format) or None if file not found
    """
    import os
    import cv2
    
    demo_folder = "demo_images"
    image_path = os.path.join(demo_folder, filename)
    
    try:
        if os.path.exists(image_path):
            image = cv2.imread(image_path, cv2.IMREAD_COLOR)
            if image is None:
                print(f"Failed to load image: {image_path}")
                return None
            return image
        else:
            print(f"Demo image not found: {image_path}")
            return None
    except Exception as e:
        print(f"Error loading demo image {filename}: {e}")
        return None 