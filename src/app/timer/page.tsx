
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

function TimerComponent() {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "timedout">("pending");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const paymentId = sessionStorage.getItem("currentPaymentId");
    if (!paymentId) {
      toast({ variant: "destructive", title: "Error", description: "No payment submission found." });
      router.push("/invest");
      return;
    }

    // Countdown timer logic
    const countdownTimer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(countdownTimer);
          if (status === 'pending') {
             setStatus("timedout");
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Supabase real-time subscription
    const channel = supabase
      .channel(`payment-status-${paymentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `id=eq.${paymentId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === "approved" || newStatus === "rejected") {
            setStatus(newStatus);
            channel.unsubscribe();
            clearInterval(countdownTimer);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(countdownTimer);
      supabase.removeChannel(channel);
    };
  }, [router, toast, status, supabase]);
  
  useEffect(() => {
    if (status === "approved") {
      toast({ title: "Success!", description: "Your payment has been approved." });
      router.push("/register");
    } else if (status === "rejected") {
      sessionStorage.removeItem("currentPaymentId");
      toast({ variant: "destructive", title: "Payment Rejected", description: "Please contact support or try again." });
      router.push("/invest");
    }
  }, [status, router, toast]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getStatusContent = () => {
    switch (status) {
      case "pending":
        return {
          title: "Awaiting Approval",
          description: "Your payment is being reviewed. This should take less than 10 minutes.",
          content: (
            <div className="text-6xl font-bold font-headline text-primary my-4 animate-pulse">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          )
        };
      case "approved":
        return {
          title: "Payment Approved!",
          description: "Redirecting you to create your account...",
          content: <div className="text-green-500 font-bold my-4">Approved</div>
        };
      case "rejected":
        return {
          title: "Payment Rejected",
          description: "There was an issue with your payment. Redirecting...",
          content: <div className="text-destructive font-bold my-4">Rejected</div>
        };
      case "timedout":
         return {
          title: "Still Pending...",
          description: "Approval is taking longer than usual. Please wait, the page will update automatically when the status changes.",
          content: <div className="text-muted-foreground font-bold my-4">Please Wait</div>
        };
      default:
        return { title: "", description: "" };
    }
  };

  const { title, description, content } = getStatusContent();

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {content}
           {status === 'pending' && (
             <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(timeLeft / 600) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function TimerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TimerComponent />
        </Suspense>
    )
}
