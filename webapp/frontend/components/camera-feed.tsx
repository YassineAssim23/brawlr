"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, CameraOff, Settings } from "lucide-react"

export function CameraFeed() {
  // state variables
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  type CameraStatus = 'Permission Needed' | 'Camera On' | 'Camera Off'
  const [status, setStatus] = useState<CameraStatus>('Permission Needed')

  // WebSocket and frame capture state
  const wsRef = useRef<WebSocket | null>(null)  // Holds WebSocket connection
  const intervalRef = useRef<NodeJS.Timeout | null>(null)  // Holds timer ID
  const canvasRef = useRef<HTMLCanvasElement | null>(null)  // Hidden canvas for frame capture
  const [isConnected, setIsConnected] = useState(false)  // Backend connection status

  // Existing startCapture function
  async function startCapture(){
    try{
      setStatus('Permission Needed')
      const stream = await navigator.mediaDevices.getUserMedia({video: true})

      if (videoRef.current){
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStatus('Camera On')
      setIsActive(true)

      // NEW: Connect to backend WebSocket
      wsRef.current = new WebSocket('ws://localhost:8000/ws')

      // When WebSocket connection opens
      wsRef.current.onopen = () => {
        setIsConnected(true)
        // Start sending frames every 100ms (10 times per second)
        intervalRef.current = setInterval(captureFrame, 100)
      }

      // When we receive a message from backend
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'punch') {
          console.log('Punch detected:', data.punchType)
          // TODO: Update punch counters
        }
      }

      // When WebSocket connection closes
      wsRef.current.onclose = () => {
        setIsConnected(false)
      }

    }
    catch(error){
      setStatus('Camera Off')
      console.log("Camera Permission Denied")
    }
  }

  // Existing stopCapture function
  async function stopCapture(){
    if (videoRef.current){
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track=> track.stop())
      videoRef.current.srcObject = null
    }
    
    setStatus('Camera Off')
    setIsActive(false)

    // NEW: Stop sending frames and close WebSocket
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  // NEW: Function to capture a frame from video and send to backend
  function captureFrame() {
    // Check if we have video, canvas, and WebSocket connection
    if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      // Set canvas size to match video size
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw the current video frame onto the canvas (like taking a screenshot)
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      // Convert the canvas drawing to a JPEG file
      canvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          // Convert the JPEG file to base64 (a text format we can send over network)
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            // Send the frame to the backend
            wsRef.current?.send(JSON.stringify({
              type: "frame",
              image: base64,
              timestamp: Date.now()
            }))
          }
          reader.readAsDataURL(blob)
        }
      }, 'image/jpeg', 0.7)
    }
  }

  return (
    <Card className="p-6 bg-card border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">Live Camera Feed</h3>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* NEW: Show connection status */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Camera: {status} | Backend: {isConnected ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6 relative overflow-hidden flex-1">
        {isActive ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-lg"
            playsInline
            muted
            autoPlay
          />
        ) : (
          <div className="text-center">
            <CameraOff className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
            <p className="text-xl text-muted-foreground font-medium">Ready to Start</p>
            <p className="text-muted-foreground/70">Click the button below to begin recording the fight</p>
          </div>
        )}
      </div>

      {/* NEW: Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex gap-3">
        <Button
          onClick={isActive ? stopCapture : startCapture}
          className={isActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
          size="lg"
        >
          {isActive ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button variant="outline" size="lg">
          Calibrate Camera
        </Button>
      </div>
    </Card>
  )
}