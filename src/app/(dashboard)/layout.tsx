'use client';

import React, { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Aap yahan ek loading spinner ya skeleton UI dikha sakte hain
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 lg:p-6">{children}</main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}