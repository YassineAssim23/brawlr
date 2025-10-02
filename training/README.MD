# Brawlr Project: YOLOv8 Training & Data Workflow

This guide outlines the end‑to‑end process for training an initial YOLOv8 model with a public dataset, adding your own annotated data, and merging multiple datasets for a stronger final model. All commands below assume **Windows** with a Python virtual environment.


## Phase 1: Initial Model Training with Roboflow Data

### 1. Environment Setup
Create and activate a virtual environment for dependency isolation.

```bat
:: Create a virtual environment named .venv
python -m venv .venv

:: Activate the environment (CMD)
.\.venv\Scripts\activate.bat

:: (PowerShell alternative)
.\.venv\Scripts\Activate.ps1
```

### 2. Required PIP Installations
Install CUDA-enabled PyTorch (pick the index URL that matches your CUDA build), then core tools.

```bat
:: Example for CUDA 12.6 (update if needed)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126

:: Core packages
pip install -U ultralytics roboflow opencv-python supervision
```

### 3. Downloading the Boxpunch Dataset
Use the Roboflow-generated snippet (e.g., `download_data.py`) from the dataset’s Universe page to pull the data and `data.yaml`.

```bat
python download_data.py
```

> The script typically looks up your workspace/project and downloads a YOLOv8-ready dataset folder containing `train/`, `val/` (or `valid/`), and `data.yaml`.

### 4. Base Model Training
Train YOLOv8 using the downloaded `data.yaml`.

```bat
yolo detect train ^
  model=yolov8s.pt ^
  data="<DATASET_ROOT_1>\data.yaml" ^
  imgsz=640 ^
  epochs=100 ^
  batch=16 ^
  device=0 ^
  project="runs\boxpunch"
```

### 5. Initial Model Testing (Inference)
Run inference on a sample video (MOV recommended if orientation is correct on your system).

```bat
yolo detect predict ^
  model="runs\boxpunch\train\weights\best.pt" ^
  source="<VIDEO_FILE>" ^
  conf=0.25 ^
  device=0 ^
  save=True
```
---

## Phase 2: Generating and Annotating Custom Data

### 1. Video Frame Extraction
Convert your recorded videos into JPEG frames using `extract_frames.py`. Common flags:

- `--input` — path to the video file  
- `--output` — output directory for frames  
- `--fps` — sampling rate (e.g., 6)  
- `--max_height` — resize frames to this height, preserving aspect ratio  
- `--rotate` — `none | cw | ccw | 180` to manually rotate frames  
- `--auto_portrait` — ensure height ≥ width after rotation  
- `--sample` — if >0, stop after this many frames (useful for quick checks)

```bat
python extract_frames.py --input "<VIDEO_FILE>" --output "C:\PATH\TO\frames\vid1" --fps 6.0 --max_height 720 --rotate none
```

> If your video appears sideways, re-run with `--rotate cw` or `--rotate ccw`, and/or include `--auto_portrait`.

### 2. Frame Annotation (Label Studio)

**A. Activate and start Label Studio**
```bat
:: Ensure venv is active, then:
pip install label-studio
label-studio start
```

**B. Create the project and import frames**
1. In the web UI, create a **new project** (e.g., “Boxing – Phase 1”).  
2. Import generated .JPEG frames.    

**C. Configure labels** (matches your existing six classes):
```xml
<View>
  <Image name="img" value="$image"/>
  <RectangleLabels name="label" toName="img">
    <Label value="bag"/>
    <Label value="cross"/>
    <Label value="hook"/>
    <Label value="jab"/>
    <Label value="no punch"/>
    <Label value="uppercut"/>
  </RectangleLabels>
</View>
```

**D. Export (YOLO format)**
When a batch is labeled, **Export → YOLO (v5/v8)**. You’ll get `images/`, `labels/`, and a `data.yaml` (if your LS build includes it) or a `classes.txt` alongside the split. If you receive a flat export, you can split later in the merge step.

---

## Phase 3: Merging Datasets for Re-Training

### 1. Execute Dataset Merger Script
Use the general-purpose merger (`merge_yolo_multi.py`) to combine multiple YOLO datasets. Each dataset root should contain a `data.yaml` plus `train/` (and optionally `val/`, `test/`). If a dataset only has `train/`, the script will create a `val/` split automatically.

```bat
python merge_yolo_multi.py ^
  --out "<MERGED_DATASET_ROOT>" ^
  --datasets "<DATASET_ROOT_1>" "<DATASET_ROOT_2>" "<DATASET_ROOT_3>" ^
  --val_pct_if_missing 0.10
```

> You can list **2+** datasets after `--datasets`. The script preserves class order and prefixes filenames to avoid collisions.

### 2. Verify Merged Dataset
The merged folder contains unified splits and a brand-new `data.yaml`:

```
C:\LabelStudioWorkspace\boxing_plus_friend\
├─ train\
│  ├─ images\   # all training images (from all datasets, safely renamed)
│  └─ labels\   # corresponding YOLO .txt labels
├─ val\
│  ├─ images\
│  └─ labels\
├─ test\        # present if any input had test split
└─ data.yaml    # points to train/val/test and lists class names/order
```

---

## Phase 4: Final Re-Training

### 1. Final Training Command
Start a **new run** initialized from your prior best weights (transfer learning). Do **not** use `resume=True` when changing datasets.

```bat
yolo detect train ^
  model="<MODEL_WEIGHTS>" ^
  data="<MERGED_DATASET_ROOT>\data.yaml" ^
  imgsz=640 epochs=80 batch=16 device=0 project="<PROJECT_NAME>" ^
  lr0=0.001 patience=25 close_mosaic=10
```

When training finishes, validate and test on your gym clips:


:: Real-world test (use upright MOV if orientation issues arise)
yolo detect predict ^
  model="<PROJECT_NAME>\train\weights\best.pt" ^
  source="<VIDEO_FILE>" ^
  conf=0.25 device=0 save=True
```

---



