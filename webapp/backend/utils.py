import base64
import time
import cv2
import numpy as np
from io import BytesIO
from PIL import Image

def base64_to_image(base64_data):
    """
    Convert base64 image data to OpenCV image array
    
    What this does:
    - Takes base64 string from frontend
    - Converts it to binary image data
    - Converts to OpenCV image array (numpy array)
    - Returns image that YOLO can process
    
    Args:
        base64_data: String like "data:image/jpeg;base64,/9j/4AAQ..."
    
    Returns:
        numpy array: Image in BGR format for OpenCV/YOLO
    """
    try:
        # Remove the "data:image/jpeg;base64," prefix
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 to binary data
        image_data = base64.b64decode(base64_data)
        
        # Convert binary data to PIL Image
        pil_image = Image.open(BytesIO(image_data))
        
        # Convert PIL to numpy array (RGB format)
        rgb_array = np.array(pil_image)
        
        # Convert RGB to BGR (OpenCV uses BGR)
        bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
        
        return bgr_array
        
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

def format_punch_result(punch_type, confidence):
    """
    Format punch detection result for frontend
    
    What this does:
    - Takes YOLO detection result
    - Formats it as JSON for frontend
    - Includes punch type and confidence
    
    Args:
        punch_type: String like "jab", "cross", "hook", "uppercut"
        confidence: Float confidence score (0.0 to 1.0)
    
    Returns:
        dict: Formatted result for frontend
    """
    return {
        "type": "punch",
        "punchType": punch_type,
        "confidence": confidence,
        "timestamp": int(time.time() * 1000)  # Current time in milliseconds
    }

def preprocess_image(image_array):
    """
    Preprocess image for YOLO inference
    
    What this does:
    - Resize image if needed
    - Normalize pixel values
    - Prepare for YOLO processing
    
    Args:
        image_array: numpy array from base64_to_image
    
    Returns:
        numpy array: Preprocessed image
    """
    # YOLO works best with certain image sizes
    # Resize to 640x640 if image is too large
    height, width = image_array.shape[:2]
    
    if width > 640 or height > 640:
        # Calculate new size maintaining aspect ratio
        if width > height:
            new_width = 640
            new_height = int((height * 640) / width)
        else:
            new_height = 640
            new_width = int((width * 640) / height)
        
        image_array = cv2.resize(image_array, (new_width, new_height))
    
    return image_array