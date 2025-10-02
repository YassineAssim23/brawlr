import sys
from pathlib import Path

# Determine log path (default to inference_log.txt in CWD, or first CLI arg)
log_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('inference_log.txt')

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
jab_count = 0
cross_count = 0
hook_count = 0
uppercut_count = 0

current_cluster_punches = [] # Store punch types in current cluster
in_cluster = False # Tells us if we are currently in a cluster

print(f"Analyzing the log file: {log_path}")

# Loop through each line in the log file to find clusters of punches
for line in lines:
    # If the line contains the words "frame" and "1 bag, 1" and any type of punch, then we have found a cluster of punches
    if "frame" in line and "1 bag, 1" in line and ("jab" in line or "cross" in line or "hook" in line or "uppercut" in line):
        # Add the punch type to the current cluster array
        if "jab" in line:
            current_cluster_punches.append("jab")
        elif "cross" in line:
            current_cluster_punches.append("cross")
        elif "hook" in line:
            current_cluster_punches.append("hook")
        elif "uppercut" in line:
            current_cluster_punches.append("uppercut")
        
        in_cluster = True # We are in a cluster
        print(f"Punch type: {current_cluster_punches[-1]}") # Prints all punch types found in the cluster
        
    # If the line contains the words "1 bag," and "no punch" or "1 bag," and no punch type, then the cluster has ended
    elif "1 bag," in line and ("no punch" in line or ("1 bag," in line and "jab" not in line and "cross" not in line and "hook" not in line and "uppercut" not in line)):
        
        if in_cluster and len(current_cluster_punches) > 0:
            print(f"Cluster Ended\nPunches found: {current_cluster_punches}")
            
            # Count punches
            if len(current_cluster_punches) >= 8:  # Only count if we have at least 8 frames minimum
                # Counts how many of each punch type detected
                jab_frames = current_cluster_punches.count("jab")
                cross_frames = current_cluster_punches.count("cross")
                hook_frames = current_cluster_punches.count("hook")
                uppercut_frames = current_cluster_punches.count("uppercut")
                
                print("Cluster analysis:")
                print(f"  Jab frames: {jab_frames}")
                print(f"  Cross frames: {cross_frames}")
                print(f"  Hook frames: {hook_frames}")
                print(f"  Uppercut frames: {uppercut_frames}")
                
                # Find which punch type was detected in the most frames
                punch_counts = {
                    "jab": jab_frames,
                    "cross": cross_frames,
                    "hook": hook_frames,
                    "uppercut": uppercut_frames
                }
                
                majority_punch = max(punch_counts, key=punch_counts.get) # Finds the punch type with the most frames within the cluster
                majority_count = punch_counts[majority_punch] # Finds the number of frames of the punch type with the most frames
                
                # Only counts if the majority punch has at least 6 frames to avoid inaccuracies
                if majority_count >= 6: # 6 frames is the minimum to avoid inaccuracies
                    if majority_punch == "jab": # Increments the punch count
                        jab_count += 1
                    elif majority_punch == "cross":
                        cross_count += 1
                    elif majority_punch == "hook":
                        hook_count += 1
                    elif majority_punch == "uppercut":
                        uppercut_count += 1
                    
                    print(f"  Counted 1 {majority_punch} punch\n\n")
                else:
                    print(f"  No punch type had 5+ frames - ignoring cluster\n\n")
            else:
                print(f"  Cluster too short ({len(current_cluster_punches)} frames) - ignoring\n\n")
        
        # Reset for next cluster
        current_cluster_punches = []
        in_cluster = False

print("==================================================")
print("FINAL PUNCH COUNT RESULTS")
print("==================================================")
print(f"Jab: {jab_count}")
print(f"Cross: {cross_count}")
print(f"Hook: {hook_count}")
print(f"Uppercut: {uppercut_count}")
print(f"Total punches: {jab_count + cross_count + hook_count + uppercut_count}")
print("==================================================")
# Correct results from BagVideo0
print("\nExpected results:")
print("Jab: 15")
print("Cross: 15")
print("Hook: 30")
print("Uppercut: 15")

