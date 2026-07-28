"use server";

import { revalidatePath } from "next/cache";
import { generateLeaveStatusEmail } from "@/lib/email";
import { runPayrollForEmployees, db, getAppUser } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";
import { generateIcsContent } from "@/lib/calendar";

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
      cc: EMAIL_CC, // NEW
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

// --- LEAVE REQUEST ACTIONS ---

type ReviewLeaveRequestResult = {
  success: boolean;
  message: string;
};

const ReviewRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    action: z.enum(["approve", "reject"]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === "reject") {
        return data.rejectionReason && data.rejectionReason.length > 10;
      }
      return true;
    },
    {
      message: "A rejection reason of at least 10 characters is required.",
      path: ["rejectionReason"],
    },
  );

export async function reviewLeaveRequestAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { userId: managerId } = auth();
  if (!managerId) {
    return {
      success: false,
      message: "Authentication Error: You must be logged in.",
    };
  }

  const action = formData.get("action");

  const dataToValidate: any = {
    requestId: formData.get("requestId"),
    action: action,
  };

  if (action === "reject") {
    dataToValidate.rejectionReason = formData.get("rejectionReason");
  }

  const validatedFields = ReviewRequestSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { requestId, rejectionReason } = validatedFields.data;
  const newStatus = action === "approve" ? "Approved" : "Rejected";

  try {
    if (!db) throw new Error("Database not configured");

    // Fetch all necessary info in one go
    const requestQuery = await db.query(
      `
            SELECT 
                lr.manager_id, 
                lr.employee_id,
                e.name as "employeeName",
                e.email as "employeeEmail",
                lt.name as "leaveType",
                lr.start_date,
                lr.end_date,
                lr.reason
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.id = $1
        `,
      [requestId],
    );

    if (requestQuery.rows.length === 0) {
      return { success: false, message: "Error: Request not found." };
    }

    const requestInfo = requestQuery.rows[0];

    // Check for admin role as well as manager
    const user = await getAppUser(managerId);
    const isAdmin = user?.roleName === "Administrator";
    if (requestInfo.manager_id !== managerId && !isAdmin) {
      return {
        success: false,
        message:
          "Authorization Error: You are not authorized to review this request.",
      };
    }

    await db.query(
      "UPDATE leave_requests SET status = $1, rejection_reason = $2 WHERE id = $3",
      [newStatus, newStatus === "Rejected" ? rejectionReason : null, requestId],
    );

    // Send email notification
    if (requestInfo.employeeEmail) {
      const emailContent = await generateLeaveStatusEmail({
        recipientName: requestInfo.employeeName,
        recipientRole: "employee",
        employeeName: requestInfo.employeeName,
        leaveType: requestInfo.leaveType,
        startDate: format(requestInfo.start_date, "yyyy-MM-dd"),
        endDate: format(requestInfo.end_date, "yyyy-MM-dd"),
        status: newStatus as "Approved" | "Rejected",
        leaveBalanceCount: requestInfo?.leaveBalanceCount,
      });

      let attachments;
      if (newStatus === "Approved") {
        const icsContent = generateIcsContent({
          title: `Leave: ${requestInfo.employeeName}`,
          description: `Leave Type: ${requestInfo.leaveType}. Reason: ${
            requestInfo.reason || "N/A"
          }`,
          startDate: requestInfo.start_date,
          endDate: requestInfo.end_date,
        });
        attachments = [
          {
            filename: "invite.ics",
            content: icsContent,
            contentType: "text/calendar",
          },
        ];
      }

      sendEmail(
        requestInfo.employeeEmail,
        emailContent.subject,
        emailContent.body,
        attachments,
      ).catch((error) => {
        console.error("Failed to send email:", error);
      });
    } else {
      console.warn(
        `Employee ${requestInfo.employeeName} does not have an email address. Cannot send notification.`,
      );
    }

    revalidatePath("/dashboard/manager");
    revalidatePath("/dashboard/admin");

    return {
      success: true,
      message: `Request has been ${newStatus.toLowerCase()}.`,
    };
  } catch (error) {
    console.error(`Failed to ${action} leave request:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to update request. ${errorMessage}`,
    };
  }
}

