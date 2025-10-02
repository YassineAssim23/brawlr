1. Create and activate venv. 

python -m venv .venv
.\.venv\Scripts\activate

2. Install dependencies - CPU ONLY. 

pip install ultralytics opencv-python torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

3. Run a quick test. 

cd "brawlr"
python training\testing\run_infer.py "C:\path\to\video.mp4"

Output appears - 

runs\detect\predict\


4. Run inference and punch counting together

PowerShell (recommended):

Two-step (clearer)
    python training\testing\run_infer.py "C:\path\to\video.mp4" cpu | Tee-Object -FilePath training\inference_log.txt
    python training\count_punches_v5.py training\inference_log.txt

One-liner
    python training\testing\run_infer.py "C:\path\to\video.mp4" cpu | Tee-Object -FilePath training\inference_log.txt; python training\count_punches_v5.py training\inference_log.txt

Command Prompt (cmd.exe):
    python training\testing\run_infer.py "C:\path\to\video.mp4" cpu > training\inference_log.txt && python training\count_punches_v5.py training\inference_log.txt

Notes:
- The counter reads a log file, not stdin. Ensure you pass the log path.
- PowerShell Tee-Object writes UTF-16 by default, matching the counter's encoding.
- Outputs (frames, AVI) are written under runs\\detect\\predict (kept out of git).

