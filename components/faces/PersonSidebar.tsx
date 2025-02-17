"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import SimpleBar from 'simplebar-react';
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
  // ... existing functions

  return (
    <Card className="h-full bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">
          Detected People
        </h2>
        <SimpleBar className="h-[calc(100vh-12rem)]">
          <div className="space-y-3 pr-4">
            {/* ... existing people list */}
          </div>
        </SimpleBar>
      </div>
    </Card>
  );
}