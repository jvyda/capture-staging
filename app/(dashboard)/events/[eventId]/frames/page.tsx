"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoCard } from "@/components/photos/PhotoCard";
import { Pagination } from "@/components/shared/Pagination";
import { UploadButton } from "@/components/photos/UploadButton";
import { FilterBar } from "@/components/photos/FilterBar";
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

type Frames = Schema['Frames']['type'];
export default function Frames() {
  const params = useParams();
  const isFirstMount = useRef(true);

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
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const framesPerPage = 24;
  const [isLoading, setIsLoading] = useState(true);
  const [frames, setFrames] = useState<Frames[]>([]);
  const lastUpdateRef = useRef<string>('');

  /**
   * Effect hook to manage Frame data fetching and real-time updates
   * Implements AWS best practices for subscription handling and error management
   */
  useEffect(() => {
    if (userId && eventId) {
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
          syncInProgress = true;
          const { data } = await client.models.Frames.list({
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
            const processedFrames = data.map(processFramesData);
            setFrames(processedFrames);
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
      const subscription = client.models.Frames.observeQuery({
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

          // Filter out archived frames in memory
          const nonArchivedFrames = items.filter(frame => !frame.isArchived);
          const processedFrames = nonArchivedFrames.map(processFramesData);
          setFrames(processedFrames);
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
            case 'onUpdate':
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
   * Processes raw frame data into the format expected by the UI
   * @param frame Raw frame data from AWS
   * @returns Processed frame data
   */
  const processFramesData = (frame: any) => ({
    ...frame,
    s3Key: frame.s3Key || '',
    fileName: frame.fileName || '',
    peopleTagged: frame.taggedPeopleCount || 0,
    status: frame.recognitionStatus || 'processing'
  });

  /**
   * Handles archiving of selected frames
   */
  const confirmDelete = async () => {
    try {
      const framesToArchive = Array.from(selectedFrames);
      console.log(`Archiving ${selectedFrames.size} frames:`, framesToArchive);

      // Optimistically update UI
      setFrames(prevFrames => prevFrames.filter(frame => !selectedFrames.has(frame.frameId)));
      setShowDeleteDialog(false);
      setSelectedFrames(new Set());

      // Update frames in parallel
      await Promise.all(
        framesToArchive.map(async (frameId) => {
          await client.models.Frames.update({
            frameId,
            isArchived: true
          });
        })
      );
      
      console.log('Successfully archived all selected frames');
    } catch (error) {
      console.error('Error archiving frames:', error);
      // Refresh the data in case of error
      const fetchFrames = async () => {
        const { data } = await client.models.Frames.list({
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
        setFrames(data);
      };
      fetchFrames();
      setShowDeleteDialog(false);
    }
  };

  const totalPages = Math.ceil(frames.length / framesPerPage);
  const startIndex = (currentPage - 1) * framesPerPage;
  const paginatedFrames = frames.slice(startIndex, startIndex + framesPerPage);

  const handleFrameSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newSelected = new Set(selectedFrames);
    if (e.shiftKey && selectedFrames.size > 0) {
      // Find the last selected frame index
      const lastSelected = Array.from(selectedFrames)[selectedFrames.size - 1];
      const lastIndex = paginatedFrames.findIndex(frame => frame.frameId === lastSelected);
      const currentIndex = paginatedFrames.findIndex(frame => frame.frameId === id);
      
      // Select all frames between last selected and current
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(paginatedFrames[i].frameId);
      }
    } else {
      if (selectedFrames.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }
    setSelectedFrames(newSelected);
  };

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
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
        title={"Frames"}
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
        selectedCount={selectedFrames.size}
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
            {paginatedFrames.map((frame, index) => (
              <motion.div
                key={frame.frameId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <PhotoCard 
                  s3Key={frame.s3Key || ''}
                  thumbnail={`https://${process.env.NEXT_PUBLIC_VIDEOS_CDN_DOMAIN}/${frame.thumbnail}`||''}
                  // thumbnail={frame.thumbnail || ''}
                  fileName={frame.fileName || ''}
                  peopleTagged={frame.taggedPeopleCount || 0}
                  status={(frame.recognitionStatus as 'uploaded' | 'processing' | 'processed' | 'failed') || 'processing'}
                  isSelected={selectedFrames.has(frame.frameId)}
                  eventId={eventId}
                  onSelect={(e) => handleFrameSelect(frame.frameId, e)}
                  photoId={frame.frameId}
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
            <AlertDialogTitle>Archive Selected Frames</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span className="block">
                  Are you sure you want to archive {selectedFrames.size} selected frame{selectedFrames.size > 1 ? 's' : ''}?
                </span>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Archived frames will be hidden from the current view</li>
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
      </motion.div>
    </>
  );
}