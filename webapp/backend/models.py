# yolo_processor.py
import time
import sys
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
        if model_path is None:
            current_dir = Path(__file__).parent
            model_path = current_dir / "models" / "best_straight_v1.pt"

        print(f"Loading YOLO model from: {model_path}")
        try:
            self.model = YOLO(str(model_path))
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

    # --------------------------
    # Video processing + analysis
    # --------------------------
    def process_video_auto(self, video_path, device="cpu", save_log_to_predict=True):
        """
        Run YOLO inference on video_path, build an immediate in-memory inference log,
        perform cluster analysis (auto-detect stock/home), optionally save inference_log.txt
        into the latest runs/detect/predict* folder, and return structured counts.

        Args:
            video_path (str or Path): Video file to process.
            device (str): "cpu" or "cuda"
            save_log_to_predict (bool): If True, attempt to write inference_log.txt into runs/detect/predict*.

        Returns:
            dict: { "videoType": str, "punchCounts": { "straight": int, "hook": int, "uppercut": int, "total": int } }
        """
        if self.model is None:
            raise Exception("YOLO model not loaded")

        video_path = Path(video_path)
        print(f"\n🎥 Processing video: {video_path}  (device={device})")

        # Run inference
        try:
            results = self.model.predict(source=str(video_path), conf=self.confidence_threshold, device=device, verbose=False, save=False)
        except Exception as e:
            print(f"❌ Error running YOLO.predict: {e}")
            raise

        # Build reliable in-memory frame logs immediately (avoid delayed filesystem logs)
        frame_logs = self._build_frame_logs_from_results(results)

        # Optionally write the inference log into runs/detect/predict* (maintain compatibility)
        if save_log_to_predict:
            try:
                self._save_inference_log_to_latest_predict(video_path, device, frame_logs)
            except Exception as e:
                # Not fatal; just warn
                print(f"⚠️ Warning: couldn't save inference log to predict folder: {e}")

        # Analyze the frame logs (cluster detection, thresholds, majority logic)
        analysis = self._analyze_frame_logs(frame_logs)

        return analysis

    # --------------------------
    # Helpers: build logs, save log, analysis
    # --------------------------
    def _build_frame_logs_from_results(self, results):
        """
        Convert ultralytics Results -> human-readable frame log lines,
        e.g. "frame 1: 1 straight, 1 hook" or "frame 3: no detections"
        """
        frame_lines = []
        for i, result in enumerate(results):
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                frame_lines.append(f"frame {i}: no detections")
                continue

            class_counts = {}
            for box in boxes:
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]
                # Only keep classes we care about
                if class_name in ["straight", "hook", "uppercut"]:
                    class_counts[class_name] = class_counts.get(class_name, 0) + 1

            if class_counts:
                parts = [f"{count} {name}" for name, count in class_counts.items()]
                frame_lines.append(f"frame {i}: " + ", ".join(parts))
            else:
                frame_lines.append(f"frame {i}: no detections")

        return frame_lines

    def _save_inference_log_to_latest_predict(self, source_path, device, frame_logs):
        """
        Attempts to find the latest runs/detect/predict* directory and write an inference_log.txt there.
        This keeps compatibility with your older scripts that read from runs/detect/predict*/inference_log.txt.
        """
        repo_root = Path(__file__).resolve().parents[2]
        runs_dir = repo_root / "runs" / "detect"

        if not runs_dir.exists():
            print("runs/detect does not exist; skipping writing inference_log to predict folder.")
            return

        predict_folders = [d for d in runs_dir.iterdir() if d.is_dir() and d.name.startswith("predict")]
        if not predict_folders:
            print("No predict folders found under runs/detect; skipping writing inference_log.")
            return

        latest_predict = max(predict_folders, key=lambda x: x.stat().st_mtime)
        log_file = latest_predict / "inference_log.txt"

        with open(log_file, "w", encoding="utf-8") as f:
            f.write(f"Source: {source_path}\n")
            f.write(f"Device: {device}\n")
            f.write(f"Predict folder: {latest_predict}\n")
            f.write("\n" + "="*50 + "\n")
            f.write("FRAME DETECTIONS:\n")
            f.write("="*50 + "\n\n")
            for line in frame_logs:
                f.write(line + "\n")

        print(f"✅ Wrote inference_log.txt to: {log_file}")

    def _analyze_frame_logs(self, lines):
        """
        Implements the cluster detection / video-type detection / counting logic adapted from count_punches_v6.py.

        Returns a structured dict:
        {
            "videoType": "home"|"stock"|"unknown",
            "punchCounts": { "straight": int, "hook": int, "uppercut": int, "total": int }
        }
        """
        # Defensive copy
        lines = list(lines)

        # --- First pass: identify clusters to determine video type ---
        all_clusters = []
        temp_cluster = []
        in_temp_cluster = False

        for line in lines:
            has_punch = False
            punch_type = None

            if "frame" in line and ("straight" in line or "hook" in line or "uppercut" in line):
                if "straight" in line:
                    punch_type = "straight"
                    has_punch = True
                elif "hook" in line:
                    punch_type = "hook"
                    has_punch = True
                elif "uppercut" in line:
                    punch_type = "uppercut"
                    has_punch = True

            if has_punch and punch_type:
                temp_cluster.append(punch_type)
                in_temp_cluster = True
            elif in_temp_cluster and len(temp_cluster) > 0:
                all_clusters.append(len(temp_cluster))
                temp_cluster = []
                in_temp_cluster = False

        if temp_cluster:
            all_clusters.append(len(temp_cluster))

        # Determine video type
        if all_clusters:
            max_cluster_size = max(all_clusters)
            if max_cluster_size <= 6:
                video_type = "stock"
            else:
                video_type = "home"
        else:
            video_type = "unknown"

        # --- Second pass: count clusters using thresholds based on video type ---
        straight_count = 0
        hook_count = 0
        uppercut_count = 0

        current_cluster_punches = []
        in_cluster = False

        for line in lines:
            has_punch = False
            punch_type = None

            if "frame" in line and ("straight" in line or "hook" in line or "uppercut" in line):
                if "straight" in line:
                    punch_type = "straight"
                    has_punch = True
                elif "hook" in line:
                    punch_type = "hook"
                    has_punch = True
                elif "uppercut" in line:
                    punch_type = "uppercut"
                    has_punch = True

            if has_punch:
                current_cluster_punches.append(punch_type)
                in_cluster = True
            elif "frame" in line and ("no detections" in line or ("straight" not in line and "hook" not in line and "uppercut" not in line)):
                # cluster ended
                if in_cluster and len(current_cluster_punches) > 0:
                    # thresholds
                    min_cluster_size = 1 if video_type == "stock" else 8
                    min_majority = 1 if video_type == "stock" else 5

                    cluster_len = len(current_cluster_punches)
                    if cluster_len >= min_cluster_size:
                        straight_frames = current_cluster_punches.count("straight")
                        hook_frames = current_cluster_punches.count("hook")
                        uppercut_frames = current_cluster_punches.count("uppercut")

                        punch_frame_counts = {
                            "straight": straight_frames,
                            "hook": hook_frames,
                            "uppercut": uppercut_frames
                        }

                        # choose majority (tie-breaker: first-occurring in cluster)
                        max_count = max(punch_frame_counts.values())
                        majority_punch = None
                        for p in current_cluster_punches:
                            if punch_frame_counts[p] == max_count:
                                majority_punch = p
                                break

                        if majority_punch and max_count >= min_majority:
                            if majority_punch == "straight":
                                straight_count += 1
                            elif majority_punch == "hook":
                                hook_count += 1
                            elif majority_punch == "uppercut":
                                uppercut_count += 1
                        # else: ignored due to majority threshold
                    # else: ignored due to cluster too short

                # reset cluster
                current_cluster_punches = []
                in_cluster = False

        total = straight_count + hook_count + uppercut_count

        # Build structured return
        result = {
            "videoType": video_type,
            "punchCounts": {
                "straight": straight_count,
                "hook": hook_count,
                "uppercut": uppercut_count,
                "total": total
            }
        }

        # Optional debug print
        print("🔎 Analysis result:", result)
        return result
