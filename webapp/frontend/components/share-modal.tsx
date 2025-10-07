"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Share  button component for the boxing match analysis application.

Notes: 
*/

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>🔗 Share brawlr</DialogTitle>  
        </DialogHeader>
        <p className="text-lg my-4">Share brawlr with your friends and help them improve their boxing skills!</p>
        <DialogFooter>
            <Button onClick={onClose}>Close</Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
    )
}