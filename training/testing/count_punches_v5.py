# import sys
# from pathlib import Path

# def find_latest_predict_log():
#     """Find the latest predict folder's inference_log.txt"""
#     repo_root = Path(__file__).resolve().parents[2]
#     runs_dir = repo_root / "runs" / "detect"
    
#     print(f"Looking for predict folders in: {runs_dir}")
#     print(f"Directory exists: {runs_dir.exists()}")
    
#     if not runs_dir.exists():
#         print("❌ runs/detect directory doesn't exist")
#         return None
    
#     # List all directories to debug
#     all_dirs = [d for d in runs_dir.iterdir() if d.is_dir()]
#     print(f"All directories found: {[d.name for d in all_dirs]}")
    
#     predict_folders = [d for d in all_dirs if d.name.startswith("predict")]
#     print(f"Predict folders found: {[d.name for d in predict_folders]}")
    
#     if not predict_folders:
#         print("❌ No predict folders found")
#         return None
    
#     # Get the most recent predict folder by creation time
#     latest_predict = max(predict_folders, key=lambda x: x.stat().st_mtime)
#     log_file = latest_predict / "inference_log.txt"
    
#     print(f"Latest predict folder: {latest_predict}")
#     print(f"Log file exists: {log_file.exists()}")
    
#     if log_file.exists():
#         return log_file
    
#     return None

# # Determine log path
# if len(sys.argv) > 1:
#     # Use provided path
#     log_path = Path(sys.argv[1])
# else:
#     # Auto-find latest predict folder log
#     latest_log = find_latest_predict_log()
#     if latest_log:
#         log_path = latest_log
#         print(f"Auto-detected latest log: {log_path}")
#     else:
#         log_path = Path('inference_log.txt')
#         print(f"No predict folders found, using: {log_path}")

# def read_lines_with_fallbacks(path: Path):
#     encodings_to_try = ['utf-16', 'utf-8-sig', 'utf-8', 'latin-1']
#     for enc in encodings_to_try:
#         try:
#             with open(path, 'r', encoding=enc, errors='strict') as f:
#                 return f.readlines()
#         except Exception:
#             continue
#     # Last resort: permissive read
#     with open(path, 'r', encoding='utf-8', errors='replace') as f:
#         return f.readlines()

# lines = read_lines_with_fallbacks(log_path)

# # Initialize each punch type count to 0
# jab_count = 0
# cross_count = 0
# hook_count = 0
# uppercut_count = 0

# current_cluster_punches = [] # Store punch types in current cluster
# in_cluster = False # Tells us if we are currently in a cluster

# print(f"Analyzing the log file: {log_path}")

# # First pass: Detect video type by analyzing cluster patterns
# all_clusters = []
# temp_cluster = []
# in_temp_cluster = False

# for line in lines:
#     has_punch = False
#     punch_type = None
    
#     if "frame" in line and ("jab" in line or "cross" in line or "hook" in line or "uppercut" in line):
#         if "jab" in line:
#             punch_type = "jab"
#             has_punch = True
#         elif "cross" in line:
#             punch_type = "cross"
#             has_punch = True
#         elif "hook" in line:
#             punch_type = "hook"
#             has_punch = True
#         elif "uppercut" in line:
#             punch_type = "uppercut"
#             has_punch = True
    
#     if has_punch and punch_type:
#         temp_cluster.append(punch_type)
#         in_temp_cluster = True
#     elif in_temp_cluster and len(temp_cluster) > 0:
#         all_clusters.append(len(temp_cluster))
#         temp_cluster = []
#         in_temp_cluster = False

# # Add final cluster if exists
# if temp_cluster:
#     all_clusters.append(len(temp_cluster))

# # Determine video type based on cluster size distribution
# if all_clusters:
#     avg_cluster_size = sum(all_clusters) / len(all_clusters)
#     max_cluster_size = max(all_clusters)
    
#     # Simple detection: if max cluster size is small, it's stock footage
#     max_cluster_size = max(all_clusters) if all_clusters else 0
    
#     # Stock footage: max cluster <= 6 frames
#     # Home videos: max cluster > 6 frames
#     if max_cluster_size <= 6:
#         video_type = "stock"
#         print(f"Detected: STOCK FOOTAGE (max cluster: {max_cluster_size})")
#     else:
#         video_type = "home"
#         print(f"Detected: HOME VIDEO (max cluster: {max_cluster_size})")
# else:
#     video_type = "unknown"
#     print("No clusters detected")

