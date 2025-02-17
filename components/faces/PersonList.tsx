"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import SimpleBar from 'simplebar-react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { Schema } from '@/amplify/data/resource';

type PersonType = Schema['Persons']['type'] & {
  faces?: Schema['Faces']['type'][];
};
interface Person {
  personId: string;
  personName: string;
  email: string;
  phoneNumber: string;
  thumbnail: string;
  totalFaces: number;
}

interface PersonListProps {
  persons: PersonType[];
  selectedPerson: PersonType | null;
  onPersonSelect: (person: PersonType) => void;
  onPersonEdit: (person: PersonType) => void;
  onFaceDrop: (personId: string) => void;
  searchQuery: string;
  setCurrentPage: (page: number) => void;
  currentPage: number;
  peoplePerPage: number;
  totalPages: number;
}


export function PersonList({
  persons,
  selectedPerson,
  onPersonSelect,
  onPersonEdit,
  onFaceDrop,
  searchQuery,
  setCurrentPage,
  currentPage,
  peoplePerPage,
  totalPages
}: PersonListProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  

  // const totalPages = Math.ceil(filteredPersons.length / peoplePerPage);
  const handleDragOver = (e: React.DragEvent, personId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(personId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, personId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    onFaceDrop(personId);
  };
  console.log(totalPages)

  return (
    <Card className="h-[calc(100vh-16rem)] flex flex-col bg-background backdrop-blur-sm border-theme-accent-alpha/20">
      <SimpleBar className="flex-1 overflow-y-auto h-full">
        <div className="p-4 space-y-2">
          {persons.map((person) => {
            const isActive = selectedPerson?.personId === person.personId;

            return (
              <motion.div
                key={person.personId}
                className={`
                  w-full p-3 rounded-lg transition-colors flex items-center gap-3 group
                  ${isActive 
                    ? "bg-theme-primary text-white" 
                    : dragOverId === person.personId
                      ? "bg-theme-highlight-alpha/20"
                      : "hover:bg-theme-highlight-alpha/10"
                  }
                `}
                onClick={() => onPersonSelect(person)}
                onDragOver={(e) => handleDragOver(e, person.personId)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, person.personId)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={`https://${process.env.NEXT_PUBLIC_FACE_DETECTION_THUMBNAILS_CDN_DOMAIN}/${person.thumbnail}`||''}
                    alt={person.personName|| 'image name'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`text-xs font-medium ${isActive ? "text-white" : "text-theme-primary"}`}>
                    {person.personName}
                  </h3>
                  <p className={`text-xs ${isActive ? "text-white/80" : "text-theme-secondary"}`}>
                    {person.faces.length} faces
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`opacity-0 group-hover:opacity-100 transition-opacity
                    ${isActive 
                      ? "text-white hover:bg-white/20" 
                      : "text-theme-primary hover:bg-theme-highlight-alpha/20"
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPersonEdit(person);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  {totalPages}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </SimpleBar>

      {totalPages > 1 && (
        <div className="p-4 border-t border-theme-accent-alpha/20">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-theme-primary hover:bg-theme-highlight-alpha/20"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-theme-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-theme-primary hover:bg-theme-highlight-alpha/20"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}