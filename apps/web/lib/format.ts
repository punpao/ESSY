export function formatTHBFromSatang(amountSatang: number): string {
  return (amountSatang / 100).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB"
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("th-TH", {
    hour12: false
  });
}
