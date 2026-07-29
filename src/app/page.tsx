import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Users, BotMessageSquare } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { getAppUser, getFallbackUserId } from '@/lib/data';
import { UserNav } from '@/components/app/user-nav';

export default async function LoginPage() {
  let clerkUserId: string | null = null;
  try {
    const authObj = await auth();
    clerkUserId = authObj?.userId || null;
  } catch {
    // ignore
  }

  const user = clerkUserId ? await getAppUser(clerkUserId) : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 md:p-6 flex justify-between items-center border-b">
        <Link href="/">
          <h1 className="text-2xl font-bold font-headline text-primary">AbsenceAce</h1>
        </Link>
        <div className="flex items-center gap-3">
          {clerkUserId && user ? (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserNav user={user} />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold font-headline text-foreground mb-4">
            Intelligent Leave Management
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Simplify time-off with AbsenceAce. Our AI-powered platform helps you manage requests, track balances, and get insights for optimal team planning.
          </p>

          {clerkUserId ? (
            <Button asChild size="lg" className="font-bold text-lg px-10 py-6 shadow-md">
              <Link href="/dashboard">Go to Your Dashboard</Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="font-bold text-lg px-10 py-6 shadow-md w-full sm:w-auto">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/dashboard">Try Demo Dashboard</Link>
              </Button>
            </div>
          )}
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
