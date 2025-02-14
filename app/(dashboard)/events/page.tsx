'use client';

import { useState } from 'react';
import { EventList } from '@/components/events/EventList';
import { AddEventDialog } from '@/components/events/AddEventDialog';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Events() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  return (
    <motion.div
      className="max-w mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <EventList />
      <AddEventDialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen} />
    </motion.div>
  );
}
