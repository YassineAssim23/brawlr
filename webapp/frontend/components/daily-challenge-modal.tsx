"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Daily Challenge button component for the boxing match analysis application.

Notes: This component provides a button that, when clicked, displays a random daily challenge in a modal popup.
Uses Modal Popup for better user experience and a game like experience has more of a glass effect

TODO: Add Animations and do daily challenge fetching from backend

*/

export function DailyChallengeModal({ open, onClose, challenge }: { open: boolean; onClose: () => void; challenge: string }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
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
