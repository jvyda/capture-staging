"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EventCard } from "./EventCard";
import { AddEventDialog } from "./AddEventDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
const client = generateClient<Schema>();
type Events = Schema['Events']['type'];
export function EventList() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [events, setEvents] = useState<Events[]>([]);

  useEffect(() => {
    const sub = client.models.Events.observeQuery().subscribe({
      next: ({ items, isSynced }) => {
        setEvents([...items]);
      },
    });
    return () => sub.unsubscribe();
  }, []);
  

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
            <EventCard {...event} />
          </motion.div>
        ))}
      </div>

      <AddEventDialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen} />
    </div>
  );
}