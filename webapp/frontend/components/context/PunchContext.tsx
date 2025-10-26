/*
Created by:Mariah Falzon
Date: October 24, 2025
Description: Context to manage punch statistics across the application.

Updated by: 
Date Updated:
Notes: 
*/
"use client"

import React, { createContext, useContext, useState } from "react"

type PunchType = "jab" | "cross" | "hook" | "uppercut" | null

interface PunchStats {
  total: number
  jab: number
  cross: number
  hook: number
  uppercut: number
}

interface PunchContextType {
  stats: PunchStats
  addPunch: (type: PunchType) => void
}

const PunchContext = createContext<PunchContextType | undefined>(undefined)

export const PunchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<PunchStats>({
    total: 0,
    jab: 0,
    cross: 0,
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

  return (
    <PunchContext.Provider value={{ stats, addPunch }}>
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
console.log('PunchContext exports:', { usePunches, PunchProvider });
