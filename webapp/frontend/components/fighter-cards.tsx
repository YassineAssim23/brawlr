import { Card } from "@/components/ui/card"

interface FighterCardProps {
  name: string
  corner: "red" | "blue"
  hits: number
  misses: number
  roundScore: number
}

function FighterCard({ name, corner, hits, misses, roundScore }: FighterCardProps) {
  const nameColor = corner === "red" ? "text-red-500" : "text-blue-500"

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex justify-center items-center mb-4">
        <h3 className={`text-xl font-bold ${nameColor}`}>{name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{hits}</div>
          <div className="text-sm text-muted-foreground">HITS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">{misses}</div>
          <div className="text-sm text-muted-foreground">MISSES</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-sm text-muted-foreground">Round Score</span>
        <span className="text-lg font-bold text-foreground">{roundScore}</span>
      </div>
    </Card>
  )
}

export function FighterCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <FighterCard name="FIGHTER A" corner="red" hits={0} misses={0} roundScore={0} />
      <FighterCard name="FIGHTER B" corner="blue" hits={0} misses={0} roundScore={0} />
    </div>
  )
}
