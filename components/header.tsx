import { Button } from "@/components/ui/button"
import { Settings, User, Menu } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">BOXING JUDGE</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              LIVE MATCHES
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              HISTORY
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              ANALYTICS
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              SETTINGS
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
