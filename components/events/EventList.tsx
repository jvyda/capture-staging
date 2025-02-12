"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EventCard } from "./EventCard";
import { AddEventDialog } from "./AddEventDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient<Schema>();
type Events = Schema['Events']['type'];
export function EventList() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [events, setEvents] = useState<Events[]>([]);
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
    if (!userId) return;
    const sub = client.models.Events.observeQuery({
      filter: {
        userId: {
          eq: userId
        }
      }
    }).subscribe({
      next: ({ items, isSynced }) => {
        setEvents([...items]);
      },
      error: (error) => {
        console.error('Error fetching events:', error);
      }
    });
    return () => sub.unsubscribe();
  }, [userId]);
  

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
            key={event.eventId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <EventCard 
            eventId={event.eventId}
              eventName={event.eventName || undefined}
              eventDate={event.eventDate || undefined}
              eventVenue={event.eventVenue || undefined}
              city={event.city || undefined}
              coverImage={event.coverImage || undefined}
              photosTotal={event.photosTotal || 0}
              videosTotal={event.videosTotal || 0}
              eventStatus={(event.eventStatus === 'upcoming' || event.eventStatus === 'completed') 
                ? event.eventStatus 
                : 'upcoming'}  />
          </motion.div>
        ))}
      </div>

      <AddEventDialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen} />
    </div>
  );
}