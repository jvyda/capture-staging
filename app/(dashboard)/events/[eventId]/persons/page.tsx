"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/shared/SearchBar";
import { PeopleGrid } from "@/components/people/PeopleGrid";
import { PeopleFilterBar } from "@/components/people/PeopleFilterBar";
import { AddPersonDialog } from "@/components/people/AddPersonDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useParams } from "next/navigation";
const client = generateClient<Schema>();
type Person = Schema['Persons']['type'];
type Face = Schema['Faces']['type'];
type PersonsWithFaces = Person & {
  faces: Array<Face>;
};


type PersonType = Schema['Persons']['type'] & {
  faces?: Schema['Faces']['type'][];
};
export default function People() {
  const params = useParams();
  const isFirstMount = useRef(true);

  const eventId = params?.eventId as string;
  const [userId, setUserId] = useState<string | null>(null);
   // Fetch current user's ID when component mounts
   useEffect(() => {
    if (isFirstMount.current) {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
        console.log(user.userId)
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserId();
    isFirstMount.current = false;
  }
  }, [userId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const peoplePerPage = 12;
  const pageTokensCache = useRef(new Map());
  const [persons, setPersons] = useState<PersonsWithFaces[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);


  

 
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
            nextToken: cachedToken || null
          });
          // Then, for each person, get their faces
      const personsWithFaces: any = await Promise.all(
        persons.map(async (person) => {
          const { data: faces } = await client.models.Faces.list({
            filter: {
              personId: { eq: person.personId },
              isArchived: { eq: false }
            }
          });
          return { ...person, faces:faces || [] };
        })
      );
          
          // Cache the nextToken for the next page
          if (newNextToken) {
            pageTokensCache.current.set(currentPage + 1, newNextToken);
          }
  
          setPersons(personsWithFaces);
          setNextToken(newNextToken || null);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching persons :', error);
          setIsLoading(false);
        }
      };
  
      fetchPersons();
    }, [eventId, currentPage]);
  

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-theme-primary">People</h1>
        <div className="flex items-center gap-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Button
            onClick={() => setIsAddPersonOpen(true)}
            className="bg-theme-primary hover:bg-theme-primary-alpha/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      <PeopleFilterBar selected={selectedFilter} onSelect={setSelectedFilter} />
      
      <div className="mt-6">
        <PeopleGrid filter={selectedFilter} search={searchQuery} eventId={eventId} userId={userId} />
      </div>

      <AddPersonDialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen} />
    </motion.div>
  );
}