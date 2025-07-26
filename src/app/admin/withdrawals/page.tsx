"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, arrayUnion } from "firebase/firestore";

interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  date: string;
  status: 'processing' | 'approved' | 'rejected';
  accountInfo: {
      platform: string;
      accountHolderName: string;
      accountNumber: string;
  }
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "withdrawals"), where("status", "==", "processing"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const withdrawalData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
        setWithdrawals(withdrawalData);
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (withdrawal: WithdrawalRequest, newStatus: 'approved' | 'rejected') => {
      const withdrawalDocRef = doc(db, "withdrawals", withdrawal.id);
      const userDocRef = doc(db, "users", withdrawal.userId);
      
      try {
          await runTransaction(db, async (transaction) => {
              const userDoc = await transaction.get(userDocRef);
              if (!userDoc.exists()) {
                  throw new Error("User not found!");
              }

              const existingHistory = userDoc.data().withdrawalHistory || [];
              const updatedHistory = existingHistory.map((h: any) => 
                  h.id === withdrawal.id ? { ...h, status: newStatus } : h
              );
              
              transaction.update(withdrawalDocRef, { status: newStatus });
              transaction.update(userDocRef, { withdrawalHistory: updatedHistory });

              if (newStatus === 'rejected') {
                  const currentBalance = userDoc.data().totalEarnings || 0;
                  transaction.update(userDocRef, { totalEarnings: currentBalance + withdrawal.amount });
              }
          });
          toast({ title: 'Success', description: `Withdrawal has been ${newStatus}.` });
      } catch (error: any) {
          console.error("Transaction failed: ", error);
          toast({variant: 'destructive', title: 'Error', description: error.message || 'Could not process withdrawal.'});
      }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <CardDescription>Manage all pending user withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Account Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.length > 0 ? (
                withdrawals.map(w => (
                    <TableRow key={w.id}>
                        <TableCell>{new Date(w.date).toLocaleString()}</TableCell>
                        <TableCell>{w.username}</TableCell>
                        <TableCell>PKR {w.amount.toLocaleString()}</TableCell>
                        <TableCell>
                            {w.accountInfo.platform} - {w.accountInfo.accountHolderName} ({w.accountInfo.accountNumber})
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           <Button size="sm" onClick={() => handleAction(w, 'approved')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                           <Button size="sm" variant="destructive" onClick={() => handleAction(w, 'rejected')}>Reject</Button>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={5} className="text-center">No pending withdrawal requests.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
