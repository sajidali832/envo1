
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Gift } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";


interface Referral {
    username: string;
    date: string;
}
interface User {
  id: string;
  username: string;
  referrals: Referral[];
}

export default function ReferralsPage() {
  const supabase = createClient();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, referrals')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error fetching referrals", error);
            } else {
                const fetchedUser = data as User;
                setUserData(fetchedUser);
                if (typeof window !== "undefined") {
                    const link = `${window.location.origin}/register?ref=${fetchedUser.username}`;
                    setReferralLink(link);
                }
            }
        }
        setLoading(false);
    };
    fetchUserData();
  }, [supabase]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalBonus = (userData?.referrals?.length || 0) * 200;

  if (loading) {
    return <div>Loading...</div>
  }

  if (!userData) {
    return <div>Could not load user data.</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Refer & Earn</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Invite friends to ENVO-EARN and earn a 200 PKR bonus for each successful referral. Plus, you need two referrals to unlock withdrawals!
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-2">
          <Input value={referralLink} readOnly />
          <Button onClick={handleCopy} className="w-full sm:w-auto font-bold">
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? "Copied" : "Copy Link"}
          </Button>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{userData?.referrals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">friends joined through your link</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referral Bonus</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">PKR {totalBonus.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">earned from your referrals</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Date Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userData?.referrals && userData.referrals.length > 0 ? (
                userData.referrals.map((ref, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{ref.username}</TableCell>
                    <TableCell className="text-right">{new Date(ref.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">You haven't referred anyone yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
