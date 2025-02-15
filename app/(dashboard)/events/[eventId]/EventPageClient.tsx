"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Image, Users, Clock, MapPin, Calendar, Frame, Edit2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Schema } from '@/amplify/data/resource';
import { toast } from "sonner";
type Event = Schema['Events']['type'];
interface EventPageClientProps {
  eventData: Event;
}
// interface EventData {
//   eventId: string;
//   eventName: string;
//   eventDescription: string;
//   eventDate: string;
//   eventVenue: string;
//   location: string;
//   coverImage: string;
//   videosTotal: number;
//   photosTotal: number;
//   framesTotal: number;
//   peopleTagged: number;
// }

// interface EventPageClientProps {
//   eventData: EventData;
// }

export function EventPageClient({ eventData }: EventPageClientProps) {
  const router = useRouter();
  const [isImageHovered, setIsImageHovered] = useState(false);

  const handleBack = () => {
    router.push("/events");
  };

  const handleEdit = () => {
    router.push(`/events/${eventData.eventId}/edit`);
  };

  const handleImageEdit = () => {
    // Add image edit functionality here
    console.log("Edit image");
  };

  const stats = [
    {
      title: "Videos",
      value: eventData.videosTotal,
      icon: Video,
      color: "bg-blue-500/10 text-blue-500",
      link: `/events/${eventData.eventId}/videos`,
    },
    {
      title: "Photos",
      value: eventData.photosTotal,
      icon: Image,
      color: "bg-green-500/10 text-green-500",
      link: `/events/${eventData.eventId}/photos`,
    },
    {
      title: "Frames",
      value: eventData.framesTotal,
      icon: Frame,
      color: "bg-purple-500/10 text-purple-500",
      link: `/events/${eventData.eventId}/frames`,
    },
    {
      title: "People",
      value: eventData.peopleTagged,
      icon: Users,
      color: "bg-orange-500/10 text-orange-500",
      link: `/events/${eventData.eventId}/faces`,
    },
  ];
  const getCollectionFaceIdCount = async () => {
    try {
      if (!eventData?.rekognitionCollectionId) {
        toast.error('No Rekognition collection found for this event');
        return;
      }
  
      const response = await fetch("/api/rekognition/getCollectionStats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId: eventData.rekognitionCollectionId,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get collection stats');
      }
  
      toast.success(`Total faces in collection: ${data.faceCount}`, {
        duration: 5000,
      });
      
      console.log('Collection stats:', data);
    } catch (error: any) {
      console.error("Error getting collection stats:", error);
      toast.error(error.message || "Failed to get collection stats");
    }
  }
  const resetCollection = async () => {
    try {
      if (!eventData?.rekognitionCollectionId) {
        toast.error('No Rekognition collection found for this event');
        return;
      }

      const response = await fetch("/api/rekognition/resetCollection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId: eventData.rekognitionCollectionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset collection');
      }

      toast.success('Collection reset successfully', {
        duration: 5000,
      });
      
      console.log('Reset collection response:', data);
    } catch (error: any) {
      console.error("Error resetting collection:", error);
      toast.error(error.message || "Failed to reset collection");
    }
  };
  return (
    <div className="max-w mx-auto space-y-6">
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
            {eventData.eventName}
          </h1>
        </div>
        <Button
          onClick={handleEdit}
          className="bg-theme-primary hover:bg-theme-primary-alpha/90"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Event
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={stat.title} 
              href={stat.link}
              className="block"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-lg bg-background backdrop-blur-sm border border-theme-accent-alpha/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-theme-primary">
                      {stat.value}
                    </h3>
                    <p className="text-sm text-theme-secondary">{stat.title}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
        <Button
            variant="ghost"
            size="icon"
            onClick={getCollectionFaceIdCount}
            className="hover:bg-theme-highlight-alpha/20"
          >Collection Faces Count</Button>
          <Button
          variant="ghost"
          onClick={resetCollection}
          className="hover:bg-theme-highlight-alpha/20"
        >
          Reset Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card className="p-6 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
            <div className="space-y-4">
              <div 
                className="aspect-[21/9] relative rounded-lg overflow-hidden group"
                onMouseEnter={() => setIsImageHovered(true)}
                onMouseLeave={() => setIsImageHovered(false)}
              >
                <img
                  src={eventData.coverImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'}
                  alt={eventData.eventName || 'Event cover image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <motion.div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isImageHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={handleImageEdit}
                    className="bg-white/90 hover:bg-white text-theme-primary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Cover Image
                  </Button>
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-theme-secondary">
                  <Calendar className="w-4 h-4" />
                  <span>{eventData.eventDate}</span>
                </div>
                <div className="flex items-center gap-2 text-theme-secondary">
                  <MapPin className="w-4 h-4" />
                  <span>{eventData.eventVenue}</span>
                </div>
                <div className="flex items-center gap-2 text-theme-secondary">
                  <MapPin className="w-4 h-4" />
                  <span>{eventData.city || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-theme-primary">Description</h2>
                <p className="text-theme-secondary">{eventData.eventDescription}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
          <h2 className="text-lg font-semibold text-theme-primary mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-theme-highlight-alpha/10"
              >
                <div className="w-10 h-10 rounded-lg bg-theme-highlight-alpha/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-theme-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-theme-primary">New video uploaded</p>
                  <p className="text-xs text-theme-secondary">2 hours ago</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}