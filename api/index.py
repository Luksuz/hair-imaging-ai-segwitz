"""
Flask API for Hair Follicle Segmentation & Triangle Detection.
Integrates all functionality from the Streamlit app including:
- Roboflow workflow processing
- Triangle detection and analysis
- Image preprocessing (auto-crop black borders)
- Comprehensive hair analysis reports
- Authentication
"""

from flask import Flask, request, jsonify
import logging
import os
import sys
import base64
import io
import numpy as np
import cv2
# Removed weasyprint and jinja2 imports - now using React PDF on frontend
# Removed PIL import - now using cv2 for all image operations

# Add the current directory to Python path to import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import our modular components from the copied src directory
try:
    from src import (
        # Configuration
        ROBOFLOW_API_KEY, ROBOFLOW_WORKSPACE, ROBOFLOW_WORKFLOW_ID,
        CONFIDENCE_THRESHOLD, USE_CACHE, BLACK_BORDER_THRESHOLD,
        
        # Classes and functions
        ImageProcessor, 
        crop_black_borders_pil, convert_rgb_to_bgr, convert_bgr_to_rgb,
        generate_hair_analysis_report, generate_hair_analysis_pdf,
        get_image_info, format_confidence, save_temp_image,
        get_hair_strand_class_name
    )
except ImportError as e:
    print(f"Error importing src modules: {e}")
    print("Make sure the src directory is properly copied to the api folder")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('app.log')  # File output
    ]
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

app = Flask(__name__)

# Enable Flask's debug mode for more verbose logging
app.config['DEBUG'] = True

# Authentication credentials (same as Streamlit app)
ADMIN_USERNAME = "segwitzAdmin"
ADMIN_PASSWORD = "segwitz312"


@app.route("/api/health", methods=['GET'])
def health_check():
    """Health check endpoint."""
    logger.info("Health check endpoint called")
    return jsonify({
        'status': 'healthy', 
        'message': 'Flask API is running',
        'config': {
            'workspace': ROBOFLOW_WORKSPACE,
            'workflow_id': ROBOFLOW_WORKFLOW_ID,
            'has_api_key': bool(ROBOFLOW_API_KEY),
            'confidence_threshold': CONFIDENCE_THRESHOLD,
            'use_cache': USE_CACHE
        }
    })


