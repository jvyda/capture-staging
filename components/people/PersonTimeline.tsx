"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import SimpleBar from 'simplebar-react';
import Image from "next/image";

interface PersonTimelineProps {
  personId: string;
}

export function PersonTimeline({ personId }: PersonTimelineProps) {
  const [timeRange, setTimeRange] = useState("all");

  // Mock data - replace with API calls
  const events = [
    {
      id: "1",
      type: "photo" as const,
      date: "2024-03-15T10:30:00Z",
      title: "Detected in photo",
      thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&q=80",
      location: "Conference Room A",
      confidence: 0.98,
    },
    {
      id: "2",
      type: "video" as const,
      date: "2024-03-14T15:45:00Z",
      title: "Appeared in video",
      thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&q=80",
      location: "Main Lobby",
      confidence: 0.85,
      duration: "00:45",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-theme-primary">Activity Timeline</h3>
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

      <SimpleBar style={{ maxHeight: "calc(100vh - 24rem)" }}>
        <div className="relative pl-8 space-y-8">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-theme-accent-alpha/20" />
          
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              <div className="absolute left-[-27px] w-4 h-4 rounded-full bg-theme-primary" />
              <Card className="p-4 bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={event.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-theme-secondary">
                      {new Date(event.date).toLocaleString()}
                    </div>
                    <h4 className="font-medium text-theme-primary mt-1">
                      {event.title}
                    </h4>
                    <div className="text-sm text-theme-secondary mt-2">
                      Location: {event.location}
                    </div>
                    <div className="text-sm text-theme-secondary">
                      Confidence: {Math.round(event.confidence * 100)}%
                    </div>
                    {event.type === "video" && (
                      <div className="text-sm text-theme-secondary">
                        Duration: {event.duration}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </SimpleBar>
    </div>
  );
}