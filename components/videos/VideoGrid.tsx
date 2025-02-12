"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCard } from "./VideoCard";
import { Pagination } from "@/components/shared/Pagination";
import { VideoUploadButton } from "./VideoUploadButton";
import { FilterBar } from "./FilterBar";

interface VideoGridProps {
  filter: string;
  search: string;
  onFilterChange: (filter: string) => void;
}

export function VideoGrid({ filter, search, onFilterChange }: VideoGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const videosPerPage = 8;

  const videos = [
    {
      id: "1",
      title: "Mountain Sunrise Timelapse",
      thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
      duration: "2:45",
      uploadDate: "2 hours ago",
      views: 1234,
      favorite: true,
      starred: false,
      status: "ready" as const,
      faceExtractionStatus: {
        status: "complete" as const,
        faceCount: 3,
      },
    },
    {
      id: "2",
      title: "Ocean Waves at Sunset",
      thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      duration: "4:20",
      uploadDate: "5 hours ago",
      views: 2567,
      favorite: false,
      starred: true,
      status: "processing" as const,
      faceExtractionStatus: {
        status: "processing" as const,
      },
    },
    // ... rest of your videos array
  ];

  const filteredVideos = videos.filter(video => {
    if (search && !video.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    switch (filter) {
      case "favorites":
        return video.favorite;
      case "starred":
        return video.starred;
      case "recent":
        return true;
      default:
        return true;
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  const startIndex = (currentPage - 1) * videosPerPage;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + videosPerPage);

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
              key={video.id}
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