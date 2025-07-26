"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const correctPassword = "Sajid092#d";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password === correctPassword) {
      try {
        sessionStorage.setItem("isAdminLoggedIn", "true");
        toast({
          title: "Login Successful",
          description: "Welcome to the Admin Panel.",
        });
        router.replace("/admin/dashboard");
      } catch (error) {
        console.error("Session storage error:", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Could not start a session. Please enable session storage.",
        });
        setIsLoading(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Incorrect password.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Admin Panel</CardTitle>
          <CardDescription>Enter the password to access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? "Logging In..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
