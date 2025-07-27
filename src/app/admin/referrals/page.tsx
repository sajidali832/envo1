
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  username: string;
  referred_by: string | null;
  referrer_username?: string;
}

interface ReferralLink {
  referrer: string;
  referee: string;
}

export default function AdminReferralsPage() {
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchReferrals = async () => {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('username, referred_by');

        if (error || !users) {
            console.error("Could not fetch referrals", error);
            return;
        }

        const referees = users.filter(u => u.referred_by);

        const links = referees.map(referee => ({
            referrer: referee.referred_by!, // At this point referred_by is guaranteed to exist
            referee: referee.username
        }));
        
        setReferralLinks(links);
    };

    fetchReferrals();

    const channel = supabase.channel('realtime-referrals')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
            fetchReferrals();
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }
  }, [supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Tracking</CardTitle>
        <CardDescription>View all referral relationships on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Referred By</TableHead>
              <TableHead></TableHead>
              <TableHead className="text-center">Referred User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referralLinks.length > 0 ? (
              referralLinks.map((link, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center font-medium">{link.referrer}</TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 mx-auto text-primary" />
                  </TableCell>
                  <TableCell className="text-center font-medium">{link.referee}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No referrals have been made yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
