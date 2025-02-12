"use client";

import { useState } from "react";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { motion } from "framer-motion";

export default function Videos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VideoGrid filter={selectedFilter} search={searchQuery} onFilterChange={setSelectedFilter} />
    </motion.div>
  );
}