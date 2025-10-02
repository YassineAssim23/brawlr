"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, CameraOff, Settings } from "lucide-react"

export function CameraFeed() {
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  type CameraStatus = 'Permission Needed' | 'Camera On' | 'Camera Off'
  const [status, setStatus] = useState<CameraStatus>('Permission Needed')

  // Turns on the camera
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
    }
    catch(error){
      setStatus('Camera Off')
      console.log("Camera Permission Denied")
    }
  }

  // Stop the Camera
  async function stopCapture(){
    if (videoRef.current){
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track=> track.stop())
      videoRef.current.srcObject = null
    }
    
    setStatus('Camera Off')
    setIsActive(false)
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
