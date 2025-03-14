"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCard } from "@/components/videos/VideoCard";
import { Pagination } from "@/components/shared/Pagination";
import { VideoUploadButton } from "@/components/videos/VideoUploadButton";
import { TopBar } from "@/components/videos/TopBar";
import { generateClient } from 'aws-amplify/data';
import { useParams } from 'next/navigation';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '@/amplify/data/resource';
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { FramesUploadButton } from "@/components/videos/FramesUploadButton";
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
import { toast } from "sonner";

const client = generateClient<Schema>();
type VideoCardProps = Schema['Videos']['type'];

export default function Videos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploadFramesOpen, setIsUploadFramesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const videosPerPage = 30;
  const params = useParams();
  const eventId = params?.eventId as string;
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);

  // Fetch current user's ID when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        if (isMounted) {
          setUserId(user.userId);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUserId();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch event details when eventId changes
  useEffect(() => {
    if (!eventId) return;
    
    let isMounted = true;
    const fetchEventDetails = async () => {
      try {
        const { data: event } = await client.models.Events.get({
          eventId: eventId
        });
        if (isMounted && event) {
          setEventName(event.eventName || "");
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    };

    fetchEventDetails();
    
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    
    let isSubscribed = true;
    
    // Use a simpler approach - first fetch videos directly
    const fetchVideos = async () => {
      try {
        const { data } = await client.models.Videos.list({
          filter: {
            userId: { eq: userId },
            eventId: { eq: eventId },
            isArchived: { ne: true }
          }
        });
        
        if (isSubscribed) {
          setVideos(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };
    
    // Initial fetch
    fetchVideos();
    
    // Then set up a subscription for real-time updates
    const sub = client.models.Videos.observeQuery({
      filter: {
        userId: { eq: userId },
        eventId: { eq: eventId }
      }
    }).subscribe({
      next: ({ items, isSynced }) => {
        if (isSubscribed) {
          // Filter out archived videos on the client side
          const filteredItems = items.filter(video => video.isArchived !== true);
          setVideos(filteredItems);
          if (isSynced) {
            setIsLoading(false);
          }
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
        // Don't update state if component is unmounted
        if (isSubscribed) {
          // If subscription fails, we already have data from the initial fetch
          // so we don't need to do anything here
        }
      }
    });
    
    // Cleanup function
    return () => {
      isSubscribed = false;
      sub.unsubscribe();
    };
  }, [userId, eventId]);

  // Clear selection when eventId changes
  useEffect(() => {
    setSelectedVideos(new Set());
  }, [eventId]);

  if (!videos) {
    return <LoadingSpinner />;
  }
//   if (!videos.length && !isLoading) {
//     return <div>No videos found</div>;
//   }
  

  const totalPages = Math.ceil(videos.length / videosPerPage);
  const startIndex = (currentPage - 1) * videosPerPage;
  const paginatedVideos = videos.slice(startIndex, startIndex + videosPerPage);
  const handleFramesUploadBox= ()=>{
    setIsUploadOpen(false)
    setIsUploadFramesOpen(!isUploadFramesOpen)
  }
  const handleVideoUploadBox= ()=>{
    setIsUploadFramesOpen(false)
    setIsUploadOpen(!isUploadOpen)
  }

  const handleVideoSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newSelected = new Set(selectedVideos);
    if (e.shiftKey && selectedVideos.size > 0) {
      // Find the last selected video index
      const lastSelected = Array.from(selectedVideos)[selectedVideos.size - 1];
      const lastIndex = videos.findIndex(
        (video) => video.videoId === lastSelected
      );
      const currentIndex = videos.findIndex((video) => video.videoId === id);

      // Select all videos between last selected and current
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);

      for (let i = start; i <= end; i++) {
        newSelected.add(videos[i].videoId);
      }
    } else {
      if (selectedVideos.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }
    setSelectedVideos(newSelected);
  };

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const videosToArchive = Array.from(selectedVideos);
      
      if (videosToArchive.length === 0) {
        setShowDeleteDialog(false);
        return;
      }

      // Optimistically update UI
      setVideos((prevVideos) =>
        prevVideos.filter((video) => !selectedVideos.has(video.videoId))
      );
      setShowDeleteDialog(false);
      setSelectedVideos(new Set());

      // Update videos in parallel with better error handling
      const results = await Promise.allSettled(
        videosToArchive.map(async (videoId) => {
          return client.models.Videos.update({
            videoId,
            isArchived: true,
          });
        })
      );
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        console.error(`Failed to archive ${failures.length} videos`);
        toast.error(`Failed to archive ${failures.length} videos. Some videos may need to be archived again.`);
        
        // Refresh the data to ensure UI is in sync
        if (userId) {
          const { data } = await client.models.Videos.list({
            filter: {
              userId: { eq: userId },
              eventId: { eq: eventId },
              isArchived: { ne: true }
            }
          });
          setVideos(data);
        }
      } else {
        toast.success(`Successfully archived ${videosToArchive.length} videos`);
      }
    } catch (error) {
      console.error("Error archiving videos:", error);
      toast.error("Failed to archive videos. Please try again.");
      
      // Refresh the data in case of error
      if (userId) {
        try {
          const { data } = await client.models.Videos.list({
            filter: {
              userId: { eq: userId },
              eventId: { eq: eventId },
              isArchived: { ne: true }
            }
          });
          setVideos(data);
        } catch (listError) {
          console.error("Error refreshing videos after archive failure:", listError);
        }
      }
      setShowDeleteDialog(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedVideos(new Set()); // Clear selection when changing pages
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TopBar
        eventId={eventId}
        eventName={eventName}
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
        isUploadFramesOpen={isUploadFramesOpen}
        setIsUploadFramesOpen={setIsUploadFramesOpen}
        selectedCount={selectedVideos.size}
        onDeleteSelected={handleDeleteSelected}
      />

      <div className="mb-6">
        {userId && (
          <>
            <VideoUploadButton userId={userId} eventId={eventId} isOpen={isUploadOpen} onOpenChange={handleVideoUploadBox} />
            <FramesUploadButton isOpen={isUploadFramesOpen} onOpenChange={handleFramesUploadBox} />
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={`${eventId}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {paginatedVideos.map((video, index) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <VideoCard 
                {...video} 
                isSelected={selectedVideos.has(video.videoId)}
                onSelect={handleVideoSelect}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Selected Videos</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span className="block">
                  Are you sure you want to archive {selectedVideos.size}{" "}
                  selected video{selectedVideos.size > 1 ? "s" : ""}?
                </span>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Archived videos will be hidden from the current view
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