"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Video, Mail, Phone, MoreVertical, AlertCircle } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Schema } from '@/amplify/data/resource';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PersonCardProps {
  eventId: string;
  userId: string;
  personId: string;
  personName: string;
  email: string;
  phoneNumber: string;
  thumbnail: string;
  faces?: Schema['Faces']['type'][];
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
  onView: (personId: string) => void;
}

export function PersonCard({
  eventId,
  userId,
  faces,
  personId,
  personName,
  email,
  phoneNumber,
  thumbnail,
  onEdit,
  onDelete,
  onView,
}: PersonCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/events/${eventId}/persons/${personId}`);
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card 
        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20"
        onClick={handleClick}
      >
        <div className="relative aspect-square">
          <Image
            src={thumbnail}
            alt={personName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Stats Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xs font-semibold text-white mb-1">{personName}</h3>
            <div className="flex items-center space-x-3 w-full">
              <div className="flex items-center space-x-3 justify-between">
                <div className="flex items-center text-xs text-white/90">
                  <Camera className="w-4 h-4 mr-1.5" />
                  <span>{faces?.length || 0}</span>
                </div>
                <div className="flex items-center text-xs text-white/90">
                  <Video className="w-4 h-4 mr-1.5" />
                  <span>{}</span>
                </div>
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:bg-theme-highlight-alpha/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4 text-theme-secondary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onView(personId);
                    }}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(personId);
                    }}>
                      Edit Person
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(personId);
                      }}
                      className="text-red-600"
                    >
                      Delete Person
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}