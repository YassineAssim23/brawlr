# training/testing/run_infer.py
import sys
import os
import io
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from ultralytics import YOLO

def main():
    if len(sys.argv) < 2:
        print("Usage: python run_infer.py <path_to_image_or_video> [cpu|cuda]")
        return

    source = sys.argv[1]
    device = sys.argv[2] if len(sys.argv) >= 3 else "cpu"  # default to CPU
    
    # Resolve repo root from this file's location
    repo_root = Path(__file__).resolve().parents[2]
    
    # If source is a relative path, make it absolute from repo root
    if not Path(source).is_absolute():
        source = repo_root / source
    
    # Debug: Print what we're using
    print(f"Source: {source}")
    print(f"Device: {device}")
    print(f"Source exists: {Path(source).exists()}")
    
    # Use new trained model (yassinesmodel.pt) or fallback to old models
    model_path = repo_root / "webapp" / "backend" / "models" / "yassinesmodel.pt"
    
    if not model_path.exists():
        # Fallback to old model
        model_path = repo_root / "webapp" / "backend" / "models" / "best.pt"
        
    if not model_path.exists():
        print(f"Model not found. Tried yassinev2.pt and best.pt")
        return
    
    print(f"Using model: {model_path.name}")

    model = YOLO(str(model_path))
    
    # Run prediction and get results
    results = model.predict(source=source, conf=0.1, device=device, save=True, verbose=True)
    
    # Build the frame detection log manually from results
    frame_detections = []
    frame_detections.append("FRAME DETECTIONS:")
    frame_detections.append("="*50)
    frame_detections.append("")
    
    # Process each result (each frame)
    for i, result in enumerate(results):
        frame_num = i + 1
        boxes = result.boxes
        
        if boxes is not None and len(boxes) > 0:
            # Count detections by class
            class_counts = {}
            for box in boxes:
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                class_counts[class_name] = class_counts.get(class_name, 0) + 1
            
            # Format the detection line
            detection_parts = []
            for class_name, count in class_counts.items():
                detection_parts.append(f"{count} {class_name}")
            
            detection_line = f"frame {frame_num}: {', '.join(detection_parts)}"
            frame_detections.append(detection_line)
        else:
            frame_detections.append(f"frame {frame_num}: no detections")
    
    # Join all frame detections
    captured_stdout = "\n".join(frame_detections)
    captured_stderr = ""
    
    # Find the latest predict folder
    runs_dir = repo_root / "runs" / "detect"
    predict_folders = [d for d in runs_dir.iterdir() if d.is_dir() and d.name.startswith("predict")]
    
    if predict_folders:
        # Get the most recent predict folder by creation time (not alphabetical)
        latest_predict = max(predict_folders, key=lambda x: x.stat().st_mtime)
        print(f"Results saved to: {latest_predict}")
        
        # Save inference log to the predict folder
        log_file = latest_predict / "inference_log.txt"
        
        print(f"Saving inference log to: {log_file}")
        
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write(f"Source: {source}\n")
            f.write(f"Device: {device}\n")
            f.write(f"Predict folder: {latest_predict}\n")
            f.write("\n" + "="*50 + "\n")
            f.write("FRAME DETECTIONS:\n")
            f.write("="*50 + "\n\n")
            f.write(captured_stdout)
            
            if captured_stderr:
                f.write("\n" + "="*50 + "\n")
                f.write("STDERR:\n")
                f.write("="*50 + "\n\n")
                f.write(captured_stderr)
        
        print(f"✅ Full inference log saved to: {log_file}")
    else:
        print("No predict folder found")

if __name__ == "__main__":
    main()