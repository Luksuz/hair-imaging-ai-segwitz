"""
Utility functions for the Hair Follicle Segmentation app.
Contains drawing functions and other helper utilities.
"""

from typing import Tuple
from PIL import Image, ImageDraw
import math

from .config import (
    COLORS, TRIANGLE_THICKNESS, ARROW_THICKNESS, POINT_RADIUS, 
    CONTOUR_THICKNESS, ARROW_TIP_LENGTH
)
from .triangle_detector import calculate_std


def _bgr_to_rgb(color: Tuple[int, int, int]) -> Tuple[int, int, int]:
    b, g, r = color
    return (r, g, b)


def draw_arrow(image: Image.Image, start_point, end_point, 
               color: Tuple[int, int, int] = COLORS['arrow'], 
               thickness: int = ARROW_THICKNESS) -> Image.Image:
    """
    Draw an arrow from start_point to end_point on a PIL Image.
    """
    if image is None or start_point is None or end_point is None:
        return image

    draw = ImageDraw.Draw(image)
    sx, sy = float(start_point[0]), float(start_point[1])
    ex, ey = float(end_point[0]), float(end_point[1])

    # Convert BGR config color to RGB for PIL
    rgb = _bgr_to_rgb(color)

    # Draw main line
    draw.line([(sx, sy), (ex, ey)], fill=rgb, width=int(max(1, thickness)))

    # Draw arrow head
    dx = ex - sx
    dy = ey - sy
    length = (dx**2 + dy**2) ** 0.5 or 1.0
    ux, uy = dx / length, dy / length

    head_len = 8.0  # pixels
    head_width = 6.0

    # Perpendicular vector
    px, py = -uy, ux

    # Base of arrow head
    bx, by = ex - ux * head_len, ey - uy * head_len
    left = (bx + px * head_width * 0.5, by + py * head_width * 0.5)
    right = (bx - px * head_width * 0.5, by - py * head_width * 0.5)

    draw.polygon([left, (ex, ey), right], fill=rgb)

    return image


def draw_line(image: Image.Image, start_point, end_point,
              color: Tuple[int, int, int], thickness: int) -> Image.Image:
    """Draw a simple line on a PIL image."""
    if image is None or start_point is None or end_point is None:
        return image
    draw = ImageDraw.Draw(image)
    rgb = _bgr_to_rgb(color)
    draw.line([(float(start_point[0]), float(start_point[1])),
               (float(end_point[0]), float(end_point[1]))],
              fill=rgb, width=int(max(1, thickness)))
    return image


def draw_triangle(image, triangle, 
                 color: Tuple[int, int, int] = COLORS['triangle'], 
                 thickness: int = TRIANGLE_THICKNESS):
    """
    Draw a triangle on the image.
    DEPRECATED: Drawing is now handled by frontend canvas.
    
    Args:
        image: Input image
        triangle: Triangle vertices
        color: Color tuple
        thickness: Line thickness
        
    Returns:
        Original image (no drawing performed)
    """
    # Drawing is now handled by frontend
    return image


def draw_point(image, point, 
               color: Tuple[int, int, int], radius: int = POINT_RADIUS):
    """
    Draw a point (filled circle) on the image.
    DEPRECATED: Drawing is now handled by frontend canvas.
    
    Args:
        image: Input image
        point: Point coordinates
        color: Color tuple
        radius: Circle radius
        
    Returns:
        Original image (no drawing performed)
    """
    # Drawing is now handled by frontend
    return image


def draw_contour(image, contour, 
                color: Tuple[int, int, int] = COLORS['contour'], 
                thickness: int = CONTOUR_THICKNESS):
    """
    Draw a contour on the image.
    DEPRECATED: Drawing is now handled by frontend canvas.
    
    Args:
        image: Input image
        contour: Contour points
        color: Color tuple
        thickness: Line thickness
        
    Returns:
        Original image (no drawing performed)
    """
    # Drawing is now handled by frontend
    return image


def draw_visualization_elements(image: Image.Image, triangle, 
                               middle_point, apex, 
                               contour, class_info: dict = None) -> Image.Image:
    """
    Draw visualization elements for a single detection - equal-length line only.
    """
    # Determine arrow color based on class info
    try:
        from .config import HAIR_STRAND_COLORS
        arrow_color = HAIR_STRAND_COLORS.get('default', (0, 255, 0))
        if class_info:
            cls = (class_info.get('class_name') or '').lower()
            if 'strong' in cls:
                arrow_color = HAIR_STRAND_COLORS.get('strong', arrow_color)
            elif 'medium' in cls or 'intermediate' in cls:
                arrow_color = HAIR_STRAND_COLORS.get('medium', arrow_color)
            elif 'weak' in cls:
                arrow_color = HAIR_STRAND_COLORS.get('weak', arrow_color)

        # Compute fixed-length line in the direction middle_point -> apex
        sx, sy = float(middle_point[0]), float(middle_point[1])
        dx, dy = float(apex[0]) - sx, float(apex[1]) - sy
        norm = math.hypot(dx, dy) or 1.0
        ux, uy = dx / norm, dy / norm
        FIXED_LEN = 80.0  # pixels (longer lines)
        ex, ey = sx + ux * FIXED_LEN, sy + uy * FIXED_LEN
        image = draw_line(image, (sx, sy), (ex, ey), arrow_color, ARROW_THICKNESS)
        return image
    except Exception:
        return image


