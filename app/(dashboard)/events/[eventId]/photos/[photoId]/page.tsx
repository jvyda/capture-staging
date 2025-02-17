"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  ArrowLeft,
  Save,
  Edit2,
  Download,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  Video,
  Layers,
} from "lucide-react";
import {toast} from 'sonner'
interface Selection {
    width: number;
    height: number;
    x: number;
    y: number;
  }
const client = generateClient<Schema>();
type TagDialogState = {
    selection: Selection;
    position: { x: number; y: number };
  } | null;
  type Photo = Schema['Photos']['type'];
  type Face = Schema['Faces']['type'];
  type PhotoWithFaces = Photo & {
    faces: Array<Face>;
  };
export default function PhotoPage() {
  const params = useParams();
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const isFirstMount = useRef(true);
  const isFirstPhotoFetch = useRef(true);
  const [tagDialog, setTagDialog] = useState<TagDialogState>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [newPersonData, setNewPersonData] = useState({
    name: "",
    phone: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const eventId = params?.eventId as string;
  const photoId = params?.photoId as string;
  const [photo, setPhoto] = useState<PhotoWithFaces | null>(null);
  const [isTagging, setIsTagging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  async function getPhotoWithFaces(photoId: string) {
    try {
      const [photoResponse, facesResponse] = await Promise.all([
        client.models.Photos.get({ photoId }),
        client.models.Faces.list({ filter: { photoId: { eq: photoId } } }),
      ]);
  
      const photo = photoResponse.data;
      const faces:any = facesResponse.data;
  
      if (!photo || !faces) {
        console.error('Photo or faces not found');
        return null;
      }
      setPhoto({
        ...photo,
        faces,
      })
    //   return {
    //     ...photo,
    //     faces,
    //   };
    } catch (error) {
      console.error('Error fetching photo with faces:', error);
      return null;
    }
  }
  
  // Fetch current user's ID when component mounts
  useEffect(() => {
    if (isFirstMount.current) {
      const fetchUserId = async () => {
        try {
          const user = await getCurrentUser();
          setUserId(user.userId);
          console.log(user.userId);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUserId();
      isFirstMount.current = false;
    }
  }, [userId]);

  // Fetch event details when eventId changes
  useEffect(() => {
    if (!photoId) return;
    if (isFirstPhotoFetch.current) {
         getPhotoWithFaces(photoId)
    //   const fetchEventDetails = async () => {
    //     try {
    //       const { data: photo } = await client.models.Photos.get({
    //         photoId: photoId,
    //       });
    //       console.log(photo)
    //       if (photo) {
    //         setPhoto(photo);
    //       }
    //     } catch (error) {
    //       console.error("Error fetching event details:", error);
    //     }
    //   };

    //   fetchEventDetails();
      isFirstPhotoFetch.current = false;
    }
  }, [photoId]); // Fetch event details when eventId changes

  const handleBack = () => {
    router.push(`/events/${eventId}/photos`);
  };
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isTagging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    startPosRef.current = { x, y };
    setIsDragging(true);
    setCurrentSelection({
      x,
      y,
      width: 0,
      height: 0,
    });
  }, [isTagging]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !startPosRef.current || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const width = currentX - startPosRef.current.x;
    const height = currentY - startPosRef.current.y;

    setCurrentSelection({
      x: startPosRef.current.x,
      y: startPosRef.current.y,
      width,
      height,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !currentSelection || !imageRef.current) return;

    setIsDragging(false);
    const rect = imageRef.current.getBoundingClientRect();
    const dialogX = e.clientX + 10;
    const dialogY = e.clientY + 10;

    setTagDialog({
      selection: currentSelection,
      position: { x: dialogX, y: dialogY },
    });
    setCurrentSelection(null);
  }, [isDragging, currentSelection]);

  const handleSaveTag = async () => {
   console.log('tag save');
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
            Photo Insignts
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1" />
          <Button
            variant={isTagging ? "default" : "outline"}
            className="mr-2"
            onClick={() => setIsTagging(!isTagging)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isTagging ? "Done Tagging" : "Tag People"}
          </Button>
          <Button
            variant={isEditing ? "secondary" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Done Editing" : "Edit Details"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6">
      <div className="col-span-3">
      <Card className="relative overflow-hidden">
            <div 
              className="aspect-video relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
                <Image
                ref={imageRef}
                  src={`https://${process.env.NEXT_PUBLIC_PHOTOS_CDN_DOMAIN}/${photo?.s3Key}`||''}
                  alt={photo?.fileName || 'Unknown Person'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 2400px) 100vw, (max-width: 2400px) 50vw, 33vw"
                />
             
              {/* {photo.faces && Object.entries(photo.faces).map((face) => (
                <div
                  key={face.faceId}
                  className="absolute border-2 border-primary"
                  style={{
                    left: `${tag.x * 100}%`,
                    top: `${tag.y * 100}%`,
                    width: `${tag.width * 100}%`,
                    height: `${tag.height * 100}%`,
                  }}
                >
                  {tag.name && (
                    <span className="absolute bottom-full left-0 bg-primary text-primary-foreground text-xs px-1 rounded">
                      {tag.name}
                    </span>
                  )}
                </div>
              ))} */}
              {currentSelection && (
                <div
                  className="absolute border-2 border-primary bg-primary/20"
                  style={{
                    left: `${currentSelection.x * 100}%`,
                    top: `${currentSelection.y * 100}%`,
                    width: `${currentSelection.width * 100}%`,
                    height: `${currentSelection.height * 100}%`,
                  }}
                />
              )}
            </div>
          </Card>
          
          </div>
          <div className="col-span-1 bg-background">
          <div className="grid grid-cols-3 gap-4">
          {photo?.faces.map((face) => (
          <motion.div
          key={face.faceId}
          className="relative aspect-square rounded-lg overflow-hidden group"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Image
                  src={`https://${process.env.NEXT_PUBLIC_FACE_DETECTION_THUMBNAILS_CDN_DOMAIN}/${face.faceImage}`||''}
                  alt={face.faceId || 'Unknown Person'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
          </motion.div>
          ))}
          </div>
          </div>
      </div>
      {/* Tag Dialog */}
      <Dialog open={!!tagDialog} onOpenChange={() => setTagDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Person Tag</DialogTitle>
            <DialogDescription>
              Select a person to tag in this photo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Person</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {/* Add person selection options here */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setTagDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTag} disabled={!selectedPerson || isLoading}>
              {isLoading ? "Adding..." : "Add Tag"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
