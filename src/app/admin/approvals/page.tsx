
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface PaymentRequest {
  id: string;
  user_id: string;
  account_holder_name: string;
  account_number: string;
  screenshot: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

export default function ApprovalsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchPayments = async () => {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('status', 'pending');
        
        if (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch pending payments." });
        } else {
            setPayments(data as PaymentRequest[]);
        }
    }

    fetchPayments();

    const channel = supabase.channel('realtime-payments-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: 'status=eq.pending' }, (payload) => {
        fetchPayments();
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }

  }, [supabase, toast]);

  const handleAction = async (paymentId: string, userId: string, newStatus: "approved" | "rejected") => {
    
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);
      
      if (paymentError) throw paymentError;

      // If approved, update user's investment status
      if (newStatus === "approved") {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ investment: 6000 })
            .eq('id', userId);
        
        if (profileError) throw profileError;
      }

      toast({
        title: "Success",
        description: `Payment has been ${newStatus}.`,
      });
      // The real-time subscription will update the UI
    } catch (error: any) {
      console.error("Error updating status: ", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Could not update the payment status." });
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
                  <TableCell>{new Date(payment.submitted_at).toLocaleString()}</TableCell>
                  <TableCell>{payment.account_holder_name}</TableCell>
                  <TableCell>{payment.account_number}</TableCell>
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
                    <Button size="sm" onClick={() => handleAction(payment.id, payment.user_id, 'approved')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(payment.id, payment.user_id, 'rejected')}>Reject</Button>
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
