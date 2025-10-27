import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { PunchProvider } from "@/components/context/PunchContext"

export const metadata: Metadata = {
  title: "brawlr - AI Boxing Trainer",
  description: "AI-powered boxing app for training analysis",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
      </body>
    </html>
  )
}
