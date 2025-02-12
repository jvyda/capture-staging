'use client';

import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="z-50 fixed top-0 bottom-0 left-0 right-0 inset-0 flex items-center justify-center bg-background backdrop-blur-sm">
      <motion.div
        className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
