"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoCard } from "@/components/photos/PhotoCard";
import { Pagination } from "@/components/shared/Pagination";
import { FilterBar } from "@/components/photos/FilterBar";
import { toast } from "sonner";


import { Info, Check, Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useParams } from "next/navigation";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

type Photo = Schema["Photos"]["type"];
export default function Photos() {
  
  
  const params = useParams();
  const isFirstMount = useRef(true);
  const isFirstMountUserId = useRef(true);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
  const eventId = params?.eventId as string;
  const [userId, setUserId] = useState<string | null>(null);
  



  const [rekognitionCollectionId, setRekognitionCollectionId] = useState<
    string | null
  >(null);

  // Fetch event data when component mounts
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;

      try {
        const { data: event } = await client.models.Events.get({ eventId });
        if (event) {
          setRekognitionCollectionId(event.rekognitionCollectionId);
          console.log(
            "Event rekognition collection:",
            event.rekognitionCollectionId
          );
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event data");
      }
    };

    fetchEventData();
  }, [eventId]);

  // Fetch current user's ID when component mounts
  useEffect(() => {
    if (isFirstMountUserId.current) {
      const fetchUserId = async () => {
        try {
          const user = await getCurrentUser();
          setUserId(user.userId);
          console.log(user.userId);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUserId();
      isFirstMountUserId.current = false;
    }
  }, [userId]);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const photosPerPage = 64;
  const pageTokensCache = useRef<Map<number, string>>(new Map());
  async function getPhotosCount(userId: string, eventId: string) {
    try {
      let totalCount = 0;
      let nextToken: string | undefined;

      do {
        const { data: photos, nextToken: newNextToken } =
          await client.models.Photos.list({
            filter: {
              and: [{ userId: { eq: userId } }, { eventId: { eq: eventId } }],
            },
            limit: 1000, // Use maximum limit to minimize API calls
            nextToken,
          });

        totalCount += photos?.length || 0;
        nextToken = newNextToken || undefined;
      } while (nextToken);

      return totalCount;
    } catch (error) {
      console.error("Error getting photos count:", error);
      return 0;
    }
  }
  const fetchTotalCount = async (userId: string, eventId: string) => {
    try {
      let totalCount = 0;
      let nextToken: string | undefined;

      do {
        const { data: photos, nextToken: newNextToken } =
          await client.models.Photos.list({
            filter: {
              and: [
                { userId: { eq: userId } },
                { eventId: { eq: eventId } },
                { isArchived: { eq: false } },
              ],
            },
            selectionSet: ["photoId"],
            limit: 1000, // Use maximum limit to minimize API calls
            nextToken,
          });

        totalCount += photos?.length || 0;
        nextToken = newNextToken || undefined;
      } while (nextToken);
      return totalCount;
    } catch (error) {
      console.error("Error getting photos count:", error);
      return 0;
    }
  };
  // Fetch total count of photos
  useEffect(() => {
    if (!eventId) return;
    if (userId) {
      const loadCount = async () => {
        const totalCount = await fetchTotalCount(userId || "", eventId);
        setTotalPhotos(totalCount);
      };

      loadCount();
    }
  }, [eventId, userId]);

  // Fetch photos for current page
  useEffect(() => {
    if (isFirstMount.current) {
    if (userId && eventId) {
      console.log('started')
      setIsLoading(true);
      let isSubscribed = true;
      let syncInProgress = false;

      /**
       * Fetches Frames with the current filter criteria
       * @returns Promise<void>
       */
      const fetchFrames = async () => {
        if (syncInProgress) return;
        
        try {
          const cachedToken = pageTokensCache.current.get(currentPage);
          syncInProgress = true;
          const { data } = await client.models.Photos.list({
            filter: {
              and: [
                { userId: { eq: userId } },
                { eventId: { eq: eventId } },
                { isArchived: { eq: false } },
                
              ]
            },
            limit: photosPerPage,
            nextToken: cachedToken || null,
          });
          
          if (isSubscribed) {
            const processedPhotos = data.map(processPhotosData);
            setPhotos(processedPhotos);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching frames:', error);
          if (isSubscribed) {
            setIsLoading(false);
          }
        } finally {
          syncInProgress = false;
        }
      };

      // Set up real-time subscription with AWS best practices
      const subscription = client.models.Photos.observeQuery({
        filter: {
          and: [
            { userId: { eq: userId } },
            { eventId: { eq: eventId } },
            { isArchived: { eq: false } }
          ]
        }
      }).subscribe({
        next: ({ items, isSynced }) => {
          if (!isSubscribed) return;
          
          console.log('Subscription update:', {
            items: items.length,
            synced: isSynced,
            timestamp: new Date().toISOString()
          });

          // Filter out archived frames in memory
          const nonArchived = items.filter(frame => !frame.isArchived);
          const processedPhotos = nonArchived.map(processPhotosData);
          setPhotos(processedPhotos);
        },
        error: (error: any) => {
          const errorDetails = {
            type: error?.type,
            errors: error?.error?.errors,
            timestamp: new Date().toISOString(),
            items: error?.error?.items
          };
          
          console.log('Subscription event:', errorDetails);

          // Handle sync events
          switch (error?.type) {
            case 'onCreate':
              // Refresh to get the new item
              fetchFrames();
              break;
            case 'onDelete':
              // Refresh to get the new item
              fetchFrames();
            case 'onUpdate':
              // Refresh to get the new item
              fetchFrames();
              // For updates and deletes, let the next callback handle it
              // as it will have the latest state
              break;
            default:
              console.error('Unexpected DataStore error:', error);
              fetchFrames();
          }
        }
      });

      // Initial fetch
      fetchFrames();
      isFirstMount.current = false;
      // Cleanup subscription and prevent memory leaks
      return () => {
        console.log('Cleaning up subscription and resources...');
        isSubscribed = false;
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }
  }, [userId, eventId]);

  /**
   * Processes raw photo data into the format expected by the UI
   * @param photo Raw photo data from AWS
   * @returns Processed photo data
   */
  const processPhotosData = (photo: any) => ({
    ...photo,
    s3Key: photo.s3Key || "",
    fileName: photo.fileName || "",
    peopleTagged: photo.taggedPeopleCount || 0,
    status: photo.recognitionStatus || "processing",
  });

  

  // Pagination controls
  const totalPages = Math.ceil(totalPhotos / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const paginatedPhotos = photos.slice(startIndex, startIndex + photosPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const handlePhotoSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newSelected = new Set(selectedPhotos);
    if (e.shiftKey && selectedPhotos.size > 0) {
      // Find the last selected photo index
      const lastSelected = Array.from(selectedPhotos)[selectedPhotos.size - 1];
      const lastIndex = photos.findIndex(
        (photo) => photo.photoId === lastSelected
      );
      const currentIndex = photos.findIndex((photo) => photo.photoId === id);

      // Select all photos between last selected and current
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);

      for (let i = start; i <= end; i++) {
        newSelected.add(photos[i].photoId);
      }
    } else {
      if (selectedPhotos.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }
    setSelectedPhotos(newSelected);
  };

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const photosToArchive = Array.from(selectedPhotos);

      // Optimistically update UI
      setPhotos((prevPhotos) =>
        prevPhotos.filter((photo) => !selectedPhotos.has(photo.photoId))
      );
      setShowDeleteDialog(false);
      setSelectedPhotos(new Set());

      // Update photos in parallel
      await Promise.all(
        photosToArchive.map(async (photoId) => {
          await client.models.Photos.update({
            photoId,
            isArchived: true,
          });
        })
      );

      console.log("Successfully archived all selected photos");
    } catch (error) {
      console.error("Error archiving photos:", error);
      // Refresh the data in case of error
      const fetchPhotos = async () => {
        const { data } = await client.models.Photos.list({
          filter: {
            and: [
              { userId: { eq: userId ?? undefined } },
              { eventId: { eq: eventId ?? undefined } },
              {
                or: [
                  { isArchived: { eq: false } },
                  { isArchived: { attributeExists: false } },
                ],
              },
            ],
          },
          limit: 100,
        });
        setPhotos(data);
      };
      fetchPhotos();
      setShowDeleteDialog(false);
    }
  };

  const startFaceDetection = async (
    photoId: string,
    s3Key: string,
    bucketName: string
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/sqs/addToPhotoDetectionQueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventId,
          userId: userId,
          sourceType: "Photos",
          photoId: photoId,
          frameId: null,
          videoId: null,
          rekognitionCollectionId: rekognitionCollectionId,
          s3Key: s3Key,
          bucketName: bucketName,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate face detection");
      }

      if (data.messagesSent === 0) {
        toast.info("No unprocessed photos found for face detection", {
          icon: <Info className="h-4 w-4" />,
        });
      } else {
        toast.success(
          `Face detection initiated for ${data.messagesSent} photos`,
          {
            icon: <Check className="h-4 w-4" />,
          }
        );
        // Refresh photos list to show updated status
        // await fetchPhotos();
      }
    } catch (error: any) {
      console.error("Error initiating face detection:", error);
      toast.error(error.message || "Failed to initiate face detection", {
        icon: <Ban className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // File upload handling
  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return "Unsupported file format. Please use JPG, PNG, or WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit.";
    }
    return null;
  };

  const uploadToS3 = async (
    file: File
  ): Promise<{
    url: string;
    key: string;
    thumbnailKey: string;
    compressedImage: { blob: Blob; width: number; height: number };
    uuid: string;
  }> => {
    const fileExtension = file.name.split(".").pop();
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${fileExtension}`;
    // const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const key = `user_${userId}/event_${eventId}/${fileName}`;
    const thumbnailKey = `user_${userId}/event_${eventId}/thumbnails/${fileName}`;
    const bucketName = process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("S3 bucket name is not configured");
    }

    // Compress image and create thumbnail
    const [compressedImage, thumbnail] = await Promise.all([
      compressImage(file, 0.85),
      createThumbnail(file, 300),
    ]);

    // Convert blobs to buffers
    const imageBuffer = Buffer.from(await compressedImage.blob.arrayBuffer());
    const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());

    // Upload both files
    await Promise.all([
      s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: imageBuffer,
          ContentType: "image/jpeg",
        })
      ),
      s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: "image/jpeg",
        })
      ),
    ]);

    return {
      url: `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`,
      key,
      thumbnailKey,
      compressedImage,
      uuid: uuid,
    };
  };

  const handleFileSelect = async (files: FileList) => {
    if (!userId) {
      toast.error("Please sign in to upload photos");
      return;
    }

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      const toastId = `upload-${Date.now()}`;

      try {
        // Show initial processing state
        toast.loading(`Processing ${file.name}`, {
          id: toastId,
        });

        // Upload to S3
        const { url, key, thumbnailKey, compressedImage, uuid } =
          await uploadToS3(file);
        // const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const photoId = uuid;

        // Update toast for database entry
        toast.loading(`Finalizing ${file.name}`, {
          id: toastId,
        });

        // Create database entry according to schema
        const dbEntry = {
          photoId,
          aspectRatio: compressedImage.width / compressedImage.height,
          eventId,
          excludeFromFaceDetection: false,
          facesExtracted: false,
          fileName: file.name,
          filePath: key,
          fileSize: compressedImage.blob.size,
          frameName: file.name,
          imageHeight: compressedImage.height,
          imageWidth: compressedImage.width,
          isArchived: false,
          recognitionCollectionId: null,
          recognitionStatus: "uploaded",
          s3Bucket: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME!,
          s3Key: key,
          taggedFaces: JSON.stringify([]),
          taggedFacesCount: 0,
          taggedPeople: JSON.stringify([]),
          taggedPeopleCount: 0,
          thumbnail: thumbnailKey,
          userId,
        };

        // Create the database entry
        const { data: newPhoto, errors } = await client.models.Photos.create(
          dbEntry
        );

        if (errors) {
          throw new Error("Failed to create database entry");
        }

        // Remove this line since the subscription will handle the update
        // setPhotos(prevPhotos => [dbEntry as Photo, ...prevPhotos]);

        toast.success(`${file.name} uploaded successfully`, {
          id: toastId,
          duration: 2000,
        });

        // Start face detection
        if (autoDetectEnabled) {
          if (
            newPhoto?.photoId &&
            key &&
            process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME
          ) {
            setTimeout(() => {
              startFaceDetection(
                newPhoto.photoId,
                key,
                process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME!
              );
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          {
            id: toastId,
            duration: 4000,
          }
        );
      }
    }
  };
  const handleProcessPhotos = async () => {
    console.log("Processing photos...");
    if (!userId || !eventId) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/sqs/addToPhotosDetectionQueueBulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          eventId,
          rekognitionCollectionId: eventId,
          bucketName: process.env.NEXT_PUBLIC_S3_PHOTOS_BUCKET_NAME,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to process frames");
      }

      // Show success message or update UI as needed
      console.log(
        `Successfully queued ${result.messagesSent} frames for processing`
      );
    } catch (error) {
      console.error("Error processing frames:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <>
      <motion.div
        className="max-w mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FilterBar
          title={`Photos ${totalPhotos}`}
          selectedCount={selectedPhotos.size}
          onDeleteSelected={handleDeleteSelected}
          onFileSelect={handleFileSelect}
          onProcessPhotos={handleProcessPhotos}
          autoDetectEnabled={autoDetectEnabled}
          onAutoDetectChange={setAutoDetectEnabled}
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute top-0 bottom-0 left-0 right-0 h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
            </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {paginatedPhotos.map((photo, index) => (
                <motion.div
                  key={photo.photoId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <PhotoCard
                    s3Key={photo.s3Key || ""}
                    thumbnail={
                      `https://${process.env.NEXT_PUBLIC_PHOTOS_CDN_DOMAIN}/${photo.thumbnail}` ||
                      ""
                    }
                    fileName={photo.fileName || ""}
                    taggedPeopleCount={photo.taggedPeopleCount || 0}
                    recognitionStatus={
                      (photo.recognitionStatus as
                        | "uploaded"
                        | "processing"
                        | "processed"
                        | "failed") || "processing"
                    }
                    isSelected={selectedPhotos.has(photo.photoId)}
                    eventId={eventId}
                    onSelect={(e) => handlePhotoSelect(photo.photoId, e)}
                    photoId={photo.photoId}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <>
          <div className="max-w mx-auto fixed bottom-3 right-5 bg-background p-1 rounded-full">

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          </div>
          
          </>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Selected Photos</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <span className="block">
                    Are you sure you want to archive {selectedPhotos.size}{" "}
                    selected photo{selectedPhotos.size > 1 ? "s" : ""}?
                  </span>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Archived photos will be hidden from the current view
                    </li>
                    <li>
                      • This action can be undone later from the archive section
                    </li>
                    <li>• Original files will be preserved in storage</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Archive Selected
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </>
  );
}
