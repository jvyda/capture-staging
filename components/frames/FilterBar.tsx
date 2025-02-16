"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// Types for upload tracking
interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

interface FilterBarProps {
  title: string;
  selectedCount: number;
  onDeleteSelected: () => void;
  onProcessFrames: () => void;
}

export function FilterBar({ 
  title,
  selectedCount,
  onDeleteSelected,
  onProcessFrames
}: FilterBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

 

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between  mb-8">
        <h1 className="text-2xl font-bold text-theme-primary">{title}</h1>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              onClick={onDeleteSelected}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedCount})
            </Button>
          )}
         
          
          <Button onClick={onProcessFrames}
          className="bg-background hover:bg-black/50">Process Frames</Button>
          
        </div>
      </div>
      

    </div>
  );
}