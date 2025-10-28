#!/usr/bin/env python3
"""
Quick training script for 2-class punch detection

This trains a fast model on the relabeled dataset with just "punch" and "no punch" classes.

Usage:
    python quick_train.py --data "simple_dataset" --epochs 30 --device 0
"""

import argparse
import sys
from pathlib import Path
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(description="Quick train a punch detection model")
    parser.add_argument('--data', required=True, help="Path to data.yaml file")
    parser.add_argument('--epochs', type=int, default=30, help="Number of epochs (default: 30)")
    parser.add_argument('--batch', type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument('--device', default=0, help="Device to use: 0 for GPU, cpu for CPU")
    parser.add_argument('--imgsz', type=int, default=640, help="Image size (default: 640)")
    parser.add_argument('--model', help="Starting model (default: yolov8n.pt)")
    parser.add_argument('--project', default="runs/simple_punch", help="Project name")
    
    args = parser.parse_args()
    
    # Check if data.yaml exists
    data_path = Path(args.data)
    if not data_path.exists():
        if (data_path / "data.yaml").exists():
            data_path = data_path / "data.yaml"
        else:
            print(f"❌ Error: data.yaml not found at {data_path}")
            sys.exit(1)
    
    # Use provided model or default to smallest
    if args.model:
        model_path = args.model
    else:
        model_path = "yolov8n.pt"  # nano model for faster training
    
    print(f"🚀 Starting quick training...")
    print(f"📊 Data: {data_path}")
    print(f"🧠 Model: {model_path}")
    print(f"⚙️  Epochs: {args.epochs}")
    print(f"📦 Batch: {args.batch}")
    print(f"🖥️  Device: {args.device}")
    print(f"🖼️  Image size: {args.imgsz}")
    print(f"📁 Project: {args.project}")
    
    try:
        # Load model
        model = YOLO(model_path)
        
        # Train
        results = model.train(
            data=str(data_path),
            epochs=args.epochs,
            batch=args.batch,
            imgsz=args.imgsz,
            device=args.device,
            project=args.project,
            name="train",
            patience=0,  # Disable early stopping - run all epochs
            save=True,
            exist_ok=True,
            plots=True
        )
        
        print("\n✅ Training complete!")
        print(f"📁 Results saved to: {Path(args.project) / 'train'}")
        
        # Find best model
        best_model = Path(args.project) / "train" / "weights" / "best.pt"
        if best_model.exists():
            print(f"\n🏆 Best model: {best_model}")
            print(f"\n💡 To copy to webapp:")
            print(f"   copy {best_model} webapp\\backend\\models\\best_simple.pt")
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()






