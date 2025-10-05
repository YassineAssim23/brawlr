import { Header } from "@/components/header"
import { CameraFeed } from "@/components/camera-feed"
import { FighterCards } from "@/components/fighter-cards"
import { MatchControls } from "@/components/match-controls"
import { LiveStats } from "@/components/live-stats"
import { VideoUpload } from "@/components/video-upload"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">Dashboard</h2>
          <p className="text-muted-foreground text-pretty">
            Real-time boxing match analysis and scoring powered by AI computer vision
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Camera Feed & Video Upload */}
          <div className="lg:col-span-3 space-y-6">
            <CameraFeed />
            <VideoUpload />
            <MatchControls />
          </div>

          {/* Right Column - Fighter Scoring */}
          <div className="lg:col-span-2 space-y-6">
            <FighterCards />
            <LiveStats />
          </div>
        </div>
      </main>
    </div>
  )
}
