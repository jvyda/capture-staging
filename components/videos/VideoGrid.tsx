"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCard } from "./VideoCard";
import { Pagination } from "@/components/shared/Pagination";
import { VideoUploadButton } from "./VideoUploadButton";
import { FilterBar } from "./FilterBar";
import { generateClient } from 'aws-amplify/data';
import { useParams } from 'next/navigation';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '@/amplify/data/resource';
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
const client = generateClient<Schema>();
type VideoCardProps = Schema['Videos']['type'];


interface VideoGridProps {
  filter: string;
  search: string;
  onFilterChange: (filter: string) => void;
}

export function VideoGrid({ filter, search, onFilterChange }: VideoGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const videosPerPage = 30;
  const params = useParams();
  const eventId = params?.eventId as string;
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user's ID when component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (!userId) return;
    const sub = client.models.Events.observeQuery({
      filter: {
        userId: {
          eq: userId
        }
      }
    }).subscribe({
      next: ({ items, isSynced }) => {
        setVideos([...items]);
      },
      error: (error) => {
        console.error('Error fetching events:', error);
      }
    });
    return () => sub.unsubscribe();
  }, [userId]);
  
  if (!videos.length) {
    return <LoadingSpinner />;
  }

  const totalPages = Math.ceil(videos.length / videosPerPage);
  const startIndex = (currentPage - 1) * videosPerPage;
  const paginatedVideos = videos.slice(startIndex, startIndex + videosPerPage);

  return (
    <>
      <FilterBar 
        selected={filter} 
        onSelect={onFilterChange}
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
      />

      <div className="mb-6">
        <VideoUploadButton isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={`${filter}-${search}-${currentPage}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
    </>
  );
}