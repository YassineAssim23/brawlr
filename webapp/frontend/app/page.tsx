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
import { MatchProvider } from "@/components/context/MatchContext"
import { VideoUpload } from "@/components/video-upload"
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { DailyChallengeButton } from "@/components/daily-challenge-button";
import { LeaderboardButton } from "@/components/leaderboard-button"
import { PunchProvider } from "@/components/context/PunchContext"

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
          <LeaderboardButton/>
          <DailyChallengeButton />
        </div>

        <MatchProvider>
          <PunchProvider>
        <div className="flex flex-col lg:flex-col gap-10">
          {/* Top Row - Video Upload & Match Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <VideoUpload />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <MatchControls />
              </div>
            </div>
          </div>

          {/* Bottom Row - Camera and Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="flex justify-center">
              <CameraFeed />
            </div>
            <div className="flex justify-center">
              <AnalyticsDashboard />
            </div>
          </div>
        </div>
        </PunchProvider>
        </MatchProvider>
      </main>
    </div>
  )
}
