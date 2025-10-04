from fastapi import FastAPI, WebSocket
from .models import YOLOProcessor
import json
import time

# Create the FastAPI app instance
app = FastAPI(title="Brawlr Backend", version="1.0.0")

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