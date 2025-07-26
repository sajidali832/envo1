"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface User {
  id: string;
  username: string;
  referredBy: string | null;
}

interface ReferralLink {
  referrer: string;
  referee: string;
}

export default function AdminReferralsPage() {
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data() as User);
        const links = users
            .filter(user => user.referredBy)
            .map(user => ({
            referrer: user.referredBy!,
            referee: user.username,
            }));
        setReferralLinks(links);
    });
    return () => unsubscribe();
  }, []);

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
