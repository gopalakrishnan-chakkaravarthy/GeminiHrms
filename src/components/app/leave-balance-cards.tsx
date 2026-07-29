import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaveBalances, getFallbackUserId } from "@/lib/data";
import { Plane, HeartPulse, User } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

const iconMap = {
  Plane: Plane,
  HeartPulse: HeartPulse,
  User: User,
} as const;

const titleMap: { [key: string]: string } = {
  Vacation: "Vacation Days",
  "Sick Leave": "Sick Days",
  "Personal Day": "Personal Days",
};

export async function LeaveBalanceCards() {
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

  const balances = await getLeaveBalances(userId);

  if (balances.length === 0) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No Balances Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Contact admin to set up your leave balances.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {balances.map((balance) => {
        const Icon = iconMap[balance.icon] || User;
        const title =
          titleMap[balance.leaveType] || `${balance.leaveType} Days`;
        return (
          <Card key={balance.leaveType}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance.balance}</div>
              <p className="text-xs text-muted-foreground">Remaining days</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
