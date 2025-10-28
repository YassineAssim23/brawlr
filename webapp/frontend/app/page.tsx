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
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Let's Get Ready To Rumble!
          </h2>
          
          <p className="text-muted-foreground">
            Real-time boxing session analysis and training game powered by AI computer vision
          </p>
        </div>
     <MatchProvider>
        {/* Centered Buttons */}
        <div className="flex justify-center items-center gap-8 mb-14">
          <LeaderboardButton/>
          <DailyChallengeButton />
        </div>

   
          <PunchProvider>
            <div className = "mb-10">
              <MatchControls />
            </div>

            {/* Camera Feed (2/3) and Analytics (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              {/* Camera Feed - wider (2 columns on large screens) */}
              <div className="lg:col-span-2 flex justify-center">
                <div className="w-full">
                  <CameraFeed />
                </div>
              </div>
                        {/* Analytics Dashboard - narrower */}
              <div className="lg:col-span-1 flex justify-center">
                <div className="w-full">
                  <AnalyticsDashboard />
                </div>
              </div>
            </div>
          
                {/* Video Upload Below */}
            <div className="flex justify-center mt-12">
              <div className="w-full lg:w-2/3">
                <VideoUpload />
              </div>
            </div>
        </PunchProvider>
        </MatchProvider>
      </main>
    </div>
  )
}
