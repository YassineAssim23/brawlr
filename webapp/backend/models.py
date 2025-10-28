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
    
    def __init__(self, model_path=None, confidence_threshold=0.15):
        """
        Initialize YOLO processor and load model
        
        What this does:
        - Finds the model file (best.pt)
        - Loads the YOLO model
        - Sets up for inference
        
        Args:
            model_path: Optional path to model file
            confidence_threshold: Minimum confidence for detections (default 0.15)
        """
        if model_path is None:
            # Find model file relative to this file
            current_dir = Path(__file__).parent
            model_path = current_dir / "models" / "yassinesmodel.pt" # CHANGED MODEL FROM best.pt
        
        print(f"Loading YOLO model from: {model_path}")
        
        try:
            # Load the YOLO model
            self.model = YOLO(str(model_path))
            print("YOLO model loaded successfully!")
            
            # Set confidence threshold (configurable to catch more detections on stock videos)
            self.confidence_threshold = confidence_threshold
            
            # Cooldown tracking for live stream (prevent counting retraction as multiple punches)
            self.last_punch_frame_time = None
            self.punch_cooldown_frames = 25  # ~0.8 seconds at 30fps - ignore new punches during this time
            
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
        - Applies cooldown to prevent counting retraction as multiple punches
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
            
            # Apply cooldown to prevent counting retraction as multiple punches
            import time
            current_time = time.time()
            
            if punch_result is not None:
                # Check if enough time has passed since last punch
                if self.last_punch_frame_time is not None:
                    time_since_last = current_time - self.last_punch_frame_time
                    # Convert cooldown frames to seconds (assuming ~30fps)
                    cooldown_seconds = self.punch_cooldown_frames / 30.0
                    
                    if time_since_last < cooldown_seconds:
                        # Still in cooldown - ignore this detection (likely retraction)
                        print(f"Punch detected but in cooldown ({time_since_last:.2f}s < {cooldown_seconds:.2f}s) - ignoring")
                        return None
                
                # New punch detected - update last punch time
                self.last_punch_frame_time = current_time
                return punch_result
            
            return None
            
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
                
                # Only care about punch detection, not punch type
                if class_name == "punch":
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_punch_type = "punch"
            
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
    
    def process_video(self, video_path):
        """
        Process an entire video file and count punches using cluster analysis
        
        What this does:
        - Loads video file
        - Processes each frame with YOLO
        - Groups consecutive punch detections into clusters
        - Counts each cluster as 1 punch (not 30+ frames)
        - Returns total counts
        
        Args:
            video_path: Path to video file
        
        Returns:
            dict: Punch counts by type
        """
        if self.model is None:
            raise Exception("YOLO model not loaded")
        
        try:
            print(f"Processing video: {video_path}")
            
            # Initialize punch counters (2-class model: just "punch")
            punch_counts = {
                "punch": 0,
                "total": 0
            }
            
            # Process video with YOLO
            results = self.model.predict(
                source=video_path,
                conf=self.confidence_threshold,
                verbose=False,
                save=False  # Don't save output video
            )
            
            # Cluster analysis for punch counting
            current_cluster_punches = []
            in_cluster = False
            frame_number = 0
            last_punch_frame = -999  # Track last frame where we counted a punch
            cooldown_frames = 30  # ~1 second at 30fps - ignore new punches during this time
            
            for result in results:
                frame_number += 1
                boxes = result.boxes
                frame_has_punch = False
                frame_punch_type = None
                
                if boxes is not None and len(boxes) > 0:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        class_name = self.model.names[class_id]
                        
                        # Only care about punch detection, not punch type
                        if class_name == "punch":
                            frame_has_punch = True
                            frame_punch_type = "punch"
                            break  # Take the first punch detection in this frame
                
                # Cluster logic (based on count_punches_v5.py)
                if frame_has_punch and frame_punch_type:
                    # Add punch to current cluster
                    current_cluster_punches.append(frame_punch_type)
                    in_cluster = True
                    print(f"Frame punch: {frame_punch_type}")
                    
                elif in_cluster and len(current_cluster_punches) > 0:
                    # End of cluster - analyze it
                    print(f"Cluster ended. Punches: {current_cluster_punches}")
                    
                    # Only count if cluster has enough frames (minimum 8)
                    if len(current_cluster_punches) >= 8:
                        # 2-class model: just count "punch" frames
                        punch_frames = current_cluster_punches.count("punch")
                        
                        # Only count if at least 6 frames detected punch
                        if punch_frames >= 6:
                            # Check cooldown - don't count if too close to last punch (prevents counting retraction)
                            frames_since_last = frame_number - last_punch_frame
                            
                            if frames_since_last >= cooldown_frames:
                                punch_counts["punch"] += 1
                                punch_counts["total"] += 1
                                last_punch_frame = frame_number
                                print(f"Counted 1 punch (frame {frame_number}, {frames_since_last} frames since last)")
                            else:
                                print(f"Punch detected but too soon after last ({frames_since_last} < {cooldown_frames} frames) - likely retraction, ignoring")
                        else:
                            print(f"Not enough punch detections (had {punch_frames}, need 6+) - ignoring cluster")
                    else:
                        print(f"Cluster too short ({len(current_cluster_punches)} frames) - ignoring")
                    
                    # Reset for next cluster
                    current_cluster_punches = []
                    in_cluster = False
            
            # Handle case where video ends while still in a cluster
            if in_cluster and len(current_cluster_punches) > 0:
                print(f"Video ended while in cluster. Punches: {current_cluster_punches}")
                if len(current_cluster_punches) >= 8:
                    punch_frames = current_cluster_punches.count("punch")
                    if punch_frames >= 6:
                        frames_since_last = frame_number - last_punch_frame
                        if frames_since_last >= cooldown_frames:
                            punch_counts["punch"] += 1
                            punch_counts["total"] += 1
                            print(f"Counted final punch (frame {frame_number})")
            
            print(f"Video processing complete. Punch counts: {punch_counts}")
            return punch_counts
            
        except Exception as e:
            print(f"Error processing video: {e}")
            raise Exception(f"Video processing failed: {str(e)}")
