"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  coverImage: string;
}

interface EventEditPageClientProps {
  eventData: EventData;
}

export function EventEditPageClient({ eventData }: EventEditPageClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(eventData);

  const handleBack = () => {
    router.push(`/events/${eventData.id}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Add API call to save event data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      router.push(`/events/${eventData.id}`);
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof EventData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-black/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-theme-primary">
            Edit Event
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => {/* Add delete confirmation */}}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </Button>
          <Button
            onClick={handleSave}
            className="bg-background hover:bg-black/50"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <motion.div
                  className="mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="w-4 h-4" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-4">
            <Label>Cover Image</Label>
            <div className="relative aspect-[21/9] rounded-lg overflow-hidden bg-theme-highlight-alpha/10">
              <img
                src={formData.coverImage}
                alt={formData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <Button className="bg-white/90 hover:bg-white text-theme-primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Cover Image
                </Button>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter event description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleChange("venue", e.target.value)}
                placeholder="Enter venue name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Enter location"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}