# # Second pass: Count punches with appropriate thresholds
# print("\nCounting punches...")

# # Loop through each line in the log file to find clusters of punches
# for line in lines:
#     # Check if line contains a punch detection (either "1 jab", "1 cross", etc. or "1 bag, 1 jab", etc.)
#     has_punch = False
#     punch_type = None
    
#     if "frame" in line and ("jab" in line or "cross" in line or "hook" in line or "uppercut" in line):
#         # Extract punch type
#         if "jab" in line:
#             punch_type = "jab"
#             has_punch = True
#         elif "cross" in line:
#             punch_type = "cross"
#             has_punch = True
#         elif "hook" in line:
#             punch_type = "hook"
#             has_punch = True
#         elif "uppercut" in line:
#             punch_type = "uppercut"
#             has_punch = True
    
#     if has_punch:
#         # Add the punch type to the current cluster array
#         current_cluster_punches.append(punch_type)
#         in_cluster = True # We are in a cluster
#         print(f"Punch type: {punch_type}") # Prints all punch types found in the cluster
        
#     # If the line contains "no detections" or no punch type, then the cluster has ended
#     elif "frame" in line and ("no detections" in line or ("jab" not in line and "cross" not in line and "hook" not in line and "uppercut" not in line)):
        
#         if in_cluster and len(current_cluster_punches) > 0:
#             print(f"Cluster Ended\nPunches found: {current_cluster_punches}")
            
#             # Count punches
#             # Use detected video type for appropriate thresholds
#             if video_type == "stock":
#                 min_cluster_size = 1  # Stock footage: count single frames
#             else:  # home video
#                 min_cluster_size = 8  # Home videos: need 8+ frames (stricter)
            
#             if len(current_cluster_punches) >= min_cluster_size:
#                 # Counts how many of each punch type detected
#                 jab_frames = current_cluster_punches.count("jab")
#                 cross_frames = current_cluster_punches.count("cross")
#                 hook_frames = current_cluster_punches.count("hook")
#                 uppercut_frames = current_cluster_punches.count("uppercut")
                
#                 print("Cluster analysis:")
#                 print(f"  Jab frames: {jab_frames}")
#                 print(f"  Cross frames: {cross_frames}")
#                 print(f"  Hook frames: {hook_frames}")
#                 print(f"  Uppercut frames: {uppercut_frames}")
                
#                 # Find which punch type was detected in the most frames
#                 punch_counts = {
#                     "jab": jab_frames,
#                     "cross": cross_frames,
#                     "hook": hook_frames,
#                     "uppercut": uppercut_frames
#                 }
                
#                 # Find the punch type with the highest count
#                 max_count = max(punch_counts.values())
#                 majority_punch = None
                
#                 # If there's a tie, prefer the punch type that appears first in the cluster
#                 # This gives priority to the punch that was detected first
#                 for punch_type in current_cluster_punches:
#                     if punch_counts[punch_type] == max_count:
#                         majority_punch = punch_type
#                         break
                
#                 # Debug: Show what we're choosing
#                 print(f"  Choosing: {majority_punch} (count: {max_count})")
                
#                 majority_count = max_count
                
#                 # Only counts if the majority punch has at least 6 frames to avoid inaccuracies
#                 # Use detected video type for majority threshold
#                 if video_type == "stock":
#                     min_majority = 1  # Stock footage: count any majority
#                 else:  # home video
#                     min_majority = 5  # Home videos: need 5+ frames for majority (stricter)
                
#                 if majority_count >= min_majority:
#                     if majority_punch == "jab": # Increments the punch count
#                         jab_count += 1
#                     elif majority_punch == "cross":
#                         cross_count += 1
#                     elif majority_punch == "hook":
#                         hook_count += 1
#                     elif majority_punch == "uppercut":
#                         uppercut_count += 1
                    
#                     print(f"  Counted 1 {majority_punch} punch\n\n")
#                 else:
#                     print(f"  No punch type had {min_majority}+ frames - ignoring cluster\n\n")
#             else:
#                 print(f"  Cluster too short ({len(current_cluster_punches)} frames) - ignoring\n\n")
        
#         # Reset for next cluster
#         current_cluster_punches = []
#         in_cluster = False

