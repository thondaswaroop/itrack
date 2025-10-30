// src/pages/dashboard/Home.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "../../utils/icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/Input";
import {Button} from "../../components";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";

// 👉 Use your existing modal component (path may differ in your repo)
import { Modal } from "../../components";

/* ---------------------------------
   Types
---------------------------------- */
type ShipmentStatus =
  | "RECEIVED"
  | "CONSOLIDATED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "READY_FOR_PICKUP"
  | "COLLECTED";

type ShipmentRow = {
  id: string;
  from: string;
  to: string;
  mode: "AIR" | "OCEAN" | "ROAD";
  packages: number;
  eta: string;
  status: ShipmentStatus;
};

type PackageResult = {
  id: string; // tracking id
  from: string;
  to: string;
  mode: "AIR" | "OCEAN" | "ROAD";
  pieces: number;
  weightKg: number;
  eta: string;
  status: ShipmentStatus;
  container?: string;
  shelf?: string;
  lastScanAt?: string;
  history: { at: string; note: string; hub?: string }[];
};

/* ---------------------------------
   Modal adapter (supports open | isOpen)
---------------------------------- */
const AnyModal = Modal as any;

/* ---------------------------------
   Inline UI Primitives
---------------------------------- */
const StatusPill: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
  const map: Record<ShipmentStatus, string> = {
    RECEIVED: "bg-[var(--color-surfaceMuted)] text-[var(--color-text)]",
    CONSOLIDATED: "bg-[var(--color-surfaceMuted)] text-[var(--color-text)]",
    DISPATCHED: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    IN_TRANSIT: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    ARRIVED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    READY_FOR_PICKUP: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    COLLECTED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
};

const PackageStepper: React.FC<{ current: ShipmentStatus }> = ({ current }) => {
  const steps: ShipmentStatus[] = [
    "RECEIVED",
    "CONSOLIDATED",
    "DISPATCHED",
    "IN_TRANSIT",
    "ARRIVED",
    "READY_FOR_PICKUP",
    "COLLECTED",
  ];

  const idx = Math.max(0, steps.indexOf(current));
  const progressPct = (idx / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Track row: circles + centered line */}
      <div className="relative h-7">
        {/* base line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-surfaceMuted)]" />
        {/* progress line */}
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${progressPct}%` }}
        />
        {/* circles */}
        <ol className="relative z-10 flex h-full items-center justify-between">
          {steps.map((_, i) => {
            const active = i <= idx;
            return (
              <li key={i} className="flex items-center justify-center">
                <span
                  className={[
                    "grid h-7 w-7 place-items-center rounded-full border text-[11px] font-bold -translate-y-[1px]",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-textMuted)]",
                  ].join(" ")}
                >
                  {i + 1}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Labels row */}
      <div className="mt-2 hidden justify-between gap-2 sm:flex">
        {steps.map((s, i) => (
          <div
            key={s}
            className="max-w-[110px] shrink-0 text-center text-[10px] leading-snug text-[var(--color-textMuted)]"
            style={{ transform: i === 0 ? "translateX(-8px)" : i === steps.length - 1 ? "translateX(8px)" : undefined }}
          >
            {s.replaceAll("_", " ")}
          </div>
        ))}
      </div>
    </div>
  );
};


const PackageStatusContent: React.FC<{ data: PackageResult }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="text-xs text-[var(--color-textMuted)]">Tracking ID</div>
          <div className="text-[var(--color-text)]">
            <span className="font-semibold">{data.id}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={data.status} />
          <Button size="sm" variant="outline" className="border-[var(--color-border)] text-[var(--color-text)]">
            Print Label
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-textMuted)]">Route</div>
          <div className="mt-1 text-[var(--color-text)]">
            <span className="font-semibold">{data.from}</span> &rarr;{" "}
            <span className="font-semibold">{data.to}</span>
          </div>
          <div className="mt-0.5 text-sm text-[var(--color-textMuted)]">Mode: {data.mode}</div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-textMuted)]">ETA</div>
          <div className="mt-1 font-semibold text-[var(--color-text)]">{data.eta}</div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-textMuted)]">Pieces / Weight</div>
          <div className="mt-1 font-semibold text-[var(--color-text)]">
            {data.pieces} pcs • {data.weightKg} kg
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-textMuted)]">Container</div>
          <div className="mt-1 text-[var(--color-text)]">{data.container ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-textMuted)]">Shelf</div>
          <div className="mt-1 text-[var(--color-text)]">{data.shelf ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-textMuted)]">Last Scan</div>
          <div className="mt-1 text-[var(--color-text)]">{data.lastScanAt ?? "—"}</div>
        </div>
      </div>

      {/* Stepper */}
      <PackageStepper current={data.status} />

      {/* Activity */}
      <div>
        <div className="mb-3 text-sm font-semibold text-[var(--color-text)]">Recent Activity</div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.history.map((h, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-primary)]"></div>
              <div>
                <div className="text-sm text-[var(--color-text)]">{h.note}</div>
                <div className="text-xs text-[var(--color-textMuted)]">
                  {h.at} {h.hub ? `• ${h.hub}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ---------------------------------
   Bottom table
---------------------------------- */
const ShipmentsTable: React.FC<{ rows: ShipmentRow[] }> = ({ rows }) => (
  <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-3 pt-4 sm:px-6">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">Current Shipments</h3>
    </div>
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-[var(--color-border)]">
            <TableRow>
              {["Shipment ID", "From", "To", "Mode", "Packages", "ETA", "Status"].map((h) => (
                <TableCell key={h} isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-[var(--color-textMuted)]">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[var(--color-border)]">
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.id}</TableCell>
                <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.from}</TableCell>
                <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.to}</TableCell>
                <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.mode}</TableCell>
                <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.packages}</TableCell>
                <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.eta}</TableCell>
                <TableCell className="px-4 py-3 text-theme-sm">
                  <StatusPill status={s.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  </section>
);

