"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function TimerPage() {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "timedout">("pending");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const paymentId = sessionStorage.getItem("currentPaymentId");
    if (!paymentId) {
      toast({ variant: "destructive", title: "Error", description: "No payment submission found." });
      router.push("/invest");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (status === 'pending') {
             setStatus("timedout");
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    const paymentDocRef = doc(db, "payments", paymentId);
    const unsubscribe = onSnapshot(paymentDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const currentStatus = docSnap.data().status;
            if (currentStatus === "approved") {
                setStatus("approved");
                clearInterval(timer);
            } else if (currentStatus === "rejected") {
                setStatus("rejected");
                clearInterval(timer);
            }
        }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [router, toast, status]);
  
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
