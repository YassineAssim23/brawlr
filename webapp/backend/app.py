from fastapi import FastAPI, WebSocket
import json
import random

# Create the FastAPI app instance
app = FastAPI(title="Brawlr Backend", version="1.0.0")

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
                # For now, just send back a fake punch result
                # Later, we'll run the real YOLO model here
                punch_result = {"type": "punch", "punchType": "jab"}
                
                # Send the punch result back to the frontend
                await websocket.send_text(json.dumps(punch_result))
                
    except Exception as e:
        print(f"WebSocket error: {e}")
        # Connection closed or error occurred