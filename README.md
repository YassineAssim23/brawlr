# Brawlr - AI Boxing Trainer

This repo contains a live camera boxing trainer with AI punch detection and training utilities.

## Project Structure
- `webapp/frontend/` - Next.js frontend with live camera feed
- `webapp/backend/` - FastAPI backend with YOLO model integration
- `training/` - Model training scripts and test utilities
- `webapp/backend/models/best.pt` - Trained YOLO model

## Prerequisites
- Windows 10/11
- Python 3.10+ on PATH (use `py -3` or `python`)
- Node.js 18+ for frontend

## Quick Start (Live Camera Demo)

### 1. Setup Backend
```bash
# Create and activate venv
py -3 -m venv .venv
.\.venv\Scripts\Activate  # or .venv\Scripts\activate.bat

# Install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt -r webapp\backend\requirements.txt

# Start backend server
uvicorn webapp.backend.app:app --reload --host 0.0.0.0 --port 8000
```

### 2. Setup Frontend
```bash
# In a new terminal, go to frontend directory
cd webapp\frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

### 3. Test Live Camera
1. Open http://localhost:3000
2. Click "Start Recording"
3. Allow camera permissions
4. You should see your live camera feed
5. Check browser console for "Punch detected: jab" messages

## Training Utilities

### Download Boxing Videos
```bash
# Install yt-dlp first
pip install yt-dlp

# Download a boxing video
python training\download_video.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Run Inference on Video File (CPU)
```bash
python training\testing\run_infer.py "PATHTOYOUYRVIDEO.MP4" cpu > training\inference_log.txt 2>&1 
```

### Run Inference on Video File (GPU)
```bash
python training\testing\run_infer.py "PATHTOYOUYRVIDEO.MP4" > training\inference_log.txt 2>&1
```
OR

```bash
python training\testing\run_infer.py "PATHTOYOUYRVIDEO.MP4" cuda
```
### Count Punches from Log
```bash
# Auto-find latest (recommended)
python training\testing\count_punches_v5.py

# Or specify a specific log if needed
python training\testing\count_punches_v5.py "runs\detect\predict2\inference_log.txt"
```

## Troubleshooting
- PowerShell execution policy blocks activation: run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- Backend not connecting: ensure uvicorn is running on port 8000
- Camera not working: check browser permissions and HTTPS requirements