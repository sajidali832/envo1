
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let email = identifier;
      // If the identifier doesn't look like an email, assume it's a username
      if (!identifier.includes('@')) {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();
        
        if (error || !data) {
          throw new Error("Invalid credentials");
        }
        email = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
          throw error;
      }
      
      toast({
        title: "Sign In Successful",
        description: `Welcome back!`,
      });
      router.refresh(); // This will re-run the layout logic and redirect to the dashboard
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error during sign in:", error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
             <Image 
              src="/logo.png" 
              alt="EnvoEarn Logo" 
              width={48} 
              height={48} 
              className="rounded-full shadow-[0_0_15px_rgba(112,231,217,0.8)]"
            />
            <h1 className="text-3xl font-headline font-bold text-primary">ENVO-EARN</h1>
          </div>
          <CardTitle className="font-headline text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="yourname or your@email.com"
                required
              />
            </div>
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
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            First time investing?{" "}
            <Link href="/invest" className="font-semibold text-primary hover:underline">
              Start here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
