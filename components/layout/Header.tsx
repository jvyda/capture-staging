"use client";

import { Search, Bell, RotateCcw, User, Settings, CreditCard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl mt-4"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-theme-accent-alpha/20">
          <div className="flex items-center justify-between py-2 px-4">
            <div className="flex items-center space-x-8">
              <img src="/logo.svg" alt="CaptureJoy" className="h-6" />
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-1.5 hover:bg-theme-highlight-alpha/20 rounded-full transition-colors">
                <Search className="w-4 h-4 text-theme-primary" />
              </button>
              <button className="p-1.5 hover:bg-theme-highlight-alpha/20 rounded-full transition-colors">
                <Bell className="w-4 h-4 text-theme-primary" />
              </button>
              <button className="p-1.5 hover:bg-theme-highlight-alpha/20 rounded-full transition-colors">
                <RotateCcw className="w-4 h-4 text-theme-primary" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="h-7 w-7 cursor-pointer ring-2 ring-theme-accent-alpha/20 hover:ring-theme-accent transition-all">
                      <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&dpr=2&q=80" />
                      <AvatarFallback>JV</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/90" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Jane Doe</p>
                      <p className="text-xs leading-none text-muted-foreground">jane.doe@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                      <User className="w-4 h-4 mr-2" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigation("/profile?tab=settings")}>
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigation("/profile?tab=billing")}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}