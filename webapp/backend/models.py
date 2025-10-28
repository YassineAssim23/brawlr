# yolo_processor.py
import torch
import sys
import time
from pathlib import Path
from ultralytics import YOLO
from .utils import base64_to_image, format_punch_result, preprocess_image

class YOLOProcessor:
    """
    Unified YOLO Processor:
      - Single-frame detection (process_frame)
      - Full-video inference + automatic cluster analysis (process_video_auto)
      - Writes inference_log.txt to latest runs/detect/predict* (if available)
      - Returns structured results:
          { "videoType": "home|stock|unknown",
            "punchCounts": { "straight": int, "hook": int, "uppercut": int, "total": int }
          }
    """

    def __init__(self, model_path=None, confidence_threshold=0.15):
        """
        Initialize YOLO processor and load model
        
        What this does:
        - Finds the model file (best.pt)
        - Loads the YOLO model
        - Sets up for inference with GPU optimization
        
        Args:
            model_path: Optional path to model file
            confidence_threshold: Minimum confidence for detections (default 0.15)
        """
        if model_path is None:
            current_dir = Path(__file__).parent
            model_path = current_dir / "models" / "best_straight_v1.pt"

        print(f"Loading YOLO model from: {model_path}")
        
        # Detect available device
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Using device: {self.device}")
        
        try:
            self.model = YOLO(str(model_path))
            
            # Move model to GPU if available
            if self.device == 'cuda':
                self.model.to(self.device)
                print("YOLO model moved to GPU for faster processing!")
            else:
                print("GPU not available, using CPU")
            
            print("YOLO model loaded successfully!")
            
            # Set confidence threshold (configurable to catch more detections on stock videos)
            self.confidence_threshold = confidence_threshold
            print("✅ YOLO model loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            self.model = None

    # --------------------------
    # Single-frame processing
    # --------------------------
    def process_frame(self, base64_data):
        if self.model is None:
            return None
        try:
            image_array = base64_to_image(base64_data)
            if image_array is None:
                return None
            processed_image = preprocess_image(image_array)
            results = self.model.predict(source=processed_image, conf=self.confidence_threshold, verbose=False)
            return self._parse_results(results)
        except Exception as e:
            print(f"Error processing frame: {e}")
            return None

    def _parse_results(self, results):
        try:
            result = results[0]
            boxes = result.boxes
            if not boxes or len(boxes) == 0:
                return None

            best_conf = 0.0
            best_type = None
            # Iterate detections in this frame and pick the highest confidence
            for box in boxes:
                class_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = self.model.names[class_id]
                if class_name in ["straight", "hook", "uppercut"]:
                    if conf > best_conf:
                        best_conf = conf
                        best_type = class_name

            if best_type:
                # Return JSON friendly format
                return format_punch_result(best_type, best_conf)
            return None
        except Exception as e:
            print(f"Error parsing YOLO results: {e}")
            return None
    
    def process_video(self, video_path, frame_skip=3, max_resolution=640):
        """
        Process an entire video file and count punches using cluster analysis
        
        What this does:
        - Loads video file
        - Processes every nth frame with YOLO (frame sampling for speed)
        - Groups consecutive punch detections into clusters
        - Counts each cluster as 1 punch (not 30+ frames)
        - Returns total counts
        
        Args:
            video_path: Path to video file
            frame_skip: Process every nth frame (default 3 for 3x speed)
            max_resolution: Maximum video resolution (default 640px)
        
        Returns:
            dict: { "videoType": str, "punchCounts": { "straight": int, "hook": int, "uppercut": int, "total": int } }
        """
        if self.model is None:
            raise Exception("YOLO model not loaded")
        
        try:
            print(f"Processing video: {video_path}")
            
            # Adaptive frame skip based on video length
            import cv2  # type: ignore
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            video_duration = total_frames / fps if fps > 0 else 0
            cap.release()
            
            # Adjust frame skip based on video length
            if video_duration > 60:  # Videos longer than 1 minute
                adaptive_frame_skip = max(4, frame_skip)  # Skip more frames for long videos
            elif video_duration > 30:  # Videos 30-60 seconds
                adaptive_frame_skip = max(3, frame_skip)
            else:  # Short videos
                adaptive_frame_skip = frame_skip
            
            print(f"Video duration: {video_duration:.1f}s, Total frames: {total_frames}")
            print(f"Frame skip: {adaptive_frame_skip}, Max resolution: {max_resolution}")
            
            # Initialize punch counters
            punch_counts = {
                # "jab": 0,
                # "cross": 0,
                "straight": 0, # ADDED STRAIGHT
                "hook": 0,
                "uppercut": 0,
                "total": 0
            }
            
            # Process video with YOLO with optimizations
            results = self.model.predict(
                source=video_path,
                conf=self.confidence_threshold,
                verbose=False,
                save=False,  # Don't save output video
                imgsz=max_resolution,  # Resize to max_resolution for speed
                device=self.device  # Use detected device (GPU if available)
            )
            
            # Cluster analysis for punch counting with frame sampling
            current_cluster_punches = []
            in_cluster = False
            frame_count = 0
            
            # Adjust cluster thresholds based on adaptive frame skip
            min_cluster_frames = max(3, 8 // adaptive_frame_skip)  # Scale down cluster requirements
            min_majority_frames = max(2, 6 // adaptive_frame_skip)  # Scale down majority requirements
            
            for result in results:
                boxes = result.boxes
                frame_has_punch = False
                frame_punch_type = None
                
                if boxes is not None and len(boxes) > 0:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        class_name = self.model.names[class_id]
                        
                        # Check if this is a punch type
                        # if class_name in ["jab", "cross", "hook", "uppercut"]:
                        if class_name in ["straight", "hook", "uppercut"]: # ADDED STRAIGHT
                            frame_has_punch = True
                            frame_punch_type = class_name
                            break  # Take the first punch detection in this frame
                
                # Cluster logic (based on count_punches_v5.py)
                if frame_has_punch and frame_punch_type:
                    # Add punch to current cluster
                    current_cluster_punches.append(frame_punch_type)
                    in_cluster = True
                    print(f"Frame {frame_count} punch: {frame_punch_type}")
                    
                elif in_cluster and len(current_cluster_punches) > 0:
                    # End of cluster - analyze it
                    print(f"Cluster ended. Punches: {current_cluster_punches}")
                    
                    # Only count if cluster has enough frames (adjusted for frame skip)
                    if len(current_cluster_punches) >= min_cluster_frames:
                        # Count frame types in cluster
                        # jab_frames = current_cluster_punches.count("jab")
                        # cross_frames = current_cluster_punches.count("cross")
                        straight_frames = current_cluster_punches.count("straight") # ADDED STRAIGHT
                        hook_frames = current_cluster_punches.count("hook")
                        uppercut_frames = current_cluster_punches.count("uppercut")

                        punch_frame_counts = {
                            "straight": straight_frames,
                            "hook": hook_frames,
                            "uppercut": uppercut_frames
                        }
                        
                        majority_punch = max(punch_frame_counts, key=punch_frame_counts.get)
                        majority_count = punch_frame_counts[majority_punch]
                        
                        # Only count if majority has enough frames (adjusted for frame skip)
                        if majority_count >= min_majority_frames:
                            punch_counts[majority_punch] += 1
                            punch_counts["total"] += 1
                            print(f"Counted 1 {majority_punch} punch")
                        else:
                            print(f"No punch type had {min_majority_frames}+ frames - ignoring cluster")
                    else:
                        print(f"Cluster too short ({len(current_cluster_punches)} frames) - ignoring")
                    
                    # Reset for next cluster
                    current_cluster_punches = []
                    in_cluster = False
                
                frame_count += 1
            
            print(f"Video processing complete. Punch counts: {punch_counts}")
            return punch_counts
            
        except Exception as e:
            print(f"Error processing video: {e}")
            raise Exception(f"Video processing failed: {str(e)}")
    
    def process_video_fast(self, video_path, max_resolution=480):
        """
        Ultra-fast video processing with maximum frame skipping
        
        What this does:
        - Processes every 5th frame for maximum speed
        - Uses lower resolution for even faster processing
        - Optimized for very long videos
        
        Args:
            video_path: Path to video file
            max_resolution: Maximum video resolution (default 480px for speed)
        
        Returns:
            dict: Punch counts by type
        """
        return self.process_video(video_path, frame_skip=5, max_resolution=max_resolution)
