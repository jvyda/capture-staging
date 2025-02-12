'use client';

import { useState, useEffect } from "react";
import { EventPageClient } from "./EventPageClient";
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient<Schema>();
// Mock event IDs - replace with actual data source
const mockEventIds = ["1", "2", "3"];

export function generateStaticParams() {
  return mockEventIds.map((id) => ({
    id: id,
  }));
}

// Mock data - replace with actual API call
const getEventData = (id: string) => ({
  id,
  title: "Summer Wedding 2024",
  description: "Beautiful summer wedding at Sunset Beach Resort. Join us for this magical celebration of love and joy.",
  date: "March 15, 2024",
  time: "2:00 PM",
  venue: "Sunset Beach Resort",
  location: "Miami Beach, FL",
  coverImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  statistics: {
    totalVideos: 24,
    totalPhotos: 486,
    totalFrames: 1248,
    totalPeople: 124,
  }
});

export default function EventPage({ params }: { params: { id: string } }) {
  const [ event, setEvent ] = useState();
  const eventData = getEventData(params.id);
  return <EventPageClient eventData={eventData} />;
}