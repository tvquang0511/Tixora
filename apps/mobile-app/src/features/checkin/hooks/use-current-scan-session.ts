import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { scanSessionStorage, type CurrentScanSession } from '@/features/checkin/storage/checkin-storage';

export function useCurrentScanSession() {
  const [session, setSession] = useState<CurrentScanSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadSession() {
        setIsLoading(true);

        try {
          const stored = await scanSessionStorage.getCurrentSession();
          if (active) {
            setSession(stored);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      void loadSession();

      return () => {
        active = false;
      };
    }, [])
  );

  return {
    session,
    isLoading,
    setSession,
  };
}
