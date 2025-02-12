"use client";

import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChunkTimelineProps {
  chunks: {
    id: number;
    startTime: number;
    endTime: number;
    color: string;
  }[];
  currentTime: number;
  duration: number;
  onChunkClick: (startTime: number) => void;
}

export function ChunkTimeline({ chunks, currentTime, duration, onChunkClick }: ChunkTimelineProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative h-2">
      <div className="absolute inset-0 flex">
        {chunks.map((chunk) => {
          const width = ((chunk.endTime - chunk.startTime) / duration) * 100;
          const isActive = currentTime >= chunk.startTime && currentTime < chunk.endTime;

          return (
            <TooltipProvider key={chunk.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className={`h-full ${chunk.color} first:rounded-l-md last:rounded-r-md relative overflow-hidden`}
                    style={{ width: `${width}%` }}
                    whileHover={{ opacity: 0.8 }}
                    onClick={() => onChunkClick(chunk.startTime)}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 "
                        layoutId="activeChunk"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent className="bg-white/20">
                  <p className="text-sm">
                    {formatTime(chunk.startTime)} - {formatTime(chunk.endTime)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Playhead */}
      <motion.div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{
          left: `${(currentTime / duration) * 100}%`,
        }}
        transition={{ type: "spring", bounce: 0 }}
      />
    </div>
  );
}