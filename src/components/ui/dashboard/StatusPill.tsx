import React from "react";

export type ShipmentStatus =
  | "RECEIVED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "READY_FOR_PICKUP";

const StatusPill: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
  const map: Record<ShipmentStatus, string> = {
    RECEIVED: "bg-[var(--color-surfaceMuted)] text-[var(--color-text)]",
    DISPATCHED: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    IN_TRANSIT: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    ARRIVED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    READY_FOR_PICKUP: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
};

export default StatusPill;
