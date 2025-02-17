"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, SlidersHorizontal } from "lucide-react";
import SimpleBar from 'simplebar-react';
import { PhotoCard } from "@/components/people/PhotoCard";
import { VideoCard } from "@/components/videos/VideoCard";
import type { Schema } from '@/amplify/data/resource';

type VideoCardProps = Schema['Videos']['type'];
type PhotoCardProps = Schema['Photos']['type'];
interface PersonMediaGridProps {
  personId: string;
}

export function PersonMediaGrid({ personId }: PersonMediaGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mediaType, setMediaType] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [photos, setPhotos] = useState<PhotoCardProps[]>([]);
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  // Mock data - replace with API calls
  // const photos = [
  //   {
  //     photoId: "1",
  //     s3Key: "events/company-event.jpg",
  //     fileName: "Company Event",
  //     peopleTagged: 3,
  //     recognitionStatus: "processed" as const,
  //     thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
  //     eventId: 'someeventid'
  //   },
  //   {
  //     photoId: "2",
  //     s3Key: "events/team-meeting.jpg",
  //     fileName: "Team Meeting",
  //     peopleTagged: 5,
  //     recognitionStatus: "processed" as const,
  //     thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
  //     eventId: 'someeventid'
  //   },
  // ];

  // const videos = [
  //   {
  //     videoId: "1",
  //     chunksCount: 5,
  //     duration: 165,
  //     eventId: personId,
  //     fileName: "Product Launch",
  //     filePath: "/videos/product-launch",
  //     fileSize: 1024000,
  //     hasChunks: true,
  //     isArchived: false,
  //     recognitionCollectionId: "collection1",
  //     recognitionStatus: "processed",
  //     s3Bucket: "my-video-bucket",
  //     s3Key: "videos/product-launch.mp4",
  //     taggedFaces: JSON.stringify([]),
  //     taggedPeople: JSON.stringify([]),
  //     taggedPeopleCount: 3,
  //     thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  //     userId: "user1",
  //     videoName: "Product Launch",
  //     videoStatus: "ready"
  //   },
  // ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-theme-highlight-alpha/10" : ""}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={mediaType} onValueChange={setMediaType}>
        <TabsList>
          <TabsTrigger value="all">All Media</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        <SimpleBar className="mt-6" style={{ maxHeight: "calc(100vh - 24rem)" }}>
          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-4 gap-6">
              {photos.map((photo) => (
                <PhotoCard key={photo.photoId} {...photo} isSelected={false} />
              ))}
              {videos.map((video) => (
                <VideoCard key={video.videoId} {...video} isSelected={false} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="m-0">
            <div className="grid grid-cols-4 gap-6">
              {photos.map((photo) => (
                <PhotoCard key={photo.photoId} {...photo} isSelected={false}/>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="m-0">
            <div className="grid grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.videoId} {...video} isSelected={false}/>
              ))}
            </div>
          </TabsContent>
        </SimpleBar>
      </Tabs>
    </div>
  );
}