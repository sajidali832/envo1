
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const isAdmin = sessionStorage.getItem("isAdminLoggedIn") === "true";
      if (isAdmin) {
        setIsVerified(true);
      } else {
        setIsVerified(false);
        if (pathname !== "/admin/login") {
            router.replace("/admin/login");
        }
      }
    } catch (error) {
      setIsVerified(false);
      router.replace("/admin/login");
    }
  }, [router, pathname]);

  if (isVerified === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-secondary">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!isVerified) {
    // If not verified, and on the login page, show the children (the login page itself)
    // without the admin sidebar.
    if (pathname === "/admin/login") {
        return <>{children}</>
    }
    // This part should theoretically not be reached due to the redirect above,
    // but it's a fallback.
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-secondary">
        {children}
      </main>
    </div>
  );
}
