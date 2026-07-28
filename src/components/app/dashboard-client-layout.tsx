"use client";

import type React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { MainNav } from '@/components/app/main-nav';
import { UserNav } from '@/components/app/user-nav';
import { Leaf } from 'lucide-react';
import type { User } from '@/lib/data';

type DashboardClientLayoutProps = {
    user: User;
    allowedRoutes: string[];
    children: React.ReactNode;
};

export function DashboardClientLayout({ user, allowedRoutes, children }: DashboardClientLayoutProps) {
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
                    <div className="flex-1">
                        <SidebarTrigger className="md:hidden" />
                    </div>
                    <UserNav user={user} />
                </header>
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
