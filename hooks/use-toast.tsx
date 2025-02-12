import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: 'default' | 'destructive';
  } | null>(null);

  const toastFn = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setToast({ title, description, variant });
  };

  return { toast, toastFn };
}