# print("==================================================")
# print("FINAL PUNCH COUNT RESULTS")
# print("==================================================")
# print(video_type)
# print(f"Jab: {jab_count}")
# print(f"Cross: {cross_count}")
# print(f"Hook: {hook_count}")
# print(f"Uppercut: {uppercut_count}")
# print(f"Total punches: {jab_count + cross_count + hook_count + uppercut_count}")
# print("==================================================")
# # Note: Update expected results based on the specific video being analyzed
# print("\nNote: Update expected results in this script based on the video being analyzed")

# # python training\testing\count_punches_v5.py training\inference_log.txt

import sys
from pathlib import Path

def find_latest_predict_log():
    """Find the latest predict folder's inference_log.txt"""
    repo_root = Path(__file__).resolve().parents[2]
    runs_dir = repo_root / "runs" / "detect"
    
    print(f"Looking for predict folders in: {runs_dir}")
    print(f"Directory exists: {runs_dir.exists()}")
    
    if not runs_dir.exists():
        print("❌ runs/detect directory doesn't exist")
        return None
    
    # List all directories to debug
    all_dirs = [d for d in runs_dir.iterdir() if d.is_dir()]
    print(f"All directories found: {[d.name for d in all_dirs]}")
    
    predict_folders = [d for d in all_dirs if d.name.startswith("predict")]
    print(f"Predict folders found: {[d.name for d in predict_folders]}")
    
    if not predict_folders:
        print("❌ No predict folders found")
        return None
    
    # Get the most recent predict folder by creation time
    latest_predict = max(predict_folders, key=lambda x: x.stat().st_mtime)
    log_file = latest_predict / "inference_log.txt"
    
    print(f"Latest predict folder: {latest_predict}")
    print(f"Log file exists: {log_file.exists()}")
    
    if log_file.exists():
        return log_file
    
    return None

# Determine log path
if len(sys.argv) > 1:
    # Use provided path
    log_path = Path(sys.argv[1])
else:
    # Auto-find latest predict folder log
    latest_log = find_latest_predict_log()
    if latest_log:
        log_path = latest_log
        print(f"Auto-detected latest log: {log_path}")
    else:
        log_path = Path('inference_log.txt')
        print(f"No predict folders found, using: {log_path}")

def read_lines_with_fallbacks(path: Path):
    encodings_to_try = ['utf-16', 'utf-8-sig', 'utf-8', 'latin-1']
    for enc in encodings_to_try:
        try:
            with open(path, 'r', encoding=enc, errors='strict') as f:
                return f.readlines()
        except Exception:
            continue
    # Last resort: permissive read
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        return f.readlines()

lines = read_lines_with_fallbacks(log_path)

# Initialize each punch type count to 0
straight_count = 0
hook_count = 0
uppercut_count = 0

current_cluster_punches = [] # Store punch types in current cluster
in_cluster = False # Tells us if we are currently in a cluster

print(f"Analyzing the log file: {log_path}")

# First pass: Detect video type by analyzing cluster patterns
all_clusters = []
temp_cluster = []
in_temp_cluster = False

for line in lines:
    has_punch = False
    punch_type = None
    
    if "frame" in line and ("straight" in line or "hook" in line or "uppercut" in line):
        if "straight" in line:
            punch_type = "straight"
            has_punch = True
        elif "hook" in line:
            punch_type = "hook"
            has_punch = True
        elif "uppercut" in line:
            punch_type = "uppercut"
            has_punch = True
    
    if has_punch and punch_type:
        temp_cluster.append(punch_type)
        in_temp_cluster = True
    elif in_temp_cluster and len(temp_cluster) > 0:
        all_clusters.append(len(temp_cluster))
        temp_cluster = []
        in_temp_cluster = False

# Add final cluster if exists
if temp_cluster:
    all_clusters.append(len(temp_cluster))

# Determine video type based on cluster size distribution
if all_clusters:
    avg_cluster_size = sum(all_clusters) / len(all_clusters)
    max_cluster_size = max(all_clusters)
    
    # Simple detection: if max cluster size is small, it's stock footage
    max_cluster_size = max(all_clusters) if all_clusters else 0
    
    # Stock footage: max cluster <= 6 frames
    # Home videos: max cluster > 6 frames
    if max_cluster_size <= 6:
        video_type = "stock"
        print(f"Detected: STOCK FOOTAGE (max cluster: {max_cluster_size})")
    else:
        video_type = "home"
        print(f"Detected: HOME VIDEO (max cluster: {max_cluster_size})")
else:
    video_type = "unknown"
    print("No clusters detected")

