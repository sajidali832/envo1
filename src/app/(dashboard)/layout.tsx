"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "@/lib/firebase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-16 w-full fixed bottom-0 left-0 right-0 rounded-none" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
