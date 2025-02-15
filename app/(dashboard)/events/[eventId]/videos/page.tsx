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
const client = generateClient<Schema>();
type VideoCardProps = Schema['Videos']['type'];

export default function Videos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploadFramesOpen, setIsUploadFramesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videosPerPage = 30;
  const params = useParams();
  const eventId = params?.eventId as string;
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const isFirstMount = useRef(true);
  const isFirstEventFetch = useRef(true);
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
  }, []);

  // Fetch event details when eventId changes
  useEffect(() => {
    if (!eventId) return;
    if (isFirstEventFetch.current) {
    const fetchEventDetails = async () => {
      try {
        const { data: event } = await client.models.Events.get({
          eventId: eventId
        });
        if (event) {
          console.log(event)
          setEventName(event.eventName || "");
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    };

    fetchEventDetails();
    isFirstEventFetch.current = false;
  }
   
  }, [eventId]);

  

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    const sub = client.models.Videos.observeQuery({
      filter: {
        userId: {
          eq: userId
        },
        eventId: {
          eq: eventId
        }
      }
    }).subscribe({
      next: ({ items, isSynced }) => {
        setVideos([...items]);
        if (isSynced) { // Only set loading to false when sync is complete
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        setIsLoading(false); // Set loading to false on error
      }
    });
    return () => sub.unsubscribe();
  }, [userId]);
  if (!videos) {
    return <LoadingSpinner />;
  }
  if (!videos.length && !isLoading) {
    return <div>No videos found</div>;
  }
  

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
      />

      <div className="mb-6">
        <VideoUploadButton isOpen={isUploadOpen} onOpenChange={handleVideoUploadBox} />
        <FramesUploadButton isOpen={isUploadFramesOpen} onOpenChange={handleFramesUploadBox} />
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
              <VideoCard {...video} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </motion.div>
    </>
  );
}