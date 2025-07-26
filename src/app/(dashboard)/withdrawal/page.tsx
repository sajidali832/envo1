
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WithdrawalInfo {
  platform: string;
  accountHolderName: string;
  accountNumber: string;
}

interface WithdrawalHistory {
    id: string;
    amount: number;
    date: string;
    status: 'processing' | 'approved' | 'rejected';
}

interface User {
  id: string;
  username: string;
  total_earnings: number;
  withdrawal_info: WithdrawalInfo | null;
  withdrawal_history: WithdrawalHistory[];
  referrals: any[];
  can_withdraw_override?: boolean;
}

export default function WithdrawalPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<WithdrawalInfo>({
    platform: "",
    accountHolderName: "",
    accountNumber: "",
  });
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    };

    const userChannel = supabase
      .channel(`public:profiles:id=eq.${currentUser.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        setUserData(payload.new as User);
      })
      .subscribe();

      const fetchInitialData = async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        if (error) {
            console.error("Error fetching user data", error);
            setLoading(false);
        } else {
            const user = data as User;
            setUserData(user);
            if (user.withdrawal_info) {
              setInfo(user.withdrawal_info);
              setIsEditingInfo(false);
            } else {
              setIsEditingInfo(true);
            }

            const hasSeenPopup = localStorage.getItem('hasSeenWithdrawalPopup');
            if (user.referrals.length < 2 && !hasSeenPopup) {
                setShowReferralPopup(true);
                localStorage.setItem('hasSeenWithdrawalPopup', 'true');
            }
            setLoading(false);
        }
      }
      fetchInitialData();


    return () => {
        supabase.removeChannel(userChannel);
    }
  }, [currentUser, supabase]);
  
  const handleSaveInfo = async () => {
    if (!currentUser) return;
    if (!info.platform || !info.accountHolderName || !info.accountNumber) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
      return;
    }
    
    const { error } = await supabase
        .from('profiles')
        .update({ withdrawal_info: info })
        .eq('id', currentUser.id);

    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save information.'});
    } else {
        setIsEditingInfo(false);
        toast({ title: "Success", description: "Withdrawal information saved.", className: "bg-green-500 text-white" });
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser || !userData) return;
    if (userData.referrals.length < 2 && !userData.can_withdraw_override) {
        toast({ variant: "destructive", title: "Withdrawal Locked", description: "You need 2 successful referrals to withdraw." });
        return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 600 || numAmount > 1600) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Withdrawal must be between 600 and 1600 PKR." });
      return;
    }
    if (numAmount > userData.total_earnings) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: "You cannot withdraw more than you have earned." });
      return;
    }

    const newWithdrawalRequest = {
      user_id: currentUser.id,
      username: userData.username,
      amount: numAmount,
      submitted_at: new Date().toISOString(),
      status: 'processing' as const,
      account_info: userData.withdrawal_info
    };
    
    const { error } = await supabase.rpc('request_withdrawal', {
        request_data: newWithdrawalRequest,
        amount_to_deduct: numAmount
    });

    if (error) {
        console.error("Error requesting withdrawal:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not submit withdrawal request." });
    } else {
        setAmount("");
        toast({ title: "Request Submitted", description: "Your withdrawal request is being processed." });
    }
  };

  const getStatusBadge = (status: 'processing' | 'approved' | 'rejected') => {
      switch(status) {
          case 'approved': return <Badge variant="default" className="bg-green-500">Approved</Badge>;
          case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
          case 'processing':
          default:
            return <Badge variant="secondary">Processing</Badge>;
      }
  }

  if (loading) {
      return <div>Loading...</div>
  }

  if (!userData) {
      return <div>Could not load user data. Please try again.</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">Withdraw Earnings</h1>
      </header>

      {showReferralPopup && (
         <AlertDialog defaultOpen={true} onOpenChange={(open) => {if(!open) setShowReferralPopup(false)}}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Withdrawal Requirement</AlertDialogTitle>
                <AlertDialogDescription>
                    To enable withdrawals, you need to successfully refer at least two new users. This is a one-time requirement. Happy earning!
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowReferralPopup(false)}>
                    I Understand
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">1. Setup Withdrawal Info</CardTitle>
            <CardDescription>Set where you want to receive your money.</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingInfo ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Platform</Label>
                  <Select value={info.platform} onValueChange={(v) => setInfo(p => ({...p, platform: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                      <SelectItem value="JazzCash">JazzCash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input value={info.accountHolderName} onChange={(e) => setInfo(p => ({...p, accountHolderName: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={info.accountNumber} onChange={(e) => setInfo(p => ({...p, accountNumber: e.target.value}))} />
                </div>
                <Button onClick={handleSaveInfo} className="w-full font-bold">Save Information</Button>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
                   <div className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5"/>
                     <span className="font-medium">Your information is saved.</span>
                   </div>
                 </div>
                 <div className="p-4 rounded-lg bg-secondary space-y-2 text-sm">
                    <p><strong>Platform:</strong> {userData?.withdrawal_info?.platform}</p>
                    <p><strong>Name:</strong> {userData?.withdrawal_info?.accountHolderName}</p>
                    <p><strong>Number:</strong> {userData?.withdrawal_info?.accountNumber}</p>
                 </div>
                 <Button onClick={() => setIsEditingInfo(true)} className="w-full font-bold" variant="outline">
                    <Pencil className="mr-2 h-4 w-4"/>
                    Edit Information
                 </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">2. Request Withdrawal</CardTitle>
            <CardDescription>Min 600 PKR, Max 1600 PKR. Requires 2 referrals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1000"/>
              <p className="text-sm text-muted-foreground">Available to withdraw: {userData?.total_earnings.toLocaleString()} PKR</p>
            </div>
            <Button onClick={handleWithdraw} className="w-full font-bold" disabled={!userData?.withdrawal_info || isEditingInfo || (userData && userData.referrals.length < 2 && !userData.can_withdraw_override)}>Request Withdrawal</Button>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {userData?.withdrawal_history && userData.withdrawal_history.length > 0 ? (
                        userData.withdrawal_history.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => (
                            <TableRow key={w.id}>
                                <TableCell>{new Date(w.date).toLocaleDateString()}</TableCell>
                                <TableCell>PKR {w.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{getStatusBadge(w.status)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={3} className="text-center">No withdrawal history.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
       </Card>
    </div>
  );
}
