"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Calendar, 
  Image, 
  Video, 
  Users,
  Menu,
  X,
  User,
  Settings,
  CreditCard,
  LogOut,
  Layers
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", description: "Overview and statistics" },
  { icon: Calendar, label: "Events", path: "/events", description: "Manage your events" },
  { icon: Image, label: "Photos", path: "/photos", description: "Browse your photos" },
  { icon: Layers, label: "Frames", path: "/frames", description: "Browse extracted frames" },
  { icon: Video, label: "Videos", path: "/videos", description: "Manage your videos" },
  { icon: Users, label: "People", path: "/people", description: "Tagged people" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(pathname);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setActiveItem(pathname);
  }, [pathname]);

  const handleNavigation = (path: string) => {
    setActiveItem(path);
    router.push(path);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleSidebar}
        className="fixed top-6 left-4 lg:hidden z-50 focus-visible:ring-0 hover:bg-transparent"
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait">
          {isMobileOpen ? (
            <motion.div
              key="close"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed top-0 left-0 h-screen z-40 flex flex-col
          w-16
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-[#161418]/80 backdrop-blur-sm border-r border-theme-accent-alpha/10
        `}
        initial={false}
      >
        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col justify-center px-2 space-y-2">
          <TooltipProvider>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.path;

              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        relative w-full flex items-center justify-center rounded-lg
                        min-h-[44px]
                        hover:bg-theme-highlight-alpha/10
                        focus:outline-none
                        transition-colors
                        ${isActive ? 'text-theme-primary' : 'text-theme-secondary'}
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={item.label}
                      role="menuitem"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isActive && (
                        <motion.div
                          className="absolute left-0 w-1 h-full bg-theme-primary rounded-r"
                          layoutId="activeIndicator"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className="bg-[#312E36] border border-theme-accent-alpha/20 backdrop-blur-sm"
                  >
                    <div>
                      <p className="font-medium text-theme-primary">{item.label}</p>
                      <p className="text-xs text-theme-secondary">{item.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* User Profile */}
        <div className="p-2 mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center min-h-[44px] px-3 rounded-lg focus-visible:ring-0 hover:bg-theme-highlight-alpha/10"
              >
                <Avatar className="h-7 w-7 cursor-pointer">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&dpr=2&q=80" />
                  <AvatarFallback>JV</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#312E36] border-theme-accent-alpha/20" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleNavigation("/profile")} className="text-theme-primary">
                  <User className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/profile?tab=settings")} className="text-theme-primary">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/profile?tab=billing")} className="text-theme-primary">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span>Billing</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-theme-accent-alpha/20" />
              <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-400/10">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>
    </>
  );
}