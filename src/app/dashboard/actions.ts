"use server";

import {
  getLeaveInsights,
  type LeaveInsightsInput,
  type LeaveInsightsOutput,
} from "@/ai/flows/leave-insights";
import { generateLeaveStatusEmail } from "@/lib/email";
import { db, getAppUser, getHolidays, getLeaveBalances, getFallbackUserId } from "@/lib/data";
import { parseLocalDate } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  differenceInDays,
  format,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { unstable_noStore as noStore } from "next/cache";
import nodemailer from "nodemailer";
const enableAIFeatures = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === "true";

// Email sending function
async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachments?: { filename: string; content: string; contentType: string }[],
) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_CC } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("Gmail credentials are not set. Cannot send email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: to,
      cc: EMAIL_CC,
      replyTo: EMAIL_CC,
      subject,
      html: body,
      attachments: attachments,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

export async function getLeaveInsightsAction(
  input: LeaveInsightsInput,
): Promise<{ success: boolean; data?: LeaveInsightsOutput; error?: string }> {
  try {
    if (!enableAIFeatures) {
      return { success: false, error: "AI features are disabled." };
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const insights = await getLeaveInsights(input);
    return { success: true, data: insights };
  } catch (error) {
    console.error("Error getting AI insights:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      error: `Failed to get AI insights. ${errorMessage}`,
    };
  }
}

// --- GENERIC FORM ACTION STATE ---
export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
};

// --- LEAVE REQUEST ACTIONS ---

const LeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid("Please select a valid leave type."),
  dates: z.object({
    from: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid start date."),
    to: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid end date."),
  }),
  reason: z.string().optional(),
  isFirstDayHalf: z.preprocess(
    (val) => val === "on" || val === "true",
    z.boolean(),
  ),
  isLastDayHalf: z.preprocess(
    (val) => val === "on" || val === "true",
    z.boolean(),
  ),
});

export async function createLeaveRequestAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
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

  const user = await getAppUser(userId);
  if (!user || !user.managerId) {
    return {
      success: false,
      message:
        "Configuration Error: Your profile is incomplete or you have no manager assigned. Please contact HR.",
    };
  }
  const validatedFields = LeaveRequestSchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"),
    dates: {
      from: formData.get("dates.from"),
      to: formData.get("dates.to"),
    },
    reason: formData.get("reason"),
    isFirstDayHalf: formData.get("isFirstDayHalf"),
    isLastDayHalf: formData.get("isLastDayHalf"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create request.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { leaveTypeId, dates, reason, isFirstDayHalf, isLastDayHalf } =
    validatedFields.data;
  const finalReason = reason || "";
  const startDate = parseLocalDate(dates.from);
  const endDate = parseLocalDate(dates.to);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  // Calculate total days including half-day options
  let days = differenceInDays(endDate, startDate) + 1;
  if (isFirstDayHalf) days -= 0.5;
  // Only deduct for last day if it's a different day than the first, or if we want to support two halves
  if (isLastDayHalf && startDate.getTime() !== endDate.getTime()) days -= 0.5;

  try {
    if (!db) {
      return { success: false, message: "Database not configured." };
    }

    // Holiday validation
    const holidays = await getHolidays(startDate.getFullYear());
    const holidayDates = holidays.map((h) => parseLocalDate(h.date));
    const requestedDates = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    for (const reqDate of requestedDates) {
      const isHoliday = holidayDates.some((holDate) =>
        isSameDay(reqDate, holDate),
      );
      if (isHoliday) {
        const holiday = holidays.find((h) => isSameDay(reqDate, parseLocalDate(h.date)));
        return {
          success: false,
          message: `Your request includes a company holiday (${format(
            reqDate,
            "MMM dd",
          )}: ${holiday?.name}). Please select different dates.`,
        };
      }
    }

    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, status, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        leaveTypeId,
        startDateStr,
        endDateStr,
        days,
        finalReason,
        "Pending",
        user.managerId,
      ],
    );

    const manager = await getAppUser(user.managerId);
    const leaveTypeResult = await db.query(
      "SELECT name FROM leave_types WHERE id = $1",
      [leaveTypeId],
    );
    const leaveType = leaveTypeResult.rows[0];

    if (manager && manager.email && leaveType) {
      const leaveBalance = await getLeaveBalances(userId);
      const filterLeaveBalance = leaveBalance?.filter(
        (x) => x.leaveType === leaveType.name,
      );
      const leaveBalanceCount =
        filterLeaveBalance?.length > 0 ? filterLeaveBalance[0]?.balance : 0;

      generateLeaveStatusEmail({
        recipientName: manager.name,
        recipientRole: "manager",
        employeeName: user.name,
        leaveType: leaveType.name,
        startDate: startDateStr,
        endDate: endDateStr,
        status: "Pending",
        leaveBalanceCount: leaveBalanceCount.toString(),
      })
        .then((emailContent) => {
          sendEmail(manager.email!, emailContent.subject, emailContent.body);
        })
        .catch((error) => {
          console.error("Failed to generate or send email:", error);
        });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/manager");
    return { success: true, message: "Leave request submitted successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to submit leave request.",
    };
  }
}

