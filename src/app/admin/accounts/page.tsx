
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserCredentials {
  id: string;
  username: string;
  email: string;
}

export default function AccountsPage() {
  const [users, setUsers] = useState<UserCredentials[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('id, username, email');
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users.' });
        } else {
            setUsers(data as UserCredentials[]);
        }
    }
    fetchUsers();

    const channel = supabase.channel('realtime-profiles-accounts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
            fetchUsers();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, [supabase, toast]);
  
  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      toast({title: "Copied to clipboard"});
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Accounts</CardTitle>
        <CardDescription>A list of all user accounts for administrative reference. Passwords are not shown for security.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="flex items-center gap-2">
                    <span className="truncate max-w-[100px]">{user.id}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(user.id)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
