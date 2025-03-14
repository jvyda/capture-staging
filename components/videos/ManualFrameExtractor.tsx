"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SimpleBar from "simplebar-react";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

// Initialize the Amplify Data client with our schema
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

interface SelectedFrame {
  id: string;
  file: File;
  preview: string;
  timestamp?: number; // Optional timestamp for the frame
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

interface ManualFrameExtractorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  userId: string;
  videoId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export function ManualFrameExtractor({
  isOpen,
  onOpenChange,
  eventId,
  userId,
  videoId,
}: ManualFrameExtractorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFrames, setSelectedFrames] = useState<SelectedFrame[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return "Unsupported file format. Please use JPG, PNG, or WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit.";
    }
    return null;
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const newFrames: SelectedFrame[] = [];

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newFrames.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
      });
    }

    setSelectedFrames((prev) => [...prev, ...newFrames]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /**
   * Creates a thumbnail maintaining aspect ratio
   * @param file Original image file
   * @param maxDimension Maximum width or height
   * @returns Promise<Blob>
   */
  const createThumbnail = async (file: File, maxDimension: number = 300) => {
    return new Promise<Blob>(async (resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src); // Clean up

        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) {
            height = height * (maxDimension / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = width * (maxDimension / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Enable smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create thumbnail"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));

      // Create object URL from file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Starts the upload process for selected frames
   * Handles progress notifications and error states
   */
  const startUpload = async () => {
    const newFiles = selectedFrames.map((frame) => ({
      id: frame.id,
      name: frame.file.name,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);
    
    // Process each file with individual promise-based toast
    const uploadPromises = selectedFrames.map(async (frame, index) => {
      const toastId = `upload-${frame.id}`;
      
      try {
        // Show initial processing state
        toast.loading(`Processing ${frame.file.name}`, {
          id: toastId,
          duration: 5000,
        });
        
        // Update progress
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === frame.id
              ? { ...f, progress: 20, status: "processing" as const }
              : f
          )
        );
        
        // Upload to S3 and create database entry
        await uploadToS3(frame, index);
        
        // Update progress and show success toast
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === frame.id
              ? { ...f, progress: 100, status: "complete" as const }
              : f
          )
        );
        
        toast.success(`Frame uploaded successfully`, {
          id: toastId,
          duration: 3000,
        });
        
        return { success: true, id: frame.id };
      } catch (error) {
        console.error(`Error uploading ${frame.file.name}:`, error);
        
        // Update progress and show error toast
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === frame.id
              ? { ...f, status: "error" as const }
              : f
          )
        );
        
        toast.error(`Failed to upload ${frame.file.name}`, {
          id: toastId,
          duration: 5000,
        });
        
        return { success: false, id: frame.id, error };
      }
    });
    
    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);
    
    // Clear selected frames
    setSelectedFrames([]);
    
    // Update video record to indicate frames have been extracted
    try {
      await client.models.Videos.update({
        videoId,
        hasChunks: true,
        chunksCount: selectedFrames.length,
      });
    } catch (error) {
      console.error("Failed to update video record:", error);
    }
  };

  /**
   * Handles the upload of a frame to AWS S3 and creates a corresponding database entry
   */
  const uploadToS3 = async (frame: SelectedFrame, frameIndex: number) => {
    const file = frame.file;
    const frameId = uuidv4();
    const frameNumber = frameIndex.toString().padStart(5, '0');
    const fileName = `frame_${frameNumber}.jpg`;
    const s3Key = `videos/${eventId}/${videoId}/frames/${fileName}`;
    const thumbnailKey = s3Key; // Using the same key for thumbnail in this case

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      
      // Create thumbnail
      const thumbnail = await createThumbnail(file);

      // Upload file to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME!,
        Key: s3Key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: "image/jpeg",
      }));

      // Create database entry
      const frameData = {
        frameId,
        aspectRatio: dimensions.width / dimensions.height,
        eventId,
        excludeFromFaceDetection: false,
        facesExtracted: false,
        fileName,
        filePath: `videos/${eventId}/${videoId}/frames`,
        fileSize: file.size,
        frameName: `Frame ${frameIndex + 1}`,
        imageHeight: dimensions.height,
        imageWidth: dimensions.width,
        isArchived: false,
        recognitionCollectionId: '',
        recognitionStatus: 'PENDING',
        s3Bucket: process.env.NEXT_PUBLIC_S3_VIDEOS_BUCKET_NAME!,
        s3Key,
        taggedFaces: null,
        taggedFacesCount: 0,
        taggedPeople: null,
        taggedPeopleCount: 0,
        thumbnail: thumbnailKey,
        userId,
        videoId,
      };

      await client.models.Frames.create(frameData);

    } catch (error) {
      console.error("Upload process failed:", error);
      throw error;
    }
  };

  /**
   * Gets the dimensions of an image file
   */
  const getImageDimensions = async (file: File): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const removeSelectedFrame = (id: string) => {
    setSelectedFrames((prev) => prev.filter((frame) => frame.id !== id));
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getStatusColor = (status: UploadingFile["status"]) => {
    switch (status) {
      case "complete":
        return "bg-emerald-500/10 text-emerald-500";
      case "error":
        return "bg-red-500/10 text-red-500";
      case "processing":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-theme-highlight-alpha/20 text-theme-primary";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
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
                <Film className="w-6 h-6 text-theme-primary" />
              </div>
              <Button
                className="mb-2 bg-primary text-black hover:bg-theme-primary-alpha/90"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Frames
              </Button>
              <p className="text-sm text-theme-secondary">
                or drag and drop your frames here
              </p>
            </div>

            {error && (
              <div className="absolute inset-x-0 bottom-0 p-2 bg-red-100 text-red-600 text-sm flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          {selectedFrames.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-theme-primary">
                  Selected Frames ({selectedFrames.length})
                </h3>
                <Button
                  size="sm"
                  onClick={startUpload}
                  className="bg-background hover:bg-theme-primary-alpha/90 text-white"
                >
                  Start Upload
                </Button>
              </div>
              <SimpleBar className="h-48">
                <div className="grid grid-cols-4 gap-4 p-1">
                  {selectedFrames.map((frame) => (
                    <div key={frame.id} className="relative group">
                      <div className="relative aspect-video">
                        <img
                          src={frame.preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <button
                        onClick={() => removeSelectedFrame(frame.id)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <p className="mt-1 text-sm text-theme-primary truncate">
                        {frame.file.name}
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
                        <ImageIcon className="w-4 h-4 text-theme-primary" />
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
                          {file.status === "processing" && "Processing frame..."}
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