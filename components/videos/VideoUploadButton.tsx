"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SimpleBar from 'simplebar-react';
import { Upload, X, Video as VideoIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

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
interface SelectedVideo {
  id: string;
  file: File;
  thumbnail: string;
  duration: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

interface VideoUploadButtonProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	eventId: string;
	userId: string;
	onUploadComplete?: (videoId: string) => void;
	onUploadError?: (error: any) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const SUPPORTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

export function VideoUploadButton({ 
	isOpen,
	onOpenChange,
	eventId, 
	userId, 
	onUploadComplete,
	onUploadError  
  }: VideoUploadButtonProps) {
	
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<SelectedVideo[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verify Amplify client on component mount
  useEffect(() => {
    console.log('Checking Amplify client initialization...');
    if (client && client.models && client.models.Videos) {
      console.log('Amplify client is properly initialized');
    } else {
      console.error('Amplify client is not properly initialized:', client);
      setError('Error initializing database client');
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return "Unsupported file format. Please use MP4, WebM, or QuickTime.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 500MB limit.";
    }
    return null;
  };

  const handleVideoUpload = async (file: File, fileId: string) => {
    try {
      if (!process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME) {
        throw new Error('S3 bucket name is not configured');
      }

      // Generate unique S3 key for the video
      const s3Key = `videos/${eventId}/${fileId}/${file.name}`;
      const thumbnailKey = `videos/${eventId}/${fileId}/thumbnail.jpg`;
      const thumbnailUrl = `https://${process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${thumbnailKey}`;
      
      console.log('Upload parameters:', {
        bucket: process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME,
        key: s3Key,
        contentType: file.type
      });

      // Get video duration
      console.log('Getting video duration...');
      const duration = await getVideoDuration(file);
      console.log('Video duration:', duration);

      // Generate thumbnail first
      console.log('Generating thumbnail...');
      const thumbnailBlob = await generateThumbnail(file);
      console.log('Thumbnail generated, URL will be:', thumbnailUrl);

      // Convert File to ArrayBuffer for S3 upload
      const fileBuffer = await file.arrayBuffer();

      // Prepare the upload command
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME,
        Key: s3Key,
        Body: new Uint8Array(fileBuffer),
        ContentType: file.type,
      });

      // Update status to uploading
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 10, status: "uploading" as const }
            : f
        )
      );

      try {
        // Handle actual upload using S3 client
        const response = await s3Client.send(uploadCommand);
        console.log('S3 upload response:', response);
        
        // Upload thumbnail to S3
        console.log('Uploading thumbnail to S3...');
        const thumbnailArrayBuffer = await thumbnailBlob.arrayBuffer();
        const thumbnailUploadCommand = new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME,
          Key: thumbnailKey,
          Body: new Uint8Array(thumbnailArrayBuffer),
          ContentType: 'image/jpeg',
        });
        
        await s3Client.send(thumbnailUploadCommand);
        console.log('Thumbnail uploaded successfully');
        
        // Update status to processing
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: 100, status: "processing" as const }
              : f
          )
        );

        // Create video entry in the database
        const videoData = {
          videoId: fileId,
          chunksCount: 0,
          duration: duration,
          eventId: eventId,
          fileName: file.name,
          filePath: `videos/${eventId}/${fileId}`,
          fileSize: file.size,
          hasChunks: false,
          isArchived: false,
          recognitionCollectionId: '',
          recognitionStatus: 'PENDING',
          s3Bucket: process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME || '',
          s3Key: s3Key,
          taggedFaces: null,
          taggedPeople: null,
          taggedPeopleCount: 0,
          thumbnail: thumbnailKey,
          userId: userId,
          videoName: file.name,
          videoStatus: 'UPLOADED',
          jobId: '',
          videoJobStatus: 'PENDING' as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
          videoJobResult: null
        };

        console.log('Attempting to create video entry with data:', JSON.stringify(videoData, null, 2));

        try {
          console.log('Using Amplify client to create video entry...');
          
          // Create with full data directly
          console.log('Creating video entry with full data...');
          const createdVideo = await client.models.Videos.create(videoData);
          console.log('Video entry created successfully:', createdVideo);

          // Update status to complete
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: "complete" as const }
                : f
            )
          );

          // Call onUploadComplete callback
          onUploadComplete?.(fileId);
          return response;
        } catch (error: any) {
          console.error('Database error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            details: error
          });
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: "error" as const }
                : f
            )
          );
          onUploadError?.(error);
          throw error;
        }
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: "error" as const }
              : f
          )
        );
        onUploadError?.(s3Error);
        throw s3Error;
      }
    } catch (error) {
      console.error('Error in handleVideoUpload:', error);
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: "error" as const }
            : f
        )
      );
      onUploadError?.(error);
      throw error;
    }
  };

  // Function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          // Clean up
          URL.revokeObjectURL(video.src);
          resolve(video.duration);
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error('Error loading video'));
        };
        
        video.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Function to generate a thumbnail from a video file
  const generateThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Create video element
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        
        // Create object URL for the video file
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
        
        // Set up event handlers
        video.onloadeddata = () => {
          // Seek to 1 second or 25% of the video, whichever is less
          const seekTime = Math.min(1, video.duration * 0.25);
          video.currentTime = seekTime;
        };
        
        video.onseeked = () => {
          try {
            // Create canvas and draw video frame
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Draw the current frame to the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                // Clean up
                URL.revokeObjectURL(videoUrl);
                resolve(blob);
              } else {
                reject(new Error('Failed to create thumbnail blob'));
              }
            }, 'image/jpeg', 0.8);
          } catch (error) {
            reject(error);
          }
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(videoUrl);
          reject(new Error('Error loading video'));
        };
        
        // Start loading the video
        video.load();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Helper function to convert blob to data URL for display
  const blobToDataURL = async (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // Upload all selected videos
  const startUpload = async () => {
    if (selectedVideos.length === 0) return;
    
    // Add all videos to uploading files state
    const uploadPromises = selectedVideos.map(async (video) => {
      setUploadingFiles(prev => [...prev, {
        id: video.id,
        name: video.file.name,
        progress: 0,
        status: "uploading" as const
      }]);

      try {
        await handleVideoUpload(video.file, video.id);
        return { success: true, id: video.id };
      } catch (error) {
        console.error('Upload failed:', error);
        return { success: false, id: video.id, error };
      }
    });

    // Start all uploads in parallel
    await Promise.all(uploadPromises);
    
    // Clear selected videos after starting upload
    setSelectedVideos([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const newVideos: SelectedVideo[] = [];

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        continue;
      }

      try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        // Generate thumbnail blob and convert to data URL for display
        const thumbnailBlob = await generateThumbnail(file);
        const thumbnail = await blobToDataURL(thumbnailBlob);
        const duration = formatDuration(video.duration);

        newVideos.push({
          id: uuidv4(),
          file,
          thumbnail,
          duration,
        });
      } catch (err) {
        console.error("Error processing video:", err);
        setError("Error processing video file");
      }
    }

    setSelectedVideos(prev => [...prev, ...newVideos]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeSelectedVideo = (id: string) => {
    setSelectedVideos(prev => prev.filter(video => video.id !== id));
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="w-full space-y-2"
    >
      <CollapsibleContent>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div
            className={`
              bg-background relative border-2 border-dashed rounded-lg p-4 transition-colors duration-200
              ${isDragging ? 'border-theme-primary bg-theme-highlight-alpha/10' : 'border-theme-accent-alpha/20'}
              ${error ? 'border-red-500 bg-red-50' : ''}
            `}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept={SUPPORTED_FORMATS.join(",")}
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center py-4">
              <div className="w-12 h-12 rounded-full bg-theme-highlight-alpha/20 flex items-center justify-center mb-2">
                <VideoIcon className="w-6 h-6 text-theme-primary" />
              </div>
              <Button
                className="mb-2 bg-primary text-black hover:bg-theme-primary-alpha/90"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Videos
              </Button>
              <p className="text-sm text-theme-secondary">
                or drag and drop your videos here
              </p>
            </div>

            {error && (
              <div className="absolute inset-x-0 bottom-0 p-2 bg-red-100 text-red-600 text-sm flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          {selectedVideos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-theme-primary">
                  Selected Videos ({selectedVideos.length})
                </h3>
                <Button
                  size="sm"
                  onClick={() => startUpload()}
                  className="bg-background hover:bg-theme-primary-alpha/90 text-white"
                >
                  Start Upload
                </Button>
              </div>
              <SimpleBar className="h-24">
                <div className="grid grid-cols-12 gap-4 p-1">
                  {selectedVideos.map((video) => (
                    <div key={video.id} className="relative group">
                      <div className="relative aspect-video">
                        <img
                          src={video.thumbnail}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                          {video.duration}
                        </div>
                      </div>
                      <button
                        onClick={() => removeSelectedVideo(video.id)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <p className="mt-1 text-sm text-theme-primary truncate">
                        {video.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </SimpleBar>
            </div>
          )}

          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-medium text-theme-primary">
                  Upload Progress
                </h3>
                <div className="space-y-2">
                  {uploadingFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-background backdrop-blur-sm rounded-lg p-2 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-theme-highlight-alpha/20 flex items-center justify-center flex-shrink-0">
                        <VideoIcon className="w-4 h-4 text-theme-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {file.name}
                          </p>
                          <button
                            onClick={() => removeUploadingFile(file.id)}
                            className="p-1 hover:bg-theme-highlight-alpha/20 rounded-full"
                          >
                            <X className="w-3 h-3 text-theme-secondary" />
                          </button>
                        </div>
                        {file.status === "uploading" && (
                          <Progress value={file.progress} className="h-1" />
                        )}
                        <p className="text-xs text-theme-secondary">
                          {file.status === "uploading" && `Uploading... ${Math.round(file.progress)}%`}
                          {file.status === "processing" && "Processing video..."}
                          {file.status === "complete" && "Upload complete"}
                          {file.status === "error" && "Upload failed"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}