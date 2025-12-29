'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebaseInstances = useMemo(() => {
    return initializeFirebase();
  }, []);

  return <FirebaseProvider value={firebaseInstances}>{children}</FirebaseProvider>;
}
