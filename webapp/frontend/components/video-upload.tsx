/*
Created by: Yassine Assim
Date: October 1, 2025
Description: Component for uploading boxing videos for analysis to the model

Updated by: 
Date Updated: 
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
  const [result, setResult] = useState<UploadResult | null>(null)
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
    setResult(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('video', file)

      // Simulate progress (we'll replace this with real progress later)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload to backend
      const response = await fetch('http://localhost:8000/upload-video', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Backend response:", data)
      
      setResult({
        success: true,
        punchCounts: data.punchCounts
      })
      console.log("Result set:", { success: true, punchCounts: data.punchCounts })

    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileVideo className="h-5 w-5" />
          Video Analysis
        </CardTitle>
        <CardDescription>
          Upload a boxing video to analyze punch counts and get detailed statistics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!result && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isUploading 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600">Processing video...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
                <p className="text-xs text-gray-400">This may take several minutes for longer videos</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-white-900">
                    Drop your video here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports MP4, AVI, MOV, and other video formats
                  </p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
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

        {/* Results */}
        {result && (!result || !result.success) && (
          <div className="text-xs text-gray-500 mb-2">
            Debug: result exists = {result ? 'true' : 'false'}, success = {result?.success ? 'true' : 'false'}
          </div>
        )}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Analysis Complete!</span>
                </div>
                
                {result.punchCounts && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.punchCounts.jab}
                      </div>
                      <div className="text-sm text-gray-600">Jabs</div>
                    </div> */}
                    {/* <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {result.punchCounts.cross}
                      </div>
                      <div className="text-sm text-gray-600">Crosses</div>
                    </div> */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {result.punchCounts.straight}
                      </div>
                      <div className="text-sm text-gray-600">Straights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {result.punchCounts.hook}
                      </div>
                      <div className="text-sm text-gray-600">Hooks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {result.punchCounts.uppercut}
                      </div>
                      <div className="text-sm text-gray-600">Uppercuts</div>
                    </div>
                    <div className="col-span-2 text-center pt-2 border-t">
                      <div className="text-3xl font-bold text-gray-800">
                        {result.punchCounts.total}
                      </div>
                      <div className="text-sm text-gray-600">Total Punches</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Upload Failed</span>
              </div>
            )}
            
            {result.error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {result.error}
              </p>
            )}
            
            <Button onClick={resetUpload} className="w-full">
            {/* variant="outline" */}
              Upload Another Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
