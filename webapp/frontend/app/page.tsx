/*
Created by:Toufiq 
Date: 
Description: Layout for the home page including header, camera feed, match controls, and analytics dashboard.

Updated by: Mariah Falzon
Date Updated: October 7, 2025
Notes: updated code to include analytics dashboard component and reflect new design
*/

import { Header } from "@/components/header"
import { CameraFeed } from "@/components/camera-feed"
import { MatchControls } from "@/components/match-controls"
import { VideoUpload } from "@/components/video-upload"
import { Button } from "@/components/ui/button"
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { DailyChallengeButton } from "@/components/daily-challenge-button";

export default function HomePage() {

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
            Let's Get Ready To Rumble!
          </h2>
          <p className="text-muted-foreground text-pretty">
            Real-time boxing session analysis and training game powered by AI computer vision
          </p>
        </div>

        {/* Centered Buttons */}
        <div className="flex justify-center items-center gap-8 mb-14">
          <Button className="px-6 py-3 text-lg font-semibold">🏆 Leaderboard</Button>
          <DailyChallengeButton/>
 
        </div>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 items-start">
          {/* Left Column - Match Controls & Related Components */}
          <div className="flex flex-col space-y-6 w-full">
            <MatchControls />
            <AnalyticsDashboard />
          </div>

          {/* Right Column - Camera Feed */}
        <div className="flex flex-col space-y-6 w-full">
            <CameraFeed />
              <VideoUpload />
          </div>
        </div>
      </main>
    </div>
  )
}
