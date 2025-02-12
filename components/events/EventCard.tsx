'use client';

import { Card } from '@/components/ui/card';
import { Camera, Video, MapPin, Calendar } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface EventCardProps {
  eventId: string;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
  city?: string;
  coverImage?: string;
  photosTotal?: number;
  videosTotal?: number;
  eventStatus?: 'upcoming' | 'completed';
}

export function EventCard({
  eventId,
  eventName,
  eventDate,
  eventVenue,
  city,
  coverImage,
  photosTotal,
  videosTotal,
  eventStatus,
}: EventCardProps) {
  return (
    <Link href={`/events/${eventId}`}>
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow bg-[#312E36]/50 backdrop-blur-sm border-theme-accent-alpha/10">
          <div className="relative h-48">
            <Image
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80"
              alt={eventName || 'Event image'}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 right-4">
              <span
                className={`
                px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5
                ${
                  eventStatus === 'upcoming'
                    ? 'text-theme-primary'
                    : 'text-theme-accent'
                }
              `}
              >
                {eventStatus === 'upcoming' ? 'Upcoming' : 'Completed'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 text-theme-primary">
              {eventName}
            </h3>
            <div className="flex items-center text-sm text-theme-secondary mb-3">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center text-sm text-theme-secondary mb-3">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate">
                {eventVenue} • {city}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-theme-primary bg-theme-highlight/10 px-3 py-1 rounded-full border border-theme-highlight/10">
                <Camera className="w-4 h-4 mr-1" />
                <span>{photosTotal}</span>
              </div>
              <div className="flex items-center text-sm text-theme-primary bg-theme-accent/10 px-3 py-1 rounded-full border border-theme-accent/10">
                <Video className="w-4 h-4 mr-1" />
                <span>{videosTotal}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
