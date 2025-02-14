"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { VideoPlayer } from "./VideoPlayer";
import { ChunkTimeline } from "./ChunkTimeline";
import { PersonSidebar } from "./PersonSidebar";
import { PersonTimeline } from "./PersonTimeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { FramesUploadButton } from "./FramesUploadButton";

// Mock data - replace with actual API calls
const mockVideoData = {
  id: "123",
  title: "Summer Wedding 2024",
  url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  duration: 600,
  chunks: [
    { id: 1, startTime: 0, endTime: 180, color: "bg-blue-500" },
    { id: 2, startTime: 180, endTime: 360, color: "bg-green-500" },
    { id: 3, startTime: 360, endTime: 540, color: "bg-purple-500" },
    { id: 4, startTime: 540, endTime: 600, color: "bg-orange-500" },
  ],
  people: [
    {
      personId: "1",
      name: "Sarah Johnson",
      thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80",
      appearances: [
        { startTime: 30, endTime: 120 },
        { startTime: 250, endTime: 300 },
        { startTime: 450, endTime: 520 },
      ],
      totalScreenTime: 210,
    },
    {
      personId: "2",
      name: "Michael Chen",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80",
      appearances: [
        { startTime: 80, endTime: 150 },
        { startTime: 320, endTime: 380 },
      ],
      totalScreenTime: 130,
    },
  ],
};

export function VideoPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState<typeof mockVideoData.people[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
const params = useParams();
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleChunkClick = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      if (!isPlaying) {
        videoRef.current.play();
      }
    }
  };

  const handlePersonClick = (person: typeof mockVideoData.people[0]) => {
    setSelectedPerson(selectedPerson?.personId === person.personId ? null : person);
  };

  const handleBack = () => {
    router.push(`/events/${params.eventId}/videos`);
  };

  

  return (
    <div className="max-w mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-theme-highlight-alpha/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-theme-primary">
            {mockVideoData.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="bg-background hover:bg-black/50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Frames
          </Button>
        
        </div>
      </div>

      <div className="mb-6">
        <FramesUploadButton isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
      </div>

      <div className="grid grid-cols-6 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              ref={videoRef}
              src={mockVideoData.url}
              onTimeUpdate={handleTimeUpdate}
              onPlayingChange={setIsPlaying}
            />
          </div>

          <div className="space-y-4">
            <ChunkTimeline
              chunks={mockVideoData.chunks}
              currentTime={currentTime}
              duration={mockVideoData.duration}
              onChunkClick={handleChunkClick}
            />

            {selectedPerson && (
              <PersonTimeline
                person={selectedPerson}
                currentTime={currentTime}
                duration={mockVideoData.duration}
                onAppearanceClick={handleChunkClick}
              />
            )}
          </div>
        </div>

        <div className="col-span-2 h-[calc(100vh-12rem)]">
          <PersonSidebar
            people={mockVideoData.people}
            selectedPerson={selectedPerson}
            onPersonClick={handlePersonClick}
            currentTime={currentTime}
          />
        </div>
      </div>
    </div>
  );
}