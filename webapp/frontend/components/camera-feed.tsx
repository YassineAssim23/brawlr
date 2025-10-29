/*
Created by: Yassine Assim
Date: October 2025
Description: Component to display live camera feed and handle video capture and streaming to backend for punch detection.

Updated by: Mariah Falzon
Date Updated: October 28, 2025
Notes: Merged memory leak fix + WebSocket + match/punch handling

Updated by: Assistant
Date Updated: October 27, 2025
Notes: Integrated PunchContext for all punch counting, removed local liveScore state
*/

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CameraOff } from "lucide-react"
import { usePunches } from "@/components/context/PunchContext"
import { useMatch } from "./context/MatchContext"
import { SaveScoreModal } from "./SaveScoreModel"

export function CameraFeed() {
  // --- State Variables ---
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  type CameraStatus = 'Permission Needed' | 'Camera On' | 'Camera Off'
  const [status, setStatus] = useState<CameraStatus>('Permission Needed')

   // WebSocket and frame capture state
   const wsRef = useRef<WebSocket | null>(null)  // Holds WebSocket connection
   const intervalRef = useRef<NodeJS.Timeout | null>(null)  // Holds timer ID
   const canvasRef = useRef<HTMLCanvasElement | null>(null)  // Hidden canvas for frame capture
   const [isConnected, setIsConnected] = useState(false)  // Backend connection status

     // --- Contexts ---
  const { addPunch, stats } = usePunches()
  const { startTimer, stopTimer, onMatchEnd } = useMatch()
   
   // Debouncing to prevent spam detections
   const lastDetectionTime = useRef<number>(0)
   const MIN_DETECTION_INTERVAL = 500 // 500ms between detections

    // --- Cleanup on Unmount or Match End ---
  useEffect(() => {
    const handleMatchEnd = () => {
      console.log("⏰ Match ended - stopping camera capture")
      stopCapture()
    }
        onMatchEnd(handleMatchEnd)

    return () => {
      stopCapture() // cleanup on unmount
    }
 }, [onMatchEnd])

  // Modal state for saving score
   const [isSaveModalOpen, setSaveModalOpen] = useState(false)

  // Existing startCapture function
  async function startCapture(){
    try{
      console.log('startCapture called!')
      setStatus('Permission Needed')
      
        // Request camera
      console.log('Requesting camera permission...')
       const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: "user",
        },
      })
      console.log('Camera stream received:', stream)

         //streamRef.current = stream

      setStatus('Camera On')
      setIsActive(true)

      startTimer() // Start match timer when camera starts

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

      setStatus("Camera On")
      setIsActive(true)
      startTimer()

      // --- Connect to backend WebSocket ---
      const ws = new WebSocket("ws://localhost:8000/ws")
      wsRef.current = ws

      ws.onopen = () => {
        console.log("✅ WebSocket connected")
        setIsConnected(true)

        // Start frame capture loop (every 100ms)
        intervalRef.current = setInterval(captureFrame, 100)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === "punch") {
          const now = Date.now()
       // Debug: Show ALL detections to see what's happening
           console.log(`🥊 ${data.punchType.toUpperCase()} detected! (${Math.round(data.confidence * 100)}% confidence)`)
           // Lower the confidence threshold to 0.5 (50%) to see more detections
           if (data.confidence > 0.5) {
             // Debounce: only count if enough time has passed since last detection
             if (now - lastDetectionTime.current > MIN_DETECTION_INTERVAL) {
               console.log(`✅ ${data.punchType.toUpperCase()} COUNTED! (${Math.round(data.confidence * 100)}% confidence)`)
               lastDetectionTime.current = now
                // Update punch stats via context - this increments stats.total and the specific punch type
               addPunch(data.punchType)
              } else {
                console.log(`🔄 ${data.punchType} detected but too soon (${Math.round(data.confidence * 100)}%) - debouncing`)
              }
            } else {
                 console.log(`⚠️ Low confidence ${data.punchType} (${Math.round(data.confidence * 100)}%) - ignoring`)
            }
          } else if (data.type === 'no_punch'){
            // No punch detected - can be used for future features
          }
          
        }
      ws.onclose = () => {
        console.log("❌ WebSocket closed")
        setIsConnected(false)
      }

    }
    catch(error){
      console.error("Camera error:", error)
      setStatus("Camera Off")
      
    }
  }

  // Existing stopCapture function
  async function stopCapture(){
    console.log("🛑 Stopping capture...")
    if (videoRef.current){
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track=> track.stop())
      videoRef.current.srcObject = null
    }
    
    setStatus('Camera Off')
    setIsActive(false)

    stopTimer() // Stop match timer when camera stops

    // NEW: Stop sending frames and close WebSocket
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      try { wsRef.current.close() } catch (e) { /* ignore */ }
      wsRef.current = null
    }
    setIsConnected(false)
    // Only prompt to save if there is at least 1 punch recorded (using stats.total from context)
    // If score is zero, notify user and do not call backend.
    if (stats.total > 0) {
      setSaveModalOpen(true)
    } else {
      // simple UX: alert – replace with your toast component if available
      window.alert("No punches recorded – nothing to save.")
    }
  }

  // Called when the modal's onSave is triggered (username + score)
  async function handleSave(username: string, score: number) {
    try {
      // POST to new backend endpoint /save-score (see backend change below)
      const resp = await fetch("http://localhost:8000/save-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, score }),
      })

      if (!resp.ok) {
        console.error("Failed to save score", await resp.text())
      } else {
        console.log("Score saved successfully")
      }
    } catch (err) {
      console.error("Error saving score:", err)
    } finally {
      setSaveModalOpen(false)
    }
  }

  // Function to capture a frame from video and send to backend
  function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ws = wsRef.current

    if (!video || !canvas || ws?.readyState !== WebSocket.OPEN) return

    const ctx = canvas.getContext("2d")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob && ws.readyState === WebSocket.OPEN) {
        const reader = new FileReader()
        reader.onload = () => {
          ws.send(
            JSON.stringify({
              type: "frame",
              image: reader.result,
              timestamp: Date.now(),
            })
          )
        }
        reader.readAsDataURL(blob)
      }
    }, "image/jpeg", 0.7)
  }

  // --- JSX ---
  return (
    <Card
      className="
      p-6 
      bg-[#111417]
      border-2 border-brawlr-red 
      rounded-xl
      w-full
      h-full
      flex flex-col
      gap-6
      transition-all duration-300
      hover:shadow-[0_0_35px_rgba(0,255,255,.5)]
      hover:scale-[1.02]
    "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-foreground">Live Camera Feed</h3>
        <Button
          onClick={isActive ? stopCapture : startCapture}
          className={`
            !bg-brawlr-red 
            !text-white 
            hover:scale-110 
            transition-all duration-300 
            rounded-xl
            ${isActive ? '!bg-destructive hover:bg-destructive/90' : '!bg-brawlr-red'}
          `}
          size="lg"
        >
          {isActive ? "Stop Training" : "Start Training"}
        </Button>
      </div>

      {/* NEW: Show connection status and live score from context*/}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Camera: {status} | Backend: {isConnected ? "Connected" : "Disconnected"}
        </p>
        <p className="text-sm text-muted-foreground">Live Score: {stats.total} 🥊</p>
      </div>

      {/* Video feed */}
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6 relative overflow-hidden flex-1">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover rounded-lg ${isActive ? "block" : "hidden"}`}
          playsInline
          muted
          autoPlay
          style={{ width: '100%', height: '100%' }}
        />
        {!isActive && (
          <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
            <CameraOff className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
            <p className="text-xl text-muted-foreground font-medium">Ready to Start</p>
            <p className="text-muted-foreground/70">Click Start Training to begin recording the fight</p>
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
       {/* Save score modal - now using stats.total from context */}
      <SaveScoreModal
        score={stats.total}
        isOpen={isSaveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSave}
      />
    </Card>
  )
}
