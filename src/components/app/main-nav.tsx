"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  UsersRound,
  Repeat,
  Building2,
  BarChart3,
  Landmark,
  Lock,
  Briefcase,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isReportsEnabled } from "@/lib/feature-flags";

export function MainNav({ allowedRoutes }: { allowedRoutes: string[] }) {
  const pathname = usePathname();

  const hasAccess = (href: string) => allowedRoutes.includes(href);

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    {
      href: "/dashboard/manager",
      label: "Manager",
      icon: Briefcase,
    },
    {
      href: "/dashboard/admin",
      label: "Admin Panel",
      icon: Users,
    },
  ];

  const showReports = isReportsEnabled();

  const adminMenuItems = [
    {
      href: "/dashboard/admin/employees",
      label: "Employees",
      icon: Users,
    },
    {
      href: "/dashboard/admin/departments",
      label: "Departments",
      icon: Building2,
    },
    {
      href: "/dashboard/admin/roles",
      label: "Roles",
      icon: ShieldCheck,
    },
    ...(showReports
      ? [
          {
            href: "/dashboard/admin/reports",
            label: "Reports",
            icon: BarChart3,
          },
        ]
      : []),
  ];

  const leaveManagementItems = [
    {
      href: "/dashboard/admin/leave-types",
      label: "Leave Types",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/admin/leave-groups",
      label: "Leave Policies",
      icon: UsersRound,
    },
    {
      href: "/dashboard/admin/carry-forward",
      label: "Carry-Forward",
      icon: Repeat,
    },
  ];

  const payrollManagementItems = [
    {
      href: "/dashboard/admin/payroll",
      label: "Payroll",
      icon: Landmark,
    },
  ];

  const accessControlItems = [
    {
      href: "/dashboard/admin/permissions",
      label: "Permissions",
      icon: Lock,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => hasAccess(item.href));
  const visibleAdminMenuItems = adminMenuItems.filter((item) =>
    hasAccess(item.href)
  );
  const visibleLeaveManagementItems = leaveManagementItems.filter((item) =>
    hasAccess(item.href)
  );
  const visiblePayrollManagementItems = payrollManagementItems.filter((item) =>
    hasAccess(item.href)
  );
  const visibleAccessControlItems = accessControlItems.filter((item) =>
    hasAccess(item.href)
  );

  return (
    <SidebarMenu>
      {visibleMenuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */}
            <SidebarMenuButton
              className={cn(pathname === item.href && "bg-sidebar-accent")}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      {visibleAdminMenuItems.length > 0 && <SidebarSeparator />}
      {visibleAdminMenuItems.length > 0 && (
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/80">
          User Management
        </p>
      )}
      {visibleAdminMenuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */}
            <SidebarMenuButton
              className={cn(
                pathname.startsWith(item.href) && "bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      {visibleLeaveManagementItems.length > 0 && <SidebarSeparator />}
      {visibleLeaveManagementItems.length > 0 && (
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/80">
          Leave Management
        </p>
      )}
      {visibleLeaveManagementItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */}
            <SidebarMenuButton
              className={cn(
                pathname.startsWith(item.href) && "bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      {visiblePayrollManagementItems.length > 0 && <SidebarSeparator />}
      {visiblePayrollManagementItems.length > 0 && (
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/80">
          Finance
        </p>
      )}
      {visiblePayrollManagementItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */}
            <SidebarMenuButton
              className={cn(
                pathname.startsWith(item.href) && "bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      {visibleAccessControlItems.length > 0 && <SidebarSeparator />}
      {visibleAccessControlItems.length > 0 && (
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/80">
          Access Control
        </p>
      )}
      {visibleAccessControlItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */}
            <SidebarMenuButton
              className={cn(
                pathname.startsWith(item.href) && "bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
