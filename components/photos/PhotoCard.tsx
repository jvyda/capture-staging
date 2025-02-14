"use client";

import { Card } from "@/components/ui/card";
import { Users, AlertCircle, CheckCircle, Loader2, Check, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface PhotoCardProps {
  s3Key: string;
  fileName: string;
  peopleTagged: number;
  status: "processing" | "processed" | "failed";
  isSelected?: boolean;
  thumbnail:string;
  onSelect?: (e: React.MouseEvent) => void;
}

export function PhotoCard({
  s3Key,
  fileName,
  peopleTagged,
  status,
  isSelected,
  thumbnail,
  onSelect,
}: PhotoCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-4 h-4 text-white animate-spin" />;
      case "processed":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-white animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "processing":
        return "Processing";
      case "processed":
        return "Ready";
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
            src={`https://${process.env.NEXT_PUBLIC_PHOTOS_CDN_DOMAIN}/${thumbnail}`||''}
            alt={fileName || ''}
            fill
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

          {/* Top Status Badge */}
          <div className="absolute top-4 left-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`
                flex items-center px-3 py-1.5 rounded-full backdrop-blur-sm
                ${peopleTagged > 0 
                  ? 'bg-theme-accent-alpha/30 text-white' 
                  : 'bg-black/70 text-white/70'
                }
              `}
            >
              <Users className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium">{peopleTagged} Tagged</span>
            </motion.div>
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <h3 className="text-xs font-semibold text-white">{fileName}</h3>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center py-1.5 rounded-full backdrop-blur-sm bg-black/20"
            >
              {getStatusIcon()}
              <span className="text-xs font-medium text-white ml-1.5">{getStatusText()}</span>
            </motion.div>
          </div>
        </div>
      </Card>
  );
}