"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const client = generateClient<Schema>();
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: `https://s3.${process.env.NEXT_PUBLIC_AWS_REGION!}.amazonaws.com`,
  forcePathStyle: true,
});

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

interface FrameUploadButtonProps {
  eventId: string;
  userId: string;
  videoId: string;
}

export function FrameUploadButton({
  eventId,
  userId,
  videoId,
}: FrameUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  
  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Get image dimensions
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

  // Upload a single frame
  const uploadFrame = async (file: File, index: number) => {
    const fileId = uuidv4();
    const toastId = `upload-${fileId}`;
    
    try {
      // Show initial toast
      toast.loading(`Uploading ${file.name}...`, { id: toastId });
      
      // Add to uploading files
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        progress: 0,
        status: "uploading"
      }]);
      
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      
      // Update progress
      setUploadingFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, progress: 30 } : f)
      );
      
      // Create frame ID and paths
      const frameId = uuidv4();
      const frameNumber = index.toString().padStart(5, '0');
      const fileName = file.name;
      const s3Key = `frames/${eventId}/${videoId}/${fileName}`;
      
      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_FRAMES_BUCKET_NAME!,
        Key: s3Key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: "image/jpeg",
      }));
      
      // Update progress
      setUploadingFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, progress: 70, status: "processing" } : f)
      );
      
      // Create database entry
      const frameData = {
        frameId,
        aspectRatio: dimensions.width / dimensions.height,
        eventId,
        excludeFromFaceDetection: false,
        facesExtracted: false,
        fileName,
        filePath: `frames/${eventId}/${videoId}`,
        fileSize: file.size,
        frameName: fileName,
        imageHeight: dimensions.height,
        imageWidth: dimensions.width,
        isArchived: false,
        recognitionCollectionId: '',
        recognitionStatus: 'PENDING',
        s3Bucket: process.env.NEXT_PUBLIC_S3_FRAMES_BUCKET_NAME!,
        s3Key,
        taggedFaces: null,
        taggedFacesCount: 0,
        taggedPeople: null,
        taggedPeopleCount: 0,
        thumbnail: s3Key, // Using the same key for thumbnail
        userId,
        videoId,
      };
      
      await client.models.Frames.create(frameData);
      
      // Update progress and show success
      setUploadingFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, progress: 100, status: "complete" } : f)
      );
      
      toast.success(`Frame uploaded successfully`, { id: toastId });
      
      // Remove from list after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 3000);
      
      return true;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      
      // Update status and show error
      setUploadingFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "error" } : f)
      );
      
      toast.error(`Failed to upload ${file.name}`, { id: toastId });
      return false;
    }
  };

  // Handle file change
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Process each file
    const uploadPromises = Array.from(files).map((file, index) => 
      uploadFrame(file, index)
    );
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(Boolean).length;
    
    // Update video record if any frames were uploaded
    if (successCount > 0) {
      try {
        // First get the current video to get the current chunksCount
        const { data: currentVideo } = await client.models.Videos.get({
          videoId
        });
        
        // Then update with the new count
        await client.models.Videos.update({
          videoId,
          hasChunks: true,
          chunksCount: (currentVideo?.chunksCount || 0) + successCount,
        });
        
        toast.success(`${successCount} frames uploaded successfully`);
      } catch (error) {
        console.error("Failed to update video record:", error);
      }
    }
    
    // Reset input to allow selecting the same files again
    event.target.value = '';
  };

  return (
    <>
      <Button
        onClick={handleFileSelect}
        className="bg-background hover:bg-black/50"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Frames
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Upload Progress Section */}
      {/* {uploadingFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  {file.status === "uploading" && (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {file.status === "processing" && "Processing..."}
                  {file.status === "complete" && "Complete"}
                  {file.status === "error" && "Error"}
                </span>
              </div>
              <Progress value={file.progress} className="h-1" />
            </div>
          ))}
        </div>
      )} */}
    </>
  );
} 