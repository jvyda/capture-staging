"use client";

import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { useState } from "react";

export default function FramesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="max-w-7xl mx-auto">
      <PhotoGrid search={searchQuery} title="Frames" />
    </div>
  );
}