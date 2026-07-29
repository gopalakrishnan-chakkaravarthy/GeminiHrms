import type React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { MainNav } from '@/components/app/main-nav';
import { UserNav } from '@/components/app/user-nav';
import { NotificationBell } from '@/components/app/notification-bell';
import { Leaf } from 'lucide-react';
import { getAllowedRoutesForUser, getAppUser, getFallbackUserId, getAllLeaveRequests } from '@/lib/data';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;
  try {
    const authObj = await auth();
    userId = authObj?.userId || null;
  } catch {
    // ignore
  }

  if (!userId) {
    userId = await getFallbackUserId();
  }

  const [allowedRoutes, user, allRequests] = await Promise.all([
    getAllowedRoutesForUser(userId),
    getAppUser(userId),
    getAllLeaveRequests(),
  ]);

  const pendingRequests = allRequests.filter((r) => r.status === "Pending");

  if (!user) {
    return (
        <div className="flex items-center justify-center h-screen">
          <p>Error: Your application profile could not be loaded. Please contact support.</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <div className="bg-primary p-2 rounded-lg">
                    <Leaf className="text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold font-headline text-primary">AbsenceAce</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <MainNav allowedRoutes={allowedRoutes} />
        </SidebarContent>
        <SidebarFooter>
            {/* Can add footer items here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
            <div className="flex-1 flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
            </div>
            <div className="flex items-center gap-3">
                <NotificationBell user={user} pendingRequests={pendingRequests} />
                <UserNav user={user} />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
