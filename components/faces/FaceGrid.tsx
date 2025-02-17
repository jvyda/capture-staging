"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import SimpleBar from 'simplebar-react';
import type { Schema } from '@/amplify/data/resource';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { generateClient } from 'aws-amplify/data';
import { DeleteFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";

const client = generateClient<Schema>();

const rekognitionClient = new RekognitionClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
  }
});

type FaceType = Schema['Faces']['type'] 
type PersonType = Schema['Persons']['type'] & {
  faces?: Schema['Faces']['type'][];
};
interface FaceGridProps {
  selectedPerson: PersonType | null;
  isLoading: boolean;
  onFaceDeleted?: () => void;
  eventId: string;
  confidenceThreshold: number;
  onFaceTransfer?: (faceId: string, targetPersonId: string) => void;
  onSetPrimary?: (faceId: string) => void;
  onRemoveFace?: (faceId: string) => void;
}

export function FaceGrid({ selectedPerson, isLoading, onFaceDeleted, eventId, confidenceThreshold, onFaceTransfer, onSetPrimary, onRemoveFace }: FaceGridProps) {
  const handleDeleteFace = async (face: FaceType) => {
    if (!face.awsFaceId) {
      console.error('Cannot delete face: awsFaceId is missing');
      return;
    }

    try {
      // Step 1: Delete face from AWS Rekognition Collection
      const deleteCommand = new DeleteFacesCommand({
        CollectionId: eventId,
        FaceIds: [face.awsFaceId]
      });
      await rekognitionClient.send(deleteCommand);

      // Step 2: Update Photos and Frames that reference this face
      // Get all photos and frames that have this face
      const { data: photos } = await client.models.Photos.list({
        filter: {
          eventId: { eq: eventId },
          isArchived: { eq: false }
        }
      });

      const { data: frames } = await client.models.Frames.list({
        filter: {
          eventId: { eq: eventId },
          isArchived: { eq: false }
        }
      });

      // Update Photos
      for (const photo of photos) {
        if (photo.taggedFaces) {
          const taggedFaces = JSON.parse(photo.taggedFaces as string);
          const updatedTaggedFaces = taggedFaces.filter((tf: any) => tf.faceId !== face.faceId);
          
          await client.models.Photos.update({
            photoId: photo.photoId,
            taggedFaces: JSON.stringify(updatedTaggedFaces),
            taggedFacesCount: updatedTaggedFaces.length
          });
        }
      }

      // Update Frames
      for (const frame of frames) {
        if (frame.taggedFaces) {
          const taggedFaces = JSON.parse(frame.taggedFaces as string);
          const updatedTaggedFaces = taggedFaces.filter((tf: any) => tf.faceId !== face.faceId);
          
          await client.models.Frames.update({
            frameId: frame.frameId,
            taggedFaces: JSON.stringify(updatedTaggedFaces),
            taggedFacesCount: updatedTaggedFaces.length
          });
        }
      }

      // Step 3: Delete the face from Faces table
      await client.models.Faces.delete({
        faceId: face.faceId,
      });

      // Step 4: Check if person has any remaining faces
      const { data: remainingFaces } = await client.models.Faces.list({
        filter: {
          personId: { eq: face.personId || undefined},
          isArchived: { eq: false }
        }
      });

      // If no faces remain, delete the person
      if (remainingFaces.length === 0 && face.personId) {
        await client.models.Persons.delete({
          personId: face.personId,
        });
      }

      // Step 5: Notify parent component to refresh the data
      onFaceDeleted?.();

    } catch (error) {
      console.error('Error deleting face:', error);
      // TODO: Add proper error handling/notification
    }
  };

  return (
    <Card className="flex-1 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
      <SimpleBar className="h-[calc(100vh-12rem)]">
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            {selectedPerson?.faces?.map((face:FaceType) => (
              <motion.div
                key={face.faceId}
                className="relative aspect-square rounded-lg overflow-hidden group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Image
                  src={`https://${process.env.NEXT_PUBLIC_FACE_DETECTION_THUMBNAILS_CDN_DOMAIN}/${face.faceImage}`||''}
                  alt={face.person?.name || 'Unknown Person'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Face Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="font-medium truncate">
                      {face.person?.name || 'Unknown Person'}
                    </p>
                    <p className="text-sm text-white/80">
                      Confidence: {Math.round(face.confidence||0 )}%
                    </p>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFace(face);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && selectedPerson?.faces.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No faces found</p>
            </div>
          )}
        </div>
      </SimpleBar>
    </Card>
  );
}