
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, LogOut as LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  username: string;
  email: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', user.id)
          .single();
        
        if (error) {
            console.error("Error fetching profile", error);
        } else {
            setUserProfile(profile);
        }
      }
      setLoading(false);
    };
    fetchUserProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/signin");
    router.refresh();
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!userProfile) {
    return <div>User not found.</div>
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your account details.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-2xl">
              <AvatarFallback>{getInitials(userProfile.username)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-headline">{userProfile.username}</CardTitle>
              <CardDescription>Account Information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center gap-4 p-3 rounded-md bg-secondary">
             <Mail className="h-5 w-5 text-muted-foreground"/>
             <span className="text-foreground">{userProfile.email}</span>
           </div>
           <div className="flex items-center gap-4 p-3 rounded-md bg-secondary">
             <User className="h-5 w-5 text-muted-foreground"/>
             <span className="text-foreground">{userProfile.username}</span>
           </div>
        </CardContent>
      </Card>
      
      <Button onClick={handleLogout} variant="destructive" className="w-full font-bold">
        <LogOutIcon className="mr-2 h-4 w-4" />
        Log Out
      </Button>

    </div>
  );
}
