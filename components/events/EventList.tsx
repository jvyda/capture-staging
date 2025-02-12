"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EventCard } from "./EventCard";
import { AddEventDialog } from "./AddEventDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventList() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const events = [
    {
      id: "1",
      title: "Summer Wedding 2024",
      date: "March 15, 2024",
      venue: "Sunset Beach Resort",
      location: "Miami Beach, FL",
      coverImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
      totalPhotos: 486,
      totalVideos: 24,
      status: "upcoming" as const,
    },
    {
      id: "2",
      title: "Corporate Anniversary",
      date: "March 10, 2024",
      venue: "Grand Hotel Convention Center",
      location: "New York, NY",
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      totalPhotos: 275,
      totalVideos: 12,
      status: "completed" as const,
    },
    {
      id: "3",
      title: "Tech Conference 2024",
      date: "April 5, 2024",
      venue: "Innovation Hub",
      location: "San Francisco, CA",
      coverImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
      totalPhotos: 0,
      totalVideos: 0,
      status: "upcoming" as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-theme-primary">Events</h1>
        <Button
          onClick={() => setIsAddEventOpen(true)}
          className="bg-background hover:bg-background/90 text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <EventCard {...event} />
          </motion.div>
        ))}
      </div>

      <AddEventDialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen} />
    </div>
  );
}