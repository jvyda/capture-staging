"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { motion } from "framer-motion";
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useParams } from "next/navigation";

export default function Photos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  return (
    <motion.div
      className="max-w mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PhotoGrid />
    </motion.div>
  );
}