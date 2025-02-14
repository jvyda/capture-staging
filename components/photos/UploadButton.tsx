"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SimpleBar from "simplebar-react";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
type Photos = Schema["Photos"]["type"];
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { toast} from "sonner";

// Initialize the Amplify Data client with our schema
const client = generateClient<Schema>();
// AWS S3 Client configuration
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: `https://s3.${process.env.NEXT_PUBLIC_AWS_REGION!}.amazonaws.com`,
  forcePathStyle: true,
});
interface SelectedImage {
  id: string;
  file: File;
  preview: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  
  Id?: string;
}

interface UploadButtonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  userId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export function UploadButton({
  isOpen,
  onOpenChange,
  eventId,
  userId,
}: UploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return "Unsupported file format. Please use JPG, PNG, or WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit.";
    }
    return null;
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
      });
    }

    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /**
   * Compresses an image and returns it as a Blob
   * @param file Original image file
   * @param quality Compression quality (0 to 1)
   * @returns Promise<{ blob: Blob, width: number, height: number }>
   */
  const compressImage = async (file: File, quality: number = 0.85) => {
    return new Promise<{ blob: Blob; width: number; height: number }>(
      async (resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src); // Clean up
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not compress image"));
                return;
              }
              resolve({ blob, width: img.width, height: img.height });
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));

        // Create object URL from file
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      }
    );
  };

  /**
   * Creates a thumbnail maintaining aspect ratio
   * @param file Original image file
   * @param maxDimension Maximum width or height
   * @returns Promise<Blob>
   */
  const createThumbnail = async (file: File, maxDimension: number = 300) => {
    return new Promise<Blob>(async (resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src); // Clean up

        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) {
            height = height * (maxDimension / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = width * (maxDimension / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Enable smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create thumbnail"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));

      // Create object URL from file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Starts the upload process for selected images
   * Handles progress notifications and error states
   */
  const startUpload = async () => {
    const newFiles = selectedImages.map((img) => ({
      id: img.id,
      name: img.file.name,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);
    
    // Process each file with individual promise-based toast
    const uploadPromises = selectedImages.map(async (image) => {
      const toastId = `upload-${image.id}`;
      
      try {
        // Show initial processing state
        toast.loading(`Processing ${image.file.name}`, {
          id: toastId,
        });

        // Compress and create thumbnail
        const [compressedImage, thumbnail] = await Promise.all([
          compressImage(image.file, 0.85),
          createThumbnail(image.file, 300),
        ]);

        // Update toast for upload phase
        toast.loading(`Uploading ${image.file.name}`, {
          id: toastId,
        });

        const fileExtension = image.file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const s3Key = `uploads/${eventId}/${fileName}`;
        const thumbnailKey = `uploads/${eventId}/thumbnails/${fileName}`;

        // Upload to S3
        await Promise.all([
          s3Client.send(new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME,
            Key: s3Key,
            Body: Buffer.from(await compressedImage.blob.arrayBuffer()),
            ContentType: "image/jpeg",
          })),
          s3Client.send(new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME,
            Key: thumbnailKey,
            Body: Buffer.from(await thumbnail.arrayBuffer()),
            ContentType: "image/jpeg",
          }))
        ]);

        // Update toast for database entry
        toast.loading(`Finalizing ${image.file.name}`, {
          id: toastId,
        });

        // Create database entry
        const dbEntry = {
          photoId,
          eventId,
          userId,
          fileName,
          filePath: s3Key,
          s3Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME!,
          s3Key,
          fileSize: compressedImage.blob.size,
          aspectRatio: compressedImage.width / compressedImage.height,
          imageHeight: compressedImage.height,
          imageWidth: compressedImage.width,
          thumbnail: thumbnailKey,
          facesExtracted: false,
          excludeFromFaceDetection: false,
          recognitionStatus: "uploaded",
          recognitionCollectionId: null,
          isArchived: false,
          taggedFaces: JSON.stringify([]),
          taggedFacesCount: 0,
          taggedPeople: JSON.stringify([]),
          taggedPeopleCount: 0,
          videoId: null,
        };

        await client.models.Photos.create(dbEntry);

        // Show success and dismiss after 2 seconds
        toast.success(`Successfully uploaded ${image.file.name}`, {
          id: toastId,
          duration: 2000,
        });

        // Remove from uploading files
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== image.id));
        }, 2000);

      } catch (error) {
        console.error(`Failed to upload ${image.file.name}:`, error);
        toast.error(`Failed to upload ${image.file.name}`, {
          id: toastId,
          duration: 4000,
        });
        throw error;
      }
    });

    // Process all uploads concurrently
    try {
      await Promise.all(uploadPromises);
      setSelectedImages([]);
    } catch (error) {
      console.error("One or more uploads failed:", error);
    }
  };

  /**
   * Handles the upload of an image to AWS S3 and creates a corresponding database entry
   * Process:
   * 1. Extracts image metadata (dimensions, aspect ratio)
   * 2. Uploads the file to S3 with proper path structure
   * 3. Creates a database entry with all required fields
   *
   * @param image - SelectedImage object containing file and preview data
   */
  const uploadToS3 = async (image: SelectedImage) => {
    const file = image.file;
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    try {
      // Compress image and create thumbnail
      const [compressedImage, thumbnail] = await Promise.all([
        compressImage(file, 0.85),
        createThumbnail(file, 300),
      ]);

      const s3Key = `uploads/${eventId}/${fileName}`;
      const thumbnailKey = `uploads/${eventId}/thumbnails/${fileName}`;

      // Upload both files to S3
      await Promise.all([
        s3Client.send(new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME,
          Key: s3Key,
          Body: Buffer.from(await compressedImage.blob.arrayBuffer()),
          ContentType: "image/jpeg",
        })),
        s3Client.send(new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME,
          Key: thumbnailKey,
          Body: Buffer.from(await thumbnail.arrayBuffer()),
          ContentType: "image/jpeg",
        }))
      ]);

      // Create database entry
      const dbEntry = {
        photoId,
        eventId,
        userId,
        fileName,
        filePath: s3Key,
        s3Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME!,
        s3Key,
        fileSize: compressedImage.blob.size,
        aspectRatio: compressedImage.width / compressedImage.height,
        imageHeight: compressedImage.height,
        imageWidth: compressedImage.width,
        thumbnail: thumbnailKey,
        facesExtracted: false,
        excludeFromFaceDetection: false,
        recognitionStatus: "uploaded",
        recognitionCollectionId: null,
        isArchived: false,
        taggedFaces: JSON.stringify([]),
        taggedFacesCount: 0,
        taggedPeople: JSON.stringify([]),
        taggedPeopleCount: 0,
        videoId: null,
      };

      await client.models.Photos.create(dbEntry);

      // Remove from uploading files
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== image.id));
      }, 2000);

    } catch (error) {
      console.error("Upload process failed:", error);
      throw error;
    }
  };

  const removeSelectedImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getStatusColor = (status: UploadingFile["status"]) => {
    switch (status) {
      case "complete":
        return "bg-emerald-500/10 text-emerald-500";
      case "error":
        return "bg-red-500/10 text-red-500";
      case "processing":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-theme-highlight-alpha/20 text-theme-primary";
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="w-full space-y-2"
    >
      <CollapsibleContent>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div
            className={`
              bg-background relative border-2 border-dashed rounded-lg p-4 transition-colors duration-200
              ${
                isDragging
                  ? "border-theme-primary bg-theme-highlight-alpha/10"
                  : "border-theme-accent-alpha/20"
              }
              ${error ? "border-red-500 bg-red-50" : ""}
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
            onDrop={handleDrop}
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
                Choose Files
              </Button>
              <p className="text-sm text-theme-secondary">
                or drag and drop your images here
              </p>
            </div>

            {error && (
              <div className="absolute inset-x-0 bottom-0 p-2 bg-red-100 text-red-600 text-sm flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          {selectedImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-theme-primary">
                  Selected Images ({selectedImages.length})
                </h3>
                <Button
                  size="sm"
                  onClick={startUpload}
                  className="bg-theme-primary hover:bg-theme-primary-alpha/90 text-white"
                >
                  Start Upload
                </Button>
              </div>
              <SimpleBar className="h-48" style={{ maxHeight: 200, overflowY: "scroll" }}>
                <div className="grid grid-cols-12 gap-2 p-1">
                  {selectedImages.map((img) => (
                    <div key={img.id} className="relative group col-span-3">
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeSelectedImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </SimpleBar>
            </div>
          )}

          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-medium text-theme-primary">
                  Upload Progress
                </h3>
                <div className="space-y-2">
                <SimpleBar className="h-48" style={{ maxHeight: 200, overflowY: "scroll" }}>
                  <AnimatePresence>
                    {uploadingFiles.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`
                          bg-background backdrop-blur-sm rounded-lg p-2 flex items-center gap-3
                          ${
                            file.status === "complete"
                              ? "border border-emerald-500"
                              : ""
                          }
                        `}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${getStatusColor(
                            file.status
                          )} flex items-center justify-center flex-shrink-0`}
                        >
                          {file.status === "complete" ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : file.status === "error" ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : file.status === "processing" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-theme-primary truncate">
                              {file.name}
                            </p>
                            {file.status !== "complete" && (
                              <button
                                onClick={() => removeUploadingFile(file.id)}
                                className="p-1 hover:bg-theme-highlight-alpha/20 rounded-full"
                              >
                                <X className="w-3 h-3 text-theme-secondary" />
                              </button>
                            )}
                          </div>
                          {file.status === "uploading" && (
                            <Progress value={file.progress} className="h-1" />
                          )}
                          <p
                            className={`text-xs ${getStatusColor(file.status)}`}
                          >
                            {file.status === "uploading" &&
                              `Uploading... ${Math.round(file.progress)}%`}
                            {file.status === "processing" && "Processing..."}
                            {file.status === "complete" && "Upload complete"}
                            {file.status === "error" && "Upload failed"}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  </SimpleBar>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
