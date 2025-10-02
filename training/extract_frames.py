import cv2
from cv2 import CAP_PROP_FPS, ROTATE_90_CLOCKWISE, ROTATE_90_COUNTERCLOCKWISE, ROTATE_180, INTER_AREA
import argparse
from pathlib import Path

#Instance of pathclass for OS path and directory management 
P = argparse.ArgumentParser(description="A simple video frame extractor.")
#Command line arguments to be used to control the script behavior
P.add_argument("--input", required=True, help="Path to the video file")
P.add_argument("--output", required=True, help="Output directory for frames")
P.add_argument("--fps", type=float, default=6.0, help="Target frame rate for extraction")
P.add_argument("--max_height", type=int, default=720, help="Max height for resizing frames")
P.add_argument("--rotate", choices=["none","cw","ccw","180"], default="none",
               help="Specify initial rotation (cw/ccw/180)")
P.add_argument("--auto_portrait", action="store_true",
               help="Automatically rotate to ensure height >= width")
P.add_argument("--sample", type=int, default=0,
               help="If greater than 0, stop after this many frames (for debugging)")
#Take CLI command line arguments and store in object ARGS when needs to be altered or accessed
ARGS = P.parse_args()

# Create a video capture object using the path provided by --input 
video_cap = cv2.VideoCapture(ARGS.input)
#Check to see if the file was opened, if not throw a runtime error 
if not video_cap.isOpened():
    raise RuntimeError("Error: Could not open video file.")

#Get OG FPS of video, if nothing then provide generic value of 30
SRC_FPS = video_cap.get(CAP_PROP_FPS) 
if SRC_FPS == 0:
    SRC_FPS = 30.0

#Calculate how many OG frames to be read to get ARGS.fps target
skip_interval = int(round(SRC_FPS / ARGS.fps))
#Will save every frame if target fps >= source fps 
if skip_interval < 1:
    skip_interval = 1 

#Path object for output directory 
out_folder = Path(ARGS.output)
#Create output directory if it doesn't exist and parent directories 
out_folder.mkdir(parents=True, exist_ok=True)

# Loop counters 
F_COUNT = 0  # Total frames read
S_COUNT = 0  # Total frames saved

# Loop to process video frame by frame 
while True:
    # Read data from next frame, store the boolean return in ret and the frame itself in frame
    ret = video_cap.read()
    frame = video_cap.read() 
    if not ret:
        break # End of video

    # Only process frames at the desired FPS
    if F_COUNT % skip_interval == 0:
        
        # Apply rotation if specified in CLI command (ARGS)  
        if ARGS.rotate == "cw":
            frame = cv2.rotate(frame, ROTATE_90_CLOCKWISE)
        elif ARGS.rotate == "ccw":
            frame = cv2.rotate(frame, ROTATE_90_COUNTERCLOCKWISE)
        elif ARGS.rotate == "180":
            frame = cv2.rotate(frame, ROTATE_180)

        # If the --auto_portrait flad was set and the frame's width is greater than its height, rotate it 
        if ARGS.auto_portrait:
            H, W = frame.shape[:2]
            if W > H:
                frame = cv2.rotate(frame, ROTATE_90_CLOCKWISE)
                
        # Get height and width after any rotation 
        H, W = frame.shape[:2]

        #  Check if the current frame height exceeds the max height specified in ARGS
        if H > ARGS.max_height:
            # Calc the resizing ratio needed to reduce the height to ARGS.max_height
            R = ARGS.max_height / H
            # Calculate the new width based on the above ratio to maintain aspect ratio
            new_W = int(W * R)
            
            # Resize the frame using INTER_AREA interpolation for downscaling 
            frame = cv2.resize(frame, (new_W, ARGS.max_height), interpolation=INTER_AREA)
        
        # Building the output filename with Path methods
        base_name = Path(ARGS.input).stem
        file_name = f"{base_name}_{S_COUNT:05d}.jpg"
        output_path = out_folder / file_name
        
        # Save operation
        cv2.imwrite(str(output_path), frame)
        S_COUNT += 1

        # Debug/Sample limit check
        if ARGS.sample > 0 and S_COUNT >= ARGS.sample:
            break
            
    F_COUNT += 1

# Release the video capture object and print summary
video_cap.release()
print(f"Finished. Saved a total of {S_COUNT} images to {out_folder}")