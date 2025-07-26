"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/approvals");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting to approvals...</p>
    </div>
  );
}
