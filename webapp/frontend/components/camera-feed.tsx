"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, CameraOff, Settings } from "lucide-react"
import { usePunches } from "@/components/context/PunchContext"

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
   
   // Debouncing to prevent spam detections
   const lastDetectionTime = useRef<number>(0)
   const MIN_DETECTION_INTERVAL = 500 // 500ms between detections

   //add punch context
   const { addPunch } = usePunches()

  // Existing startCapture function
  async function startCapture(){
    try{
      console.log('startCapture called!')
      setStatus('Permission Needed')
      
      console.log('Requesting camera permission...')
      const stream = await navigator.mediaDevices.getUserMedia({video: true})
      console.log('Camera stream received:', stream)

      if (videoRef.current){
        console.log('Setting video srcObject...')
        videoRef.current.srcObject = stream
        console.log('Video srcObject set to:', videoRef.current.srcObject)
        
        // Wait for the video to be ready before playing
        console.log('Waiting for video to be ready...')
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback...')
            videoRef.current!.play().then(() => {
              console.log('Video started playing!')
              resolve(true)
            })
          }
        })
      } else {
        console.log('ERROR: videoRef.current is null!')
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
           const now = Date.now()

           //update live punch stats
            addPunch(data.punchType)
           
           // Debug: Show ALL detections to see what's happening
           console.log(`🥊 ${data.punchType.toUpperCase()} detected! (${Math.round(data.confidence * 100)}% confidence)`)
           
           // Lower the confidence threshold to 0.5 (50%) to see more detections
           if (data.confidence > 0.5) {
             // Debounce: only show if enough time has passed since last detection
             if (now - lastDetectionTime.current > MIN_DETECTION_INTERVAL) {
               console.log(`🥊 ${data.punchType.toUpperCase()} detected! (${Math.round(data.confidence * 100)}% confidence)`)
               lastDetectionTime.current = now
               // TODO: Update punch counters
             } else {
               console.log(`🔄 ${data.punchType} detected but too soon (${Math.round(data.confidence * 100)}%) - debouncing`)
             }
           } else {
             console.log(`⚠️ Low confidence ${data.punchType} (${Math.round(data.confidence * 100)}%) - ignoring`)
           }
         } else if (data.type === 'no_punch') {
           // Show when no punch is detected (less spam)
           // console.log('No punch detected')
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
      </div>

      {/* NEW: Show connection status */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Camera: {status} | Backend: {isConnected ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6 relative overflow-hidden flex-1">
        {/* Always render video element, but hide it when not active */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover rounded-lg ${isActive ? 'block' : 'hidden'}`}
          playsInline
          muted
          autoPlay
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Show placeholder when camera is off */}
        {!isActive && (
          <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
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
          {isActive ? "Stop Training" : "Start Training"}
        </Button>
      </div>
    </Card>
  )
}