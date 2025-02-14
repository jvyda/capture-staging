"use client";

import { useState } from "react";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { motion } from "framer-motion";

export default function Videos() {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VideoGrid />
    </motion.div>
  );
}