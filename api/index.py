"""
Flask API for Hair Follicle Segmentation & Triangle Detection.
Integrates all functionality from the Streamlit app including:
- Roboflow workflow processing
- Triangle detection and analysis
- Image preprocessing (auto-crop black borders)
- Comprehensive hair analysis reports
- Authentication
"""

from flask import Flask, request, jsonify, make_response, render_template
from flask_cors import CORS
import logging
import os
import sys
import base64
import io
from PIL import Image
from weasyprint import HTML

# Add the current directory to Python path to import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import our modular components from the src directory
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
# Enable permissive CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

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
                image = Image.open(image_file.stream)
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
                image = Image.open(io.BytesIO(image_bytes))
                image_source = data.get('image_name', 'Base64 Image')
                logger.info(f"Received base64 image: {image_source}")
        
        if image is None:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        original_size = image.size
        logger.info(f"Original image size: {original_size}")
        
        # Auto-crop black borders
        cropped_image = crop_black_borders_pil(image, BLACK_BORDER_THRESHOLD)
        cropped_size = cropped_image.size
        
        auto_cropped = cropped_size != original_size
        if auto_cropped:
            logger.info(f"Auto-cropped black borders: {original_size} → {cropped_size}")
        
        # Get image info (PIL only, no numpy conversion needed)
        img_info = get_image_info(cropped_image)
        
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
        temp_path = save_temp_image(cropped_image)
        
        try:
            # Initialize image processor
            processor = ImageProcessor(api_key=ROBOFLOW_API_KEY)
            
            # Process the image
            processed_image, analysis_results, detections = processor.process_image_file(
                temp_path, ROBOFLOW_WORKSPACE, ROBOFLOW_WORKFLOW_ID, CONFIDENCE_THRESHOLD, USE_CACHE
            )
            
            # Generate comprehensive analysis report
            report = generate_hair_analysis_report(detections, analysis_results, img_info)
            
            if 'error' in report:
                return jsonify({'error': f'Error generating report: {report["error"]}'}), 500
            
            # Convert processed image (OpenCV BGR ndarray) to PIL for JSON response
            processed_image_pil = None
            try:
                import numpy as _np
                if isinstance(processed_image, _np.ndarray):
                    rgb_img = convert_bgr_to_rgb(processed_image)
                    processed_image_pil = Image.fromarray(rgb_img)
                elif hasattr(processed_image, 'save'):
                    processed_image_pil = processed_image
                else:
                    processed_image_pil = cropped_image
            except Exception:
                processed_image_pil = cropped_image
            buffered = io.BytesIO()
            processed_image_pil.save(buffered, format="PNG")
            processed_image_b64 = base64.b64encode(buffered.getvalue()).decode()
            
            # Prepare detection data for frontend
            detection_data = []
            logger.info(f"Debug: Preparing {len(detections)} detections with {len(analysis_results)} analysis results")
            
            for i, detection in enumerate(detections):
                det_id = detection.get('detection_id', f'det_{i}')
                det_data = {
                    'id': det_id,
                    'class': detection.get('class', 'unknown'),
                    'confidence': detection.get('confidence', 0),
                    'points': detection.get('points', []),
                }
                
                logger.info(f"Debug: Processing detection {i} with ID: {det_id}")
                
                # Add triangle data if available
                triangle_found = False
                for result in analysis_results:
                    result_id = result.get('detection_id')
                    logger.info(f"Debug: Checking analysis result with ID: {result_id}")
                    
                    if result_id == det_id:
                        triangle_found = True
                        logger.info(f"Debug: Found matching analysis result for detection {det_id}")
                        
                        if 'triangle_vertices' in result:
                            det_data['triangle_vertices'] = result['triangle_vertices']
                            logger.info(f"Debug: Added triangle vertices: {result['triangle_vertices']}")
                        if 'arrow_start' in result:
                            det_data['arrow_start'] = result['arrow_start']
                            logger.info(f"Debug: Added arrow start: {result['arrow_start']}")
                        if 'arrow_end' in result:
                            det_data['arrow_end'] = result['arrow_end']
                            logger.info(f"Debug: Added arrow end: {result['arrow_end']}")
                        break
                
                if not triangle_found:
                    logger.info(f"Debug: No matching analysis result found for detection {det_id}")
                    
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


@app.route("/api/generate-pdf", methods=['POST'])
def generate_pdf():
    """Generate PDF report from HTML template based on detections and report data."""
    try:
        payload = request.get_json() or {}
        detections = payload.get('detections', [])
        report = payload.get('analysis_report') or payload.get('report') or {}
        image_info = payload.get('image_info') or {}

        # Downscale processed image (if provided) to reduce PDF size
        processed_image_data_url = payload.get('processed_image')
        try:
            if processed_image_data_url:
                b64_part = processed_image_data_url
                if processed_image_data_url.startswith('data:image'):
                    b64_part = processed_image_data_url.split(',')[1]
                img_bytes = base64.b64decode(b64_part)
                with Image.open(io.BytesIO(img_bytes)) as im:
                    im = im.convert('RGB')
                    new_w = max(1, im.width // 10)
                    new_h = max(1, im.height // 10)
                    im_small = im.resize((new_w, new_h), Image.LANCZOS)
                    out = io.BytesIO()
                    im_small.save(out, format='PNG', optimize=True)
                    processed_image_data_url = 'data:image/png;base64,' + base64.b64encode(out.getvalue()).decode()
        except Exception as _e:
            logger.warning(f"PDF image downscale failed, embedding original image. Error: {_e}")

        html = render_template(
            'report_template.html',
            generated_on=payload.get('generated_on') or payload.get('report_date') or '',
            detections=detections,
            report=report,
            image_info=image_info,
            processed_image=processed_image_data_url,
        )

        pdf_bytes = HTML(string=html).write_pdf()
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = 'attachment; filename=hair_follicle_report.pdf'
        return response
    except Exception as e:
        logger.error(f"Error in generate_pdf: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


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
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        image_b64 = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'filename': filename,
            'image_data': f"data:image/png;base64,{image_b64}",
            'size': list(image.size)
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