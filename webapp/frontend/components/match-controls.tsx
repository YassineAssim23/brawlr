"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Timer } from "lucide-react"
import { useMatch } from "@/components/context/MatchContext"

export function MatchControls() {
 const { timeRemaining, resetMatch, setDuration } = useMatch()
  const [minutes, setMinutes] = useState(3)

    // Convert seconds → MM:SS
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

 return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Match Controls</h3>
      </div>

      {/* Timer display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-primary mb-2">
          {formatTime(timeRemaining)}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          Time Remaining
        </div>
      </div>

      {/* Duration input */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <input
          type="number"
          min="1"
          className="w-20 text-center border border-border rounded-md p-1 bg-background text-foreground"
          value={minutes}
          onChange={(e) => {
            const val = Number(e.target.value)
            setMinutes(val)
            setDuration(val * 60)
          }}
        />
        <span className="text-muted-foreground text-sm">min</span>
      </div>

      {/* Reset button */}
      <Button
        onClick={resetMatch}
        variant="ghost"
        className="w-full mt-2 text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Match
      </Button>
    </Card>
  )
}
