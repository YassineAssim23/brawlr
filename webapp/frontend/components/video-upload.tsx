/*
Created by: Yassine Assim
Date: October 1, 2025
Description: Component for uploading boxing videos for analysis to the model

Updated by: Toufiq Charania
Date Updated: October 28 2025
Notes: 
*/
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileVideo, CheckCircle, AlertCircle } from "lucide-react"

interface UploadResult {
  success: boolean
  punchCounts?: {
    // jab: number
    // cross: number
    straight: number
    hook: number
    uppercut: number
    total: number
  }
  error?: string
}

export function VideoUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState<string>('')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [fastMode, setFastMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

// Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      handleUpload(file)
    }
  }

 const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

 // Upload and process video
  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setProcessingStage('Preparing video...')
    setResult(null)

    // Declare progressInterval outside try block so it's accessible in catch
    let progressInterval: NodeJS.Timeout | null = null


   try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('video', file)

      // Simulate progress with realistic stages
      const progressStages = [
        { stage: 'Uploading video...', progress: 20 },
        { stage: 'Preprocessing video...', progress: 40 },
        { stage: 'Loading AI model...', progress: 60 },
        { stage: 'Analyzing frames...', progress: 80 },
        { stage: 'Counting punches...', progress: 95 }
      ]

 let currentStageIndex = 0
      
      progressInterval = setInterval(() => {
        if (currentStageIndex < progressStages.length) {
          const currentStage = progressStages[currentStageIndex]
          setProcessingStage(currentStage.stage)
          setUploadProgress(currentStage.progress)
          currentStageIndex++
        } else {
          if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
          }
        }
      }, 1000)


 // Upload to backend (choose endpoint based on fast mode)
      const endpoint = fastMode ? 'http://localhost:8000/upload-video-fast' : 'http://localhost:8000/upload-video'
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      setProcessingStage('Finalizing results...')
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Backend response:", data)
      
setResult({
  success: data.success,
  punchCounts:
    data.punchCounts ||
    data.results?.punchCounts || // ✅ works with your /upload-video endpoint
    data.results ||
    {
      straight: 0,
      hook: 0,
      uppercut: 0,
      total: 0,
    },
})

      console.log("Result set:", { success: true, punchCounts: data.punchCounts })

    } catch (error) {
      console.error('Upload error:', error)
      // Ensure interval is cleared on error
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsUploading(false)
      setProcessingStage('')
    }
  }
  const resetUpload = () => {
    setResult(null)
    setUploadProgress(0)
    setProcessingStage('')
    setFastMode(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card
      className="w-full bg-[#111417] border-2 border-brawlr-red rounded-xl gap-6 
                 transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,255,255,.8)]
                 hover:scale-[1.02]"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileVideo className="h-5 w-5" />
          Video Analysis
        </CardTitle>
        <CardDescription>
          Upload a boxing video to analyze punch counts and get detailed statistics
        </CardDescription>

  {/* Fast Mode Toggle */}
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            id="fastMode"
            checked={fastMode}
            onChange={(e) => setFastMode(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="fastMode" className="text-sm text-gray-600">
            <strong>Fast Mode</strong> — Process every 5th frame for maximum speed
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload / Progress Section */}
        {!result && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isUploading
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600">{processingStage}</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
              <p className="text-xs text-gray-400">
                  {fastMode ? 
                    (uploadProgress < 40 ? 'Ultra-fast mode: Optimizing video...' : 
                     uploadProgress < 80 ? 'AI analyzing every 5th frame...' : 
                     'Almost done! Counting punches...') :
                    (uploadProgress < 40 ? 'Optimizing video for faster processing...' : 
                     uploadProgress < 80 ? 'AI is analyzing your video...' : 
                     'Almost done! Counting punches...')
                  }
                </p>

              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-white">Drop your video here, or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports MP4, AVI, MOV, and other video formats
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="brawlr-red border-2 border-brawlr-red text-white hover:scale-110 transition-all duration-300 rounded-xl"
                >
                  Choose Video File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}



{result && (
  <Card
    className="
      p-6 
      bg-[#111417] 
      border-2 
      border-brawlr-red 
      rounded-xl 
      w-full 
      max-w-md 
      mx-auto 
      mt-6
      shadow-[0_0_25px_rgba(255,0,0,0.25)]
      transition-all 
      duration-300 
      hover:shadow-[0_0_40px_rgba(255,0,0,0.4)]
    "
  >
    <CardContent className="space-y-5 text-center">
      {result.success ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-center gap-2 text-brawlr-red">
            <CheckCircle className="h-6 w-6" />
            <span className="text-xl font-semibold">Analysis Complete!</span>
          </div>

          {/* Punch Breakdown */}
          {result.punchCounts && (
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
              {/* Straights */}
              <div className="flex flex-col items-center justify-center bg-[#1a1d21] p-4 rounded-lg border border-gray-700">
                <div className="text-3xl font-bold text-brawlr-red">
                  {result.punchCounts.straight}
                </div>
                <div className="text-sm text-gray-300">Straights</div>
              </div>

              {/* Hooks */}
              <div className="flex flex-col items-center justify-center bg-[#1a1d21] p-4 rounded-lg border border-gray-700">
                <div className="text-3xl font-bold text-brawlr-red">
                  {result.punchCounts.hook}
                </div>
                <div className="text-sm text-gray-300">Hooks</div>
              </div>

              {/* Uppercuts */}
              <div className="col-span-2 flex flex-col items-center justify-center bg-[#1a1d21] p-4 rounded-lg border border-gray-700">
                <div className="text-3xl font-bold text-purple-500">
                  {result.punchCounts.uppercut}
                </div>
                <div className="text-sm text-gray-300">Uppercuts</div>
              </div>

              {/* Divider */}
              <div className="col-span-2 border-t border-gray-700 my-2" />

              {/* Total */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="text-5xl font-extrabold text-white">
                  {result.punchCounts.total}
                </div>
                <div className="text-sm text-gray-400">Total Punches</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-red-500">
          <AlertCircle className="h-6 w-6" />
          <span className="text-lg font-semibold">Upload Failed</span>
        </div>
      )}
    </CardContent>
  </Card>
)}
 </CardContent>
    </Card>
  )
}