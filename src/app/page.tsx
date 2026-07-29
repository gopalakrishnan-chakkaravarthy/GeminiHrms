import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Users, BotMessageSquare } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { getAppUser, getFallbackUserId } from '@/lib/data';
import { UserNav } from '@/components/app/user-nav';

export default async function LoginPage() {
  let userId: string | null = null;
  try {
    const authObj = await auth();
    userId = authObj?.userId || null;
  } catch {
    // ignore
  }

  // If no auth user, fallback to default user for seamless dev preview
  if (!userId) {
    userId = await getFallbackUserId();
  }

  const user = userId ? await getAppUser(userId) : null;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:p-6 flex justify-between items-center">
        <Link href="/">
            <h1 className="text-2xl font-bold font-headline text-primary">AbsenceAce</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          {user && <UserNav user={user} />}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold font-headline text-foreground mb-4">
            Intelligent Leave Management
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Simplify time-off with AbsenceAce. Our AI-powered platform helps you manage requests, track balances, and get insights for optimal team planning.
          </p>
          <Button asChild size="lg" className="font-bold text-lg px-10 py-6">
            <Link href="/dashboard">Go to Your Dashboard</Link>
          </Button>
        </div>
      </main>
      <footer className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="flex items-start gap-4">
            <CalendarCheck className="w-8 h-8 text-primary mt-1" />
            <div>
              <h3 className="font-bold font-headline text-foreground">Effortless Requests</h3>
              <p className="text-muted-foreground">Submit and manage leave requests in just a few clicks.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Users className="w-8 h-8 text-primary mt-1" />
            <div>
              <h3 className="font-bold font-headline text-foreground">Admin Oversight</h3>
              <p className="text-muted-foreground">Approve, reject, and view all employee requests from one place.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <BotMessageSquare className="w-8 h-8 text-primary mt-1" />
            <div>
              <h3 className="font-bold font-headline text-foreground">AI-Powered Insights</h3>
              <p className="text-muted-foreground">Get smart suggestions on the best timing for leave.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
