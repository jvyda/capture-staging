"use client";

import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PersonTimelineProps {
  person: {
    name: string;
    appearances: {
      startTime: number;
      endTime: number;
    }[];
  };
  currentTime: number;
  duration: number;
  onAppearanceClick: (startTime: number) => void;
}

export function PersonTimeline({ person, currentTime, duration, onAppearanceClick }: PersonTimelineProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-theme-primary">
        Appearances: {person.name}
      </h3>

      <div className="relative h-2 bg-theme-highlight-alpha/10 rounded-md">
        {person.appearances.map((appearance, index) => {
          const left = (appearance.startTime / duration) * 100;
          const width = ((appearance.endTime - appearance.startTime) / duration) * 100;
          const isActive = currentTime >= appearance.startTime && currentTime < appearance.endTime;

          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className="absolute top-0 bottom-0 bg-theme-primary rounded-md"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                    }}
                    whileHover={{ opacity: 0.8 }}
                    onClick={() => onAppearanceClick(appearance.startTime)}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        layoutId="activeAppearance"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {formatTime(appearance.startTime)} - {formatTime(appearance.endTime)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{
            left: `${(currentTime / duration) * 100}%`,
          }}
          transition={{ type: "spring", bounce: 0 }}
        />
      </div>
    </div>
  );
}