def draw_arrow_with_color(image, start_point, end_point, color: tuple):
    """
    Draw an arrow with specified color.
    DEPRECATED: Drawing is now handled by frontend canvas.
    
    Args:
        image: Input image
        start_point: Starting point of the arrow
        end_point: End point of the arrow (tip)
        color: Color tuple
        
    Returns:
        Original image (no drawing performed)
    """
    # Drawing is now handled by frontend
    return image


def convert_bgr_to_rgb(image):
    """
    Convert BGR image to RGB - now deprecated as we use PIL only.
    
    Args:
        image: PIL Image or any image data
        
    Returns:
        Original image (no conversion needed for PIL)
    """
    # With PIL, we don't need BGR conversion
    return image


def convert_rgb_to_bgr(image):
    """
    Convert RGB image to BGR - now deprecated as we use PIL only.
    
    Args:
        image: PIL Image or any image data
        
    Returns:
        Original image (no conversion needed for PIL)
    """
    # With PIL, we don't need BGR conversion
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


def get_image_info(image) -> dict:
    """
    Get basic information about an image.
    
    Args:
        image: PIL Image object
        
    Returns:
        Dictionary with image information
    """
    if image is None:
        return {}
    
    # Handle PIL Image
    if hasattr(image, 'size'):
        width, height = image.size
        mode = image.mode
        
        # Determine number of channels from mode
        if mode == 'L':  # Grayscale
            channels = 1
        elif mode == 'RGB':
            channels = 3
        elif mode == 'RGBA':
            channels = 4
        else:
            channels = len(mode) if isinstance(mode, str) else 3
    else:
        # Fallback for other image types
        width, height, channels = 0, 0, 0
    
    return {
        'width': width,
        'height': height,
        'channels': channels,
        'size': (width, height),
        'mode': getattr(image, 'mode', 'RGB')
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
            'average': sum(confidence_values) / len(confidence_values) if confidence_values else 0.0,
            'min': min(confidence_values) if confidence_values else 0.0,
            'max': max(confidence_values) if confidence_values else 0.0,
            'std': calculate_std(confidence_values) if confidence_values else 0.0
        }
    }
    
    # Per-class confidence stats
    for class_type, confidences in class_confidences.items():
        if confidences:
            confidence_stats[class_type] = {
                'average': sum(confidences) / len(confidences),
                'min': min(confidences),
                'max': max(confidences),
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


def crop_black_borders(image, threshold: int = 10):
    """
    Remove rows and columns that are almost fully black from an image.
    Now deprecated - use crop_black_borders_pil instead.
    
    Args:
        image: Input image 
        threshold: Threshold for what constitutes "almost black" (0-255)
        
    Returns:
        Original image (use PIL version instead)
    """
    print("Warning: crop_black_borders is deprecated, use crop_black_borders_pil")
    return image


def crop_black_borders_pil(pil_image, threshold: int = 10):
    """
    Remove rows and columns that are almost fully black from a PIL Image.
    
    Args:
        pil_image: PIL Image object
        threshold: Threshold for what constitutes "almost black" (0-255)
        
    Returns:
        Cropped PIL Image with black borders removed
    """
    try:
        from PIL import Image
        
        # Convert to grayscale for analysis
        gray_image = pil_image.convert('L')
        width, height = gray_image.size
        
        # Get pixel data as a list
        pixels = list(gray_image.getdata())
        
        # Convert to 2D structure for easier processing
        rows = []
        for y in range(height):
            row = pixels[y * width:(y + 1) * width]
            rows.append(row)
        
        # Find first and last non-black rows
        top_row = 0
        bottom_row = height - 1
        
        for y in range(height):
            row_mean = sum(rows[y]) / width
            if row_mean > threshold:
                top_row = y
                break
        
        for y in range(height - 1, -1, -1):
            row_mean = sum(rows[y]) / width
            if row_mean > threshold:
                bottom_row = y
                break
        
        # Find first and last non-black columns
        left_col = 0
        right_col = width - 1
        
        for x in range(width):
            col_pixels = [rows[y][x] for y in range(height)]
            col_mean = sum(col_pixels) / height
            if col_mean > threshold:
                left_col = x
                break
        
        for x in range(width - 1, -1, -1):
            col_pixels = [rows[y][x] for y in range(height)]
            col_mean = sum(col_pixels) / height
            if col_mean > threshold:
                right_col = x
                break
        
        # Ensure we have valid crop bounds
        if top_row >= bottom_row or left_col >= right_col:
            print("Debug: No valid crop area found, returning original image")
            return pil_image
        
        # Crop the image
        crop_box = (left_col, top_row, right_col + 1, bottom_row + 1)
        cropped_image = pil_image.crop(crop_box)
        
        print(f"Debug: Cropped image from {pil_image.size} to {cropped_image.size}")
        return cropped_image
        
    except Exception as e:
        print(f"Debug: Error cropping PIL image: {e}")
        return pil_image 


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
        PIL Image object or None if file not found
    """
    import os
    from PIL import Image
    
    demo_folder = "demo_images"
    image_path = os.path.join(demo_folder, filename)
    
    try:
        if os.path.exists(image_path):
            return Image.open(image_path)
        else:
            print(f"Demo image not found: {image_path}")
            return None
    except Exception as e:
        print(f"Error loading demo image {filename}: {e}")
        return None 