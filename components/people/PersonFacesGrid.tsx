"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Trash2, Crown } from "lucide-react";
import SimpleBar from 'simplebar-react';
import Image from "next/image";

interface PersonFacesGridProps {
  personId: string;
}

export function PersonFacesGrid({ personId }: PersonFacesGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [selectedFaces, setSelectedFaces] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Mock data - replace with API calls
  const faces = [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&q=80",
      confidence: 0.98,
      isPrimary: true,
      detectedAt: "2024-03-15T10:30:00Z",
      source: {
        type: "photo" as const,
        id: "photo1",
        title: "Company Event",
      },
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&q=80",
      confidence: 0.85,
      isPrimary: false,
      detectedAt: "2024-03-14T15:45:00Z",
      source: {
        type: "video" as const,
        id: "video1",
        title: "Team Meeting",
        timestamp: 145,
      },
    },
  ];

  const handleFaceSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newSelected = new Set(selectedFaces);
    if (selectedFaces.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFaces(newSelected);
  };

  const handleDeleteSelected = async () => {
    // Make API call to delete faces
    setSelectedFaces(new Set());
    setShowDeleteDialog(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search faces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-theme-highlight-alpha/10" : ""}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {selectedFaces.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected ({selectedFaces.size})
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confidence Threshold</span>
              <span className="text-sm text-theme-secondary">
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
            <Slider
              value={[confidenceThreshold]}
              onValueChange={([value]) => setConfidenceThreshold(value)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>
        </Card>
      )}

      <SimpleBar style={{ maxHeight: "calc(100vh - 24rem)" }}>
        <div className="grid grid-cols-6 gap-4">
          {faces
            .filter(face => face.confidence >= confidenceThreshold)
            .map((face) => (
              <motion.div
                key={face.id}
                className={`
                  relative aspect-square rounded-lg overflow-hidden cursor-pointer group
                  ${selectedFaces.has(face.id) ? "ring-2 ring-red-500" : ""}
                `}
                whileHover={{ scale: 1.05 }}
                onClick={(e) => handleFaceSelect(face.id, e)}
              >
                <Image
                  src={face.url}
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {face.isPrimary && (
                  <div className="absolute top-2 right-2 bg-theme-primary text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Primary
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-xs text-white font-medium bg-black/50 px-2 py-1 rounded-full text-center">
                    {Math.round(face.confidence * 100)}% Confidence
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </SimpleBar>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Faces</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFaces.size} selected face{selectedFaces.size > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}