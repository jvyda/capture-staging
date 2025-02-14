"use client";

import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  title: string;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export function FilterBar({ 
  title,
  isUploadOpen, 
  setIsUploadOpen,
  selectedCount,
  onDeleteSelected 
}: FilterBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
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
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          className="bg-theme-primary hover:bg-theme-primary-alpha/90"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Images
        </Button>
      </div>
    </div>
  );
}