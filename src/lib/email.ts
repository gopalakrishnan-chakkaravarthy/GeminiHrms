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
const applicationUrl = process.env.APPLICATION_URL;
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
      <p>Please log in to your dashboard to review and take action on this request. <a href="${applicationUrl}/dashboard" target='_blank'>Dashboard</a></p>
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
        // For 'Pending' status for an employee, no email is typically sent,
        // but we can handle it just in case.
        subject = `Your Leave Request is Pending`;
        body = `
            <p>Hi ${recipientName},</p>
            <p>Your leave request has been submitted and is now pending review.</p>
            <p>Thanks,<br/>The AbsenceAce Team</p>
        `;
    }
  }

  // Basic HTML wrapper for a consistent look
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${body}
    </div>
  `;

  return { subject, body: htmlBody };
}
