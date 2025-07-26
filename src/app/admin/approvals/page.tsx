"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";

interface PaymentRequest {
  id: string;
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  screenshot: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export default function ApprovalsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "payments"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pendingPayments: PaymentRequest[] = [];
      querySnapshot.forEach((doc) => {
        pendingPayments.push({ id: doc.id, ...doc.data() } as PaymentRequest);
      });
      setPayments(pendingPayments);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (paymentId: string, userId: string, newStatus: "approved" | "rejected") => {
    const paymentDocRef = doc(db, "payments", paymentId);
    const userDocRef = doc(db, "users", userId);
    
    try {
      const batch = writeBatch(db);
      
      // Update payment status
      batch.update(paymentDocRef, { status: newStatus });
      
      // If approved, update user's investment status
      if (newStatus === "approved") {
        batch.update(userDocRef, { investment: 6000 });
      }

      await batch.commit();

      toast({
        title: "Success",
        description: `Payment has been ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update the payment status." });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Approvals</CardTitle>
        <CardDescription>Review and approve or reject new investment payments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.submittedAt).toLocaleString()}</TableCell>
                  <TableCell>{payment.accountHolderName}</TableCell>
                  <TableCell>{payment.accountNumber}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">View</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Payment Screenshot</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <Image src={payment.screenshot} alt="Payment Screenshot" width={800} height={600} style={{ objectFit: 'contain' }}/>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => handleAction(payment.id, payment.userId, 'approved')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(payment.id, payment.userId, 'rejected')}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No pending approvals.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
