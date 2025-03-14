"use client";

import { Card } from "@/components/ui/card";
import { Heart, Star, Clock, MapPin, Users, Layers, AlertCircle, Loader2, Play, CheckCircle, Edit2, Check } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Schema } from '@/amplify/data/resource';
// type VideoCardProps = Schema['Videos']['type'];
type PhotoCardProps = Schema['Photos']['type'];

type VideoType = Schema['Videos']['type'];
interface VideoCardProps extends VideoType {
  isSelected?: boolean;
  onSelect?: (id: string, e: React.MouseEvent) => void;
}


export function VideoCard({
  videoId,
  eventId,
  fileName,
  thumbnail,
  duration,
  taggedPeople,
  recognitionStatus,
  chunksCount,
  isSelected,
  onSelect,
}: VideoCardProps) {
  const router = useRouter();



  const formatSeconds =(seconds: number)=> {
    // Ensure the input is a valid number
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '00:00';
    }
  
    // Convert seconds to minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
  
    // Pad minutes and seconds with leading zeros if necessary
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
    // Return the formatted time as MM:SS
    return `${formattedMinutes}:${formattedSeconds}`;
  }




  



  const getStatusIcon = () => {
    switch (recognitionStatus) {
      case "processing":
        return <Loader2 className="w-4 h-4 text-white animate-spin" />;
      case "complete":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Loader2 className="w-4 h-4 text-white" />;
    }
  };

  const getStatusText = () => {
    switch (recognitionStatus) {
      case "processing":
        return "Processing";
      case "complete":
        return "Ready";
      case "failed":
        return "Failed";
      default:
        return "Waiting";
    }
  };

  const getFaceExtractionText = () => {
    switch (recognitionStatus) {
      case "processing":
        return "Extracting faces...";
      case "complete":
        return taggedPeople === 0 
          ? "No faces detected" 
          : `${taggedPeople}`;
      case "failed":
        return "Failed to extract faces";
      default:
        return "unprocessed";
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/events/${eventId}/videos/${videoId}`);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(videoId, e);
    } else {
      router.push(`/events/${eventId}/videos/${videoId}`);
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }} 
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
    >
      <Card className={`overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow bg-background backdrop-blur-sm ${isSelected ? "ring-2 ring-theme-primary" : "border-theme-accent-alpha/20 border-0"}`}>
        <div className="relative aspect-square">
          <Image
            src={`https://${process.env.NEXT_PUBLIC_VIDEOS_CDN_DOMAIN}/${thumbnail}`||'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'}
            alt={fileName || 'Video thumbnail'}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isSelected ? "opacity-80" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Selection Indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 z-10 bg-theme-primary rounded-full p-1">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div 
              className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEditClick}
            >
              <Play className="w-8 h-8 text-theme-primary ml-1" />
            </motion.div>
          </div>

          

          {/* Top Status Badges */}
          <div className="absolute top-4 left-4 flex flex-row gap-2">
            {/* Duration Badge */}
            <div className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{formatSeconds(duration?duration:0)}</span>
            </div>

           

            {/* Chunks Badge */}
           
                <button className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black/80 transition-colors">
                  <Layers className="w-3 h-3" />
                  <span>{chunksCount && chunksCount > 1 ? chunksCount : "Original"}</span>
                </button>
              
          </div>


          {/* Bottom Content */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xs font-semibold text-white mb-1">{fileName}</h3>
            
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
              ${recognitionStatus === "processing" ? "bg-theme-primary/70 text-white" :
                recognitionStatus === "complete" ? 
                  taggedPeople === 0 ? "bg-yellow-500/70 text-white" : "bg-emerald-500/70 text-white" :
                recognitionStatus === "failed" ? "bg-red-500/70 text-white" :
                "bg-black/70 text-white"}
            `}>
              {recognitionStatus === "processing" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : recognitionStatus === "complete" ? (
                <Users className="w-3 h-3" />
              ) : recognitionStatus === "failed" ? (
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