export async function deleteLeaveRequestByManagerAction(
  requestId: string,
): Promise<DeleteResult> {
  const { userId: managerId } = auth();
  if (!managerId) {
    return {
      success: false,
      message: "Authentication Error: You must be logged in.",
    };
  }

  try {
    if (!db) {
      return { success: false, message: "Database not configured." };
    }

    const requestQuery = await db.query(
      `SELECT manager_id FROM leave_requests WHERE id = $1`,
      [requestId],
    );

    if (requestQuery.rows.length === 0) {
      return { success: false, message: "Error: Request not found." };
    }

    const request = requestQuery.rows[0];

    // We can add an extra check for Admin role here if needed in the future
    if (request.manager_id !== managerId) {
      return {
        success: false,
        message:
          "Authorization Error: You can only delete requests for your team.",
      };
    }

    await db.query("DELETE FROM leave_requests WHERE id = $1", [requestId]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/manager");
    revalidatePath("/dashboard/admin");

    return { success: true, message: "Leave request deleted successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to delete leave request.",
    };
  }
}

// --- GENERIC FORM ACTION STATE ---
export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
};

// --- GENERIC DELETE ACTION ---
type DeleteResult = { success: boolean; message: string };

async function performDelete(
  tableName: string,
  id: string,
  revalidationPath: string,
  entityName: string,
): Promise<DeleteResult> {
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    revalidatePath(revalidationPath);
    return { success: true, message: `${entityName} deleted successfully.` };
  } catch (error) {
    console.error("Database Error:", error);
    if (error instanceof Error && "code" in error && error.code === "23503") {
      return {
        success: false,
        message: `Database Error: Cannot delete this ${entityName.toLowerCase()} as it is being used by another record.`,
      };
    }
    return {
      success: false,
      message: `Database Error: Failed to delete ${entityName.toLowerCase()}.`,
    };
  }
}

// --- HOLIDAY ACTIONS ---
const HolidaySchema = z.object({
  name: z.string().min(3, "Holiday name must be at least 3 characters."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
});

export async function createHolidayAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = HolidaySchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create holiday.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { name, date } = validatedFields.data;

  try {
    if (!db) throw new Error("Database not configured");
    await db.query("INSERT INTO holidays (name, date) VALUES ($1, $2)", [
      name,
      new Date(date),
    ]);
    revalidatePath("/dashboard/calendar");
    return { success: true, message: `Created holiday "${name}".` };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create holiday. Does it already exist on this date?",
    };
  }
}

export async function deleteHolidayAction(id: string): Promise<DeleteResult> {
  return performDelete("holidays", id, "/dashboard/calendar", "Holiday");
}

// --- ROLE ACTIONS ---
const RoleSchema = z.object({
  name: z.string().min(3, "Role name must be at least 3 characters."),
});

export async function createRoleAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = RoleSchema.safeParse({ name: formData.get("name") });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create role.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    if (!db) throw new Error("Database not configured");
    await db.query("INSERT INTO roles (name) VALUES ($1)", [
      validatedFields.data.name,
    ]);
    revalidatePath("/dashboard/admin/roles");
    return {
      success: true,
      message: `Created role "${validatedFields.data.name}".`,
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to create role. Does it already exist?",
    };
  }
}

const UpdateRoleSchema = RoleSchema.extend({ id: z.string().uuid() });
export async function updateRoleAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdateRoleSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update role.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  try {
    if (!db) throw new Error("Database not configured");
    await db.query("UPDATE roles SET name = $1 WHERE id = $2", [
      validatedFields.data.name,
      validatedFields.data.id,
    ]);
    revalidatePath("/dashboard/admin/roles");
    return { success: true, message: "Role updated successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update role.",
    };
  }
}

export async function deleteRoleAction(id: string): Promise<DeleteResult> {
  return performDelete("roles", id, "/dashboard/admin/roles", "Role");
}

