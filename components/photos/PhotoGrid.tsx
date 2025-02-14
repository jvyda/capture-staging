"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoCard } from "./PhotoCard";
import { Pagination } from "@/components/shared/Pagination";
import { UploadButton } from "./UploadButton";
import { FilterBar } from "./FilterBar";
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

import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
const client = generateClient<Schema>();

type Photos = Schema['Photos']['type'];
export function PhotoGrid() {
  const params = useParams();
  const isFirstMount = useRef(true);
  const isFirstPhotoFetch = useRef(true);

  const eventId = params?.eventId as string;
  const [userId, setUserId] = useState<string | null>(null);
  // Fetch current user's ID when component mounts
  useEffect(() => {
    if (isFirstMount.current) {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
        console.log(user.userId)
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserId();
    isFirstMount.current = false;
  }
  }, [userId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const photosPerPage = 24;
  const [isLoading, setIsLoading] = useState(true);
  const [photos, setPhotos] = useState<Photos[]>([]);
  const lastUpdateRef = useRef<string>('');

  /**
   * Effect hook to manage photo data fetching and real-time updates
   * Implements AWS best practices for subscription handling and error management
   */
  useEffect(() => {
    if (userId && eventId) {
      setIsLoading(true);
      let isSubscribed = true;
      let syncInProgress = false;

      /**
       * Fetches photos with the current filter criteria
       * @returns Promise<void>
       */
      const fetchPhotos = async () => {
        if (syncInProgress) return;
        
        try {
          syncInProgress = true;
          const { data } = await client.models.Photos.list({
            filter: {
              and: [
                { userId: { eq: userId } },
                { eventId: { eq: eventId } },
                { or: [
                  { isArchived: { eq: false } },
                  { isArchived: { attributeExists: false } }
                ]}
              ]
            },
            limit: 100
          });
          
          if (isSubscribed) {
            const processedPhotos = data.map(processPhotoData);
            setPhotos(processedPhotos);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching photos:', error);
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
            { eventId: { eq: eventId } }
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

          // Filter out archived photos in memory
          const nonArchivedPhotos = items.filter(photo => !photo.isArchived);
          const processedPhotos = nonArchivedPhotos.map(processPhotoData);
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
              fetchPhotos();
              break;
            case 'onDelete':
            case 'onUpdate':
              // For updates and deletes, let the next callback handle it
              // as it will have the latest state
              break;
            default:
              console.error('Unexpected DataStore error:', error);
              fetchPhotos();
          }
        }
      });

      // Initial fetch
      fetchPhotos();

      // Cleanup subscription and prevent memory leaks
      return () => {
        console.log('Cleaning up subscription and resources...');
        isSubscribed = false;
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [userId, eventId]);

  /**
   * Processes raw photo data into the format expected by the UI
   * @param photo Raw photo data from AWS
   * @returns Processed photo data
   */
  const processPhotoData = (photo: any) => ({
    ...photo,
    s3Key: photo.s3Key || '',
    fileName: photo.fileName || '',
    peopleTagged: photo.taggedPeopleCount || 0,
    status: photo.recognitionStatus || 'processing'
  });

  /**
   * Handles archiving of selected photos
   */
  const confirmDelete = async () => {
    try {
      const photosToArchive = Array.from(selectedPhotos);
      console.log(`Archiving ${selectedPhotos.size} photos:`, photosToArchive);

      // Optimistically update UI
      setPhotos(prevPhotos => prevPhotos.filter(photo => !selectedPhotos.has(photo.photoId)));
      setShowDeleteDialog(false);
      setSelectedPhotos(new Set());

      // Update photos in parallel
      await Promise.all(
        photosToArchive.map(async (photoId) => {
          await client.models.Photos.update({
            photoId,
            isArchived: true
          });
        })
      );
      
      console.log('Successfully archived all selected photos');
    } catch (error) {
      console.error('Error archiving photos:', error);
      // Refresh the data in case of error
      const fetchPhotos = async () => {
        const { data } = await client.models.Photos.list({
          filter: {
            and: [
              { userId: { eq: userId ?? undefined } },
              { eventId: { eq: eventId ?? undefined } },
              { or: [
                { isArchived: { eq: false } },
                { isArchived: { attributeExists: false } }
              ]}
            ]
          },
          limit: 100
        });
        setPhotos(data);
      };
      fetchPhotos();
      setShowDeleteDialog(false);
    }
  };

  const totalPages = Math.ceil(photos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const paginatedPhotos = photos.slice(startIndex, startIndex + photosPerPage);

  const handlePhotoSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newSelected = new Set(selectedPhotos);
    if (e.shiftKey && selectedPhotos.size > 0) {
      // Find the last selected photo index
      const lastSelected = Array.from(selectedPhotos)[selectedPhotos.size - 1];
      const lastIndex = paginatedPhotos.findIndex(photo => photo.photoId === lastSelected);
      const currentIndex = paginatedPhotos.findIndex(photo => photo.photoId === id);
      
      // Select all photos between last selected and current
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(paginatedPhotos[i].photoId);
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

  return (
    <>
      <FilterBar 
        title={"Photos"}
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
        selectedCount={selectedPhotos.size}
        onDeleteSelected={handleDeleteSelected}
      />

      {userId && (
        <div className="mb-6">
          <UploadButton 
            isOpen={isUploadOpen} 
            onOpenChange={setIsUploadOpen} 
            userId={userId} 
            eventId={eventId}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
            ))}
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
                  s3Key={photo.s3Key || ''}
                  thumbnail={photo.thumbnail || ''}
                  fileName={photo.fileName || ''}
                  peopleTagged={photo.taggedPeopleCount || 0}
                  status={(photo.recognitionStatus as 'uploaded' | 'processing' | 'processed' | 'failed') || 'processing'}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Selected Photos</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span className="block">
                  Are you sure you want to archive {selectedPhotos.size} selected photo{selectedPhotos.size > 1 ? 's' : ''}?
                </span>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Archived photos will be hidden from the current view</li>
                  <li>• This action can be undone later from the archive section</li>
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
    </>
  );
}