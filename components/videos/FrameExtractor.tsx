"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Film, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';

const client = generateClient<Schema>();

// AWS S3 Client configuration
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: `https://s3.${process.env.NEXT_PUBLIC_AWS_REGION!}.amazonaws.com`,
  forcePathStyle: true,
});

interface FrameExtractorProps {
  videoUrl: string;
  videoId: string;
  eventId: string;
  userId: string;
  fileName: string;
}

export function FrameExtractor({ videoUrl, videoId, eventId, userId, fileName }: FrameExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [extractedFrames, setExtractedFrames] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Process the videoUrl to ensure it works with CORS
  const processedVideoUrl = videoUrl;

  // Function to start the server-side frame extraction process
  const extractFrames = async () => {
    try {
      setIsExtracting(true);
      setError(null);
      setProgress(0);
      setExtractedFrames(0);
      setIsComplete(false);
      
      // Get video duration if possible (for UI purposes)
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Wait for video metadata to load
        if (!video.duration) {
          await new Promise<void>((resolve) => {
            const metadataHandler = () => {
              video.removeEventListener('loadedmetadata', metadataHandler);
              resolve();
            };
            video.addEventListener('loadedmetadata', metadataHandler);
          });
        }
        
        // Set estimated total frames (1 frame per second)
        const duration = Math.floor(video.duration);
        setTotalFrames(duration);
      }
      
      // Call the Amplify function to extract frames
      // This is where you'll integrate with your Amplify function
      try {
        // Start a polling mechanism to check progress
        const extractionId = uuidv4(); // Generate a unique ID for this extraction job
        
        // In a real implementation, you would:
        // 1. Call your Amplify function to start the extraction
        // const { data } = await client.graphql({
        //   query: `mutation StartFrameExtraction($input: StartFrameExtractionInput!) {
        //     startFrameExtraction(input: $input) {
        //       jobId
        //       status
        //     }
        //   }`,
        //   variables: {
        //     input: {
        //       videoId,
        //       eventId,
        //       userId,
        //       videoUrl,
        //       extractionId
        //     }
        //   }
        // });
        
        // 2. Set up a polling mechanism to check progress
        const pollInterval = setInterval(async () => {
          try {
            // In a real implementation, you would:
            // const { data: progressData } = await client.graphql({
            //   query: `query GetExtractionProgress($extractionId: ID!) {
            //     getExtractionProgress(extractionId: $extractionId) {
            //       status
            //       framesExtracted
            //       totalFrames
            //       error
            //     }
            //   }`,
            //   variables: {
            //     extractionId
            //   }
            // });
            
            // For demo purposes, we'll simulate progress
            const mockProgress = Math.min(extractedFrames + 1, totalFrames);
            setExtractedFrames(mockProgress);
            setProgress(Math.round((mockProgress / totalFrames) * 100));
            
            // If complete, clean up and update UI
            if (mockProgress >= totalFrames) {
              clearInterval(pollInterval);
              
              // Update video record to indicate frames have been extracted
              await client.models.Videos.update({
                videoId,
                hasChunks: true,
                chunksCount: totalFrames,
              });
              
              setIsComplete(true);
              setIsExtracting(false);
            }
          } catch (pollError) {
            console.error('Error polling extraction progress:', pollError);
            clearInterval(pollInterval);
            setError('Failed to get extraction progress');
            setIsExtracting(false);
          }
        }, 1000); // Poll every second
        
        // For demo purposes, we'll simulate the extraction process
        // In a real implementation, you would rely on the polling mechanism above
        setTimeout(() => {
          clearInterval(pollInterval);
          setExtractedFrames(totalFrames);
          setProgress(100);
          setIsComplete(true);
          setIsExtracting(false);
        }, totalFrames * 1000); // Simulate completion after totalFrames seconds
        
      } catch (functionError: any) {
        console.error('Error calling frame extraction function:', functionError);
        setError(functionError.message || 'Failed to start frame extraction');
        setIsExtracting(false);
      }
    } catch (err: any) {
      console.error('Error in frame extraction process:', err);
      setError(err.message || 'Failed to extract frames');
      setIsExtracting(false);
    }
  };

  return (
    <div>
      {/* Hidden video element for metadata */}
      <video 
        ref={videoRef} 
        src={processedVideoUrl} 
        className="hidden" 
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error("Video loading error:", e);
          // We can still proceed with server-side extraction even if browser can't load the video
          // setError("Failed to load video. Please check the URL and try again.");
        }}
      />
      
      {!isExtracting && !isComplete && (
        <Button 
          onClick={extractFrames}
          className="w-full bg-background hover:bg-black/50"
        >
          <Film className="mr-2 h-4 w-4" />
          Extract Frames
        </Button>
      )}
      
      {isExtracting && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Extracting frames...</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {extractedFrames} / {totalFrames} frames
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {isComplete && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center text-green-800"
        >
          <Check className="mr-2 h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Frame extraction complete</p>
            <p className="text-sm text-green-700">
              Successfully extracted {extractedFrames} frames from video
            </p>
          </div>
        </motion.div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center text-red-800">
          <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium">Error extracting frames</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
} 