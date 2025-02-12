'use client';

import { Card } from '@/components/ui/card';
import { Camera, Video, MapPin, Calendar } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  venue: string;
  location: string;
  coverImage: string;
  totalPhotos: number;
  totalVideos: number;
  status: 'upcoming' | 'completed';
}

export function EventCard({
  id,
  title,
  date,
  venue,
  location,
  coverImage,
  totalPhotos,
  totalVideos,
  status,
}: EventCardProps) {
  return (
    <Link href={`/events/${id}`}>
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow bg-[#312E36]/50 backdrop-blur-sm border-theme-accent-alpha/10">
          <div className="relative h-48">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 right-4">
              <span
                className={`
                px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5
                ${
                  status === 'upcoming'
                    ? 'text-theme-primary'
                    : 'text-theme-accent'
                }
              `}
              >
                {status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 text-theme-primary">
              {title}
            </h3>
            <div className="flex items-center text-sm text-theme-secondary mb-3">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{date}</span>
            </div>
            <div className="flex items-center text-sm text-theme-secondary mb-3">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate">
                {venue} • {location}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-theme-primary bg-theme-highlight/10 px-3 py-1 rounded-full border border-theme-highlight/10">
                <Camera className="w-4 h-4 mr-1" />
                <span>{totalPhotos}</span>
              </div>
              <div className="flex items-center text-sm text-theme-primary bg-theme-accent/10 px-3 py-1 rounded-full border border-theme-accent/10">
                <Video className="w-4 h-4 mr-1" />
                <span>{totalVideos}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
