export function isPunchInEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_ENABLE_PUNCH_IN;
  if (envVal === undefined || envVal === "") return true; // Enabled by default
  return envVal.toLowerCase() === "true" || envVal === "1";
}

export function isReportsEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_ENABLE_REPORTS;
  if (envVal === undefined || envVal === "") return true; // Enabled by default
  return envVal.toLowerCase() === "true" || envVal === "1";
}
