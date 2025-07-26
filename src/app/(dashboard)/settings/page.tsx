"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, LogOut as LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";


interface UserProfile {
  username: string;
  email: string;
}

export default function SettingsPage() {
  const [currentUser, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/signin");
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
