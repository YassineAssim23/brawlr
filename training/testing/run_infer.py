# training/testing/run_infer.py
import sys
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
    # Adjusted to current repo layout: model is under webapp/backend/models/best.pt
    model_path = repo_root / "webapp" / "backend" / "models" / "best.pt"

    if not model_path.exists():
        print(f"Model not found: {model_path}")
        return

    model = YOLO(str(model_path))
    model.predict(source=source, conf=0.25, device=device, save=True)

if __name__ == "__main__":
    main()