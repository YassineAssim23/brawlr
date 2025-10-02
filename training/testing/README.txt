1) Create and activate venv (from repo root)

PowerShell
    py -3 -m venv .venv
    .\.venv\Scripts\Activate.ps1

CMD
    py -3 -m venv .venv
    .venv\Scripts\activate.bat

2) Install requirements
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt -r training\requirements.txt

3) Run inference (repo root)

PowerShell
    python training\testing\run_infer.py training\videos\BagVideo0.MOV cpu *>&1 | Tee-Object -FilePath training\inference_log.txt

CMD
    python training\testing\run_infer.py training\videos\BagVideo0.MOV cpu > training\inference_log.txt 2>&1

4) Run punch counter (repo root)
    .\.venv\Scripts\python.exe training\testing\count_punches_v5.py training\inference_log.txt

Optional thresholds
    .\.venv\Scripts\python.exe training\testing\count_punches_v5.py training\inference_log.txt --min-cluster 10 --majority 8 --min-gap-lines 10

Outputs
- Annotated predictions in runs\detect\predict*
- Log at training\inference_log.txt

