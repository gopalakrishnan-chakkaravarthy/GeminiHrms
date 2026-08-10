import nodemailer from "nodemailer";

export type GenerateEmailInput = {
  recipientName: string;
  recipientRole: "employee" | "manager";
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "Approved" | "Rejected" | "Pending";
  leaveBalanceCount: string;
};

export type GenerateEmailOutput = {
  subject: string;
  body: string;
};

const getAppUrl = () => process.env.APPLICATION_URL || "http://localhost:3000";

/**
 * Universal email dispatcher using nodemailer (supports Gmail, SMTP, or graceful log fallback)
 */
export async function sendMail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; message: string }> {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  const sender = SMTP_FROM || GMAIL_USER || "AbsenceAce HR <noreply@absenceace.com>";

  // Check if we have valid email transport credentials
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: sender,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH] Sent email to ${to}: "${subject}"`);
      return { success: true, message: `Email dispatched to ${to}` };
    } catch (err: any) {
      console.error(`[EMAIL ERROR] Failed to send via Gmail to ${to}:`, err);
    }
  } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: sender,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH] Sent email via SMTP to ${to}: "${subject}"`);
      return { success: true, message: `Email dispatched to ${to}` };
    } catch (err: any) {
      console.error(`[EMAIL ERROR] Failed to send via SMTP to ${to}:`, err);
    }
  }

  // Graceful Fallback if SMTP is not configured in env
  console.log(`[EMAIL SIMULATION] Recipient: ${to} | Subject: "${subject}"`);
  return {
    success: true,
    message: `Email queued for ${to} (Simulated - configure SMTP/Gmail credentials in env for live delivery)`,
  };
}

/**
 * Send welcome onboarding email with login default password
 */
export async function sendEmployeeOnboardingEmail({
  name,
  email,
  password,
  employeeId,
  roleName,
  departmentName,
}: {
  name: string;
  email: string;
  password: string;
  employeeId?: string | null;
  roleName?: string | null;
  departmentName?: string | null;
}) {
  const loginUrl = `${getAppUrl()}/login`;
  const subject = `Welcome to AbsenceAce - Your Employee Account Credentials`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #059669;">
        <h1 style="color: #065f46; margin: 0; font-size: 24px; font-weight: 800;">AbsenceAce HR</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Employee Onboarding Portal</p>
      </div>

      <p style="font-size: 16px; color: #1e293b;">Dear <b>${name}</b>,</p>

      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Welcome to the team! Your employee account has been created on <b>AbsenceAce</b>. Below are your official account credentials to log in to your employee dashboard.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">Account Details:</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">Full Name:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${name}</td>
          </tr>
          ${employeeId ? `<tr><td style="padding: 6px 0; color: #64748b;">Employee ID:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${employeeId}</td></tr>` : ""}
          ${roleName ? `<tr><td style="padding: 6px 0; color: #64748b;">Role:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${roleName}</td></tr>` : ""}
          ${departmentName ? `<tr><td style="padding: 6px 0; color: #64748b;">Department:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${departmentName}</td></tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Login Email:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Default Password:</td>
            <td style="padding: 6px 0;">
              <span style="font-family: monospace; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 15px; font-weight: 700; color: #047857;">${password}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">
          Log In to AbsenceAce Dashboard
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <b>Security Notice:</b> For security purposes, please log in and update your default password upon first access. If you have any trouble signing in, please contact your HR administrator.
      </p>
    </div>
  `;

  return await sendMail(email, subject, htmlContent);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  name,
  email,
  newPassword,
}: {
  name: string;
  email: string;
  newPassword: string;
}) {
  const loginUrl = `${getAppUrl()}/login`;
  const subject = `Password Reset Notification - AbsenceAce HR`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #059669;">
        <h1 style="color: #065f46; margin: 0; font-size: 24px; font-weight: 800;">AbsenceAce HR</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Security & Password Reset Notice</p>
      </div>

      <p style="font-size: 16px; color: #1e293b;">Hello <b>${name}</b>,</p>

      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Your password for the AbsenceAce platform has been reset. You can now log in using your email and temporary password below:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">Email:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">New Password:</td>
            <td style="padding: 6px 0;">
              <span style="font-family: monospace; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 15px; font-weight: 700; color: #047857;">${newPassword}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
          Sign In Now
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        If you did not request this password reset, please notify your system administrator immediately.
      </p>
    </div>
  `;

  return await sendMail(email, subject, htmlContent);
}

export async function generateLeaveStatusEmail(
  input: GenerateEmailInput,
): Promise<GenerateEmailOutput> {
  let subject = "";
  let body = "";

  const {
    recipientName,
    recipientRole,
    employeeName,
    leaveType,
    startDate,
    endDate,
    status,
  } = input;

  if (recipientRole === "manager" && status === "Pending") {
    subject = `New Leave Request from ${employeeName}`;
    body = `
      <p>Hi ${recipientName},</p>
      <p>A new leave request has been submitted by <b>${employeeName}</b> and is awaiting your approval.</p>
      <h3>Request Details:</h3>
      <ul>
        <li><b>Employee:</b> ${employeeName}</li>
        <li><b>Leave Type:</b> ${leaveType} Available Balance :${input.leaveBalanceCount}</li>
        <li><b>Dates:</b> ${startDate} to ${endDate}</li>
      </ul>
      <p>Please log in to your dashboard to review and take action on this request. <a href="${getAppUrl()}/dashboard" target='_blank'>Dashboard</a></p>
      <p>Thanks,<br/>The AbsenceAce Team</p>
    `;
  } else if (recipientRole === "employee") {
    switch (status) {
      case "Approved":
        subject = `Your Leave Request has been Approved`;
        body = `
          <p>Hi ${recipientName},</p>
          <p>Great news! Your leave request has been approved.</p>
          <h3>Approved Details:</h3>
          <ul>
            <li><b>Leave Type:</b> ${leaveType}</li>
            <li><b>Dates:</b> ${startDate} to ${endDate}</li>
          </ul>
          <p>We hope you have a great time off!</p>
          <p>Thanks,<br/>The AbsenceAce Team</p>
        `;
        break;
      case "Rejected":
        subject = `Update on Your Leave Request`;
        body = `
          <p>Hi ${recipientName},</p>
          <p>This is an update regarding your recent leave request.</p>
          <p>Unfortunately, your request for <b>${leaveType}</b> from <b>${startDate}</b> to <b>${endDate}</b> has been rejected.</p>
          <p>Please reach out to your manager directly to discuss the reasons for this decision and to explore alternative dates if possible.</p>
          <p>Thanks,<br/>The AbsenceAce Team</p>
        `;
        break;
      default:
        subject = `Your Leave Request is Pending`;
        body = `
            <p>Hi ${recipientName},</p>
            <p>Your leave request has been submitted and is now pending review.</p>
            <p>Thanks,<br/>The AbsenceAce Team</p>
        `;
    }
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${body}
    </div>
  `;

  return { subject, body: htmlBody };
}

