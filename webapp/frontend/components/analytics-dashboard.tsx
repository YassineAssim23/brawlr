/*
Created by:Mariah Falzon
Date: October 7, 2025
Description: Analytics dashboard that will pull from the scoring script and display real-time stats.

Updated by: Mariah Falzon
Date Updated: October 27 2025
Notes: including reset dashboard from MatchContext
*/
"use client"
import { Card } from "@/components/ui/card"
import { TrendingUp, Target, Zap, Award, CornerDownRight, ArrowBigUpDash } from "lucide-react"
import { usePunches } from "@/components/context/PunchContext"
import { useMatch } from "@/components/context/MatchContext"


export function AnalyticsDashboard() {
  
const { stats } = usePunches()
  const statItems = [
    { label: "Total Punches", value: stats.total, icon: Target, color: "text-primary" },
    // { label: "Jabs Landed", value: stats.jab, icon: TrendingUp, color: "text-primary" },
    // { label: "Crosses Landed", value: stats.cross, icon: Award, color: "text-secondary" },
    { label: "Straights Landed", value: stats.straight, icon: TrendingUp, color: "text-primary" }, // ADDED STRAIGHT
    { label: "Hooks Landed", value: stats.hook, icon: CornerDownRight, color: "text-destructive" },
    { label: "Uppercuts Landed", value: stats.uppercut, icon: ArrowBigUpDash, color: "text-destructive" },
  ]

  

  return (
    <div className="space-y-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="p-4 bg-card border-border w-full
        bg-[#111417]
    border-2 border-brawlr-red 
    rounded-xl
    gap-4
    transition-all duration-300
    hover:shadow-[0_0_35px_rgba(0,255,255,.5)]
    hover:scale-[1.02]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}