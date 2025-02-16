"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Edit2, Download, Trash2, Calendar, Clock, MapPin, Users, Image as ImageIcon, Video, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PersonMediaGrid } from "./PersonMediaGrid";
import { PersonFacesGrid } from "./PersonFacesGrid";
import { PersonTimeline } from "./PersonTimeline";
import { PersonConnections } from "./PersonConnections";

interface PersonDetailsPageProps {
  personId: string;
}

// Mock data - replace with API call
const mockPerson = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.j@example.com",
  phone: "+1 (555) 123-4567",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80",
  dateAdded: "2024-01-15",
  lastDetection: "2024-03-10",
  stats: {
    totalFaces: 156,
    totalPhotos: 89,
    totalVideos: 23,
    totalFrames: 432,
  },
  locations: [
    "Conference Room A",
    "Main Lobby",
    "Cafeteria",
  ],
  accessLevel: "Employee",
  notes: "Key team member in marketing department",
};

export function PersonDetailsPage({ personId }: PersonDetailsPageProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(mockPerson);
  const [activeTab, setActiveTab] = useState("overview");

  const handleBack = () => {
    router.push("/people");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Make API call to save changes
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            Person Details
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {isEditing && (
            <Button
              onClick={handleSave}
              className="bg-theme-primary hover:bg-theme-primary-alpha/90"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
          <Button
            className="bg-background"
            onClick={() => {/* Handle export */}}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Profile Card */}
        <Card className="p-6 bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-theme-accent-alpha/20">
                <Image
                  src={formData.avatar}
                  alt={formData.name}
                  fill
                  className="object-cover"
                />
              </div>
              {isEditing && (
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="text-center font-semibold"
              />
            ) : (
              <h2 className="text-xl font-semibold text-theme-primary">
                {formData.name}
              </h2>
            )}

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex items-center justify-center gap-2 text-sm text-theme-secondary">
                <Calendar className="w-4 h-4" />
                <span>Added {new Date(formData.dateAdded).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-theme-secondary">
                <Clock className="w-4 h-4" />
                <span>Last seen {new Date(formData.lastDetection).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-lg bg-theme-highlight-alpha/10">
                <div className="text-2xl font-semibold text-theme-primary">
                  {formData.stats.totalFaces}
                </div>
                <div className="text-sm text-theme-secondary">Total Faces</div>
              </div>
              <div className="p-4 rounded-lg bg-theme-highlight-alpha/10">
                <div className="text-2xl font-semibold text-theme-primary">
                  {formData.stats.totalPhotos + formData.stats.totalVideos}
                </div>
                <div className="text-sm text-theme-secondary">Total Media</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="flex flex-col items-center">
                <ImageIcon className="w-5 h-5 text-theme-primary mb-1" />
                <div className="text-sm font-medium text-theme-primary">
                  {formData.stats.totalPhotos}
                </div>
                <div className="text-xs text-theme-secondary">Photos</div>
              </div>
              <div className="flex flex-col items-center">
                <Video className="w-5 h-5 text-theme-primary mb-1" />
                <div className="text-sm font-medium text-theme-primary">
                  {formData.stats.totalVideos}
                </div>
                <div className="text-xs text-theme-secondary">Videos</div>
              </div>
              <div className="flex flex-col items-center">
                <Layers className="w-5 h-5 text-theme-primary mb-1" />
                <div className="text-sm font-medium text-theme-primary">
                  {formData.stats.totalFrames}
                </div>
                <div className="text-xs text-theme-secondary">Frames</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="col-span-3 space-y-6">
          <Card className="bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full border-b border-theme-accent-alpha/20 px-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="faces">Faces</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      {isEditing ? (
                        <Input
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                        />
                      ) : (
                        <div className="text-theme-secondary">{formData.email}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                        />
                      ) : (
                        <div className="text-theme-secondary">{formData.phone}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Access Level</Label>
                      {isEditing ? (
                        <Input
                          value={formData.accessLevel}
                          onChange={(e) => handleChange("accessLevel", e.target.value)}
                        />
                      ) : (
                        <div className="text-theme-secondary">{formData.accessLevel}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Known Locations</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.locations.map((location, index) => (
                          <div
                            key={index}
                            className="px-3 py-1 rounded-full bg-theme-highlight-alpha/10 text-sm text-theme-primary flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            {location}
                            {isEditing && (
                              <button
                                onClick={() => {/* Handle remove location */}}
                                className="hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Handle add location */}}
                          >
                            Add Location
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => handleChange("notes", e.target.value)}
                          rows={4}
                        />
                      ) : (
                        <div className="text-theme-secondary whitespace-pre-wrap">
                          {formData.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media">
                <PersonMediaGrid personId={personId} />
              </TabsContent>

              <TabsContent value="faces">
                <PersonFacesGrid personId={personId} />
              </TabsContent>

              <TabsContent value="timeline">
                <PersonTimeline personId={personId} />
              </TabsContent>

              <TabsContent value="connections">
                <PersonConnections personId={personId} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}