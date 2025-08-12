"""
Hair Follicle Segmentation & Triangle Detection App

A modular Streamlit application for processing images with Roboflow segmentation
and performing triangular analysis with directional arrows.
"""

from .config import (
    APP_TITLE, APP_DESCRIPTION, PAGE_ICON, SUPPORTED_IMAGE_FORMATS,
    DEFAULT_API_URL, ROBOFLOW_API_KEY, ROBOFLOW_WORKSPACE, ROBOFLOW_WORKFLOW_ID,
    CONFIDENCE_THRESHOLD, USE_CACHE, MIN_CONFIDENCE, MAX_CONFIDENCE, CONFIDENCE_STEP,
    TEMP_IMAGE_PATH, COLORS, HAIR_STRAND_COLORS, MIN_CONTOUR_POINTS, BLACK_BORDER_THRESHOLD,
    TRIANGLE_THICKNESS, ARROW_THICKNESS, POINT_RADIUS, CONTOUR_THICKNESS, ARROW_TIP_LENGTH
)
from .image_processor import ImageProcessor, save_temp_image
from .triangle_detector import get_smallest_triangle, find_shortest_side_and_apex, calculate_triangle_properties
from .utils import (
    draw_arrow, draw_triangle, draw_point, draw_contour, draw_visualization_elements, draw_arrow_with_color,
    convert_bgr_to_rgb, convert_rgb_to_bgr, format_confidence, validate_workspace_name, validate_workflow_id, get_image_info,
    get_hair_strand_class_name, generate_hair_analysis_report, generate_hair_analysis_pdf,
    crop_black_borders, crop_black_borders_pil, get_demo_images, load_demo_image
)

__version__ = "2.0.0"
__author__ = "Hair Follicle Analysis Team" 