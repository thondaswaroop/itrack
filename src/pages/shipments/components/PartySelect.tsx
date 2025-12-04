// src/pages/shipments/components/PartySelect.tsx
import React, { useMemo, useState } from "react";
import { Party } from "../shipmentTypes";
import { Input, Button } from "../../../components";
import Label from "../../../components/form/Label";
import { Icon } from "../../../utils/icons";

export default function PartySelect({
  value,
  label,
  onSelect,
  onClear,
  placeholder,
  onCreateNew,
}: {
  value: Party | null;
  label: string;
  onSelect: (p: Party) => void;
  onClear: () => void;
  placeholder?: string;
  onCreateNew: () => void;
}) {
  const [q, setQ] = useState("");
  const suggestions = useMemo<Party[]>(
    () =>
      !q
        ? []
        : [
            { id: "P-1001", name: "AER LINGUS LIMITED P.L.C.", email: "ops@aerlingus.com", country: "UK" },
            { id: "P-1002", name: "ABOVE & BEYOND TRADING", email: "admin@abt.com", country: "UAE" },
            { id: "P-1003", name: "Blue Retail Pvt Ltd", email: "support@blue.com", country: "India" },
          ].filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  const showDropdown = !value && q.length > 0;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="relative">
        <Input value={value ? value.name : q} onValueChange={(v) => { if (value) onClear(); setQ(v); }} placeholder={placeholder} />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {value ? (
            <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onCreateNew} leadingIcon={<Icon name="plus" className="h-4 w-4" />}>New</Button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute z-20 mt-2 w-full rounded border bg-[var(--color-surface)] shadow">
            <ul className="max-h-48 overflow-auto text-sm">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => { onSelect(s); setQ(""); }} className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-[var(--color-surfaceMuted)]">
                    <div>
                      <div className="font-medium text-[var(--color-text)]">{s.name}</div>
                      <div className="text-xs text-[var(--color-textMuted)]">{s.email ?? "—"} {s.country ? `• ${s.country}` : ""}</div>
                    </div>
                  </button>
                </li>
              ))}
              <li className="border-t">
                <button type="button" onClick={onCreateNew} className="w-full px-3 py-2 text-left text-[var(--color-primary)]">+ Create new</button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
