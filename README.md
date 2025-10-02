# Brawlr - AI Boxing Trainer

This repo contains training utilities and a minimal test harness to run your YOLO model on a video and count punches.

## Project Structure (relevant now)
- `training/` - scripts, test video(s), and punch counter
- `webapp/backend/models/best.pt` - current model file used by tests
- `runs/` - YOLO outputs (created on first run; ignored by git)

## Prerequisites
- Windows 10/11
- Python 3.10+ on PATH (use `py -3` or `python`)

## Setup (choose one shell)

PowerShell
1. Create venv
   - `py -3 -m venv .venv` (or `python -m venv .venv`)
2. Activate venv (if blocked by policy, see Troubleshooting)
   - `.\.venv\Scripts\Activate.ps1`
3. Install deps
   - `python -m pip install --upgrade pip`
   - `python -m pip install -r requirements.txt -r training\requirements.txt`

Command Prompt (cmd.exe)
1. Create venv
   - `py -3 -m venv .venv` (or `python -m venv .venv`)
2. Activate venv
   - `.venv\Scripts\activate.bat`
3. Install deps
   - `python -m pip install --upgrade pip`
   - `python -m pip install -r requirements.txt -r training\requirements.txt`

## Run Inference (creates predictions and a log)
From repo root:

PowerShell
- `python training\testing\run_infer.py training\videos\BagVideo0.MOV cpu *>&1 | Tee-Object -FilePath training\inference_log.txt`

CMD
- `python training\testing\run_infer.py training\videos\BagVideo0.MOV cpu > training\inference_log.txt 2>&1`

Outputs:
- Predictions and an annotated video in `runs\detect\predict*`.
- Logs in `training\inference_log.txt`.

## Count Punches
PowerShell (repo root)
- `\.venv\Scripts\python.exe training\testing\count_punches_v5.py training\inference_log.txt`

CMD (repo root)
- `\.venv\Scripts\python.exe training\testing\count_punches_v5.py training\inference_log.txt`

Optional thresholds (if you see over/under-counting):
- Append flags, e.g. `--min-cluster 10 --majority 8 --min-gap-lines 10`

## Troubleshooting
- PowerShell execution policy blocks activation: run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, then activate again. Or use CMD.
- Ensure you’re using the venv Python: invoke explicitly as `\.venv\Scripts\python.exe`.
- Model path: the test runner loads `webapp/backend/models/best.pt`.