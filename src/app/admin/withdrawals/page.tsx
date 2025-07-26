
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  submitted_at: string;
  status: 'processing' | 'approved' | 'rejected';
  account_info: {
      platform: string;
      accountHolderName: string;
      accountNumber: string;
  }
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchWithdrawals = async () => {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('status', 'processing')
            .order('submitted_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch withdrawals.' });
        } else {
            setWithdrawals(data as WithdrawalRequest[]);
        }
    };
    
    fetchWithdrawals();

    const channel = supabase.channel('realtime-withdrawals-processing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: 'status=eq.processing' }, (payload) => {
        fetchWithdrawals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [supabase, toast]);

  const handleAction = async (withdrawal: WithdrawalRequest, newStatus: 'approved' | 'rejected') => {
      
      try {
          const { error } = await supabase.rpc('handle_withdrawal', {
              request_id: withdrawal.id,
              new_status: newStatus
          });

          if (error) throw error;
          
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
                        <TableCell>{new Date(w.submitted_at).toLocaleString()}</TableCell>
                        <TableCell>{w.username}</TableCell>
                        <TableCell>PKR {w.amount.toLocaleString()}</TableCell>
                        <TableCell>
                            {w.account_info.platform} - {w.account_info.accountHolderName} ({w.account_info.accountNumber})
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
