"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, CameraOff, Settings } from "lucide-react"

export function CameraFeed() {
  const[videoLive,useVideoLive]=useState(false)
  const[streamActive,setStreamActive]=useState(false)
  const videoRef=useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Use useEffect to attach stream when video element is ready
  useEffect(() => {
    if (streamActive && stream && videoRef.current) {
      console.log("Attaching stream to video element");
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [streamActive, stream]);

  const startVideoCapture = async () => {
    try {
      console.log("Starting camera...");
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: "user"
        }
      });
      console.log("Stream created:", newStream);
      console.log("Tracks:", newStream.getTracks());
      
      // Log the actual video track settings
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log("Video settings:", {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate
        });
      }
      
      // Save the stream in state so React can attach it when video element renders
      setStream(newStream);
      setStreamActive(true);
      useVideoLive(true);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const stopVideoCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current){
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setStreamActive(false);
    useVideoLive(false);
  };

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
        {streamActive ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-lg shadow-lg"
            autoPlay
            playsInline
            muted
            style={{
              filter: 'contrast(1.1) brightness(1.05) saturate(1.1)',
              imageRendering: 'crisp-edges'
            }}
            onLoadStart={() => console.log("Video onLoadStart")}
            onLoadedData={() => console.log("Video onLoadedData")}
            onCanPlay={() => console.log("Video onCanPlay")}
            onPlaying={() => console.log("Video onPlaying")}
            onError={(e) => console.error("Video error:", e)}
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
          onClick={streamActive ? stopVideoCapture : startVideoCapture}
          className={streamActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
          size="lg"
        >{streamActive ? "Stop Recording" : "Start Recording"}</Button>
        <Button variant="outline" size="lg">  
          Calibrate Camera
        </Button>
      </div>
    </Card>
  );
}