"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, SlidersHorizontal } from "lucide-react";
import SimpleBar from 'simplebar-react';
import { PhotoCard } from "@/components/photos/PhotoCard";
import { VideoCard } from "@/components/videos/VideoCard";

interface PersonMediaGridProps {
  personId: string;
}

export function PersonMediaGrid({ personId }: PersonMediaGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mediaType, setMediaType] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  // Mock data - replace with API calls
  const photos = [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
      title: "Company Event",
      peopleTagged: 3,
      status: "processed" as const,
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
      title: "Team Meeting",
      peopleTagged: 5,
      status: "processed" as const,
    },
  ];

  const videos = [
    {
      id: "1",
      title: "Product Launch",
      thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
      duration: "2:45",
      uploadDate: "2 hours ago",
      favorite: true,
      starred: false,
      status: "ready" as const,
      faceExtractionStatus: {
        status: "complete" as const,
        faceCount: 3,
      },
    },
  ];

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
                <PhotoCard key={photo.id} {...photo} />
              ))}
              {videos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="m-0">
            <div className="grid grid-cols-4 gap-6">
              {photos.map((photo) => (
                <PhotoCard key={photo.id} {...photo} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="m-0">
            <div className="grid grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
        </SimpleBar>
      </Tabs>
    </div>
  );
}