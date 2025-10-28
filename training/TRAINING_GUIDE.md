# Quick Training Guide

Train a 2-class model (punch vs no-punch) in 4-6 hours.

## Step 1: Process All Datasets (5 min)

If you have zip files from Roboflow in a folder (like `Downloads/toTrain`):

```bash
python training/process_all_datasets.py --input_folder "C:/Users/Yassine/Downloads/toTrain" --output "datasets/final_simple"
```

This automatically:
- Extracts all zip files
- Relabels everything to "punch" / "no punch" 
- Merges them into one dataset
- Cleans up temp files

**OR** if you have unzipped folders already:

```bash
python training/relabel_to_simple.py --dataset_dir "dataset1" --output "simple_1"
python training/merge_yolo_multi.py --out "datasets/final" --datasets "simple_1" "simple_2" ...
```

## Step 2: Train (2-4 hours GPU, 8-12 hours CPU)

```bash
# GPU:
python training/quick_train.py --data "datasets/final_simple/data.yaml" --epochs 30 --device 0

# CPU:
python training/quick_train.py --data "datasets/final_simple/data.yaml" --epochs 20 --device cpu
```

## Step 3: Test Model

```bash
python training/testing/run_infer.py "training/videos/your_video.mp4" cuda
```

## Done!

Your new model will be in `runs/simple_punch/train/weights/best.pt`

---

**That's it!** Copy the model to `webapp/backend/models/` when ready.

---

**Note:** The script handles different class names automatically (jab, cross, hook, uppercut, punch, etc → all become "punch"). No need to unzip first - the script does everything!

