import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getLeaveReportByPeriod } from '@/lib/data';
import { ReportsChart } from '@/components/app/reports-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ReportsPage() {
    const weeklyData = await getLeaveReportByPeriod('week');
    const monthlyData = await getLeaveReportByPeriod('month');
    const yearlyData = await getLeaveReportByPeriod('year');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Leave Reports</h1>
                <p className="text-muted-foreground">Analyze leave trends across the organization.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests Over Time</CardTitle>
                    <CardDescription>View leave requests trends by week, month, or year.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="month">
                        <TabsList>
                            <TabsTrigger value="week">Weekly</TabsTrigger>
                            <TabsTrigger value="month">Monthly</TabsTrigger>
                            <TabsTrigger value="year">Yearly</TabsTrigger>
                        </TabsList>
                        <TabsContent value="week">
                            <ReportsChart data={weeklyData} dataKey="week" />
                        </TabsContent>
                        <TabsContent value="month">
                            <ReportsChart data={monthlyData} dataKey="month" />
                        </TabsContent>
                        <TabsContent value="year">
                            <ReportsChart data={yearlyData} dataKey="year" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