// --- DEPARTMENT ACTIONS ---
const DepartmentSchema = z.object({
  name: z.string().min(3, "Department name must be at least 3 characters."),
});
export async function createDepartmentAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = DepartmentSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create department.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    if (!db) throw new Error("Database not configured");
    await db.query("INSERT INTO departments (name) VALUES ($1)", [
      validatedFields.data.name,
    ]);
    revalidatePath("/dashboard/admin/departments");
    return {
      success: true,
      message: `Created department "${validatedFields.data.name}".`,
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create department. Does it already exist?",
    };
  }
}

const UpdateDepartmentSchema = DepartmentSchema.extend({
  id: z.string().uuid(),
});
export async function updateDepartmentAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdateDepartmentSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update department.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  try {
    if (!db) throw new Error("Database not configured");
    await db.query("UPDATE departments SET name = $1 WHERE id = $2", [
      validatedFields.data.name,
      validatedFields.data.id,
    ]);
    revalidatePath("/dashboard/admin/departments");
    return { success: true, message: "Department updated successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update department.",
    };
  }
}

export async function deleteDepartmentAction(
  id: string,
): Promise<DeleteResult> {
  return performDelete(
    "departments",
    id,
    "/dashboard/admin/departments",
    "Department",
  );
}

// --- LEAVE TYPE ACTIONS ---
const LeaveTypeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().optional(),
});
export async function createLeaveTypeAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = LeaveTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create leave type.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, description } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "INSERT INTO leave_types (name, description) VALUES ($1, $2)",
      [name, description],
    );
    revalidatePath("/dashboard/admin/leave-types");
    return { success: true, message: `Created leave type "${name}".` };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create leave type. Does it already exist?",
    };
  }
}

const UpdateLeaveTypeSchema = LeaveTypeSchema.extend({ id: z.string().uuid() });
export async function updateLeaveTypeAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdateLeaveTypeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update leave type.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { id, name, description } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "UPDATE leave_types SET name = $1, description = $2 WHERE id = $3",
      [name, description, id],
    );
    revalidatePath("/dashboard/admin/leave-types");
    return { success: true, message: "Leave type updated successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update leave type.",
    };
  }
}

export async function deleteLeaveTypeAction(id: string): Promise<DeleteResult> {
  return performDelete(
    "leave_types",
    id,
    "/dashboard/admin/leave-types",
    "Leave Type",
  );
}

// --- LEAVE POLICY (GROUP) ACTIONS ---
const LeavePolicySchema = z.object({
  roleId: z.string().uuid("Please select a valid role."),
  leaveTypeId: z.string().uuid("Please select a valid leave type."),
  daysAllowed: z.coerce
    .number()
    .int()
    .min(0, "Days must be a positive number."),
});
export async function createLeavePolicyAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = LeavePolicySchema.safeParse({
    roleId: formData.get("roleId"),
    leaveTypeId: formData.get("leaveTypeId"),
    daysAllowed: formData.get("daysAllowed"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create policy.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { roleId, leaveTypeId, daysAllowed } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "INSERT INTO leave_policies (role_id, leave_type_id, days_allowed) VALUES ($1, $2, $3)",
      [roleId, leaveTypeId, daysAllowed],
    );
    revalidatePath("/dashboard/admin/leave-groups");
    return { success: true, message: "Successfully created new leave policy." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create leave policy. Does a policy for this role and leave type already exist?",
    };
  }
}

const UpdateLeavePolicySchema = LeavePolicySchema.extend({
  id: z.string().uuid(),
});
export async function updateLeavePolicyAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdateLeavePolicySchema.safeParse({
    id: formData.get("id"),
    roleId: formData.get("roleId"),
    leaveTypeId: formData.get("leaveTypeId"),
    daysAllowed: formData.get("daysAllowed"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update policy.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { id, roleId, leaveTypeId, daysAllowed } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "UPDATE leave_policies SET role_id = $1, leave_type_id = $2, days_allowed = $3 WHERE id = $4",
      [roleId, leaveTypeId, daysAllowed, id],
    );
    revalidatePath("/dashboard/admin/leave-groups");
    return { success: true, message: "Leave policy updated successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update leave policy.",
    };
  }
}

