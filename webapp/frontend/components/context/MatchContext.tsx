/*

Context interface for use of match controls across components


*/


"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface MatchContextType {
  isRunning: boolean
  timeRemaining: number
  startTimer: () => void
  stopTimer: () => void
  resetMatch: () => void
  setDuration: (seconds: number) => void
  //trigger analytics reset function can be added here
  resetAnalytics: number
  //ending of the timer trigger can be added here
  onMatchEnd: (callback: () => void) => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

export function MatchProvider({ children }: { children: ReactNode }) {
    const [isRunning, setIsRunning] = useState(false)
    const [duration, setDuration] = useState(180) // default 3 minutes in seconds
    const [timeRemaining, setTimeRemaining] = useState(duration)
    //reset counter
    const [resetAnalytics, setResetAnalytics] = useState(0)
    //callback for match end
    const [matchEndCallbacks, setMatchEndCallbacks] = useState<(() => void)[]>([])

    //Register match end callbacks
    const onMatchEnd = (callback: () => void) => {
        setMatchEndCallbacks((prev) => [...prev, callback])
    }

    //Logic to handle timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => prev - 1)
            }, 1000)
        } else if (timeRemaining === 0 && isRunning) {
            setIsRunning(false)

            //Play sound for end of match
            const audio = new Audio('/sounds/match-end.mp3')
            audio.play().catch(() => console.log("Audio play failed"))

            //Trigger all registered match end callbacks
            matchEndCallbacks.forEach((callback) => callback())
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, timeRemaining])

    //Sync reset with duration changes
    useEffect(() => setTimeRemaining(duration), [duration])

    const startTimer = () => setIsRunning(true)
    const stopTimer = () => setIsRunning(false)


    const resetMatch = () => {
        setIsRunning(false)
        setTimeRemaining(duration)
        //reset analytics trigger
        setResetAnalytics((prev) => prev + 1) 
        console.log("Match reset - analytics should reset")
       
}

 return (
    <MatchContext.Provider value={{ isRunning, timeRemaining, startTimer, stopTimer, resetMatch, setDuration, resetAnalytics, onMatchEnd}}>
      {children}
    </MatchContext.Provider>
  )
}

export function useMatch() {
  const context = useContext(MatchContext)
  if (!context) throw new Error("useMatch must be used inside a MatchProvider")
  return context
}
