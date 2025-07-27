"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Users,
  CheckCircle,
  FileKey,
  Wallet,
  UserPlus,
  LogOut,
  BarChart
} from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/admin/dashboard", icon: BarChart, label: "Dashboard" },
  { href: "/admin/approvals", icon: CheckCircle, label: "Approvals" },
  { href: "/admin/users", icon: Users, label: "All Users" },
  { href: "/admin/withdrawals", icon: Wallet, label: "Withdrawals" },
  { href: "/admin/accounts", icon: FileKey, label: "Accounts" },
  { href: "/admin/referrals", icon: UserPlus, label: "Referrals" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    router.push("/admin/login");
  }

  return (
    <div className="hidden border-r bg-card md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold font-headline">
             <Image 
              src="/logo.png" 
              alt="EnvoEarn Logo" 
              width={32} 
              height={32} 
              className="rounded-full shadow-[0_0_10px_rgba(112,231,217,0.7)]"
            />
            <span className="text-lg text-primary">Admin Panel</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
      </div>
    </div>
  )
}
