"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react"

/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Share  button component for the boxing match analysis application.

Updated by: Mariah Falzon
Date Updated: October 26, 2025
Notes: Added Links for the share modal.
Changing Style to gameify and make appealing to users

**Used AI TO help with CSS Styling Class Names and button hover effects**
*/

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    //adding url and will change depending on actual site URL
    const shareURL = "https://brawlr.app"
    //adding title and text for sharing
    const shareText = "Check out brawlr, the ultimate boxing match analysis app!"

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
                    <DialogTitle className="text-brawlr-yellow font-display text-2xl tracking-wider">🔗 Share brawlr</DialogTitle>
                </DialogHeader>
                <p className="my-4 text-brawlr-blue font-body text-lg"> Invite your crew — train smarter, punch harder! </p>

                <div className="flex justify-center gap-3 my-4" >
                    {/* Email Share Button */}
                    <Button className="bg-gradient-to-r from-brawlr-red to-brawlr-yellow text-white hover:scale-105 transition-transform"
                        onClick={() => window.open(`mailto:?subject=${encodeURIComponent("Check out brawlr!")}&body=${encodeURIComponent(shareText + " " + shareURL)}`, '_blank')}>
                        <Mail /> </Button>

                    {/* Twitter Share Button */}
                    <Button className="bg-gradient-to-r from-brawlr-red to-brawlr-yellow text-white hover:scale-105 transition-transform"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareURL)}`, '_blank')}>
                        <Twitter /> </Button>
                    {/* Facebook Share Button */}
                    <Button className="bg-gradient-to-r from-brawlr-red to-brawlr-yellow text-white hover:scale-105 transition-transform"
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}`, '_blank')}>
                        <Facebook /> </Button>
                    {/* LinkedIn Share Button */}
                    <Button className="bg-gradient-to-r from-brawlr-red to-brawlr-yellow text-white hover:scale-105 transition-transform"
                        onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareURL)}&title=${encodeURIComponent(shareText)}`, '_blank')}>
                        <Linkedin /> </Button>
                    {/* Copy Link Button */}
                    <Button className="bg-gradient-to-r from-brawlr-red to-brawlr-yellow text-white hover:scale-105 transition-transform"
                        onClick={() => { navigator.clipboard.writeText(shareURL); alert("Link copied to clipboard!"); }}>
                        <LinkIcon /> </Button>


                </div>
                <DialogFooter>
                    <Button onClick={onClose}  >Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}