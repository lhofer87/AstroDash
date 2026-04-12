'use client';

import { useEffect } from 'react';
import { useSpotStore } from '@/lib/stores/spot-store';

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const hydrate = useSpotStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
