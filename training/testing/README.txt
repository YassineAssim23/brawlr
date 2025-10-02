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

