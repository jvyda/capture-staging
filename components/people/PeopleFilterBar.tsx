"use client";

import { motion } from "framer-motion";
import { Users, Camera, Video, Clock, SortAsc } from "lucide-react";

interface PeopleFilterBarProps {
  selected: string;
  onSelect: (filter: string) => void;
}

export function PeopleFilterBar({ selected, onSelect }: PeopleFilterBarProps) {
  const filters = [
    { id: "all", label: "All People", icon: Users },
    { id: "in-photos", label: "In Photos", icon: Camera },
    { id: "in-videos", label: "In Videos", icon: Video },
    { id: "recent", label: "Recently Added", icon: Clock },
    { id: "alphabetical", label: "A-Z", icon: SortAsc },
  ];

  return (
    <div className="flex space-x-4 mb-6">
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
              ${isSelected 
                ? "text-white" 
                : "text-theme-primary hover:bg-theme-highlight-alpha/20"
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSelected && (
              <motion.div
                layoutId="filterBackground"
                className="absolute inset-0 bg-theme-primary rounded-full"
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
  );
}