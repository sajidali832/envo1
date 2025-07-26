
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const InvestForm = dynamic(() => import('@/components/invest-form'), {
  ssr: false,
  loading: () => <InvestPageSkeleton />,
});

function InvestPageSkeleton() {
  return (
     <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
        <div className="w-full max-w-md">
            <Card className="shadow-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-primary/10">
                        <Skeleton className="h-6 w-32 mb-2"/>
                        <Skeleton className="h-4 w-full mb-1"/>
                        <Skeleton className="h-4 w-full mb-1"/>
                        <Skeleton className="h-4 w-3/4"/>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-40" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                           <Skeleton className="h-4 w-40" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                           <Skeleton className="h-4 w-40" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
     </div>
  );
}


export default function InvestPage() {
  return <InvestForm />;
}
