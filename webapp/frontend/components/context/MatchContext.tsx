/*

Context interface for use of match controls across components


*/

"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react"

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
  onMatchEnd: (callback: () => void) => (() => void)

  //register camera for daily start training
  // registerCameraStart: (fn: () => void) => void
  // triggerCameraStart: () => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

export function MatchProvider({ children }: { children: ReactNode }) {
    const [isRunning, setIsRunning] = useState(false)
    const [duration, setDuration] = useState(180) // default 3 minutes in seconds
    const [timeRemaining, setTimeRemaining] = useState(duration)
    //reset counter
    const [resetAnalytics, setResetAnalytics] = useState(0)
    //callback for match end - using ref to store callbacks to prevent memory leaks
    const matchEndCallbacksRef = useRef<(() => void)[]>([])

    //Register match end callbacks - memoized to prevent unnecessary re-renders
    // Returns cleanup function to remove the callback
    const onMatchEnd = useCallback((callback: () => void) => {
        matchEndCallbacksRef.current.push(callback)
        // Return cleanup function to remove callback when component unmounts
        return () => {
            matchEndCallbacksRef.current = matchEndCallbacksRef.current.filter(cb => cb !== callback)
        }
    }, [])

  //   //register the start of camera for daily challenge autostart
  //   const cameraStartRef = useRef<(() => void) | null>(null)

  //   const registerCameraStart = (fn: () => void) => {
  //       cameraStartRef.current = fn
  //   }

  // const triggerCameraStart = () => {
  //   if (cameraStartRef.current) {
  //     cameraStartRef.current()
  //   } else {
  //     console.warn("No camera start function registered yet")
  //   }
  // }

    //Logic to handle timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

    if (isRunning && timeRemaining > 0) {
    interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // play sound **immediately** as it hits 0
          const audio = new Audio("/sounds/match-end.mp3")
          audio.play().catch(() => console.log("Audio play failed"))

          // stop the timer instantly
          setIsRunning(false)

          // trigger match end callbacks (use ref to get latest callbacks)
          matchEndCallbacksRef.current.forEach((cb) => cb())

          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning]) // Only depend on isRunning to avoid restarting interval unnecessarily

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
