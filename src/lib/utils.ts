import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parses a date input (string or Date object) into a local midnight Date object,
 * avoiding UTC-to-local timezone shift (e.g. converting 2026-07-20 UTC into 2026-07-19 local time).
 */
export function parseLocalDate(dateInput: string | Date | null | undefined): Date {
  if (!dateInput) return new Date();

  if (typeof dateInput === "string") {
    // If ISO or YYYY-MM-DD string, take date portion
    const cleanStr = dateInput.split("T")[0]; // "2026-07-20"
    const parts = cleanStr.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      return new Date(year, month - 1, day); // local midnight
    }
    return new Date(dateInput);
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return new Date();
    // Extract UTC year/month/date if Date was created at UTC midnight
    const year = dateInput.getUTCFullYear();
    const month = dateInput.getUTCMonth();
    const day = dateInput.getUTCDate();
    return new Date(year, month, day);
  }

  return new Date();
}

/**
 * Formats a date input using date-fns format string, strictly preserving the intended calendar date.
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  formatStr: string = "MMM dd, yyyy"
): string {
  if (!dateInput) return "";
  const localDate = parseLocalDate(dateInput);
  return format(localDate, formatStr);
}
