"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface UserCredentials {
  id: string;
  username: string;
  email: string;
  // Passwords are not stored in Firestore for security reasons.
  // This page is for reference only.
}

export default function AccountsPage() {
  const [users, setUsers] = useState<UserCredentials[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserCredentials));
        setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);
  
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
