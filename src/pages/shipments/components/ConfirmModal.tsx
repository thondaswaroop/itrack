// src/pages/shipments/components/ConfirmModal.tsx
import React from "react";
import { FormState } from "../shipmentTypes";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import { computeTotals } from "../../../utils/shipmentUtils";

export default function ConfirmModal({ open, onClose, onConfirm, form }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  form: FormState;
}) {
  const totals = computeTotals(form.items);
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={onClose} title="Confirm Receipt" size="lg" dismissible showCloseIcon footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="solid" onClick={onConfirm}>Confirm & Print</Button>
      </>
    }>
      <div className="space-y-3 p-2 text-sm">
        <div><strong>WR:</strong> {form.wrNo} • <strong>Received:</strong> {new Date(form.receivedAt).toLocaleString()}</div>
        <div><strong>Shipper:</strong> {form.shipper?.name ?? "-"}</div>
        <div><strong>Consignee:</strong> {form.consignee?.name ?? "-"}</div>
        <div>
          <strong>Packages:</strong>
          <ul className="mt-1 ml-4">
            {form.items.map((it, i) => <li key={it.id} className="text-xs">{i+1}. {it.description || "-"} — {it.length}×{it.width}×{it.height} {it.dimUnit} — {it.actWeightKg || 0} kg</li>)}
          </ul>
        </div>
        <div className="mt-2 text-xs text-[var(--color-textMuted)]">Totals: {totals.totalPkg} pkgs • {totals.totalPcs} pcs • CBM {totals.cbm.toFixed(3)} • Weight {totals.actKg} kg</div>
      </div>
    </Modal>
  );
}
