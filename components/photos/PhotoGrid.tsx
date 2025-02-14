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

interface PhotoGridProps {
  search: string;
  title?: string;
}

import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
const client = generateClient<Schema>();

type Photos = Schema['Photos']['type'];
export function PhotoGrid({ search, title = "Photos" }: PhotoGridProps) {
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

  useEffect(() => {
    if (!userId || !eventId) return;

    let isSubscribed = true;
    setIsLoading(true);

    const fetchPhotos = async () => {
      try {
        // Set up subscription first
        const subscription = client.models.Photos.observeQuery({
          filter: {
            userId: { eq: userId },
            eventId: { eq: eventId }
          }
        }).subscribe({
          next: ({ items }) => {
            if (!isSubscribed) return;
            
            // Create a hash of the current items to check for real changes
            const updateHash = JSON.stringify(items.map(p => p.photoId).sort());
            
            if (updateHash !== lastUpdateRef.current) {
              console.log('Real update detected:', {
                count: items.length,
                photoIds: items.map(p => p.photoId)
              });

              // Process items to match PhotoCard props
              const processedPhotos = items.map(photo => ({
                ...photo,
                s3Key: photo.s3Key || '',
                fileName: photo.fileName || '',
                peopleTagged: photo.taggedPeopleCount || 0,
                status: photo.recognitionStatus ? 'processed' as const : 'processing' as const
              }));

              setPhotos(processedPhotos);
              lastUpdateRef.current = updateHash;
            }
            
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Subscription error:', error);
            setIsLoading(false);
          }
        });

        return () => {
          console.log('Unsubscribing from photos subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error in photo fetch:', error);
        if (isSubscribed) {
          setPhotos([]);
          setIsLoading(false);
        }
      }
    };

    const cleanup = fetchPhotos();
    return () => {
      console.log('Cleaning up photo subscription');
      isSubscribed = false;
      if (cleanup) cleanup();
    };
  }, [userId, eventId]);

  const filteredPhotos = useMemo(() => 
    photos.filter(photo => {
      if (!search) return true;
      return photo.fileName.toLowerCase().includes(search.toLowerCase());
    }),
    [photos, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const paginatedPhotos = filteredPhotos.slice(startIndex, startIndex + photosPerPage);

  const handlePhotoSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newSelected = new Set(selectedPhotos);
    if (e.shiftKey && selectedPhotos.size > 0) {
      // Find the last selected photo index
      const lastSelected = Array.from(selectedPhotos)[selectedPhotos.size - 1];
      const lastIndex = paginatedPhotos.findIndex(photo => photo.id === lastSelected);
      const currentIndex = paginatedPhotos.findIndex(photo => photo.id === id);
      
      // Select all photos between last selected and current
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(paginatedPhotos[i].id);
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

  const confirmDelete = () => {
    // Here you would make an API call to delete the selected photos
    console.log("Deleting photos:", Array.from(selectedPhotos));
    setSelectedPhotos(new Set());
    setShowDeleteDialog(false);
  };

  return (
    <>
      <FilterBar 
        title={title}
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
                  status={photo.recognitionStatus ? 'processed' : 'processing'}
                  isSelected={selectedPhotos.has(photo.photoId)}
                  onSelect={(e) => handlePhotoSelect(photo.photoId, e)}
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
            <AlertDialogTitle>Delete Selected Photos</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPhotos.size} selected photo{selectedPhotos.size > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}