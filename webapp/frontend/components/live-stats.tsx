import { Card } from "@/components/ui/card"
import { TrendingUp, Target, Zap, Award } from "lucide-react"

export function LiveStats() {
  const stats = [
    {
      label: "Total Punches",
      value: "0",
      change: "+0",
      icon: Target,
      color: "text-primary",
    },
    {
      label: "Avg Accuracy",
      value: "0%",
      change: "+0%",
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      label: "Power Shots",
      value: "0",
      change: "+0",
      icon: Zap,
      color: "text-destructive",
    },
    {
      label: "Round Winner",
      value: "Begin Match",
      change: "",
      icon: Award,
      color: "text-foreground",
    },
  ]

  return (
    <div className="space-y-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 bg-card border-border w-full">
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
            <div className="text-right">
              <div className="text-xs text-accent font-medium">{stat.change}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