export async function deleteLeavePolicyAction(
  id: string,
): Promise<DeleteResult> {
  return performDelete(
    "leave_policies",
    id,
    "/dashboard/admin/leave-groups",
    "Leave Policy",
  );
}

// --- CARRY FORWARD POLICY ACTIONS ---
const CarryForwardPolicySchema = z.object({
  leaveTypeId: z.string().uuid("Please select a valid leave type."),
  maxDays: z.coerce
    .number()
    .int()
    .min(0, "Max days must be a positive number."),
  expiryMonths: z.coerce
    .number()
    .int()
    .min(1, "Expiry must be at least 1 month."),
});
export async function createCarryForwardPolicyAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = CarryForwardPolicySchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"),
    maxDays: formData.get("maxDays"),
    expiryMonths: formData.get("expiryMonths"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create policy.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { leaveTypeId, maxDays, expiryMonths } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "INSERT INTO carry_forward_policies (leave_type_id, max_days, expiry_months) VALUES ($1, $2, $3)",
      [leaveTypeId, maxDays, expiryMonths],
    );
    revalidatePath("/dashboard/admin/carry-forward");
    return {
      success: true,
      message: "Successfully created new carry-forward policy.",
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create policy. Does a policy for this leave type already exist?",
    };
  }
}

const UpdateCarryForwardPolicySchema = CarryForwardPolicySchema.extend({
  id: z.string().uuid(),
});
export async function updateCarryForwardPolicyAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdateCarryForwardPolicySchema.safeParse({
    id: formData.get("id"),
    leaveTypeId: formData.get("leaveTypeId"),
    maxDays: formData.get("maxDays"),
    expiryMonths: formData.get("expiryMonths"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update policy.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { id, leaveTypeId, maxDays, expiryMonths } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "UPDATE carry_forward_policies SET leave_type_id = $1, max_days = $2, expiry_months = $3 WHERE id = $4",
      [leaveTypeId, maxDays, expiryMonths, id],
    );
    revalidatePath("/dashboard/admin/carry-forward");
    return {
      success: true,
      message: "Carry-forward policy updated successfully.",
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update policy.",
    };
  }
}

export async function deleteCarryForwardPolicyAction(
  id: string,
): Promise<DeleteResult> {
  return performDelete(
    "carry_forward_policies",
    id,
    "/dashboard/admin/carry-forward",
    "Carry-Forward Policy",
  );
}

// --- EMPLOYEE ACTIONS ---
const EmployeeSchema = z.object({
  id: z.string().min(1, "Clerk User ID is required."),
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email."),
  roleId: z.string().uuid("Please select a valid role."),
  departmentId: z.string().uuid("Please select a valid department."),
  managerId: z.string().nullable().optional(),
  employeeId: z.string().optional(),
  phoneNumber: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export async function createEmployeeAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawManagerId = formData.get("managerId");
  const managerId =
    rawManagerId === "null" || rawManagerId === "" ? null : rawManagerId;

  const validatedFields = EmployeeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
    departmentId: formData.get("departmentId"),
    managerId: managerId,
    employeeId: formData.get("employeeId"),
    phoneNumber: formData.get("phoneNumber"),
    emergencyContactNumber: formData.get("emergencyContactNumber"),
    bloodGroup: formData.get("bloodGroup"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create employee.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    id,
    name,
    email,
    roleId,
    departmentId,
    employeeId,
    phoneNumber,
    emergencyContactNumber,
    bloodGroup,
  } = validatedFields.data;
  const finalManagerId = validatedFields.data.managerId; // Use validated managerId

  const avatarUrl = `https://placehold.co/100x100.png`; // Default avatar

  if (!db) {
    return { success: false, message: "Database not configured." };
  }
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO employees (id, name, email, avatar_url, role_id, department_id, manager_id, leave_history, employee_id, phone_number, emergency_contact_number, blood_group) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        name,
        email,
        avatarUrl,
        roleId,
        departmentId,
        finalManagerId,
        "",
        employeeId,
        phoneNumber,
        emergencyContactNumber,
        bloodGroup,
      ],
    );

    // Get leave policies for the new role
    const policiesRes = await client.query(
      "SELECT leave_type_id, days_allowed FROM leave_policies WHERE role_id = $1",
      [roleId],
    );

    // Insert initial leave balances
    for (const policy of policiesRes.rows) {
      await client.query(
        "INSERT INTO leave_balances (employee_id, leave_type_id, balance) VALUES ($1, $2, $3)",
        [id, policy.leave_type_id, policy.days_allowed],
      );
    }

    await client.query("COMMIT");

    revalidatePath("/dashboard/admin/employees");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: `Created employee "${name}" and initialized leave balances.`,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create employee. Does this user ID or email already exist?",
    };
  } finally {
    client.release();
  }
}

