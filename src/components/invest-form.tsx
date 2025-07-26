
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Info, Copy, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';


export default function InvestForm() {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const easypaisaNumber = "03130306344";
  const supabase = createClient();
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            setUser(data.user);
        } else {
            router.push('/signin');
        }
        setAuthLoading(false);
    }
    getUser();
  }, [router, supabase.auth]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(easypaisaNumber);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Easypaisa number copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setPaymentScreenshot(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file.",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accountHolderName || !accountNumber || !paymentScreenshot || !user) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill all fields and upload a screenshot.",
      });
      return;
    }

    setIsLoading(true);

    try {
        // 1. Upload screenshot to Supabase Storage
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `${user.id}-${uuidv4()}.${fileExt}`;
        const filePath = `payment-screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('app-files') // Make sure you have a bucket named 'app-files'
            .upload(filePath, paymentScreenshot);

        if (uploadError) throw uploadError;

        // 2. Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
            .from('app-files')
            .getPublicUrl(filePath);
        
        const screenshotPublicUrl = urlData.publicUrl;

        // 3. Save payment details to 'payments' table in Supabase
        const paymentId = uuidv4();
        const { error: dbError } = await supabase
            .from('payments')
            .insert({
                id: paymentId,
                user_id: user.id,
                account_holder_name: accountHolderName,
                account_number: accountNumber,
                payment_platform: "Easypaisa",
                screenshot: screenshotPublicUrl,
                status: "pending",
                submitted_at: new Date().toISOString(),
            });

        if (dbError) throw dbError;

        sessionStorage.setItem("currentPaymentId", paymentId);
        
        toast({
          title: "Payment Submitted",
          description: "Your payment is under review. You will be redirected shortly.",
        });
        
        router.push("/timer");

    } catch (error: any) {
        console.error("Failed to submit payment", error);
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: error.message || "Could not submit your payment. Please try again.",
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Submit Payment Proof</CardTitle>
          <CardDescription className="text-center">Follow the steps below to complete your investment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-primary/10 border-primary/20 mb-6">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="font-headline text-primary">Payment Instructions</AlertTitle>
            <AlertDescription className="text-primary/80">
              <p className="font-bold">Send 6000 PKR to:</p>
              <p>Platform: <span className="font-semibold">Easypaisa</span></p>
              <p>Name: <span className="font-semibold">Zulekhan</span></p>
              <div className="flex items-center gap-2">
                <p>Number: <span className="font-semibold">{easypaisaNumber}</span></p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Your Account Holder's Name</Label>
              <Input
                id="accountHolderName"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="e.g. Ali Khan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Your Account Number</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 03xxxxxxxxx"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screenshot">Upload Payment Screenshot</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="file:text-primary file:font-semibold"
              />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
