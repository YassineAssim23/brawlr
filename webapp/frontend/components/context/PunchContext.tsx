/*
Created by:Mariah Falzon
Date: October 24, 2025
Description: Context to manage punch statistics across the application.

Updated by: Mariah
Date Updated: October 27, 2025
Notes: Added MatchContext reset trigger integration from the match controls.

Updated by: Toufiq Charania
Date Updated: October 27, 2025
Notes: Removed jab and cross from the punch types and added straight to the punch types.
*/
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useMatch } from "./MatchContext"

// type PunchType = "jab" | "cross" | "hook" | "uppercut" | null
type PunchType = "straight" | "hook" | "uppercut" | null // ADDED STRAIGHT

interface PunchStats {
  total: number
  // jab: number
  // cross: number
  straight: number // ADDED STRAIGHT
  hook: number
  uppercut: number
}

interface PunchContextType {
  stats: PunchStats
  addPunch: (type: PunchType) => void
  resetPunches: () => void
}

const PunchContext = createContext<PunchContextType | undefined>(undefined)

export const PunchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const { resetAnalytics } = useMatch() //listener event for resets from MatchContext
  const [stats, setStats] = useState<PunchStats>({
    total: 0,
    // jab: 0,
    // cross: 0,
    straight: 0, // ADDED STRAIGHT
    hook: 0,
    uppercut: 0,
  })

  const addPunch = (type: PunchType) => {
    if (!type) return
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      [type]: prev[type] + 1,
    }))
  }

  //reset punches when triggered from MatchContext
  const resetPunches = () => {
    setStats({
      total: 0,
      straight: 0,
      hook: 0,
      uppercut: 0,
    })
    console.log("Punch stats reset")
  }

  // Effect to listen for reset trigger from MatchContext
  useEffect(() => {
    resetPunches()
  }, [resetAnalytics])

  return (
    <PunchContext.Provider value={{ stats, addPunch, resetPunches }}>
      {children}
    </PunchContext.Provider>
  )
}

export const usePunches = () => {
  const context = useContext(PunchContext)
  if (!context) {
    throw new Error("usePunches must be used within a PunchProvider")
  }
  return context
}

// At the bottom of PunchContext.tsx
console.log("PunchContext exports:", { usePunches, PunchProvider })
