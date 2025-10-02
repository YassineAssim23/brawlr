"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, CameraOff, Settings } from "lucide-react"

export function CameraFeed() {
  const [isActive, setIsActive] = useState(false)

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
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground font-medium">Camera Active - AI Analyzing Fight</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
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
          onClick={() => setIsActive(!isActive)}
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
