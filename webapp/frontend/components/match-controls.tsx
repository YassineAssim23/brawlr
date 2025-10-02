"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, RotateCcw, Timer } from "lucide-react"

export function MatchControls() {
  const [isActive, setIsActive] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState("3:00")

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Match Controls</h3>
        <Badge variant="outline" className="text-accent border-accent">
          ROUND {currentRound}
        </Badge>
      </div>

      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-primary mb-2">{timeRemaining}</div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          Time Remaining
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => setIsActive(!isActive)}
          className={isActive ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"}
          size="lg"
        >
          {isActive ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start
            </>
          )}
        </Button>

        <Button variant="outline" size="lg">
          <Square className="h-5 w-5 mr-2" />
          Stop
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
          disabled={currentRound === 1}
        >
          Previous Round
        </Button>
        <Button variant="outline" onClick={() => setCurrentRound(currentRound + 1)}>
          Next Round
        </Button>
      </div>

      <Button variant="ghost" className="w-full mt-4 text-muted-foreground">
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Match
      </Button>
    </Card>
  )
}
