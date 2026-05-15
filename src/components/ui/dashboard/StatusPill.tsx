import React from "react";

export type ShipmentStatus =
  | "RECEIVED"
  | "CONSOLIDATED"
  | "READY_TO_SHIP"
  | "DISPATCHED"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "READY_FOR_PICKUP"
  | "COLLECTED"
  | "DELIVERED";

const StatusPill: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
  const map: Record<string, string> = {
    RECEIVED: "bg-[var(--color-surfaceMuted)] text-[var(--color-text)]",
    CONSOLIDATED: "bg-blue-500/10 text-blue-600",
    READY_TO_SHIP: "bg-purple-500/10 text-purple-600",
    DISPATCHED: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    SHIPPED: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    IN_TRANSIT: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    ARRIVED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    READY_FOR_PICKUP: "bg-green-500/10 text-green-600",
    COLLECTED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    DELIVERED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
};

export default StatusPill;
