"use client";
// This is a client component as it uses useState and event handlers and is a directive to the file to be treated as a client component in Next.js
//https://nextjs.org/docs/app/api-reference/directives/use-client
import { useState } from "react"
import { Button } from "./ui/button";
import { ShareModal } from "./share-modal";

/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Share  button component for the boxing match analysis application.

Notes: 
*/

export const ShareButton = () => {
    //State to manage modal visibility
    const [open, setShowShare] = useState(false);
    return (
        <div>
<Button
  className="
    bg-brawlr-red
    text-white 
    hover:from-brawlr-red hover:to-brawlr-blue
    hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] 
    hover:scale-110 
    transition-all duration-300 
    rounded-xl
  "
  onClick={() => setShowShare(true)}
>
                SHARE
            </Button>   
            <ShareModal open={open} onClose={() => setShowShare(false)} />
        </div>
    );
}