from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from .models import YOLOProcessor
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

# Video upload endpoint
@app.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    username: str = Form(None) 
):
    """
    Upload a video file, process it, and optionally save the score to the leaderboard.
    """
    try:
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{video.filename.split('.')[-1]}") as temp_file:
            content = await video.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            print(f"Processing video: {video.filename}")
            punch_counts = yolo_processor.process_video(temp_file_path)
            
            total_score = punch_counts.get("total", 0)
            save_result = None

            if username and total_score > 0:
                print(f"Saving score for user: {username} with score: {total_score}")
                save_result = await save_or_update_score(username, total_score)
            
            return {
                "success": True,
                "filename": video.filename,
                "punchCounts": punch_counts,
                "scoreSaved": save_result
            }
            
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        print(f"Video processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")

# Save score endpoint
class ScorePayload(BaseModel):
    username: str
    score: int

@app.post("/save-score")
async def save_score(payload: ScorePayload):
    print("DEBUG /save-score called with payload:", payload.dict())
    print("DEBUG db is None?:", db is None)
    if db is None:
        print("ERROR: Database not configured - service account init may have failed")
        raise HTTPException(status_code=503, detail="Database not configured")
    if not payload.username or payload.score <= 0:
        print("WARN: invalid payload:", payload.dict())
        raise HTTPException(status_code=400, detail="Invalid username or score")
    try:
        if inspect.iscoroutinefunction(save_or_update_score):
            result = await save_or_update_score(payload.username, payload.score)
        else:
            result = save_or_update_score(payload.username, payload.score)
        print("DEBUG save_or_update_score result:", result)
        return {"success": True, "result": result}
    except Exception as e:
        print("ERROR saving score:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save score")