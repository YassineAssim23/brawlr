from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from .models import YOLOProcessor
from .utils import preprocess_video
import json
import time
import tempfile
import os
from pathlib import Path
from pydantic import BaseModel
import traceback
import inspect
from .firebaseAdmin import save_or_update_score, db  # Import db from firebaseAdmin

# Create the FastAPI app instance
app = FastAPI(title="Brawlr Backend", version="1.0.0")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model once at startup
yolo_processor = YOLOProcessor()

# WebSocket endpoint - this is where the frontend connects
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Accept the WebSocket connection from the frontend
    await websocket.accept()
    
    try:
        # Keep listening for messages forever
        while True:
            # Wait for a message from the frontend
            data = await websocket.receive_text()
            
            # Convert JSON string to Python dictionary
            message = json.loads(data)
            
            # Check if the message is a frame (video frame from camera)
            if message["type"] == "frame":
                # Process the frame with YOLO
                punch_result = yolo_processor.process_frame(message["image"])
                
                if punch_result:
                    # Send the real punch result back to the frontend
                    await websocket.send_text(json.dumps(punch_result))
                else:
                    # No punch detected, send a "no punch" message
                    no_punch_result = {
                        "type": "no_punch",
                        "timestamp": int(time.time() * 1000)
                    }
                    await websocket.send_text(json.dumps(no_punch_result))
                
    except Exception as e:
        print(f"WebSocket error: {e}")
        # Connection closed or error occurred

# Simple HTTP endpoints for testing
@app.get("/")
async def root():
    return {"message": "Brawlr Backend is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": yolo_processor.model is not None}


MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Video upload endpoint
@app.post("/upload-video")
async def upload_video(video: UploadFile = File(...),
                       username: str = Form(None)):
     # Check file size
    video.file.seek(0, 2)  # Seek to end
    file_size = video.file.tell()
    video.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 100MB)")

    """
    Upload a video file and process it through YOLO to count punches
    """
    try:
        #validate file type
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        #save uploaded video to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{video.filename.split('.')[-1]}") as temp_file:
            # content = await video.read()
            # temp_file.write(content)
            # temp_file_path = temp_file.name
            #Change for straming file 
            while chunk := await video.read(1024 * 1024):
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        try:
             # Preprocess video for faster analysis (lower resolution)
            print(f"Preprocessing video (fast mode): {video.filename}")
            preprocessed_path = preprocess_video(temp_file_path, max_resolution=480)
            
            # Process video through YOLO
            print(f"Processing video: {video.filename}")
            #print(f"Video size: {len(content)} bytes")
            # Use ultra-fast processing (every 5th frame)
            punch_counts = yolo_processor.process_video_fast(preprocessed_path)
            
            total_score = punch_counts.get("total", 0)
            save_result = None

            if username and total_score > 0:
                print(f"Saving score for user: {username} with score: {total_score}")
                save_result = await save_or_update_score(username, total_score)
            
            return {
                "success": True,
                "filename": video.filename,
                "punchCounts": punch_counts,
                "processingMode": "ultra-fast",
                "scoreSaved": save_result
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            if 'preprocessed_path' in locals() and os.path.exists(preprocessed_path):
                os.unlink(preprocessed_path)
                
    except Exception as e:
        print(f"Video processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")