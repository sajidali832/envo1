
"use client";

import { Suspense } from 'react';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();
  const [paymentUserId, setPaymentUserId] = useState<string | null>(null);

  // Client-side check for payment approval
  useEffect(() => {
    const paymentId = sessionStorage.getItem("currentPaymentId");
    if (!paymentId) {
      toast({ variant: "destructive", title: "Access Denied", description: "Please submit a payment first." });
      router.push("/invest");
      return;
    }

    const checkPayment = async () => {
        try {
            const {data, error} = await supabase
                .from('payments')
                .select('status, user_id')
                .eq('id', paymentId)
                .single();

            if (error || !data) {
                throw new Error("Could not verify payment.");
            }
            if (data.status !== 'approved') {
                 toast({ variant: "destructive", title: "Access Denied", description: "Your payment has not been approved yet." });
                 router.push("/timer");
                 return;
            }
            // Store the temporary user_id from the payment record
            setPaymentUserId(data.user_id);
        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: e.message || "Could not verify payment status." });
            router.push("/invest");
        }
    };
    checkPayment();
  }, [router, toast, supabase]);

  const validateField = async (field: "username" | "email", value: string) => {
    if (!value) return;
    if (field === "username") {
      const { data } = await supabase.from('profiles').select('id').eq('username', value);
      if (data && data.length > 0) {
        setUsernameError("Username already exists.");
      } else {
        setUsernameError("");
      }
    } else if (field === "email") {
      // Supabase auth handles email uniqueness automatically, but a check here is good for UX
       const { data } = await supabase.from('profiles').select('id').eq('email', value);
       if (data && data.length > 0) {
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

    if (usernameError || emailError || !username || !email || !password || !paymentUserId) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Please fix the errors and fill all fields.",
      });
      return;
    }
    setIsLoading(true);

    try {
      // Step 1: Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed: no user returned.");
      
      const user = authData.user;
      const ref = searchParams.get('ref');

      // Step 2: Create a profile in the 'profiles' table, replacing the temp id with the real one.
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id, // The real auth user ID
          temp_id: paymentUserId, // The temporary ID from payment
          username,
          email,
          investment: 6000,
          total_earnings: 0,
          referred_by: ref || null,
          can_withdraw_override: false,
          registration_date: new Date().toISOString(),
          last_earning_date: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Handle referral bonus
      if (ref) {
        await supabase.rpc('add_referral_and_bonus', { referrer_username: ref, new_user_id: user.id, new_user_username: username });
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

// Dynamically import the RegisterForm ONLY on the client side.
const DynamicRegisterForm = dynamic(() => Promise.resolve(RegisterForm), {
    ssr: false,
    loading: () => <RegisterPageSkeleton />
});

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
           {/* Suspense is required by Next.js when using useSearchParams */}
           <Suspense fallback={<RegisterPageSkeleton />}>
                <DynamicRegisterForm />
           </Suspense>
        </div>
    )
}
