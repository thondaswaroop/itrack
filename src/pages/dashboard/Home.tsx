// src/pages/dashboard/Home.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "../../utils/icons";        // registry icons
import { Icon as UIIcon } from "../../utils/uiIcon"; // small inline svgs + registry fallback

import Label from "../../components/form/Label";
import Input from "../../components/form/input/Input";
import { Button } from "../../components";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { Modal } from "../../components";

/* ---------------------------
   Types
   --------------------------- */
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
  id: string;
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

/* ---------------------------
   Small UI pieces
   --------------------------- */
const StatusPill = ({ status }: { status: ShipmentStatus }) => {
  const map: Record<ShipmentStatus, string> = {
    RECEIVED: "bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]",
    CONSOLIDATED: "bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]",
    DISPATCHED: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
    IN_TRANSIT: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
    ARRIVED: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
    READY_FOR_PICKUP: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
    COLLECTED: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>{status.replaceAll("_", " ")}</span>;
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
      <div className="relative h-7">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-surfaceMuted)]" />
        <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progressPct}%` }} />
        <ol className="relative z-10 flex h-full items-center justify-between">
          {steps.map((_, i) => {
            const active = i <= idx;
            return (
              <li key={i} className="flex items-center justify-center">
                <span className={[
                  "grid h-7 w-7 place-items-center rounded-full border text-[11px] font-bold -translate-y-[1px]",
                  active ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-onPrimary)]" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-textMuted)]"
                ].join(" ")}>
                  {i + 1}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-2 hidden justify-between gap-2 sm:flex">
        {steps.map((s, i) => (
          <div key={s} className="max-w-[110px] shrink-0 text-center text-[10px] leading-snug text-[var(--color-textMuted)]" style={{ transform: i === 0 ? "translateX(-8px)" : i === steps.length - 1 ? "translateX(8px)" : undefined }}>
            {s.replaceAll("_", " ")}
          </div>
        ))}
      </div>
    </div>
  );
};

const SummaryBox = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <div className="text-xs font-medium text-[var(--color-textMuted)] uppercase tracking-wide">{title}</div>
    <div className="mt-1 text-[var(--color-text)] font-semibold">{value}</div>
    {subtitle && <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{subtitle}</div>}
  </div>
);

const ActivityTimeline = ({ history }: { history: any[] }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-[var(--color-text)]">Recent Activity</div>
    <ul className="grid gap-3 sm:grid-cols-2">
      {history.map((h, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]"></div>
          <div>
            <div className="text-sm text-[var(--color-text)]">{h.note}</div>
            <div className="text-xs text-[var(--color-textMuted)]">{h.at} {h.hub ? `• ${h.hub}` : ""}</div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

/* ---------------------------
   Shipments table component
   --------------------------- */
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
                <TableCell key={h} isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-[var(--color-textMuted)]">{h}</TableCell>
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
                <TableCell className="px-4 py-3 text-theme-sm"><StatusPill status={s.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  </section>
);

/* ---------------------------
   Dashboard Page
   --------------------------- */
const Home: React.FC = () => {
  const navigate = useNavigate();

  const kpis = useMemo(() => [
    { key: "customers", label: "Customers", value: "3,782" },
    { key: "vehicle", label: "Active Shipments", value: "128" },
    { key: "routes", label: "Hubs", value: "50" },
    { key: "master", label: "Vendors", value: "24" },
    { key: "drivers", label: "Associates", value: "312" },
    { key: "bookings", label: "Packages Today", value: "642" },
  ], []);

  const quickActions = [
    { label: "New Receipt", icon: "plus", link: "/newshipment" },
    { label: "Pending Assignments", icon: "routes", link: "/warehouse/pending" },
    { label: "Create Container", icon: "vehicle", link: "/containers/new" },
    { label: "Scan Package", icon: "scan", link: "/scan" },
    { label: "Print Center", icon: "report", link: "/print-center" },
    { label: "New Customer", icon: "customers", link: "/customers/new" },
  ];

  // check-package modal state
  const [trackId, setTrackId] = useState("");
  const [result, setResult] = useState<PackageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function fetchStatus(id: string): Promise<PackageResult> {
    await new Promise((r) => setTimeout(r, 550));
    return {
      id,
      from: "Hyderabad",
      to: "Chennai",
      mode: "ROAD",
      pieces: 3,
      weightKg: 12,
      eta: "Today 6:30 PM",
      status: "IN_TRANSIT",
      container: "CONT-129",
      shelf: "Aisle B • Shelf 3",
      lastScanAt: "2025-10-22 15:42",
      history: [
        { at: "2025-10-22 15:42", note: "Loaded into container", hub: "HYD-001" },
        { at: "2025-10-22 10:21", note: "Warehouse receipt generated" },
      ]
    };
  }

  const searchPackage = async () => {
    if (!trackId.trim()) return;
    setShowModal(true);
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const data = await fetchStatus(trackId.trim());
      setResult(data);
    } catch (err) {
      setErrorMsg("Unable to fetch tracking details.");
    } finally {
      setLoading(false);
    }
  };

  const rows: ShipmentRow[] = [
    { id: "ITR-202510-MAA-000123", from: "Hyderabad", to: "Chennai", mode: "ROAD", packages: 12, eta: "Today 5:30 PM", status: "IN_TRANSIT" },
    { id: "ITR-202510-BLR-000221", from: "Bangalore", to: "Mumbai", mode: "AIR", packages: 7, eta: "Tomorrow 9:00 AM", status: "DISPATCHED" },
    { id: "ITR-202510-DEL-000078", from: "Delhi", to: "Agra", mode: "ROAD", packages: 3, eta: "Today 3:15 PM", status: "READY_FOR_PICKUP" },
  ];

  return (
    <>
      <div className="grid grid-cols-12 gap-6">

        {/* Quick actions */}
        <div className="col-span-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((qa) => (
              <button key={qa.label} onClick={() => navigate(qa.link)} className="group flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition shadow-sm">
                <Icon name={qa.icon as any} className="h-6 w-6 text-[var(--color-primary)] group-hover:text-[var(--color-primaryActive)]" />
                <span className="font-medium text-sm text-[var(--color-text)]">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((k) => (
              <div key={k.key} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--color-surfaceMuted)] text-[var(--color-primary)]">
                  <Icon name={k.key as any} className="h-6 w-6" />
                </div>
                <div className="mt-3">
                  <div className="text-sm text-[var(--color-textMuted)]">{k.label}</div>
                  <div className="text-2xl font-bold text-[var(--color-text)]">{k.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Check package */}
        <div className="col-span-12 xl:col-span-4">
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <Label>Check Package</Label>
            <div className="mt-3 flex gap-2">
              <Input value={trackId} onValueChange={setTrackId} onKeyDown={(e) => e.key === "Enter" && searchPackage()} placeholder="Enter tracking ID" />
              <Button tone="primary" onClick={searchPackage}><UIIcon name="search" className="h-4 w-4 mr-1" /> Search</Button>
            </div>
          </div>
        </div>

        {/* Shipments table */}
        <div className="col-span-12">
          <ShipmentsTable rows={rows} />
        </div>
      </div>

      <Modal title="Package Status" isOpen={showModal} onClose={() => setShowModal(false)} size="xl">
        <div className="min-w-[280px] max-w-full">
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--color-surfaceMuted)]" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />))}
              </div>
            </div>
          ) : errorMsg ? (
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4 text-[var(--color-danger)]">{errorMsg}</div>
          ) : result ? (
            <>
              {/* header + controls */}
              <div className="mb-4"><div className="text-xs text-[var(--color-textMuted)]">Package</div><div className="font-semibold text-[var(--color-text)]">{result.id}</div></div>

              {/* status + print */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div><StatusPill status={result.status} /></div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline"><UIIcon name="printer" className="h-4 w-4 mr-1" /> Print Label</Button>
                </div>
              </div>

              {/* summaries */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                <SummaryBox title="Route" value={`${result.from} → ${result.to}`} subtitle={`Mode: ${result.mode}`} />
                <SummaryBox title="ETA" value={result.eta} />
                <SummaryBox title="Pieces / Weight" value={`${result.pieces} pcs • ${result.weightKg} kg`} />
                <SummaryBox title="Container" value={result.container ?? "—"} />
                <SummaryBox title="Shelf" value={result.shelf ?? "—"} />
                <SummaryBox title="Last Scan" value={result.lastScanAt ?? "—"} />
              </div>

              {/* stepper */}
              <div className="mb-4"><PackageStepper current={result.status} /></div>

              {/* activity */}
              <ActivityTimeline history={result.history} />
            </>
          ) : (
            <div className="text-[var(--color-textMuted)]">No data.</div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default Home;