const UpdateEmployeeSchema = z.object({
  id: z.string().min(1, "Employee ID is required."),
  roleId: z.string().uuid("Please select a valid role."),
  departmentId: z.string().uuid("Please select a valid department."),
  managerId: z.string().nullable().optional(),
  employeeId: z.string().optional(),
  phoneNumber: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export async function updateEmployeeAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawManagerId = formData.get("managerId");
  const managerId =
    rawManagerId === "null" || rawManagerId === "" ? null : rawManagerId;

  const validatedFields = UpdateEmployeeSchema.safeParse({
    id: formData.get("id"),
    roleId: formData.get("roleId"),
    departmentId: formData.get("departmentId"),
    managerId: managerId,
    employeeId: formData.get("employeeId"),
    phoneNumber: formData.get("phoneNumber"),
    emergencyContactNumber: formData.get("emergencyContactNumber"),
    bloodGroup: formData.get("bloodGroup"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update employee.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    id,
    roleId,
    departmentId,
    employeeId,
    phoneNumber,
    emergencyContactNumber,
    bloodGroup,
  } = validatedFields.data;
  const finalManagerId = validatedFields.data.managerId; // Use validated managerId

  if (!db) {
    return { success: false, message: "Database not configured." };
  }
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Get old role to see if it changed
    const oldEmployeeRes = await client.query(
      "SELECT role_id FROM employees WHERE id = $1",
      [id],
    );
    const oldRoleId = oldEmployeeRes.rows[0]?.role_id;

    await client.query(
      `UPDATE employees SET 
        role_id = $1, 
        department_id = $2, 
        manager_id = $3,
        employee_id = $4,
        phone_number = $5,
        emergency_contact_number = $6,
        blood_group = $7
       WHERE id = $8`,
      [
        roleId,
        departmentId,
        finalManagerId,
        employeeId,
        phoneNumber,
        emergencyContactNumber,
        bloodGroup,
        id,
      ],
    );

    // If role changed, update leave balances
    if (oldRoleId !== roleId) {
      // This is a simple reset. A more complex implementation might pro-rate balances.
      await client.query("DELETE FROM leave_balances WHERE employee_id = $1", [
        id,
      ]);

      const policiesRes = await client.query(
        "SELECT leave_type_id, days_allowed FROM leave_policies WHERE role_id = $1",
        [roleId],
      );

      for (const policy of policiesRes.rows) {
        await client.query(
          "INSERT INTO leave_balances (employee_id, leave_type_id, balance) VALUES ($1, $2, $3)",
          [id, policy.leave_type_id, policy.days_allowed],
        );
      }
    }

    await client.query("COMMIT");
    revalidatePath("/dashboard/admin/employees");
    revalidatePath("/dashboard");
    return { success: true, message: "Employee details updated successfully." };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update employee.",
    };
  } finally {
    client.release();
  }
}

export async function deleteEmployeeAction(id: string): Promise<DeleteResult> {
  return performDelete(
    "employees",
    id,
    "/dashboard/admin/employees",
    "Employee",
  );
}
// --- PAYROLL ACTIONS ---
const PayrollComponentSchema = z.object({
  name: z.string().min(3, "Component name must be at least 3 characters."),
  type: z.enum(["Earning", "Deduction"]),
  description: z.string().optional(),
});
export async function createPayrollComponentAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = PayrollComponentSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create component.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, type, description } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "INSERT INTO payroll_components (name, type, description) VALUES ($1, $2, $3)",
      [name, type, description],
    );
    revalidatePath("/dashboard/admin/payroll/components");
    return { success: true, message: `Created component "${name}".` };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create component. Does it already exist?",
    };
  }
}

