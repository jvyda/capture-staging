"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PersonCard } from "./PersonCard";
import { Pagination } from "@/components/shared/Pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PeopleGridProps {
  filter: string;
  search: string;
  userId: string | null;
  eventId: string | null;
}
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

type PersonType = Schema['Persons']['type'] & {
  faces?: Schema['Faces']['type'][];
};
const client = generateClient<Schema>();

export function PeopleGrid({ filter, search, userId, eventId }: PeopleGridProps) {
  const [persons, setPersons] = useState<PersonType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);  
  const [nextToken, setNextToken] = useState<string | null>(null);
  const peoplePerPage = 10;
  const pageTokensCache = useRef(new Map());

   // Fetch {Persons} for current page
   useEffect(() => {
    if (!eventId) return;

    const fetchPersons = async () => {
      setIsLoading(true);
      try {
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

        setPersons(personsWithFaces);
        console.log(personsWithFaces)
        setNextToken(newNextToken);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching persons :', error);
        setIsLoading(false);
      }
    };

    fetchPersons();
  }, [eventId, currentPage]);

  // const filteredPeople = persons.filter(person => {
  //   if (search) {
  //     const searchLower = search.toLowerCase();
  //     return (
  //       person.name.toLowerCase().includes(searchLower) ||
  //       person.email.toLowerCase().includes(searchLower) ||
  //       person.phone.includes(search)
  //     );
  //   }
    
  //   switch (filter) {
  //     case "in-photos":
  //       return person.photosTotal > 0;
  //     case "in-videos":
  //       return person.totalVideos > 0;
  //     case "recent":
  //       return true; // In a real app, you'd filter by creation date
  //     case "alphabetical":
  //       return true; // Sorting handled below
  //     default:
  //       return true;
  //   }
  // });

  // if (filter === "alphabetical") {
  //   filteredPeople.sort((a, b) => a.name.localeCompare(b.name));
  // }

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const totalPages = Math.ceil(persons.length / peoplePerPage);
  const startIndex = (currentPage - 1) * peoplePerPage;
  const paginatedPeople = persons.slice(startIndex, startIndex + peoplePerPage);

  const handleDelete = (id: string) => {
    setSelectedPersonId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // Handle delete logic here
    setDeleteDialogOpen(false);
    setSelectedPersonId(null);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div 
          key={`${filter}-${search}-${currentPage}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {paginatedPeople.map((person, index) => (
            <motion.div
              key={person.personId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <PersonCard
                eventId={eventId || ''}
                userId={userId || ''}
                personId={person.personId}
                faces={person.faces || []}
                personName={person.personName || ''}
                email={person.email|| ''}
                phoneNumber={person.phoneNumber|| ''}
                thumbnail={`https://${process.env.NEXT_PUBLIC_FACE_DETECTION_THUMBNAILS_CDN_DOMAIN}/${person.thumbnail}`||''}
                onEdit={(personId) => console.log('Edit:', personId)}
                onDelete={handleDelete}
                onView={(personId) => console.log('View:', personId)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this person? This action cannot be undone.
              All associated face data will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}