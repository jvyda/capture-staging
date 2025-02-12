"use client";

import { motion } from "framer-motion";
import { Video, Heart, Star, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  selected: string;
  onSelect: (filter: string) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
}

export function FilterBar({ selected, onSelect, isUploadOpen, setIsUploadOpen }: FilterBarProps) {
  const filters = [
    { id: "all", label: "All Videos", icon: Video },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "starred", label: "Starred", icon: Star },
    { id: "recent", label: "Recent", icon: Clock },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex space-x-4">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selected === filter.id;
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onSelect(filter.id)}
              className={`
                flex items-center px-4 py-2 rounded-full text-sm font-medium
                transition-colors relative
                ${isSelected ? "text-white" : "text-theme-primary hover:bg-theme-highlight-alpha/20"}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="filterBackground"
                  className="absolute inset-0 bg-background rounded-full"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-4 h-4 mr-2 relative z-10 ${isSelected ? "text-white" : ""}`} />
              <span className="relative z-10">{filter.label}</span>
            </motion.button>
          );
        })}
      </div>
      <Button
        onClick={() => setIsUploadOpen(!isUploadOpen)}
        className="flex items-center gap-2 bg-background text-primary hover:bg-background/90"
      >
        <Upload className="w-4 h-4" />
        Upload Video
      </Button>
    </div>
  );
}