/* ---------------------------------
   Main Dashboard
---------------------------------- */
const Home: React.FC = () => {
  const navigate = useNavigate();

  // KPI cards
  const kpis = useMemo(
    () => [
      { key: "customers", label: "Customers", value: "3,782", trend: "+4.2%" },
      { key: "vehicle", label: "Current Shipments", value: "128", trend: "+2.1%" },
      { key: "routes", label: "Hubs", value: "50" },
      { key: "master", label: "Vendors", value: "24" },
      { key: "drivers", label: "Associates", value: "312" },
      { key: "bookings", label: "Packages (Today)", value: "642", trend: "+6.3%" },
      { key: "dashboard", label: "Ready for Pickup", value: "57" },
      { key: "reports", label: "Delayed", value: "6" },
    ],
    []
  );

  // Search + modal state
  const [trackId, setTrackId] = useState("");
  const [result, setResult] = useState<PackageResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 👉 replace this with your real API call
  async function fetchPackageStatus(trackingId: string): Promise<PackageResult> {
    // Example for your PHP API:
    // const res = await fetch(`/api/packages/status?trackId=${encodeURIComponent(trackingId)}`, { credentials: "include" });
    // if (!res.ok) throw new Error("Failed to fetch");
    // const json = await res.json();
    // return json as PackageResult;

    // --- temporary mock
    await new Promise((r) => setTimeout(r, 600));
    const modes: Array<"AIR" | "OCEAN" | "ROAD"> = ["AIR", "OCEAN", "ROAD"];
    const steps: ShipmentStatus[] = ["RECEIVED","CONSOLIDATED","DISPATCHED","IN_TRANSIT","ARRIVED","READY_FOR_PICKUP","COLLECTED"];
    const d = Number(trackingId.replace(/\D/g, "").slice(-1)) || 3;
    return {
      id: trackingId.trim(),
      from: "Hyderabad",
      to: "Chennai",
      mode: modes[d % modes.length],
      pieces: 3 + (d % 4),
      weightKg: 8.5 + d,
      eta: d % 2 ? "Today 6:30 PM" : "Tomorrow 10:00 AM",
      status: steps[d % steps.length],
      container: d % 2 ? `CONT-${120 + d}` : undefined,
      shelf: d % 2 ? `Aisle B • Shelf ${2 + (d % 3)}` : undefined,
      lastScanAt: d % 2 ? "2025-10-22 15:42" : "2025-10-22 09:15",
      history: [
        { at: "2025-10-22 15:42", note: "Package scanned into container", hub: "HYD-001" },
        { at: "2025-10-22 12:08", note: "Consolidated at hub", hub: "HYD-001" },
        { at: "2025-10-22 10:21", note: "Warehouse receipt generated" },
      ],
    };
  }

  const searchPackage = async () => {
    if (!trackId.trim()) return;
    setShowModal(true);
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const data = await fetchPackageStatus(trackId.trim());
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unable to fetch package status.");
    } finally {
      setLoading(false);
    }
  };

  const [rows] = useState<ShipmentRow[]>([
    { id: "ITR-202510-MAA-000123", from: "Hyderabad", to: "Chennai", mode: "ROAD", packages: 12, eta: "Today 5:30 PM", status: "IN_TRANSIT" },
    { id: "ITR-202510-BLR-000221", from: "Bangalore", to: "Mumbai", mode: "AIR", packages: 7, eta: "Tomorrow 9:00 AM", status: "DISPATCHED" },
    { id: "ITR-202510-DEL-000078", from: "Delhi", to: "Agra", mode: "ROAD", packages: 3, eta: "Today 3:15 PM", status: "READY_FOR_PICKUP" },
  ]);

  return (
    <>
      <div className="grid grid-cols-12 gap-5 md:gap-6">
        {/* KPI CARDS: 3 per row on md+ */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.key} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surfaceMuted)] text-[var(--color-primary)]">
                  <Icon name={k.key as any} className="h-6 w-6" />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span className="text-sm text-[var(--color-textMuted)]">{k.label}</span>
                    <h4 className="mt-2 text-title-sm font-bold text-[var(--color-text)]">{k.value}</h4>
                  </div>
                  {k.trend && (
                    <div className="hidden items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-success)] sm:flex">
                      <Icon name="caretDown" className="h-4 w-4 rotate-180" />
                      {k.trend}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Right: Check Package */}
        <div className="col-span-12 xl:col-span-4">
          <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="rounded-2xl p-5 sm:p-6">
              <Label>Check Package</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr,12rem]">
                <Input
                  id="quick-track-input"
                  value={trackId}
                  className="w-full"
                  onValueChange={setTrackId}
                  placeholder="Enter Tracking ID / Package UID"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPackage();
                  }}
                />
                <Button tone="primary" size="sm" onClick={searchPackage} disabled={!trackId.trim()}>
                  Search
                </Button>
              </div>
            </div>
          </aside>
        </div>

        {/* Shipments Table */}
        <div className="col-span-12">
          <ShipmentsTable rows={rows} />
        </div>
      </div>

      {/* ===== Modal using your existing component ===== */}
      <AnyModal
        // support both "open" and "isOpen" props, your Modal will ignore the other
        open={showModal}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Package Status"
        size="xl"
      >
        <div className="min-w-[280px] max-w-full">
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--color-surfaceMuted)]" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />
                ))}
              </div>
              <div className="h-28 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-16 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />
                <div className="h-16 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />
              </div>
            </div>
          ) : errorMsg ? (
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4 text-[var(--color-danger)]">
              {errorMsg}
            </div>
          ) : result ? (
            <PackageStatusContent data={result} />
          ) : (
            <div className="text-sm text-[var(--color-textMuted)]">No data.</div>
          )}
        </div>
      </AnyModal>
    </>
  );
};

export default Home;
