"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

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
  onFileSelect: (files: FileList) => void;
}

export function FilterBar({ 
  title,
  selectedCount,
  onDeleteSelected,
  onFileSelect
}: FilterBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
      // Reset input to allow selecting the same file again
      event.target.value = '';
    }
  };

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
          <Button
            onClick={handleFileSelect}
            className="bg-background hover:bg-black/50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      
      {/* Upload Progress Section */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  {file.status === "uploading" && (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {file.status === "processing" && "Processing..."}
                  {file.status === "complete" && "Complete"}
                  {file.status === "error" && "Error"}
                </span>
              </div>
              <Progress value={file.progress} className="h-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}