export async function withdrawLeaveRequestAction(
  requestId: string,
): Promise<{ success: boolean; message: string }> {
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

  try {
    if (!db) {
      return { success: false, message: "Database not configured." };
    }

    const requestQuery = await db.query(
      `SELECT employee_id, status FROM leave_requests WHERE id = $1`,
      [requestId],
    );

    if (requestQuery.rows.length === 0) {
      return { success: false, message: "Error: Request not found." };
    }

    const request = requestQuery.rows[0];

    if (request.employee_id !== userId) {
      return {
        success: false,
        message:
          "Authorization Error: You can only withdraw your own requests.",
      };
    }

    if (request.status !== "Pending") {
      return {
        success: false,
        message: `Error: Cannot withdraw a request with '${request.status}' status.`,
      };
    }

    await db.query("DELETE FROM leave_requests WHERE id = $1", [requestId]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/manager");

    return { success: true, message: "Leave request withdrawn successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to withdraw leave request.",
    };
  }
}

export async function runCarryForwardLogicForUser(userId: string) {
  noStore();
  if (!db) {
    console.warn("Database not configured, skipping carry forward logic.");
    return;
  }

  const currentYear = new Date().getFullYear();

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const employeeRes = await client.query(
      "SELECT last_carry_forward_year FROM employees WHERE id = $1",
      [userId],
    );

    if (employeeRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return;
    }

    const lastCarryForwardYear = employeeRes.rows[0].last_carry_forward_year;

    if (lastCarryForwardYear && lastCarryForwardYear >= currentYear) {
      await client.query("ROLLBACK");
      return;
    }

    const policiesRes = await client.query(
      "SELECT leave_type_id, max_days FROM carry_forward_policies",
    );
    const policies = policiesRes.rows;

    if (policies.length === 0) {
      await client.query("ROLLBACK");
      return;
    }

    for (const policy of policies) {
      const leaveTypeId = policy.leave_type_id;
      const maxDaysToCarry = policy.max_days;

      const balanceRes = await client.query(
        "SELECT balance FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2",
        [userId, leaveTypeId],
      );

      if (balanceRes.rows.length > 0) {
        const currentBalance = parseFloat(balanceRes.rows[0].balance);
        const carryForwardAmount = Math.min(currentBalance, maxDaysToCarry);

        if (carryForwardAmount > 0) {
          await client.query(
            "UPDATE leave_balances SET balance = balance + $1 WHERE employee_id = $2 AND leave_type_id = $3",
            [carryForwardAmount, userId, leaveTypeId],
          );
        }
      }
    }

    await client.query(
      "UPDATE employees SET last_carry_forward_year = $1 WHERE id = $2",
      [currentYear, userId],
    );

    await client.query("COMMIT");
    revalidatePath("/dashboard");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      `Failed to run carry forward logic for user ${userId}:`,
      error,
    );
  } finally {
    client.release();
  }
}

type CalendarInviteResult = {
  success: boolean;
  message: string;
};

export async function sendCalendarInviteAction(input: {
  recipientEmail: string;
  icsContent: string;
  summary: string;
}): Promise<CalendarInviteResult> {
  try {
    await sendEmail(
      input.recipientEmail,
      input.summary,
      "You have been invited to an event. Please see the attached calendar file.",
      [
        {
          filename: "invite.ics",
          content: input.icsContent,
          contentType: "text/calendar",
        },
      ],
    );
    return { success: true, message: "Calendar invite sent successfully." };
  } catch (error) {
    console.error("Error sending calendar invite:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to send invite: ${errorMessage}`,
    };
  }
}

export async function getYearlyLeaveBalancesAction(options?: {
  year?: number;
  employeeId?: string;
  managerId?: string;
}) {
  const { getYearlyLeaveBalances } = await import("@/lib/data");
  return getYearlyLeaveBalances(options);
}

