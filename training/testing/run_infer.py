import sys
from ultralytics import YOLO

def main():
    if len(sys.argv) < 2:
        print("Usage: python run_infer.py <path_to_image_or_video>")
        return
    source = sys.argv[1]
    model = YOLO("best.pt")
    # change device="cpu" if they don't have a CUDA GPU
    model.predict(source=source, conf=0.25, device="cuda", save=True)

if __name__ == "__main__":
    main()
