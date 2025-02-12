"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChunkTimeline } from "@/components/videos/ChunkTimeline";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Mock data - replace with actual API calls
const mockVideoData = {
  id: "123",
  title: "Summer Wedding 2024",
  description: "Beautiful summer wedding at Sunset Beach Resort",
  thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  duration: 600, // 10 minutes
  chunks: [
    { id: 1, startTime: 0, endTime: 180, color: "bg-blue-500" },
    { id: 2, startTime: 180, endTime: 360, color: "bg-green-500" },
    { id: 3, startTime: 360, endTime: 540, color: "bg-purple-500" },
    { id: 4, startTime: 540, endTime: 600, color: "bg-orange-500" },
  ],
};

export function VideoEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState(mockVideoData.title);
  const [description, setDescription] = useState(mockVideoData.description);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    router.push(`/videos/${params.id}`);
  };

  const handleBack = () => {
    router.push(`/videos/${params.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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
            Edit Video
          </h1>
        </div>
        <Button
          onClick={handleSave}
          className="bg-theme-primary hover:bg-theme-primary-alpha/90"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <motion.div
                className="mr-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Save className="w-4 h-4" />
              </motion.div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description"
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-theme-primary">
                  Video Chunks
                </h2>
                <ChunkTimeline
                  chunks={mockVideoData.chunks}
                  currentTime={currentTime}
                  duration={mockVideoData.duration}
                  onChunkClick={(time) => setCurrentTime(time)}
                />
                <p className="text-sm text-theme-secondary">
                  Click on a chunk to preview that section of the video.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-theme-primary">
                  Advanced Settings
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="privacy">Privacy</Label>
                    <select
                      id="privacy"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="events">Events</option>
                      <option value="weddings">Weddings</option>
                      <option value="corporate">Corporate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-theme-primary">
              Preview
            </h2>
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <Image
                src={mockVideoData.thumbnail}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-theme-primary">
                {title || "Untitled Video"}
              </h3>
              <p className="text-sm text-theme-secondary line-clamp-3">
                {description || "No description"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}