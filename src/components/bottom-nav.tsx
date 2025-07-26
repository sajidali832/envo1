"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, UserPlus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/withdrawal", icon: Wallet, label: "Withdrawal" },
  { href: "/referrals", icon: UserPlus, label: "Referrals" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto h-full px-4">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link href={item.href} key={item.href} className="flex flex-col items-center justify-center space-y-1 w-20">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                    isActive ? "bg-primary text-primary-foreground scale-110 shadow-lg" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
