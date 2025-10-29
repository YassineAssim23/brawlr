/*
Created by: Yassine Assim
Date: October 2025
Description: Component to display live camera feed and handle video capture and streaming to backend for punch detection.

Updated by: Mariah Falzon
Date Updated: October 28, 2025
Notes: Merged memory leak fix + WebSocket + match/punch handling
*/

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CameraOff } from "lucide-react"
import { usePunches } from "@/components/context/PunchContext"
import { useMatch } from "./context/MatchContext"

export function CameraFeed() {
  // --- State Variables ---
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState<"Permission Needed" | "Camera On" | "Camera Off">("Permission Needed")
  const [isConnected, setIsConnected] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // --- Stream + Connection Refs ---
  const streamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // --- Contexts ---
  const { addPunch } = usePunches()
  const { startTimer, stopTimer, onMatchEnd } = useMatch()

  // --- Debounce Punch Detections ---
  const lastDetectionTime = useRef<number>(0)
  const MIN_DETECTION_INTERVAL = 500 // ms

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

  // --- Start Camera + WebSocket ---
  async function startCapture() {
    try {
      console.log("🎥 Starting capture...")
      setStatus("Permission Needed")

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: "user",
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
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
          if (data.confidence > 0.5 && now - lastDetectionTime.current > MIN_DETECTION_INTERVAL) {
            console.log(`🥊 ${data.punchType.toUpperCase()} (${Math.round(data.confidence * 100)}%)`)
            lastDetectionTime.current = now
            addPunch(data.punchType)
          }
        }
      }

      ws.onclose = () => {
        console.log("❌ WebSocket closed")
        setIsConnected(false)
      }

      ws.onerror = (err) => {
        console.error("WebSocket error:", err)
      }
    } catch (error) {
      console.error("Camera error:", error)
      setStatus("Camera Off")
    }
  }

  // --- Stop Camera + Cleanup ---
  function stopCapture() {
    console.log("🛑 Stopping capture...")

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Stop timer
    stopTimer()
    setStatus("Camera Off")
    setIsActive(false)

    // Stop frame loop
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Reset connection flag
    setIsConnected(false)
  }

  // --- Capture Frame + Send to Backend ---
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

      {/* Status */}
      <div className="mb-2">
        <p className="text-sm text-muted-foreground">
          Camera: {status} | Backend: {isConnected ? "Connected" : "Disconnected"}
        </p>
      </div>

      {/* Video feed */}
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6 relative overflow-hidden flex-1">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover rounded-lg ${isActive ? "block" : "hidden"}`}
          playsInline
          muted
          autoPlay
        />
        {!isActive && (
          <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
            <CameraOff className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
            <p className="text-xl text-muted-foreground font-medium">Ready to Start</p>
            <p className="text-muted-foreground/70">Click Start Training to begin recording the fight</p>
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Card>
  )
}
