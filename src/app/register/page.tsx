"use client";

import { Suspense } from 'react';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction, collection, where, query, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const paymentId = sessionStorage.getItem("currentPaymentId");
    if (!paymentId) {
      toast({ variant: "destructive", title: "Access Denied", description: "Please submit a payment first." });
      router.push("/invest");
      return;
    }

    const checkPayment = async () => {
        try {
            const paymentRef = doc(db, "payments", paymentId);
            const paymentSnap = await getDoc(paymentRef);
            if (!paymentSnap.exists() || paymentSnap.data().status !== 'approved') {
                toast({ variant: "destructive", title: "Access Denied", description: "Your payment is not approved yet." });
                router.push("/timer");
            }
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Could not verify payment status." });
            router.push("/invest");
        }
    };
    checkPayment();
  }, [router, toast]);

  const validateField = async (field: "username" | "email", value: string) => {
    if (field === "username") {
      const q = query(collection(db, "users"), where("username", "==", value));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUsernameError("Username already exists.");
      } else {
        setUsernameError("");
      }
    } else if (field === "email") {
       const q = query(collection(db, "users"), where("email", "==", value));
       const querySnapshot = await getDocs(q);
       if (!querySnapshot.empty) {
        setEmailError("Email already registered.");
      } else {
        setEmailError("");
      }
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await validateField("username", username);
    await validateField("email", email);

    if (usernameError || emailError || !username || !email || !password) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Please fix the errors and fill all fields.",
      });
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const ref = searchParams.get('ref');

      const newUser = {
        id: user.uid,
        username,
        email,
        investment: 6000,
        earnings: [],
        totalEarnings: 0,
        withdrawalInfo: null,
        withdrawalHistory: [],
        referrals: [],
        referredBy: ref || null,
        canWithdrawOverride: false,
        registrationDate: new Date().toISOString(),
        lastEarningDate: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", user.uid), newUser);
      
      // Handle referral bonus
      if (ref) {
        await runTransaction(db, async (transaction) => {
            const usersQuery = query(collection(db, "users"), where("username", "==", ref));
            const referringUserSnapshot = await getDocs(usersQuery);
            if (!referringUserSnapshot.empty) {
                const referringUserDoc = referringUserSnapshot.docs[0];
                const referringUserRef = doc(db, "users", referringUserDoc.id);

                const referralBonus = { amount: 200, date: new Date().toISOString(), type: 'Referral Bonus' };
                const newReferral = { username: newUser.username, date: new Date().toISOString() };
                
                const currentEarnings = referringUserDoc.data().totalEarnings || 0;
                const currentEarningsHistory = referringUserDoc.data().earnings || [];
                const currentReferrals = referringUserDoc.data().referrals || [];

                transaction.update(referringUserRef, {
                    totalEarnings: currentEarnings + 200,
                    earnings: [...currentEarningsHistory, referralBonus],
                    referrals: [...currentReferrals, newReferral]
                });
            }
        });
      }
      
      sessionStorage.removeItem("currentPaymentId");

      toast({
          title: "Registration Successful!",
          description: "Welcome to ENVO-EARN. You are now logged in.",
      });
      router.push("/dashboard");

    } catch (error: any) {
        console.error("Registration failed:", error);
        if (error.code === 'auth/email-already-in-use') {
            setEmailError("This email address is already in use.");
        }
        toast({ variant: "destructive", title: "Error", description: error.message || "Something went wrong." });
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
        <CardDescription>Congratulations on your approval! Let's get you set up.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onBlur={(e) => validateField("username", e.target.value)}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <p className="text-sm text-destructive">{usernameError}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onBlur={(e) => validateField("email", e.target.value)}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={isLoading || !!usernameError || !!emailError}>
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterPageSkeleton() {
    return (
        <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full mt-2" />
        </CardContent>
        </Card>
    )
}

const DynamicRegisterForm = dynamic(() => Promise.resolve(RegisterForm), {
    ssr: false,
    loading: () => <RegisterPageSkeleton />
});

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
           <Suspense fallback={<RegisterPageSkeleton />}>
                <DynamicRegisterForm />
           </Suspense>
        </div>
    )
}
