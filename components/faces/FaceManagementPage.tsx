"use client";

import { useEffect, useRef, useState } from "react";
import { PersonList } from "./PersonList";
import { FaceGrid } from "./FaceGrid";
import { EditPersonDialog } from "./EditPersonDialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

type PersonType = Schema['Persons']['type'] & {
  faces?: Schema['Faces']['type'][];
};
type FaceType = Schema['Faces']['type'] 

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  totalFaces: number;
}

interface Face {
  id: string;
  url: string;
  personId: string;
  isPrimary: boolean;
  confidence: number;
  source: {
    type: "photo" | "video";
    id: string;
    title: string;
    timestamp?: number;
  };
}

interface FaceManagementPageProps {
  userId: string | null;
  eventId: string;
}

const client = generateClient<Schema>();

export function FaceManagementPage({ userId, eventId }: FaceManagementPageProps) {
  const [selectedPerson, setSelectedPerson] = useState<PersonType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [showFilters, setShowFilters] = useState(false);
  const [draggedFaceId, setDraggedFaceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [persons, setPersons] = useState<PersonType[]>([]);


  const [personsData, setPersonsData] = useState<PersonType[]>(persons);
  // const [facesData, setFacesData] = useState<FaceType[]>(faces);
  const pageTokensCache = useRef(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [peoplePerPage, setPeoplePerPage] = useState(5);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const isFirstMount = useRef(true);
  const fetchPersons = async () => {
    setIsLoading(true);
    try {
      // First get total count of persons
      const { data: allPersons } = await client.models.Persons.list({
        filter: {
          eventId: { eq: eventId },
          isArchived: { eq: false }
        }
      });
      
      // Calculate total pages
      const totalCount = allPersons.length;
      setTotalPages(Math.ceil(totalCount / peoplePerPage));

      // Get cached token for the requested page
      const cachedToken = pageTokensCache.current.get(currentPage);
      
      const { data: persons, nextToken: newNextToken } = await client.models.Persons.list({
        filter: {
          eventId: { eq: eventId },
          isArchived: { eq: false }
        },
        limit: peoplePerPage,
        nextToken: cachedToken || null,
        sort: {
          field: 'updatedAt',
          direction: 'desc'
        }
      });
      // Then, for each person, get their faces
  const personsWithFaces = await Promise.all(
    persons.map(async (person) => {
      const { data: faces } = await client.models.Faces.list({
        filter: {
          personId: { eq: person.personId },
          isArchived: { eq: false }
        }
      });
      return { ...person, faces };
    })
  );
      
      // Cache the nextToken for the next page
      if (newNextToken) {
        pageTokensCache.current.set(currentPage + 1, newNextToken);
      }

      setPersonsData(personsWithFaces);
      setNextToken(newNextToken);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching persons :', error);
      setIsLoading(false);
    }
  };
    // Fetch total count and persons for current page
    useEffect(() => {
      // if (isFirstMount.current) {
      if (!eventId) return;
  
     
  
      fetchPersons();
    //   isFirstMount.current = false;
    // }
    }, [eventId, currentPage]);


  const handlePersonSelect = (person: PersonType) => {
    setSelectedPerson(person);
  };

  const handlePersonEdit = (person: PersonType) => {
    setSelectedPerson(person);
    setIsEditDialogOpen(true);
  };

  const handleFaceTransfer = async (faceId: string, targetPersonId: string) => {
    try {
      // Here you would make an API call to update the face's person ID
      console.log(`Transferring face ${faceId} to person ${targetPersonId}`);
      
      // Update the face counts and assignments
      
      // Show success message
      alert("Face transferred successfully!");
    } catch (error) {
      console.error("Error transferring face:", error);
      alert("Failed to transfer face. Please try again.");
    }
  };

  const handleSetPrimary = async (faceId: string) => {
    try {
      // Here you would make an API call to set the face as primary
      console.log(`Setting face ${faceId} as primary`);
      alert("Face set as primary successfully!");
    } catch (error) {
      console.error("Error setting primary face:", error);
      alert("Failed to set primary face. Please try again.");
    }
  };

  const handleRemoveFace = async (faceId: string) => {
    try {
      // Here you would make an API call to remove the face
      console.log(`Removing face ${faceId}`);
      alert("Face removed successfully!");
    } catch (error) {
      console.error("Error removing face:", error);
      alert("Failed to remove face. Please try again.");
    }
  };

  const handleFaceDrop = async (targetPersonId: string) => {
    if (draggedFaceId) {
      await handleFaceTransfer(draggedFaceId, targetPersonId);
      setDraggedFaceId(null);
    }
  };
  const handleSetCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-theme-primary">Face Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary w-4 h-4" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-theme-highlight-alpha/10" : ""}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-4 bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20">
                <div className="space-y-4">
                  <h3 className="font-medium text-theme-primary">Confidence Threshold</h3>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[confidenceThreshold]}
                      onValueChange={([value]) => setConfidenceThreshold(value)}
                      min={0}
                      max={1}
                      step={0.01}
                      className="flex-1"
                    />
                    <span className="text-sm text-theme-secondary w-12">
                      {Math.round(confidenceThreshold * 100)}%
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Only render the grid section after loading is complete */}
        {/* {!isLoading && ( */}
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1">
              <PersonList
                persons={personsData}
                selectedPerson={selectedPerson}
                onPersonSelect={handlePersonSelect}
                onPersonEdit={handlePersonEdit}
                onFaceDrop={handleFaceDrop}
                searchQuery={searchQuery}
                setCurrentPage={handleSetCurrentPage}
                currentPage={currentPage}
                peoplePerPage={peoplePerPage}
                totalPages={totalPages}
              />
            </div>
            <div className="col-span-3">
              <FaceGrid
                selectedPerson={selectedPerson}
                isLoading={isLoading}
                eventId={eventId}
                onFaceDeleted={() => fetchPersons()}
                confidenceThreshold={confidenceThreshold}
                onFaceTransfer={handleFaceTransfer}
                onSetPrimary={handleSetPrimary}
                onRemoveFace={handleRemoveFace}
              />
            </div>
          </div>
        {/* )} */}
      </div>

      <EditPersonDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        person={selectedPerson}
      />
    </div>
  );
}

