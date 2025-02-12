"use client";

import { Card } from "@/components/ui/card";
import { Heart, Star, Clock, MapPin, Users, Layers, AlertCircle, Loader2, Play, CheckCircle, Edit2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  uploadDate: string;
  favorite: boolean;
  starred: boolean;
  status: "processing" | "ready" | "failed";
  faceExtractionStatus: {
    status: "processing" | "complete" | "failed" | "none";
    faceCount?: number;
  };
}

export function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  uploadDate,
  favorite,
  starred,
  status,
  faceExtractionStatus,
}: VideoCardProps) {
  const router = useRouter();
  const durationInSeconds = duration.split(":").reduce((acc, time) => (60 * acc) + parseInt(time), 0);
  const chunks = Math.ceil(durationInSeconds / 180);
  const isOriginal = durationInSeconds <= 180;

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getChunks = () => {
    if (isOriginal) return [];
    const chunkList = [];
    let remainingSeconds = durationInSeconds;
    let startTime = 0;

    while (remainingSeconds > 0) {
      const chunkDuration = Math.min(180, remainingSeconds);
      chunkList.push({
        number: chunkList.length + 1,
        start: formatDuration(startTime),
        end: formatDuration(startTime + chunkDuration),
        duration: formatDuration(chunkDuration),
      });
      remainingSeconds -= 180;
      startTime += 180;
    }

    return chunkList;
  };

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-4 h-4 text-white animate-spin" />;
      case "ready":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "processing":
        return "Processing";
      case "ready":
        return "Ready";
      case "failed":
        return "Failed";
    }
  };

  const getFaceExtractionText = () => {
    switch (faceExtractionStatus.status) {
      case "processing":
        return "Extracting faces...";
      case "complete":
        return faceExtractionStatus.faceCount === 0 
          ? "No faces detected" 
          : `${faceExtractionStatus.faceCount}`;
      case "failed":
        return "Failed to extract faces";
      default:
        return "Waiting to process";
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/videos/${id}`);
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
        <div className="relative aspect-square">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div 
              className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="w-8 h-8 text-theme-primary ml-1" />
            </motion.div>
          </div>

          {/* Edit Button */}
          <motion.button
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            onClick={handleEditClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit2 className="w-4 h-4 text-theme-primary" />
          </motion.button>

          {/* Top Status Badges */}
          <div className="absolute top-4 left-4 flex flex-row gap-2">
            {/* Duration Badge */}
            <div className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{duration}</span>
            </div>

           

            {/* Chunks Badge */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black/80 transition-colors">
                  <Layers className="w-3 h-3" />
                  <span>{isOriginal ? "Original" : `${chunks}`} </span>
                </button>
              </PopoverTrigger>
              {!isOriginal && (
                <PopoverContent 
                  className="w-64 p-2 bg-white/90 backdrop-blur-sm"
                  align="start"
                  side="right"
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-theme-primary px-2">Video Chunks</h4>
                    <div className="space-y-1">
                      {getChunks().map((chunk) => (
                        <div
                          key={chunk.number}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-theme-highlight-alpha/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-theme-highlight-alpha/20 flex items-center justify-center text-xs font-medium text-theme-primary">
                              {chunk.number}
                            </div>
                            <div className="text-xs text-theme-secondary">
                              {chunk.start} - {chunk.end}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-theme-primary">
                            {chunk.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </div>

          {/* Favorite/Star Icons */}
          <div className="absolute top-4 right-16 flex space-x-2">
            {favorite && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-theme-highlight-alpha/30 backdrop-blur-sm flex items-center justify-center"
              >
                <Heart className="w-4 h-4 text-white fill-white" />
              </motion.div>
            )}
            {starred && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-theme-accent-alpha/30 backdrop-blur-sm flex items-center justify-center"
              >
                <Star className="w-4 h-4 text-white fill-white" />
              </motion.div>
            )}
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xs font-semibold text-white mb-1">{title}</h3>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center py-1.5 rounded-full backdrop-blur-sm bg-black/20 flex-row gap-2"
            >
              {getStatusIcon()}
              <span className="text-xs font-medium text-white ml-1.5">{getStatusText()}</span>
               {/* Face Detection Badge */}
              <div>
            <div className={`
              px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm
              ${faceExtractionStatus.status === "processing" ? "bg-theme-primary/70 text-white" :
                faceExtractionStatus.status === "complete" ? 
                  faceExtractionStatus.faceCount === 0 ? "bg-yellow-500/70 text-white" : "bg-emerald-500/70 text-white" :
                faceExtractionStatus.status === "failed" ? "bg-red-500/70 text-white" :
                "bg-black/70 text-white"}
            `}>
              {faceExtractionStatus.status === "processing" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : faceExtractionStatus.status === "complete" ? (
                <Users className="w-3 h-3" />
              ) : faceExtractionStatus.status === "failed" ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Users className="w-3 h-3" />
              )}
              <span>{getFaceExtractionText()}</span>
            </div>
              
            </div>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}