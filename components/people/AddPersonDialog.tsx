"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedImage {
  id: string;
  file: File;
  preview: string;
  status: "processing" | "detected" | "no-face" | "error";
  faces?: { x: number; y: number; width: number; height: number }[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export function AddPersonDialog({ open, onOpenChange }: AddPersonDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return "Unsupported file format. Please use JPG, PNG, or WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5MB limit.";
    }
    return null;
  };

  const simulateFaceDetection = async (image: SelectedImage) => {
    // Simulate face detection process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Randomly decide if faces were detected
    const detected = Math.random() > 0.2;
    if (detected) {
      return {
        ...image,
        status: "detected" as const,
        faces: [{ x: 20, y: 20, width: 100, height: 100 }],
      };
    } else {
      return {
        ...image,
        status: "no-face" as const,
      };
    }
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const newImages: SelectedImage[] = [];

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        status: "processing",
      });
    }

    setSelectedImages(prev => [...prev, ...newImages]);

    // Process each image
    setIsProcessing(true);
    for (let i = 0; i < newImages.length; i++) {
      const processedImage = await simulateFaceDetection(newImages[i]);
      setSelectedImages(prev => 
        prev.map(img => 
          img.id === processedImage.id ? processedImage : img
        )
      );
      setProgress((i + 1) / newImages.length * 100);
    }
    setIsProcessing(false);
    setProgress(0);
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async () => {
    // Handle form submission
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-theme-primary">
            Add New Person
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Training Photos</Label>
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-4 transition-colors duration-200
                  ${isDragging ? 'border-theme-primary bg-theme-highlight-alpha/10' : 'border-theme-accent-alpha/20'}
                  ${error ? 'border-red-500 bg-red-50' : ''}
                `}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept={SUPPORTED_FORMATS.join(",")}
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                <div className="flex flex-col items-center py-4">
                  <div className="w-12 h-12 rounded-full bg-theme-highlight-alpha/20 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6 text-theme-primary" />
                  </div>
                  <Button
                    className="mb-2 bg-theme-primary text-white hover:bg-theme-primary-alpha/90"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Photos
                  </Button>
                  <p className="text-sm text-theme-secondary">
                    or drag and drop photos here
                  </p>
                </div>

                {error && (
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-red-100 text-red-600 text-sm flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-theme-secondary">Processing images...</span>
                    <span className="text-theme-primary font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              )}

              {selectedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="relative aspect-square">
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {image.status === "processing" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        {image.status === "no-face" && (
                          <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center rounded-lg">
                            <AlertCircle className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {image.faces && image.faces.map((face, index) => (
                          <div
                            key={index}
                            className="absolute border-2 border-green-500"
                            style={{
                              left: `${face.x}%`,
                              top: `${face.y}%`,
                              width: `${face.width}%`,
                              height: `${face.height}%`,
                            }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-theme-primary hover:bg-theme-primary-alpha/90"
                disabled={isProcessing || selectedImages.length === 0}
              >
                Add Person
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}