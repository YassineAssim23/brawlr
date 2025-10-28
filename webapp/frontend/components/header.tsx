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
          {/* Left side: Logo + Title */}
          <div className="flex items-center gap-3">
            <img
              src="/brawlr.png"
              alt="Brawlr Logo"
              className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <h1  className="
                text-4xl font-extrabold text-foreground tracking-wide 
                transition-all duration-300 group-hover:text-brawlr-red
                font-title
              ">
              brawlr
            </h1>
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
