"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { toast } from 'sonner';

// Initialize the Amplify Data client with our schema
const client = generateClient<Schema>();

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEventDialog({ open, onOpenChange }: AddEventDialogProps) {
  // Event form state
  const [eventDate, setEventDate] = useState<Date>();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [eventVenue, setEventVenue] = useState<string>('');
  const [noOfGuests, setNoOfGuests] = useState<number>(0);
  const [eventDescription, setEventDescription] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Handle image upload for event cover
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
  };

  /**
   * Creates a new event in the database
   * 1. Gets the current authenticated user
   * 2. Creates an event record with user details and form data
   * 3. Handles success/failure cases with appropriate UI feedback
   */
  const handleCreateEvent = async () => {
    if (!eventName || !eventDate || !eventVenue) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current authenticated user using Amplify Gen2
      const { username, userId } = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();

      // Create unique event ID
      const eventId = crypto.randomUUID();

      // Create event record
      const { errors, data: newEvent } = await client.models.Events.create({
        eventId,
        address,
        city,
        country: 'india',
        coverImage: '',
        eventDate: eventDate.toISOString(),
        eventDescription,
        eventName,
        eventVenue,
        framesProcessed: 0,
        framesTotal: 0,
        isArchived: false,
        noOfGuests,
        peopleTagged: 0,
        photosProcessed: 0,
        photosTotal: 0,
        postalCode,
        rekognitionCollectionId: null,
        state,
        storageUsed: 0,
        userId, // Use the userId from getCurrentUser
        videosProcessed: 0,
        videosTotal: 0,
      });

      if (errors) {
        console.error('Failed to create event:', errors);
        toast.error('Failed to create event. Please try again.');
        return;
      }

      // Show success message and close dialog
      toast.success('Event created successfully!');
      onOpenChange(false);

      // Reset form
      setEventName('');
      setEventDate(undefined);
      setEventVenue('');
      setCity('');
      setState('');
      setAddress('');
      setPostalCode('');
      setNoOfGuests(0);
      setEventDescription('');
      setPreviewImage(null);

    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('An error occurred while creating the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Fill in the details</DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6" style={{ maxHeight: "calc(90vh - 120px)" }}>
          <div className="grid gap-6 p-1">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input 
                id="eventName" 
                placeholder="Enter event name" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={setEventDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="noOfGuests">Expected Guests Count</Label>
                <Input 
                  id="noOfGuests" 
                  type="number" 
                  min="0"
                  value={noOfGuests}
                  onChange={(e) => setNoOfGuests(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventVenue">Event Venue *</Label>
                <Input 
                  id="eventVenue" 
                  placeholder="Enter venue name" 
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  placeholder="Enter state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  placeholder="Enter postal code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter complete address"
                className="resize-none"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Event Banner</Label>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-4
                  ${previewImage ? 'border-theme-accent' : 'border-theme-accent-alpha/20'}
                `}
              >
                <AnimatePresence>
                  {previewImage ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-theme-highlight-alpha/20 flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-theme-primary" />
                      </div>
                      <p className="text-sm text-theme-secondary mb-2">
                        Drag and drop your banner image here
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="banner-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('banner-upload')?.click()}
                      >
                        Choose File
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDescription">Event Description</Label>
              <Textarea
                id="eventDescription"
                placeholder="Enter event description"
                className="resize-none"
                rows={3}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-theme-primary hover:bg-theme-primary-alpha/90"
                onClick={handleCreateEvent}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}