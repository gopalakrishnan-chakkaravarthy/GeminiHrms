"use server";

/**
 * @fileOverview AI-powered leave insights flow.
 *
 * This file defines a Genkit flow that provides insights into the best timing and potential impact of a proposed leave, based on the employee's role and past leave history.
 * It exports:
 *   - `getLeaveInsights`: An async function to trigger the leave insights flow.
 *   - `LeaveInsightsInput`: The input type for the `getLeaveInsights` function.
 *   - `LeaveInsightsOutput`: The output type for the `getLeaveInsights` function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const LeaveInsightsInputSchema = z.object({
  employeeRole: z.string().describe("The role of the employee."),
  leaveHistory: z.string().describe("The past leave history of the employee."),
  proposedStartDate: z
    .string()
    .describe("The proposed start date of the leave (YYYY-MM-DD)."),
  proposedEndDate: z
    .string()
    .describe("The proposed end date of the leave (YYYY-MM-DD)."),
});
export type LeaveInsightsInput = z.infer<typeof LeaveInsightsInputSchema>;

const LeaveInsightsOutputSchema = z.object({
  bestTimingSuggestion: z
    .string()
    .describe("A suggestion for the best timing of the leave."),
  potentialImpactAssessment: z
    .string()
    .describe(
      "An assessment of the potential impact of the leave on projects and team."
    ),
  overallRecommendation: z
    .string()
    .describe("An overall recommendation for the leave request."),
});
export type LeaveInsightsOutput = z.infer<typeof LeaveInsightsOutputSchema>;

export async function getLeaveInsights(
  input: LeaveInsightsInput
): Promise<LeaveInsightsOutput> {
  return leaveInsightsFlow(input);
}

const leaveInsightsPrompt = ai.definePrompt({
  name: "leaveInsightsPrompt",
  input: { schema: LeaveInsightsInputSchema },
  output: { schema: LeaveInsightsOutputSchema },
  prompt: `You are an AI assistant providing insights on leave requests. Your response MUST be a valid JSON object and nothing else.

  Based on the employee's role, leave history, and proposed leave dates, provide insights into the best timing and potential impact of the leave.

  Employee Role: {{{employeeRole}}}
  Leave History: {{{leaveHistory}}}
  Proposed Start Date: {{{proposedStartDate}}}
  Proposed End Date: {{{proposedEndDate}}}

  Consider factors such as project deadlines, team workload, and company policies.

  Provide a best timing suggestion, a potential impact assessment, and an overall recommendation for the leave request.

  You must respond with a JSON object that strictly adheres to the following schema. Do not include any other text, explanation, or markdown formatting.
  
  Schema:
  ${JSON.stringify(LeaveInsightsOutputSchema.describe)}
  `,
});

const leaveInsightsFlow = ai.defineFlow(
  {
    name: "leaveInsightsFlow",
    inputSchema: LeaveInsightsInputSchema,
    outputSchema: LeaveInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await leaveInsightsPrompt(input);
    return output!;
  }
);
