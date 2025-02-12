"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-highlight-alpha/30 to-theme-accent-alpha/30">
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-theme-primary" />
          <motion.div 
            className="relative z-20 flex items-center text-lg font-medium"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Camera className="mr-2 h-6 w-6" />
            CaptureJoy
          </motion.div>
          <motion.div 
            className="relative z-20 mt-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <blockquote className="space-y-2">
              <p className="text-lg">
                "CaptureJoy has revolutionized how we manage and organize our media. It's an essential tool for our team."
              </p>
              <footer className="text-sm">Sofia Davis, Creative Director</footer>
            </blockquote>
          </motion.div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}