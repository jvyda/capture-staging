"use client";

import { Card } from "@/components/ui/card";
import { EyeIcon ,Users, AlertCircle, CheckCircle, Loader2, Check, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Schema } from '@/amplify/data/resource';


type PhotoType = Schema['Photos']['type'];
interface PhotoCardProps extends PhotoType {
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}


// type PhotoType = Schema['Photos']['type'];
// interface PhotoCardProps extends PhotoType {
//   s3Key: string;
//   fileName: string;
//   taggedPeopleCount: number;
//   recognitionStatus: "uploaded" | "processing" | "processed" | "failed";
//   photoId: string;
//   thumbnail: string;
//   eventId: string;
//   isSelected?: boolean;
//   onSelect?: (e: React.MouseEvent) => void;
// }
// UI specific props
interface PhotoCardUIProps {
  s3Key: string;
  fileName: string;
  taggedPeopleCount: number;
  recognitionStatus: "uploaded" | "processing" | "processed" | "failed";
  photoId: string;
  thumbnail: string;
  eventId: string;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}

// Combine UI props with optional schema fields
// type PhotoCardProps = Partial<Omit<PhotoType, keyof PhotoCardUIProps>> & PhotoCardUIProps;

export function PhotoCard({
  s3Key,
  fileName,
  taggedPeopleCount,
  recognitionStatus,
  photoId,
  thumbnail,
  isSelected,
  eventId,
  onSelect,
}: PhotoCardProps) {
  const router = useRouter();

  const handleViewPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/events/${eventId}/photos/${photoId}`);
  };

  const getStatusIcon = () => {
    switch (recognitionStatus) {
      case "processing":
        return <Loader2 className="w-4 h-4 text-white animate-spin" />;
      case "processed":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-white" />;
    }
  };

  const getStatusText = () => {
    switch (recognitionStatus) {
      case "processing":
        return "Processing";
      case "processed":
        return "Processed";
      case "failed":
        return "Failed";
      default:
        return "uploaded";
    }
  };

  return (
      <Card 
        className={`
          overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow 
          bg-background backdrop-blur-sm border-theme-accent-alpha/20
          relative
          ${isSelected ? 'ring-2 ring-red-500' : ''}
        `}
        onClick={onSelect}
      >
        <div className="relative aspect-square">
          <Image
            src={`${thumbnail}`||''}
            alt={fileName || ''}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
            quality={75}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Selection Checkbox */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center z-20"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}

          {/* Hover View Button */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity"
            
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileInView={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-sm p-3 rounded-full"
              onClick={handleViewPhoto}
            >
              <EyeIcon className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>

          {/* Top Status Badge */}
          <div className="absolute top-1 left-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`
                flex items-center px-3 py-1.5 rounded-full backdrop-blur-sm
                 ${(taggedPeopleCount ?? 0) > 0 
                  ? 'bg-black/30 text-white' 
                  : 'bg-black/70 text-white/70'
                }
              `}
            >
              <Users className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium">{taggedPeopleCount} Tagged</span>
            </motion.div>
          </div>
          

          {/* Bottom Content */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <h3 className="text-xs font-semibold text-white truncate">{fileName}</h3>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center px-3 py-1.5 rounded-full backdrop-blur-sm bg-black/70"
            >
              {getStatusIcon()}
              <span className="text-xs font-medium text-white ml-1.5">{getStatusText()}</span>
            </motion.div>
          </div>
        </div>
      </Card>
  );
}