# Second pass: Count punches with appropriate thresholds
print("\nCounting punches...")

# Loop through each line in the log file to find clusters of punches
for line in lines:
    # Check if line contains a punch detection (either "1 jab", "1 cross", etc. or "1 bag, 1 jab", etc.)
    has_punch = False
    punch_type = None
    
    if "frame" in line and ("straight" in line or "hook" in line or "uppercut" in line):
        # Extract punch type
        if "straight" in line:
            punch_type = "straight"
            has_punch = True
        elif "hook" in line:
            punch_type = "hook"
            has_punch = True
        elif "uppercut" in line:
            punch_type = "uppercut"
            has_punch = True
    
    if has_punch:
        # Add the punch type to the current cluster array
        current_cluster_punches.append(punch_type)
        in_cluster = True # We are in a cluster
        print(f"Punch type: {punch_type}") # Prints all punch types found in the cluster
        
    # If the line contains "no detections" or no punch type, then the cluster has ended
    elif "frame" in line and ("no detections" in line or ("straight" not in line and "hook" not in line and "uppercut" not in line)):
        
        if in_cluster and len(current_cluster_punches) > 0:
            print(f"Cluster Ended\nPunches found: {current_cluster_punches}")
            
            # Count punches
            # Use detected video type for appropriate thresholds
            if video_type == "stock":
                min_cluster_size = 1  # Stock footage: count single frames
            else:  # home video
                min_cluster_size = 8  # Home videos: need 8+ frames (stricter)
            
            if len(current_cluster_punches) >= min_cluster_size:
                # Counts how many of each punch type detected
                straight_frames = current_cluster_punches.count("straight")
                hook_frames = current_cluster_punches.count("hook")
                uppercut_frames = current_cluster_punches.count("uppercut")
                
                print("Cluster analysis:")
                print(f"  Straight frames: {straight_frames}")
                print(f"  Hook frames: {hook_frames}")
                print(f"  Uppercut frames: {uppercut_frames}")
                
                # Find which punch type was detected in the most frames
                punch_counts = {
                    "straight": straight_frames,
                    "hook": hook_frames,
                    "uppercut": uppercut_frames
                }
                
                # Find the punch type with the highest count
                max_count = max(punch_counts.values())
                majority_punch = None
                
                # If there's a tie, prefer the punch type that appears first in the cluster
                # This gives priority to the punch that was detected first
                for punch_type in current_cluster_punches:
                    if punch_counts[punch_type] == max_count:
                        majority_punch = punch_type
                        break
                
                # Debug: Show what we're choosing
                print(f"  Choosing: {majority_punch} (count: {max_count})")
                
                majority_count = max_count
                
                # Only counts if the majority punch has at least 6 frames to avoid inaccuracies
                # Use detected video type for majority threshold
                if video_type == "stock":
                    min_majority = 1  # Stock footage: count any majority
                else:  # home video
                    min_majority = 5  # Home videos: need 5+ frames for majority (stricter)
                
                if majority_count >= min_majority:
                    if majority_punch == "straight": # Increments the punch count
                        straight_count += 1
                    elif majority_punch == "hook":
                        hook_count += 1
                    elif majority_punch == "uppercut":
                        uppercut_count += 1
                    
                    print(f"  Counted 1 {majority_punch} punch\n\n")
                else:
                    print(f"  No punch type had {min_majority}+ frames - ignoring cluster\n\n")
            else:
                print(f"  Cluster too short ({len(current_cluster_punches)} frames) - ignoring\n\n")
        
        # Reset for next cluster
        current_cluster_punches = []
        in_cluster = False

print("==================================================")
print("FINAL PUNCH COUNT RESULTS")
print("==================================================")
# print(video_type)
print(f"Straight: {straight_count}")
print(f"Hook: {hook_count}")
print(f"Uppercut: {uppercut_count}")
print(f"Total punches: {straight_count + hook_count + uppercut_count}")
print("==================================================")
# Note: Update expected results based on the specific video being analyzed
print("\nNote: Update expected results in this script based on the video being analyzed")

# TO RUN SCRIPT:
# cd brawlr\brawlr
# .\.venv\Scripts\Activate
# Generate inference_log.txt: python training\testing\run_infer.py "training\videos\BagVideoTESTONLY.avi" cpu > training\inference_log.txt 2>&1
# Count punches: python training\testing\count_punches_v6.py training\inference_log.txt
