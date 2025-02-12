"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SimpleBar from 'simplebar-react';
import { Upload, X, Video as VideoIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

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
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const SUPPORTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

export function VideoUploadButton({ isOpen, onOpenChange }: VideoUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<SelectedVideo[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return "Unsupported file format. Please use MP4, WebM, or QuickTime.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 500MB limit.";
    }
    return null;
  };

  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL());
      };
      video.src = URL.createObjectURL(file);
    });
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

        const thumbnail = await generateThumbnail(file);
        const duration = formatDuration(video.duration);

        newVideos.push({
          id: Math.random().toString(36).substr(2, 9),
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

  const startUpload = () => {
    const newFiles = selectedVideos.map(video => ({
      id: video.id,
      name: video.file.name,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);
    setSelectedVideos([]);

    newFiles.forEach(file => simulateUpload(file.id));
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: 100, status: "processing" as const }
              : f
          )
        );
        
        setTimeout(() => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: Math.random() > 0.1 ? "complete" as const : "error" as const }
                : f
            )
          );
        }, 3000);
      }
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        )
      );
    }, 200);
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
              relative border-2 border-dashed rounded-lg p-4 transition-colors duration-200
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
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            <div className="flex flex-col items-center py-4">
              <div className="w-12 h-12 rounded-full bg-theme-highlight-alpha/20 flex items-center justify-center mb-2">
                <VideoIcon className="w-6 h-6 text-theme-primary" />
              </div>
              <Button
                className="mb-2 bg-theme-primary text-white hover:bg-theme-primary-alpha/90"
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
                  onClick={startUpload}
                  className="bg-theme-primary hover:bg-theme-primary-alpha/90 text-white"
                >
                  Start Upload
                </Button>
              </div>
              <SimpleBar className="h-48">
                <div className="grid grid-cols-4 gap-4 p-1">
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
                      className="bg-white/50 backdrop-blur-sm rounded-lg p-2 flex items-center gap-3"
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