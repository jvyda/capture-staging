"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src: string;
  initials: string;
  status?: "online" | "offline" | "busy";
}

export function UserAvatar({ src, initials, status }: UserAvatarProps) {
  return (
    <div className="relative">
      <Avatar className="w-10 h-10">
        <AvatarImage src={src} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {status && (
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
            ${status === "online" ? "bg-green-500" : status === "busy" ? "bg-red-500" : "bg-gray-500"}`}
        />
      )}
    </div>
  );
}