
'use client';
import { useState, useEffect } from "react";
import { EventPageClient } from "./EventPageClient";
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';
import { useParams } from 'next/navigation';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import {LoadingSpinner} from "@/components/layout/LoadingSpinner";
type Event = Schema['Events']['type'];
interface EventPageClientProps {
  eventData: Event;
}
const client = generateClient<Schema>();
// Mock event IDs - replace with actual data source
const mockEventIds = ["1", "2", "3"];

// get the eventId from the params
//get the logged in USerId
//fetch the event data



export default function EventPage() {
  const params = useParams();
  const [ event, setEvent ] = useState<Schema['Events']['type'] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const eventId = params?.eventId as string;
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

  // Fetch event data when we have both eventId and userId
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId || !userId) return;

      try {
        // Fetch event data with filter to ensure user has access
        const { data: eventData, errors } = await client.models.Events.get({
          eventId: eventId
        });
        if (eventData && eventData.userId === userId) {
          setEvent(eventData);
        } else {
          console.error('Event not found or access denied');
          setEvent(null);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    fetchEventData();
  }, [eventId, userId]);

  if (!event) {
    return <LoadingSpinner />;
  }

  return <EventPageClient eventData={event} />;
}