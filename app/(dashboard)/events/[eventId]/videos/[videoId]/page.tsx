"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { ChunkTimeline } from "@/components/videos/ChunkTimeline";
import { PersonSidebar } from "@/components/videos/PersonSidebar";
import { PersonTimeline } from "@/components/videos/PersonTimeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Upload, RefreshCcw, Eye, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { FramesUploadButton } from "@/components/videos/FramesUploadButton";
import { FrameUploadButton } from "@/components/videos/FrameUploadButton";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import { processVideoFunction } from '@/utils/processVideoFunction';
import type { Schema } from "@/amplify/data/resource";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const client = generateClient<Schema>();

type VideoType = Schema["Videos"]["type"];
type FrameType = Schema["Frames"]["type"];

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
  const [video, setVideo] = useState<VideoType | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [frames, setFrames] = useState<FrameType[]>([]);
  const [activeTab, setActiveTab] = useState("persons");
  const [selectedFrame, setSelectedFrame] = useState<FrameType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const framesPerPage = 12; // 3 rows of 4 frames each
  
  // Calculate pagination values
  const totalFrames = frames.length;
  const totalPages = Math.ceil(totalFrames / framesPerPage);
  const indexOfLastFrame = currentPage * framesPerPage;
  const indexOfFirstFrame = indexOfLastFrame - framesPerPage;
  const currentFrames = frames.slice(indexOfFirstFrame, indexOfLastFrame);
  
  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Fetch current user's ID when component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUserId();
  }, []);

  // Fetch video details when videoId changes
  useEffect(() => {
    if (!videoId) return;
    
    const fetchVideoDetails = async () => {
      try {
        const { data: video } = await client.models.Videos.get({
          videoId: videoId,
        });
        if (video) {
          setVideo(video);
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  // Fetch frames associated with the video
  useEffect(() => {
    if (!videoId || !userId) return;
    
    let isSubscribed = true;
    setIsLoading(true);
    
    const fetchFrames = async () => {
      try {
        const { data } = await client.models.Frames.list({
          filter: {
            videoId: { eq: videoId },
            isArchived: { ne: true }
          }
        });
        if (isSubscribed) {
          setFrames(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching frames:", error);
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };
    
    // Initial fetch
    fetchFrames();
    
    // Set up subscription for real-time updates
    const subscription = client.models.Frames.observeQuery({
      filter: {
        videoId: { eq: videoId },
        isArchived: { ne: true }
      }
    }).subscribe({
      next: ({ items, isSynced }) => {
        if (!isSubscribed) return;
        
        console.log('Frames subscription update:', {
          items: items.length,
          isSynced,
          timestamp: new Date().toISOString()
        });
        
        setFrames(items);
        if (isSynced) {
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error("Frames subscription error:", error);
        
        // If there's an error with the subscription, try to fetch frames directly
        if (isSubscribed) {
          const errorDetails = {
            type: error?.type,
            errors: error?.error?.errors,
            timestamp: new Date().toISOString()
          };
          
          console.log('Subscription event:', errorDetails);
          
          // Handle different error types
          switch (error?.type) {
            case 'onCreate':
            case 'onDelete':
            case 'onUpdate':
              // Refresh to get the latest data
              fetchFrames();
              break;
            default:
              console.error('Unexpected subscription error:', error);
              fetchFrames();
          }
        }
      }
    });
    
    // Cleanup function
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [videoId, userId]);

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
    console.log(videos);
  };

  const handleFramePreview = (frame: FrameType) => {
    setSelectedFrame(frame);
    setShowPreviewDialog(true);
  };

  const handleFrameDelete = (frame: FrameType) => {
    setSelectedFrame(frame);
    setShowDeleteDialog(true);
  };

  const handleFrameUploadComplete = () => {
    // Manually refresh frames list
    if (videoId && userId) {
      setIsLoading(true);
      client.models.Frames.list({
        filter: {
          videoId: { eq: videoId },
          isArchived: { ne: true }
        }
      }).then(({ data }) => {
        setFrames(data);
        setCurrentPage(1); // Reset to first page when new frames are added
        
        // Update video record with new frames count
        if (video) {
          client.models.Videos.update({
            videoId,
            hasFrames: data.length > 0,
            framesCount: data.length
          }).then(updatedVideo => {
            setVideo(updatedVideo.data);
          }).catch(error => {
            console.error("Error updating video record:", error);
          });
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Error refreshing frames:", error);
        setIsLoading(false);
      });
    }
  };

  const confirmDeleteFrame = async () => {
    if (!selectedFrame) return;
    
    try {
      setIsLoading(true);
      // Delete from database
      await client.models.Frames.delete({
        frameId: selectedFrame.frameId
      });
      
      // Update UI optimistically
      const updatedFrames = frames.filter(f => f.frameId !== selectedFrame.frameId);
      setFrames(updatedFrames);
      
      // If we're on a page that would now be empty, go to the previous page
      const newTotalPages = Math.ceil(updatedFrames.length / framesPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      // Update video record
      if (video) {
        await client.models.Videos.update({
          videoId,
          hasFrames: updatedFrames.length > 0,
          framesCount: updatedFrames.length
        }).then(updatedVideo => {
          setVideo(updatedVideo.data);
        });
      }
      
      setShowDeleteDialog(false);
      setSelectedFrame(null);
      setIsLoading(false);
      
      toast.success("Frame deleted successfully");
    } catch (error) {
      console.error("Error deleting frame:", error);
      toast.error("Failed to delete frame");
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "frames") {
      setCurrentPage(1); // Reset to first page when switching to frames tab
    }
  };

  // Helper function to calculate face count
  const getFaceCount = (frame: FrameType): number => {
    if (frame.taggedFacesCount !== null && frame.taggedFacesCount !== undefined) {
      return frame.taggedFacesCount;
    }
    
    if (frame.taggedFaces && typeof frame.taggedFaces === 'object') {
      if (Array.isArray(frame.taggedFaces)) {
        return frame.taggedFaces.length;
      }
      return Object.keys(frame.taggedFaces).length;
    }
    
    return 0;
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
              onUploadComplete={handleFrameUploadComplete}
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
          <Tabs defaultValue="persons" value={activeTab} onValueChange={handleTabChange} className="h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="persons">Persons</TabsTrigger>
              <TabsTrigger value="frames">
                Frames {(video?.framesCount || frames.length) > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-auto min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                    {video?.framesCount || frames.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="persons" className="h-[calc(100%-48px)]">
              <PersonSidebar
                people={people}
                selectedPerson={selectedPerson}
                onPersonClick={handlePersonClick}
                currentTime={currentTime}
              />
            </TabsContent>
            
            <TabsContent value="frames" className="h-[calc(100%-48px)]">
              <Card className="h-full bg-background backdrop-blur-sm border-theme-accent-alpha/20">
                <div className="p-4 flex flex-col h-full">
                  <ScrollArea className="flex-1">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">Loading frames...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 pr-4 pb-4">
                        {frames.length > 0 ? (
                          currentFrames.map((frame) => (
                            <div 
                              key={frame.frameId} 
                              className="relative group rounded-lg overflow-hidden aspect-square"
                            >
                              <Image
                                src={`https://${process.env.NEXT_PUBLIC_FRAMES_CDN_DOMAIN}/${frame.s3Key}`}
                                alt={frame.frameName || "Frame"}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                              
                              {/* Status indicator and face count */}
                              <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                                <div className={`h-3 w-3 rounded-full ${frame.recognitionStatus === 'COMPLETED' || frame.facesExtracted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {getFaceCount(frame) > 0 && (
                                  <div className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center">
                                    <span>{getFaceCount(frame)}</span>
                                    <span className="ml-1">faces</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Hover overlay with actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40"
                                  onClick={() => handleFramePreview(frame)}
                                >
                                  <Eye className="h-4 w-4 text-white" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-red-500/80"
                                  onClick={() => handleFrameDelete(frame)}
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 flex flex-col items-center justify-center py-8 text-theme-secondary">
                            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                            <p>No frames available for this video</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* Pagination UI */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{indexOfFirstFrame + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(indexOfLastFrame, totalFrames)}
                        </span>{" "}
                        of <span className="font-medium">{totalFrames}</span> frames
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around current page
                          let pageToShow;
                          if (totalPages <= 5) {
                            pageToShow = i + 1;
                          } else if (currentPage <= 3) {
                            pageToShow = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageToShow = totalPages - 4 + i;
                          } else {
                            pageToShow = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageToShow}
                              variant={currentPage === pageToShow ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageToShow)}
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Go to page {pageToShow}</span>
                              {pageToShow}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Go to next page</span>
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Frame Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Frame Preview</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selectedFrame?.frameName || "Frame"}
              {selectedFrame && (
                <>
                  <div className="flex items-center ml-4 gap-2">
                    <div className={`h-3 w-3 rounded-full ${selectedFrame.recognitionStatus === 'COMPLETED' || selectedFrame.facesExtracted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs">
                      {selectedFrame.recognitionStatus === 'COMPLETED' || selectedFrame.facesExtracted ? 'Processed' : 'Not processed'}
                    </span>
                  </div>
                  {getFaceCount(selectedFrame) > 0 && (
                    <div className="flex items-center ml-4">
                      <span className="text-xs font-medium">
                        {getFaceCount(selectedFrame)} faces detected
                      </span>
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            {selectedFrame && (
              <Image
                src={`https://${process.env.NEXT_PUBLIC_FRAMES_CDN_DOMAIN}/${selectedFrame.s3Key}`}
                alt={selectedFrame.frameName || "Frame"}
                fill
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Frame</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this frame? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFrame}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
