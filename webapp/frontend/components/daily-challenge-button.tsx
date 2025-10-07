"use client";
// This is a client component as it uses useState and event handlers and is a directive to the file to be treated as a client component in Next.js
//https://nextjs.org/docs/app/api-reference/directives/use-client
import { useState } from "react"
import { Button } from "./ui/button";
import { DailyChallengeModal } from "./daily-challenge-modal";
/*
Created by: Mariah Falzon
Date: October 7, 2025
Description: Daily Challenge button component for the boxing match analysis application.

Notes: This component provides a button that, when clicked, displays a random daily challenge in a modal popup.
Uses Modal Popup for better user experience and a game like experience

*/

//Arrat of daily challenges for testing purposes
const challenges = [
    "Throw 50 punches in 2 minutes 🥊",
    "Focus on head movement for 1 round 🧠",
    "Only jab for 60 seconds 💥",
    "Alternate between left and right hooks for 3 rounds 🔄",
    "Keep perfect guard while dodging punches 🛡️",
]

export const DailyChallengeButton = () => {
    //State to manage modal visibility and current challenge
    const [open, setShowChallenge] = useState(false);
    const [challenge, setChallenge] = useState("");

    //Function to select a random challenge and show the modal (this is for testing purposes as randomizer will bbe replaced with a daily challenge from the backend))
    const handleDailyChallenge = () => {
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
        setChallenge(randomChallenge)
        setShowChallenge(true)
    }

    return (
        <div>
            <Button
            //When button is clicked the randomizer function is called and the modal is shown
                onClick={handleDailyChallenge}
                className="px-6 py-3 text-lg font-semibold" >
                🔥 Daily Challenge
            </Button>
            {/* The Daily Challenge Modal is called which is the Alert Dialog */}
            <DailyChallengeModal open={open} onClose={() => setShowChallenge(false)} challenge={challenge} />
        </div>
    );
}