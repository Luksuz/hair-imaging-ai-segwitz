"""
Configuration constants and settings for the Hair Follicle Segmentation app.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Configuration
DEFAULT_API_URL = "https://serverless.roboflow.com"

# Load configuration from environment variables
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "1SxAyEbpaNdwrNSbmDon")
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "ranaudio")
ROBOFLOW_WORKFLOW_ID = "small-object-detection-sahi-5"

# UI Configuratio
APP_TITLE = "🔬 Hair Follicle Segmentation & Triangle Detection"
APP_DESCRIPTION = "Upload an image to perform segmentation using Roboflow and detect triangular patterns."
PAGE_ICON = "🔬"

# Workflow Settings
CONFIDENCE_THRESHOLD = 0.2
USE_CACHE = False

# UI Settings for sliders (if needed)
MIN_CONFIDENCE = 0.1
MAX_CONFIDENCE = 1.0
CONFIDENCE_STEP = 0.05

# Image Processing Settings
SUPPORTED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'bmp', 'tiff']
TEMP_IMAGE_PATH = "temp_image.jpg"

# Visualization Colors (BGR format for OpenCV)
COLORS = {
    'triangle': (255, 0, 0),     # Blue
    'arrow': (0, 255, 0),        # Green
    'middle_point': (0, 255, 255),  # Yellow
    'apex_point': (0, 0, 255),   # Red
    'contour': (255, 255, 0),    # Cyan
}

# Hair Strand Class Colors (BGR format for OpenCV)
HAIR_STRAND_COLORS = {
    1: (0, 255, 0),      # Green for strong
    2: (0, 255, 255),    # Yellow for medium  
    3: (0, 0, 255),      # Red for weak
    'strong': (0, 255, 0),    # Green
    'medium': (0, 255, 255),  # Yellow
    'weak': (0, 0, 255),      # Red
    'default': (0, 255, 0),   # Default to green
}

# Drawing Settings
TRIANGLE_THICKNESS = 2
ARROW_THICKNESS = 3
POINT_RADIUS = 5
CONTOUR_THICKNESS = 1
ARROW_TIP_LENGTH = 0.3

# Processing Settings
MIN_CONTOUR_POINTS = 3

# Image Preprocessing Settings
BLACK_BORDER_THRESHOLD = 20