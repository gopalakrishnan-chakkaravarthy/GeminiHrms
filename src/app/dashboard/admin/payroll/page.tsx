import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Settings, Component, Receipt, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function ManagementCard({ title, description, href, icon: Icon }: { title: string, description: string, href: string, icon: React.ElementType }) {
    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl font-headline">{title}</CardTitle>
                        <CardDescription className="pt-1">{description}</CardDescription>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" size="sm">
                    <Link href={href}>
                        Go to Section <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function PayrollPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Payroll Management</h1>
            <p className="text-muted-foreground">Configure, run, and review your organization's payroll.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Payroll Sections</CardTitle>
                <CardDescription>Manage core components of the payroll system.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ManagementCard 
                    title="Payroll Components" 
                    description="Define earnings and deductions." 
                    href="/dashboard/admin/payroll/components"
                    icon={Component}
                />
                <ManagementCard 
                    title="Payroll Settings" 
                    description="Assign components to employees." 
                    href="/dashboard/admin/payroll/settings"
                    icon={Settings}
                />
                 <ManagementCard 
                    title="Run Payroll" 
                    description="Generate payslips for a pay period." 
                    href="/dashboard/admin/payroll/run"
                    icon={PlayCircle}
                />
                <ManagementCard 
                    title="Payslips"
                    description="View and print historical payslips." 
                    href="/dashboard/admin/payroll/payslips"
                    icon={Receipt}
                />
            </CardContent>
        </Card>
    </div>
  );
}
