export function satangToBaht(amountSatang: number) {
  return amountSatang / 100;
}

export function formatBaht(amountSatang: number) {
  return satangToBaht(amountSatang).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB"
  });
}
