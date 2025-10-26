"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react"

/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Share  button component for the boxing match analysis application.

Updated by: Mariah Falzon
Date Updated: October 8, 2025
Notes: Added Links for the share modal.
*/

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  //adding url and will change depending on actual site URL
  const shareURL = "https://brawlr.app"
  //adding title and text for sharing
  const shareText = "Check out brawlr, the ultimate boxing match analysis app!"
  
    return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>🔗 Share brawlr</DialogTitle>  
        </DialogHeader>
        <p className="text-lg my-4">Share brawlr with your friends and help them improve their boxing skills!</p>
       
       <div className="flex justify-center gap-3 my-4" >
        {/* Email Share Button */}
        <Button variant="outline"
        onClick={() => window.open(`mailto:?subject=${encodeURIComponent("Check out brawlr!")}&body=${encodeURIComponent(shareText + " " + shareURL)}`, '_blank')}>
            <Mail /> </Button>

        {/* Twitter Share Button */}
        <Button variant="outline"
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareURL)}`, '_blank')}>
            <Twitter /> </Button>
        {/* Facebook Share Button */}
        <Button variant="outline"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}`, '_blank')}>  
            <Facebook /> </Button>
        {/* LinkedIn Share Button */}
        <Button variant="outline"
        onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareURL)}&title=${encodeURIComponent(shareText)}`, '_blank')}>
            <Linkedin /> </Button>
        {/* Copy Link Button */}
        <Button variant="outline"
        onClick={() => {navigator.clipboard.writeText(shareURL); alert("Link copied to clipboard!");}}>
            <LinkIcon /> </Button>
            

       </div>
        <DialogFooter>
            <Button onClick={onClose}>Close</Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
    )
}