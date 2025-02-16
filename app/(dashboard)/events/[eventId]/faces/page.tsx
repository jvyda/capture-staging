"use client";

import { FaceManagementPage } from "@/components/faces/FaceManagementPage";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

export default function FacesPage() {
const params = useParams();

  const eventId = params?.eventId as string;
  const [userId, setUserId] = useState<string | null>(null);
  const isFirstMount = useRef(true);


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
  return <FaceManagementPage userId={userId} eventId={eventId} />;
}