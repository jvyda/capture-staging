"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import { ManualFrameExtractor } from "./ManualFrameExtractor";

interface ManualFrameUploadButtonProps {
  eventId: string;
  userId: string;
  videoId: string;
}

export function ManualFrameUploadButton({
  eventId,
  userId,
  videoId,
}: ManualFrameUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full flex items-center gap-2 mb-2"
      >
        <Film className="h-4 w-4" />
        {isOpen ? "Hide Frame Upload" : "Upload Frames Manually"}
      </Button>
      
      <ManualFrameExtractor
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        eventId={eventId}
        userId={userId}
        videoId={videoId}
      />
    </div>
  );
} 