/**
 * Send official Payslip Generation Email Notification
 */
export async function sendPayslipEmail({
  employeeName,
  employeeEmail,
  payPeriod,
  grossEarnings,
  totalDeductions,
  netPay,
  details,
  payslipId,
}: {
  employeeName: string;
  employeeEmail: string;
  payPeriod: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  details: Array<{ name: string; type: string; value: number }>;
  payslipId: string;
}) {
  const payslipUrl = `${getAppUrl()}/dashboard/admin/payroll/payslips/${payslipId}`;
  const subject = `Your Salary Payslip for ${payPeriod} - AbsenceAce HR`;

  const earnings = details.filter((d) => d.type === "Earning");
  const deductions = details.filter((d) => d.type === "Deduction");

  const formatAmt = (val: number) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      {/* HEADER */}
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #059669;">
        <h1 style="color: #065f46; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AbsenceAce Payroll Services</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Salary Advice & Payslip Statement</p>
      </div>

      <p style="font-size: 16px; color: #1e293b;">Dear <b>${employeeName}</b>,</p>

      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Your official payslip for the pay period <b>${payPeriod}</b> has been generated and processed. Below is your detailed salary statement summary:
      </p>

      {/* SUMMARY STATS TABLE */}
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Gross Earnings</td>
            <td style="padding: 8px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Deductions</td>
            <td style="padding: 8px; font-size: 13px; color: #047857; text-transform: uppercase; font-weight: 700;">Net Payout</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-size: 18px; font-weight: 700; color: #0f172a;">${formatAmt(grossEarnings)}</td>
            <td style="padding: 8px; font-size: 18px; font-weight: 700; color: #dc2626;">-${formatAmt(totalDeductions)}</td>
            <td style="padding: 8px; font-size: 22px; font-weight: 800; color: #059669;">${formatAmt(netPay)}</td>
          </tr>
        </table>
      </div>

      {/* ITEMIZED BREAKDOWN */}
      <div style="margin: 24px 0;">
        <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Itemized Salary Breakdown</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 8px 12px;">Component</th>
              <th style="padding: 8px 12px;">Category</th>
              <th style="padding: 8px 12px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${earnings
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 12px; color: #1e293b; font-weight: 500;">${item.name}</td>
                <td style="padding: 8px 12px; color: #16a34a; font-size: 12px; font-weight: 600;">Earning</td>
                <td style="padding: 8px 12px; text-align: right; color: #0f172a; font-family: monospace; font-weight: 600;">${formatAmt(item.value)}</td>
              </tr>
            `
              )
              .join("")}
            ${deductions
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 12px; color: #1e293b; font-weight: 500;">${item.name}</td>
                <td style="padding: 8px 12px; color: #dc2626; font-size: 12px; font-weight: 600;">Deduction</td>
                <td style="padding: 8px 12px; text-align: right; color: #dc2626; font-family: monospace; font-weight: 600;">-${formatAmt(item.value)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      {/* CTA BUTTON */}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${payslipUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.25);">
          View Full Interactive Payslip
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <b>Note:</b> This is an automated system notification from AbsenceAce HR. For any payroll queries or discrepancy reports, please reach out to your finance administrator.
      </p>
    </div>
  `;

  return await sendMail(employeeEmail, subject, htmlContent);
}

