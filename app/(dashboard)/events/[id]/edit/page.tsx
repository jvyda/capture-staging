import { EventEditPageClient } from "./EventEditPageClient";

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
});

export default function EventEditPage({ params }: { params: { id: string } }) {
  const eventData = getEventData(params.id);
  return <EventEditPageClient eventData={eventData} />;
}