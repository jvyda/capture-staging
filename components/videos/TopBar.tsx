"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  eventId: string;
  eventName: string | null;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isUploadFramesOpen: boolean;
  setIsUploadFramesOpen: (open: boolean) => void;
}

export function TopBar({ eventId, eventName, isUploadOpen, setIsUploadOpen,isUploadFramesOpen, setIsUploadFramesOpen }: TopBarProps) {


  return (
    <div className="flex items-center justify-between  mb-6">
      <h1 className="text-2xl font-semibold text-foreground uppercase">
        Videos from:{eventName || 'Event Videos'}
      </h1>
      <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
}