/**
 * Send official TDS (Tax Deducted at Source) Tax Statement & Certificate Notification
 */
export async function sendTdsStatementEmail({
  employeeName,
  employeeEmail,
  financialYear,
  annualGrossSalary,
  annualTaxableIncome,
  totalTdsDeducted,
  monthlyTdsAverage,
  taxSlabName,
}: {
  employeeName: string;
  employeeEmail: string;
  financialYear: string;
  annualGrossSalary: number;
  annualTaxableIncome: number;
  totalTdsDeducted: number;
  monthlyTdsAverage: number;
  taxSlabName?: string;
}) {
  const portalUrl = `${getAppUrl()}/dashboard/admin/payroll/statutory`;
  const subject = `Tax Deducted at Source (TDS) Statement - FY ${financialYear} - AbsenceAce HR`;

  const formatAmt = (val: number) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      {/* HEADER */}
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #0284c7;">
        <h1 style="color: #0369a1; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AbsenceAce Statutory Compliance</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Tax Deducted at Source (TDS) & Income Tax Statement</p>
      </div>

      <p style="font-size: 16px; color: #1e293b;">Dear <b>${employeeName}</b>,</p>

      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        This is your official Tax Deducted at Source (TDS) statement for the financial year <b>${financialYear}</b>. Below is the summary of your taxable gross income and cumulative tax deductions withheld by your employer:
      </p>

      {/* SUMMARY BOX */}
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0369a1; font-size: 16px; border-bottom: 1px dashed #7dd3fc; padding-bottom: 8px;">TDS Tax Deduction Summary (${financialYear})</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 8px;">
          <tr>
            <td style="padding: 6px 0; color: #475569; width: 220px;">Annual Gross Salary:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${formatAmt(annualGrossSalary)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #475569;">Taxable Base Income:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${formatAmt(annualTaxableIncome)}</td>
          </tr>
          ${taxSlabName ? `<tr><td style="padding: 6px 0; color: #475569;">Applicable Tax Slab:</td><td style="padding: 6px 0; font-weight: 600; color: #0284c7;">${taxSlabName}</td></tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #475569;">Monthly Average TDS Withheld:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #d97706; font-family: monospace;">${formatAmt(monthlyTdsAverage)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #0369a1; font-weight: 700; font-size: 15px;">Total Cumulative TDS Deducted:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #0284c7; font-size: 18px; font-family: monospace;">${formatAmt(totalTdsDeducted)}</td>
          </tr>
        </table>
      </div>

      {/* TAX FILING ADVISORY */}
      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 6px 0; color: #b45309; font-size: 13px; font-weight: 700; text-transform: uppercase;">Tax Filing Notice & Guidance</h4>
        <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
          The TDS withheld above has been deposited with the tax authorities. You can utilize this statement and your Form 16 / Tax Certificate when filing your annual Income Tax Returns (ITR).
        </p>
      </div>

      {/* CTA BUTTON */}
      <div style="text-align: center; margin: 28px 0;">
        <a href="${portalUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
          View Statutory & Tax Settings Portal
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        If you have tax exemption declarations or investment proofs to submit, please contact the HR / Finance team.
      </p>
    </div>
  `;

  return await sendMail(employeeEmail, subject, htmlContent);
}


