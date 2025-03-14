"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { ChunkTimeline } from "@/components/videos/ChunkTimeline";
import { PersonSidebar } from "@/components/videos/PersonSidebar";
import { PersonTimeline } from "@/components/videos/PersonTimeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Upload, RefreshCcw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { FramesUploadButton } from "@/components/videos/FramesUploadButton";
import { FrameUploadButton } from "@/components/videos/FrameUploadButton";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import { processVideoFunction } from '@/utils/processVideoFunction';
import type { Schema } from "@/amplify/data/resource";
const client = generateClient<Schema>();

type VideoType = Schema["Videos"]["type"];

// Define the Person interface to match PersonSidebar requirements
interface Person {
  personId: string;
  name: string;
  thumbnail: string;
  appearances: {
    startTime: number;
    endTime: number;
  }[];
  totalScreenTime: number;
}
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
      id: "1",
      name: "Sarah Johnson",
      thumbnail:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80",
      appearances: [
        { startTime: 30, endTime: 120 },
        { startTime: 250, endTime: 300 },
        { startTime: 450, endTime: 520 },
      ],
      totalScreenTime: 210,
    },
    {
      id: "2",
      name: "Michael Chen",
      thumbnail:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80",
      appearances: [
        { startTime: 80, endTime: 150 },
        { startTime: 320, endTime: 380 },
      ],
      totalScreenTime: 130,
    },
  ],
};

export default function VideoPage() {
  const [progress, setProgress] = useState(0);
const [activeJobs, setActiveJobs] = useState(0);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const params = useParams();
  const eventId = params?.eventId as string;
  const videoId = params?.videoId as string;
  const [userId, setUserId] = useState<string | null>(null);
  const isFirstMount = useRef(true);
  const isFirstVideoFetch = useRef(true);
  const [video, setVideo] = useState<VideoType | null>(null);
  const [people, setPeople] = useState<Person[]>([]);

  // Fetch current user's ID when component mounts
  useEffect(() => {
    if (isFirstMount.current) {
      const fetchUserId = async () => {
        try {
          const user = await getCurrentUser();
          setUserId(user.userId);
          console.log(user.userId);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUserId();
      isFirstMount.current = false;
    }
  }, []);

  // Fetch event details when eventId changes
  useEffect(() => {
    if (!videoId) return;
    if (isFirstVideoFetch.current) {
      const fetchEventDetails = async () => {
        try {
          const { data: video } = await client.models.Videos.get({
            videoId: videoId,
          });
          if (video) {
            const videoChunks = await video.videoChunks();
            setVideo(video);
            console.log(video)
          }
        } catch (error) {
          console.error("Error fetching event details:", error);
        }
      };

      fetchEventDetails();
      isFirstVideoFetch.current = false;
    }
  }, [videoId]);

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

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(
      selectedPerson?.personId === person.personId ? null : person
    );
  };

  const handleBack = () => {
    router.push(`/events/${params.eventId}/videos`);
  };
  const processVideo = async () => {
    const videoList: {
      videoId: string;
      chunkId?: string;
      bucket: string;
      s3Key: string;
      collectionId: string;
    }[] = [];
  
    const video = await client.models.Videos.get({ videoId: videoId });
  
    if (!video.data) {
      console.error('Video not found');
      return;
    }
  
    const hasChunks = video.data.hasChunks;
  
    if (hasChunks) {
      const videoChunks = await client.models.VideoChunks.list({
        filter: { videoId: { eq: video.data.videoId } }
      });
  
      if (videoChunks.data) {
        for (const chunk of videoChunks.data) {
          if (chunk.videoId) {
            videoList.push({
              videoId: chunk.videoId,
              chunkId: chunk.chunkId,
              bucket: chunk.s3Bucket || '',
              s3Key: chunk.s3Key || '',
              collectionId: eventId
            });
          }
        }
      }
    } else {
      if (video.data.videoId) {
        videoList.push({
          videoId: video.data.videoId,
          chunkId: undefined,
          bucket: video.data.s3Bucket || '',
          s3Key: video.data.s3Key || '',
          collectionId: eventId
        });
      }
    }
  
    // Start processing (up to 20 jobs)
    await Promise.all(
      videoList.slice(0, 20).map(async (video) => {
        await client.models.Videos.update({
          videoId: video.videoId,
          videoJobStatus: 'PROCESSING'
        });
        await processVideoFunction(video);
      })
    );
  };
    const checkVideoStatus = async () => {
      const videos = await client.models.Videos.list({
        filter: { videoJobStatus: { eq: 'PROCESSING' } }
      });
      console.log(videos)
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
            {video?.fileName || "Video Details"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
        <Button
            onClick={() => checkVideoStatus()}
            className="bg-background hover:bg-black/50 mr-2"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Check Video Status
          </Button>
          
          
          
          {userId && (
            <FrameUploadButton
              eventId={eventId}
              userId={userId}
              videoId={videoId}
            />
          )}
          <Button
            onClick={() => processVideo()}
            className="bg-background hover:bg-black/50 mr-2"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Process Video
          </Button>
        </div>
      </div>

      <div className="mb-6">
        {/* <FramesUploadButton
          isOpen={isUploadOpen}
          onOpenChange={setIsUploadOpen}
        /> */}
      </div>

      <div className="grid grid-cols-6 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              ref={videoRef}
              src={
                `https://${process.env.NEXT_PUBLIC_VIDEOS_CDN_DOMAIN}/${video?.s3Key}` ||
                ""
              }
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
            people={people}
            selectedPerson={selectedPerson}
            onPersonClick={handlePersonClick}
            currentTime={currentTime}
          />
        </div>
      </div>
    </div>
  );
}
