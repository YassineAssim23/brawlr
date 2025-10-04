import time
from pathlib import Path
from ultralytics import YOLO
from .utils import base64_to_image, format_punch_result, preprocess_image

class YOLOProcessor:
    """
    Handles YOLO model loading and inference
    
    What this class does:
    - Loads the YOLO model once at startup
    - Processes frames with YOLO
    - Parses results to extract punch detection
    - Returns formatted results for frontend
    """
    
    def __init__(self, model_path=None):
        """
        Initialize YOLO processor and load model
        
        What this does:
        - Finds the model file (best.pt)
        - Loads the YOLO model
        - Sets up for inference
        
        Args:
            model_path: Optional path to model file
        """
        if model_path is None:
            # Find model file relative to this file
            current_dir = Path(__file__).parent
            model_path = current_dir / "models" / "best.pt"
        
        print(f"Loading YOLO model from: {model_path}")
        
        try:
            # Load the YOLO model
            self.model = YOLO(str(model_path))
            print("YOLO model loaded successfully!")
            
            # Set confidence threshold (only show detections with 25%+ confidence)
            self.confidence_threshold = 0.25
            
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            self.model = None
    
    def process_frame(self, base64_data):
        """
        Process a single frame with YOLO
        
        What this does:
        - Converts base64 to image
        - Runs YOLO inference
        - Parses results for punch detection
        - Returns formatted result
        
        Args:
            base64_data: Base64 image string from frontend
        
        Returns:
            dict: Punch detection result or None
        """
        if self.model is None:
            return None
        
        try:
            # Convert base64 to image array
            image_array = base64_to_image(base64_data)
            if image_array is None:
                return None
            
            # Preprocess image for YOLO
            processed_image = preprocess_image(image_array)
            
            # Run YOLO inference
            results = self.model.predict(
                source=processed_image,
                conf=self.confidence_threshold,
                verbose=False  # Don't print inference details
            )
            
            # Parse results for punch detection
            punch_result = self._parse_results(results)
            
            return punch_result
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            return None
    
    def _parse_results(self, results):
        """
        Parse YOLO results to extract punch detection
        
        What this does:
        - Looks at YOLO detection results
        - Finds the highest confidence punch
        - Returns formatted result
        
        Args:
            results: YOLO inference results
        
        Returns:
            dict: Best punch detection or None
        """
        try:
            # Get the first result (we're processing single frames)
            result = results[0]
            
            # Get detected objects
            boxes = result.boxes
            
            if boxes is None or len(boxes) == 0:
                # No detections
                return None
            
            # Find the detection with highest confidence
            best_confidence = 0
            best_punch_type = None
            
            # Debug: Show all detections
            all_detections = []
            
            for box in boxes:
                # Get class name and confidence
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                
                # Get class name from model
                class_name = self.model.names[class_id]
                
                # Debug: Collect all detections
                all_detections.append(f"{class_name}({confidence:.2f})")
                
                # Check if this is a punch type
                if class_name in ["jab", "cross", "hook", "uppercut"]:
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_punch_type = class_name
            
            # Debug: Print all detections (limit to avoid spam)
            if len(all_detections) > 0:
                print(f"YOLO detections: {', '.join(all_detections)}")
            
            # Return result if we found a punch
            if best_punch_type:
                print(f"Best punch: {best_punch_type} ({best_confidence:.2f})")
                return format_punch_result(best_punch_type, best_confidence)
            
            return None
            
        except Exception as e:
            print(f"Error parsing YOLO results: {e}")
            return None