#!/usr/bin/env python3
"""
Video Download Script for Brawlr Training

This script downloads boxing videos from YouTube for training/testing purposes.
Downloads go to training/videos/ folder.

Usage:
    python download_video.py "https://www.youtube.com/watch?v=VIDEO_ID"
    python download_video.py "https://youtu.be/VIDEO_ID"
"""

import os
import sys
import subprocess
from pathlib import Path

def download_video(url, output_dir="training/videos"):
    """
    Download a video from YouTube using yt-dlp
    
    Args:
        url: YouTube URL
        output_dir: Directory to save video (default: training/videos)
    """
    # Ensure output directory exists
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Downloading video from: {url}")
    print(f"Saving to: {output_path.absolute()}")
    
    try:
        # yt-dlp command
        cmd = [
            "yt-dlp",
            "-o", str(output_path / "%(title)s.%(ext)s"),  # Output filename
            "--format", "best[height<=720]",  # Max 720p for smaller files
            "--no-playlist",  # Don't download playlists
            url
        ]
        
        print(f"Running: {' '.join(cmd)}")
        
        # Run the command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Video downloaded successfully!")
            print(result.stdout)
        else:
            print("❌ Download failed!")
            print("Error:", result.stderr)
            return False
            
    except FileNotFoundError:
        print("❌ yt-dlp not found! Please install it first:")
        print("pip install yt-dlp")
        return False
    except Exception as e:
        print(f"❌ Error downloading video: {e}")
        return False
    
    return True

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python download_video.py <youtube_url>")
        print("Example: python download_video.py 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'")
        sys.exit(1)
    
    url = sys.argv[1]
    
    if not url.startswith(("https://www.youtube.com/", "https://youtu.be/")):
        print("❌ Please provide a valid YouTube URL")
        sys.exit(1)
    
    success = download_video(url)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
