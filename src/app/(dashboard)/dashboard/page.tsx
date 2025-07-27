
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

interface Earning {
  amount: number;
  date: string;
  type?: string;
}

interface User {
  id: string;
  username: string;
  investment: number;
  earnings: Earning[];
  total_earnings: number;
  registration_date: string;
  last_earning_date: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          setIsLoading(false);
          return;
        }

        let fetchedUserData = profileData as User;

        // Daily earning logic
        const lastEarningDate = new Date(fetchedUserData.last_earning_date || fetchedUserData.registration_date);
        const today = new Date();
        
        const isDifferentDay = today.setHours(0,0,0,0) > lastEarningDate.setHours(0,0,0,0);

        if (isDifferentDay) {
          const timeDiff = today.getTime() - lastEarningDate.getTime();
          const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));
          
          if (daysPassed > 0) {
            const earningsToAdd = daysPassed * 200;
            const newEarningsHistory: Earning[] = [];

            for (let i = 1; i <= daysPassed; i++) {
              const earningDate = new Date(lastEarningDate);
              earningDate.setDate(lastEarningDate.getDate() + i);
              newEarningsHistory.push({ amount: 200, date: earningDate.toISOString(), type: 'Daily Return' });
            }

            const currentTotalEarnings = fetchedUserData.total_earnings || 0;
            const currentEarnings = fetchedUserData.earnings || [];
            
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({
                total_earnings: currentTotalEarnings + earningsToAdd,
                earnings: [...newEarningsHistory, ...currentEarnings],
                last_earning_date: today.toISOString()
              })
              .eq('id', user.id)
              .select()
              .single();

            if (updateError) {
                console.error("Error updating earnings:", updateError);
            } else {
                fetchedUserData = updatedProfile as User;
            }
          }
        }
        setUserData(fetchedUserData);
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  if (isLoading) {
    return <div>Loading user data...</div>;
  }
  
  if (!userData) {
      return <div>Could not load user data.</div>
  }

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">Welcome, {userData.username}!</h1>
        <p className="text-muted-foreground">Here's your financial overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{formatCurrency(userData.investment)}</div>
            <p className="text-xs text-muted-foreground">Your initial investment</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{formatCurrency(userData.total_earnings)}</div>
            <p className="text-xs text-primary-foreground/70">All earnings including bonuses</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Earning History</CardTitle>
          <CardDescription>A log of all your daily returns and bonuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userData.earnings && userData.earnings.length > 0 ? (
                userData.earnings.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((earning, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(earning.date)}</TableCell>
                    <TableCell className="font-medium">{earning.type || 'Daily Return'}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      + {formatCurrency(earning.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Your first earning will appear tomorrow.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
