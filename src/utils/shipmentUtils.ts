// src/utils/shipmentUtils.ts
import type { PackageRow } from "../pages/shipments/shipmentTypes";

export const cmToCbm = (l?: number | "", w?: number | "", h?: number | "") =>
  l && w && h ? (Number(l) * Number(w) * Number(h)) / 1_000_000 : 0;

export const inchToCft = (l?: number | "", w?: number | "", h?: number | "") =>
  l && w && h ? (Number(l) * Number(w) * Number(h)) / 1728 : 0;

export const kgToLbs = (kg?: number | "") => (kg ? Number(kg) * 2.20462 : 0);

export function computeTotals(items: PackageRow[]) {
  let totalPkg = 0, totalPcs = 0, cbm = 0, cft = 0, actKg = 0;
  items.forEach((r) => {
    totalPkg += Number(r.pkg || 0);
    totalPcs += Number((r as any).pcs || 0);
    if (r.dimUnit === "CM") cbm += cmToCbm(r.length, r.width, r.height);
    else cft += inchToCft(r.length, r.width, r.height);
    actKg += Number(r.actWeightKg || 0);
  });
  return { totalPkg, totalPcs, cbm, cft, actKg, actLbs: kgToLbs(actKg) };
}
