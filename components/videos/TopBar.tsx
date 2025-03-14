"use client";

import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  eventId: string;
  eventName: string | null;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isUploadFramesOpen: boolean;
  setIsUploadFramesOpen: (open: boolean) => void;
  selectedCount?: number;
  onDeleteSelected?: () => void;
}

export function TopBar({ 
  eventId, 
  eventName, 
  isUploadOpen, 
  setIsUploadOpen,
  isUploadFramesOpen, 
  setIsUploadFramesOpen,
  selectedCount = 0,
  onDeleteSelected
}: TopBarProps) {


  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-foreground uppercase">
        {selectedCount > 0 
          ? `Selected ${selectedCount} video${selectedCount > 1 ? 's' : ''}` 
          : `Videos from: ${eventName || 'Event Videos'}`}
      </h1>
      <div className="flex items-center gap-3">
        {selectedCount > 0 ? (
          <Button
            variant="destructive"
            onClick={onDeleteSelected}
            className="bg-red-500 hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected ({selectedCount})
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setIsUploadFramesOpen(!isUploadFramesOpen)}
              className="flex items-center gap-2 bg-background text-primary hover:bg-background/90"
            >
              <Upload className="w-4 h-4" />
              Upload Frames
            </Button>

            <Button
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className="flex items-center gap-2 bg-background text-primary hover:bg-background/90"
            >
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
          </>
        )}
      </div>
    </div>
  );
}