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
    <Card
  className="
    p-4 
    bg-[#111417]
    border-2 border-brawlr-red 
    rounded-xl
    flex flex-col sm:flex-row 
    justify-between 
    items-center 
    gap-6 
    transition-all duration-300
    hover:shadow-[0_0_35px_rgba(0,255,255,.8)]
    hover:scale-[1.02]
  ">
  <div>
    <h3 className="text-lg font-semibold text-white">Match Controls</h3>
  </div>

  {/* Timer display */}
  <div className="text-center">
    <div className="text-3xl font-mono font-bold text-brawlr-red mb-1">
      {formatTime(timeRemaining)}
    </div>
    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
      <Timer className="h-4 w-4" /> Time Remaining
    </div>
  </div>

  {/* Duration input */}
  <div className="flex items-center gap-2">
    <input
      type="number"
      min="1"
      className="w-16 text-center border border-gray-700 rounded-md p-1 bg-background text-white"
      value={minutes}
      onChange={(e) => {
        const val = Number(e.target.value);
        setMinutes(val);
        setDuration(val * 60);
      }}
    />
    <span className="text-gray-400 text-sm">min</span>
  </div>

  {/* Reset button */}
  <Button
    onClick={resetMatch}
    variant="ghost"
    className="text-gray-400 hover:text-brawlr-red transition"
  >
    <RotateCcw className="h-4 w-4 mr-1" />
    Reset
  </Button>
</Card>

  )
}
