"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMatch } from "./context/MatchContext";

/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Daily Challenge button component for the boxing match analysis application.

Notes: This component provides a button that, when clicked, displays a random daily challenge in a modal popup.
Uses Modal Popup for better user experience and a game like experience has more of a glass effect

TODO: Add Animations and do daily challenge fetching from backend

**Used AI TO help with CSS Styling Class Names and button hover effects**

*/

export function DailyChallengeModal({ open, onClose, challenge }: { open: boolean; onClose: () => void; challenge: string }) {
  
// const { triggerCameraStart } = useMatch();

// const handleStartTraining = () => {
//   onClose(); // Close the modal
//   triggerCameraStart!(); // The ! tells TypeScript that this will never be undefined
// };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
         className="
    bg-[#111417]
    text-brawlr-text
    border-2 border-brawlr-blue
    rounded-2xl
    shadow-[0_0_30px_rgba(0,255,255,0.6)]
    p-6
    transition-all duration-300
  ">
        <DialogHeader>
          <DialogTitle>🥊 Your Daily Challenge</DialogTitle>
        </DialogHeader>
        <p className="text-lg my-4">{challenge}</p>
        <DialogFooter>
          <Button onClick={onClose}>Start Training!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
