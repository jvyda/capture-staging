"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Clock } from "lucide-react";

interface Person {
  personId: string;
  name: string;
  thumbnail: string;
  appearances: {
    startTime: number;
    endTime: number;
  }[];
  totalScreenTime: number;
}

interface PersonSidebarProps {
  people: Person[];
  selectedPerson: Person | null;
  onPersonClick: (person: Person) => void;
  currentTime: number;
}

export function PersonSidebar({ people, selectedPerson, onPersonClick, currentTime }: PersonSidebarProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const isPersonActive = (person: Person) => {
    return person.appearances.some(
      (appearance) => currentTime >= appearance.startTime && currentTime < appearance.endTime
    );
  };
if (!people.length) return (
  <Card className="h-full bg-background backdrop-blur-sm border-theme-accent-alpha/20">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">
          Detected People
        </h2>
        No people detected
      </div>
    </Card>
);
  return (
    <Card className="h-full bg-background backdrop-blur-sm border-theme-accent-alpha/20">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">
          Detected People
        </h2>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-3 pr-4">
            {people.map((person) => {
              const isActive = isPersonActive(person);
              const isSelected = selectedPerson?.personId === person.personId;

              return (
                <motion.button
                  key={person.personId}
                  className={`
                    w-full p-3 rounded-lg transition-colors
                    ${isSelected 
                      ? "bg-black/50 text-white" 
                      : "hover:bg-theme-highlight-alpha/20"
                    }
                  `}
                  onClick={() => onPersonClick(person)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={person.thumbnail}
                          alt={person.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 border-2 border-theme-accent rounded-full"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-medium ${isSelected ? "text-white" : "text-theme-primary"}`}>
                        {person.name}
                      </h3>
                      <div className={`flex items-center text-xs ${isSelected ? "text-white/80" : "text-theme-secondary"}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Screen time: {formatTime(person.totalScreenTime)}</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}