@app.route("/api/auth", methods=['POST'])
def authenticate():
    """Authenticate user with username and password."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            return jsonify({
                'success': True,
                'message': 'Authentication successful'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
        
    except Exception as e:
        logger.error(f"Error in authenticate: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route("/api/process-image", methods=['POST'])
def process_image():
    """
    Main image processing endpoint that handles the complete workflow:
    1. Receive image data (base64 or multipart)
    2. Auto-crop black borders
    3. Run Roboflow workflow
    4. Perform triangle analysis
    5. Generate comprehensive report
    """
    try:
        logger.info(f"Received image processing request: {request.method}")
        
        # Extract image from request
        image = None
        image_source = "Unknown"
        
        # Check if it's multipart form data with image file
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename:
                # Read image file as bytes and decode with cv2
                image_bytes = image_file.read()
                image_array = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
                if image_array is None:
                    return jsonify({'error': 'Invalid image file format'}), 400
                # Convert BGR to RGB for consistency
                image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
                image_source = f"Upload: {image_file.filename}"
                logger.info(f"Received multipart image: {image_file.filename}")
        
        # Check if it's JSON with base64 image data
        elif request.is_json:
            data = request.get_json()
            if 'image_data' in data:
                # Decode base64 image
                image_data = data['image_data']
                if image_data.startswith('data:image'):
                    # Remove data URL prefix
                    image_data = image_data.split(',')[1]
                
                image_bytes = base64.b64decode(image_data)
                image_array = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
                if image_array is None:
                    return jsonify({'error': 'Invalid base64 image data'}), 400
                # Convert BGR to RGB for consistency
                image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
                image_source = data.get('image_name', 'Base64 Image')
                logger.info(f"Received base64 image: {image_source}")
        
        if image is None:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Image is already in RGB format from cv2 conversion above
        original_size = (image.shape[1], image.shape[0])  # (width, height)
        logger.info(f"Original image size: {original_size}")
        
        # Auto-crop black borders - convert to BGR for processing
        image_bgr = convert_rgb_to_bgr(image)
        cropped_image_bgr = crop_black_borders_pil(image_bgr, BLACK_BORDER_THRESHOLD)
        cropped_size = (cropped_image_bgr.shape[1], cropped_image_bgr.shape[0])  # (width, height)
        
        auto_cropped = cropped_size != original_size
        if auto_cropped:
            logger.info(f"Auto-cropped black borders: {original_size} → {cropped_size}")
        
        # Get image info
        img_info = get_image_info(cropped_image_bgr)
        
        # Validate configuration
        if not ROBOFLOW_API_KEY:
            return jsonify({'error': 'ROBOFLOW_API_KEY not configured'}), 500
        if not ROBOFLOW_WORKSPACE:
            return jsonify({'error': 'ROBOFLOW_WORKSPACE not configured'}), 500
        if not ROBOFLOW_WORKFLOW_ID:
            return jsonify({'error': 'ROBOFLOW_WORKFLOW_ID not configured'}), 500
        
        # Process the image through Roboflow workflow
        logger.info("Processing image with Roboflow workflow...")
        
        # Save cropped image to temporary file
        temp_path = save_temp_image(cropped_image_bgr)
        
        try:
            # Initialize image processor
            processor = ImageProcessor(api_key=ROBOFLOW_API_KEY)
            
            # Process the image
            processed_image, analysis_results, detections = processor.process_image_file(
                temp_path, ROBOFLOW_WORKSPACE, ROBOFLOW_WORKFLOW_ID, CONFIDENCE_THRESHOLD, USE_CACHE
            )
            
            # Convert back to RGB for JSON serialization
            processed_image_rgb = convert_bgr_to_rgb(processed_image)
            
            # Generate comprehensive analysis report
            report = generate_hair_analysis_report(detections, analysis_results, img_info)
            
            if 'error' in report:
                return jsonify({'error': f'Error generating report: {report["error"]}'}), 500
            
            # Convert processed image to base64 for JSON response
            # Encode image as PNG using cv2
            success, buffer = cv2.imencode('.png', cv2.cvtColor(processed_image_rgb, cv2.COLOR_RGB2BGR))
            if not success:
                return jsonify({'error': 'Failed to encode processed image'}), 500
            processed_image_b64 = base64.b64encode(buffer.tobytes()).decode()
            
            # Prepare detection data for frontend
            detection_data = []
            for i, detection in enumerate(detections):
                det_data = {
                    'id': detection.get('detection_id', f'det_{i}'),
                    'class': detection.get('class', 'unknown'),
                    'confidence': detection.get('confidence', 0),
                    'points': detection.get('points', []),
                }
                # Add triangle data if available
                for result in analysis_results:
                    if result.get('detection_id') == det_data['id']:
                        if 'triangle_vertices' in result:
                            det_data['triangle_vertices'] = result['triangle_vertices']
                        if 'arrow_start' in result:
                            det_data['arrow_start'] = result['arrow_start']
                        if 'arrow_end' in result:
                            det_data['arrow_end'] = result['arrow_end']
                        break
                detection_data.append(det_data)
            
            response_data = {
                'success': True,
                'image_info': {
                    'original_size': list(original_size),
                    'processed_size': list(cropped_size),
                    'auto_cropped': auto_cropped,
                    'width': img_info['width'],
                    'height': img_info['height'],
                    'channels': img_info['channels']
                },
                'processed_image': f"data:image/png;base64,{processed_image_b64}",
                'detections': detection_data,
                'analysis_report': report,
                'config': {
                    'confidence_threshold': CONFIDENCE_THRESHOLD,
                    'workspace': ROBOFLOW_WORKSPACE,
                    'workflow_id': ROBOFLOW_WORKFLOW_ID
                }
            }
            
            logger.info(f"Successfully processed image with {len(detections)} detections")
            return jsonify(response_data)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# PDF generation now handled on frontend using React PDF components


@app.route("/api/config", methods=['GET'])
def get_config():
    """Get current configuration."""
    try:
        return jsonify({
            'success': True,
            'config': {
                'workspace': ROBOFLOW_WORKSPACE,
                'workflow_id': ROBOFLOW_WORKFLOW_ID,
                'has_api_key': bool(ROBOFLOW_API_KEY),
                'api_key_preview': f"{'*' * 8}...{ROBOFLOW_API_KEY[-4:] if len(ROBOFLOW_API_KEY) > 4 else '****'}",
                'confidence_threshold': CONFIDENCE_THRESHOLD,
                'use_cache': USE_CACHE,
                'black_border_threshold': BLACK_BORDER_THRESHOLD
            }
        })
    except Exception as e:
        logger.error(f"Error in get_config: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route("/api/demo-images", methods=['GET'])
def get_demo_images():
    """Get list of available demo images."""
    try:
        from src import get_demo_images
        demo_images = get_demo_images()
        
        return jsonify({
            'success': True,
            'images': demo_images
        })
    except Exception as e:
        logger.error(f"Error in get_demo_images: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'images': []
        })


@app.route("/api/demo-image/<filename>", methods=['GET'])
def get_demo_image(filename):
    """Get a specific demo image as base64."""
    try:
        from src import load_demo_image
        
        image = load_demo_image(filename)
        if image is None:
            return jsonify({'error': f'Demo image not found: {filename}'}), 404
        
        # Convert to base64 using cv2
        # Convert PIL image to cv2 format if needed
        if hasattr(image, 'mode'):  # PIL Image
            image_array = np.array(image)
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        else:  # already numpy array
            image_array = image
            
        success, buffer = cv2.imencode('.png', image_array)
        if not success:
            return jsonify({'error': 'Failed to encode demo image'}), 500
        image_b64 = base64.b64encode(buffer.tobytes()).decode()
        
        return jsonify({
            'success': True,
            'filename': filename,
            'image_data': f"data:image/png;base64,{image_b64}",
            'size': [image_array.shape[1], image_array.shape[0]]  # [width, height]
        })
        
    except Exception as e:
        logger.error(f"Error in get_demo_image: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Legacy endpoint for compatibility (redirects to new endpoint)
@app.route("/api/python", methods=['POST'])
def legacy_triangle_processing():
    """Legacy endpoint - redirects to new process-image endpoint."""
    return jsonify({
        'error': 'This endpoint has been deprecated. Please use /api/process-image instead.',
        'new_endpoint': '/api/process-image'
    }), 410


if __name__ == '__main__':
    logger.info("Starting Flask application...")
    logger.info("Available endpoints:")
    logger.info("  GET  /api/health - Health check")
    logger.info("  POST /api/auth - Authentication")
    logger.info("  POST /api/process-image - Main image processing")
    logger.info("  POST /api/generate-pdf - Generate PDF report")
    logger.info("  GET  /api/config - Get configuration")
    logger.info("  GET  /api/demo-images - List demo images")
    logger.info("  GET  /api/demo-image/<filename> - Get demo image")
    
    app.run(debug=True, host='0.0.0.0', port=5328)