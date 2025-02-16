"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import SimpleBar from 'simplebar-react';
import Image from "next/image";

interface PersonConnectionsProps {
  personId: string;
}

export function PersonConnections({ personId }: PersonConnectionsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with API calls
  const connections = [
    {
      person: {
        id: "2",
        name: "Michael Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&q=80",
      },
      appearances: 15,
      lastSeen: "2024-03-14T15:45:00Z",
      events: [
        "Team Meeting",
        "Product Launch",
        "Company Event",
      ],
    },
    {
      person: {
        id: "3",
        name: "Emma Wilson",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&q=80",
      },
      appearances: 8,
      lastSeen: "2024-03-13T09:15:00Z",
      events: [
        "Marketing Meeting",
        "Team Building",
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-theme-primary">Frequently Appears With</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <SimpleBar style={{ maxHeight: "calc(100vh - 24rem)" }}>
        <div className="grid gap-4">
          {connections
            .filter(conn => 
              conn.person.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((connection) => (
              <Card 
                key={connection.person.id}
                className="p-4 bg-white/50 backdrop-blur-sm border-theme-accent-alpha/20"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={connection.person.avatar}
                      alt={connection.person.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-theme-primary">
                      {connection.person.name}
                    </h4>
                    <div className="text-sm text-theme-secondary mt-1">
                      {connection.appearances} appearances together
                    </div>
                    <div className="text-sm text-theme-secondary">
                      Last seen: {new Date(connection.lastSeen).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <div className="text-xs text-theme-secondary">
                      Common events: {connection.events.join(", ")}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </SimpleBar>
    </div>
  );
}