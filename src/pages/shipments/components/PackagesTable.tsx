// src/pages/shipments/components/PackagesTable.tsx
import React from "react";
import { PackageRow, DimUnit } from "../shipmentTypes";
import { Input, Button } from "../../../components";
import { Icon } from "../../../utils/icons";

export default function PackagesTable({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: PackageRow[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<PackageRow>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={onAdd}><Icon name="plus" className="h-4 w-4" /> Add</Button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
            <tr>
              <th className="px-3 py-2">L</th>
              <th className="px-3 py-2">W</th>
              <th className="px-3 py-2">H</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Act Wt</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="divide-y divide-[var(--color-border)]">
                <td className="px-2 py-2"><Input type="number" value={String(r.length ?? "")} onValueChange={(v) => onUpdate(r.id, { length: v ? Number(v) : "" })} /></td>
                <td className="px-2 py-2"><Input type="number" value={String(r.width ?? "")} onValueChange={(v) => onUpdate(r.id, { width: v ? Number(v) : "" })} /></td>
                <td className="px-2 py-2"><Input type="number" value={String(r.height ?? "")} onValueChange={(v) => onUpdate(r.id, { height: v ? Number(v) : "" })} /></td>
                <td className="px-2 py-2">
                  <select value={r.dimUnit} onChange={(e) => onUpdate(r.id, { dimUnit: e.target.value as DimUnit })} className="rounded border px-2 py-1">
                    <option value="CM">CM</option>
                    <option value="INCH">INCH</option>
                  </select>
                </td>
                <td className="px-2 py-2"><Input value={r.description} onValueChange={(v) => onUpdate(r.id, { description: v })} placeholder="Contents" /></td>
                <td className="px-2 py-2"><Input type="number" value={String(r.actWeightKg ?? "")} onValueChange={(v) => onUpdate(r.id, { actWeightKg: v ? Number(v) : "" })} /></td>
                <td className="px-2 py-2"><Button variant="ghost" tone="danger" onClick={() => onRemove(r.id)}><Icon name="trash" className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
