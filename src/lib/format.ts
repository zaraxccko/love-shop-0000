export const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export const shortId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();
