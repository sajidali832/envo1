
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

interface User {
  id: string;
  username: string;
  email: string;
  total_earnings: number;
  registration_date: string;
  can_withdraw_override: boolean;
  [key: string]: any;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fullSelectedUser, setFullSelectedUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [canWithdraw, setCanWithdraw] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users.'});
        } else {
            setUsers(data as User[]);
        }
    }
    fetchUsers();

    const channel = supabase.channel('realtime-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        fetchUsers(); // Refetch all users on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);
  
  const handleViewUser = async (user: User) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if(error) {
        toast({variant: 'destructive', title: 'Error', description: 'Could not fetch user details.'})
        return;
    }
    setFullSelectedUser(data as User);
  };

  const handleSelectUserForEdit = (user: User) => {
    setSelectedUser(user);
    setEditBalance(user.total_earnings.toString());
    setCanWithdraw(user.can_withdraw_override || false);
  };
  
  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    
    const { error } = await supabase
        .from('profiles')
        .update({
            total_earnings: parseFloat(editBalance) || selectedUser.total_earnings,
            can_withdraw_override: canWithdraw
        })
        .eq('id', selectedUser.id)

    if (error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not update user." });
    } else {
        toast({ title: "Success", description: "User updated." });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // This is a simplified delete. In a real app, you would want to handle this
    // via a cloud function to clean up the auth user as well.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    
    if (error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete user." });
    } else {
        toast({ title: "User Deleted", description: "The user has been removed from the database." });
    }
  }

  const handleExportData = () => {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "all_users_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast({title: "Success", description: "User data exported."})
    } catch (error) {
        console.error("Failed to export data", error);
        toast({variant: "destructive", title: "Error", description: "Could not export user data."})
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all registered users on the platform.</CardDescription>
        </div>
        <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export All Data
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>PKR {user.total_earnings?.toLocaleString() || 0}</TableCell>
                <TableCell>{new Date(user.registration_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                   <Dialog onOpenChange={(open) => !open && setFullSelectedUser(null)}>
                        <DialogTrigger asChild>
                           <Button variant="secondary" size="sm" onClick={() => handleViewUser(user)}>View</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>User Details: {fullSelectedUser?.username}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 max-h-[60vh] overflow-y-auto p-1">
                                <pre className="bg-secondary p-4 rounded-md text-sm">
                                    {JSON.stringify(fullSelectedUser, null, 2)}
                                </pre>
                            </div>
                        </DialogContent>
                    </Dialog>
                   <Dialog onOpenChange={(open) => !open && setSelectedUser(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleSelectUserForEdit(user)}>Edit</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="balance" className="text-right">Balance</Label>
                            <Input id="balance" value={editBalance} onChange={e => setEditBalance(e.target.value)} className="col-span-3"/>
                          </div>
                           <div className="flex items-center space-x-2">
                            <Switch id="can-withdraw" checked={canWithdraw} onCheckedChange={setCanWithdraw} />
                            <Label htmlFor="can-withdraw">Override Withdrawal Lock</Label>
                          </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" onClick={handleSaveChanges}>Save changes</Button>
                            </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user's document from the database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
