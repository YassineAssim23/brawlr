/*
Created by:Toufiq
Date: September 23, 2025
Description: Header component for the boxing match analysis application.

This page provides buttons for various navigation options and camera settings.

Updated by: Mariah Falzon
Date Updated: October 7, 2025
Notes: Updated layout and styling for better user experience.
*/

import { Button } from "@/components/ui/button"
import { ShareButton } from "@/components/share-button"
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
              <h1 className="text-xl font-bold text-foreground">brawlr</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {/* Share button to provide link via copy, email etc. WIll be a pop up and created later */}
            <ShareButton />
          </nav>
        </div>
      </div>
    </header>
  )
}