const UpdatePayrollComponentSchema = PayrollComponentSchema.extend({
  id: z.string().uuid(),
});
export async function updatePayrollComponentAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdatePayrollComponentSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update component.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { id, name, type, description } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    await db.query(
      "UPDATE payroll_components SET name = $1, type = $2, description = $3 WHERE id = $4",
      [name, type, description, id],
    );
    revalidatePath("/dashboard/admin/payroll/components");
    return {
      success: true,
      message: "Payroll component updated successfully.",
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update component.",
    };
  }
}

export async function deletePayrollComponentAction(
  id: string,
): Promise<DeleteResult> {
  return performDelete(
    "payroll_components",
    id,
    "/dashboard/admin/payroll/components",
    "Payroll Component",
  );
}

const EmployeePayrollSettingSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee."),
  componentId: z.string().uuid("Please select a valid component."),
  value: z.coerce.number().min(0, "Value must be a positive number."),
});
export async function assignEmployeePayrollSettingAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = EmployeePayrollSettingSchema.safeParse({
    employeeId: formData.get("employeeId"),
    componentId: formData.get("componentId"),
    value: formData.get("value"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to assign component.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { employeeId, componentId, value } = validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");
    // Upsert logic: Update if exists, otherwise insert.
    await db.query(
      `
      INSERT INTO employee_payroll_settings (employee_id, component_id, value) 
      VALUES ($1, $2, $3)
      ON CONFLICT (employee_id, component_id) 
      DO UPDATE SET value = $3;
    `,
      [employeeId, componentId, value],
    );
    revalidatePath("/dashboard/admin/payroll/settings");
    return {
      success: true,
      message: "Successfully assigned component to employee.",
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to assign component.",
    };
  }
}

export async function deleteEmployeePayrollSettingAction(
  id: string,
): Promise<DeleteResult> {
  return performDelete(
    "employee_payroll_settings",
    id,
    "/dashboard/admin/payroll/settings",
    "Employee Payroll Setting",
  );
}

export async function deletePayslipAction(id: string): Promise<DeleteResult> {
  return performDelete(
    "payslips",
    id,
    "/dashboard/admin/payroll/payslips",
    "Payslip",
  );
}

const RunPayrollSchema = z.object({
  employeeIds: z.string().min(1, "Please select at least one employee."),
  payPeriod: z.object({
    from: z.string(),
    to: z.string(),
  }),
});
export async function runPayrollAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = RunPayrollSchema.safeParse({
    employeeIds: formData.get("employeeIds"),
    payPeriod: {
      from: formData.get("dateFrom"),
      to: formData.get("dateTo"),
    },
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided for payroll run.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { employeeIds, payPeriod } = validatedFields.data;
  const employeeIdArray = employeeIds.split(",");
  const startDate = parseISO(payPeriod.from);
  const endDate = parseISO(payPeriod.to);

  try {
    const result = await runPayrollForEmployees(
      employeeIdArray,
      startDate,
      endDate,
    );
    revalidatePath("/dashboard/admin/payroll/run");
    revalidatePath("/dashboard/admin/payroll/payslips");
    return {
      success: true,
      message: `Successfully ran payroll for ${result.processedCount} employee(s).`,
    };
  } catch (error) {
    console.error("Payroll Run Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message: `Payroll Run Failed: ${errorMessage}` };
  }
}

// --- SCREEN PERMISSION ACTIONS ---
const ScreenPermissionSchema = z.object({
  route: z.string().min(1, "Please select a route."),
  permissionType: z.enum(["employee", "department", "role"]),
  targetId: z.string().min(1, "Please select a target."),
  isDefault: z.preprocess((val) => val === "on", z.boolean()),
});
export async function createScreenPermissionAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = ScreenPermissionSchema.safeParse({
    route: formData.get("route"),
    permissionType: formData.get("permissionType"),
    targetId: formData.get("targetId"),
    isDefault: formData.get("isDefault"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to create permission.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { route, permissionType, targetId, isDefault } = validatedFields.data;

  try {
    if (!db) throw new Error("Database not configured");

    // If setting as default, first unset other defaults for the same target
    if (isDefault) {
      await db.query(
        "UPDATE screen_permissions SET is_default = false WHERE permission_type = $1 AND target_id = $2",
        [permissionType, targetId],
      );
    }

    await db.query(
      "INSERT INTO screen_permissions (route, permission_type, target_id, is_default) VALUES ($1, $2, $3, $4)",
      [route, permissionType, targetId, isDefault],
    );
    revalidatePath("/dashboard/admin/permissions");
    return {
      success: true,
      message: "Successfully created new screen permission.",
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message:
        "Database Error: Failed to create permission. Does it already exist for this combination?",
    };
  }
}

const UpdateScreenPermissionSchema = ScreenPermissionSchema.extend({
  id: z.string().uuid(),
});
export async function updateScreenPermissionAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = UpdateScreenPermissionSchema.safeParse({
    id: formData.get("id"),
    route: formData.get("route"),
    permissionType: formData.get("permissionType"),
    targetId: formData.get("targetId"),
    isDefault: formData.get("isDefault"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Failed to update permission.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { id, route, permissionType, targetId, isDefault } =
    validatedFields.data;
  try {
    if (!db) throw new Error("Database not configured");

    if (isDefault) {
      await db.query(
        "UPDATE screen_permissions SET is_default = false WHERE permission_type = $1 AND target_id = $2 AND id != $3",
        [permissionType, targetId, id],
      );
    }

    await db.query(
      "UPDATE screen_permissions SET route = $1, permission_type = $2, target_id = $3, is_default = $4 WHERE id = $5",
      [route, permissionType, targetId, isDefault, id],
    );
    revalidatePath("/dashboard/admin/permissions");
    return { success: true, message: "Permission updated successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update permission.",
    };
  }
}

export async function deleteScreenPermissionAction(
  id: string,
): Promise<DeleteResult> {
  return performDelete(
    "screen_permissions",
    id,
    "/dashboard/admin/permissions",
    "Screen Permission",
  );
}

// --- GOOGLE CALENDAR ACTIONS ---
type AddToCalendarResult = {
  success: boolean;
  message: string;
};

export async function addEventToGoogleCalendarAction(
  summary: string,
  startDate: string,
  endDate: string,
): Promise<AddToCalendarResult> {
  const { userId } = auth();
  if (!userId) {
    return {
      success: false,
      message: "You must be logged in to add events to Google Calendar.",
    };
  }

  try {
    const oauthTokens = await clerkClient.users.getUserOauthAccessToken(
      userId,
      "oauth_google",
    );
    const accessToken = oauthTokens?.data[0].token;

    if (!accessToken) {
      return {
        success: false,
        message: "Google account not connected or permission denied.",
      };
    }

    const event = {
      summary: summary,
      start: {
        date: startDate,
      },
      end: {
        date: endDate,
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (response.ok) {
      return { success: true, message: "Event added to Google Calendar." };
    } else {
      const errorData = await response.json();
      console.error("Google Calendar API Error:", errorData);
      return {
        success: false,
        message:
          errorData.error.message || "Failed to add event to Google Calendar.",
      };
    }
  } catch (error) {
    console.error("Error adding event to Google Calendar:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    if (errorMessage.includes("No matching token")) {
      return {
        success: false,
        message:
          "Could not find Google account connection. Please ensure you have signed in with Google.",
      };
    }
    return { success: false, message: `Error: ${errorMessage}` };
  }
}
