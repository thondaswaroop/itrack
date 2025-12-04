// src/pages/scan/ScanPackage.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../utils/icons";
import UIIcon from "../../utils/uiIcon";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/Input";
import { Button, Select } from "../../components";
import ComponentCard from "../../components/common/ComponentCard";

/* ----------------------------
   Types & mocks
---------------------------- */
type ShipmentStatus = "RECEIVED" | "CONSOLIDATED" | "DISPATCHED" | "IN_TRANSIT" | "ARRIVED" | "READY_FOR_PICKUP" | "COLLECTED";

type Package = {
  id: string;
  status: ShipmentStatus;
  shipper?: string;
  consignee?: string;
  origin?: string;
  destination?: string;
  container?: string | null;
  shelf?: string | null;
  transport?: string | null;
  currentLocation?: string | null;
  items?: { id: string; description: string; pkg?: number; pcs?: number; weight?: number }[];
  history: { at: string; note: string; hub?: string }[];
  remark?: string;
};

async function mockLoad(id: string): Promise<Package> {
  await new Promise((r) => setTimeout(r, 300));
  const now = new Date().toISOString();
  return {
    id,
    status: "RECEIVED",
    shipper: "Blue Retail Pvt Ltd",
    consignee: "Akash Logistics",
    origin: "HYD-001",
    destination: "MAA-003",
    container: null,
    shelf: null,
    transport: null,
    currentLocation: "HYD-001",
    items: [{ id: "it1", description: "T-shirts", pkg: 1, pcs: 20, weight: 8 }],
    history: [{ at: now, note: "Warehouse receipt created", hub: "HYD-001" }],
    remark: "Handle with care",
  };
}

function now() { return new Date().toISOString(); }

/* ----------------------------
   VerticalTimeline - same as UpdateShipment (copying for page scoping)
---------------------------- */
type TimelineStep = { key: string; label: string; time?: string; hub?: string; done?: boolean; active?: boolean };

const VerticalTimeline: React.FC<{ steps: TimelineStep[]; activeKey?: string }> = ({ steps, activeKey }) => {
  return (
    <div className="w-full">
      <ol className="relative ml-4">
        <div className="absolute left-1 top-0 bottom-0 w-px bg-[var(--color-surfaceMuted)]" />
        {steps.map((s, i) => {
          const done = s.done ?? false;
          const active = activeKey ? s.key === activeKey : s.active;
          return (
            <li key={s.key} className="relative mb-6 pl-6">
              <div
                className={[
                  "absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2",
                  done ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : active ? "bg-white border-[var(--color-primary)] text-[var(--color-primary)]" : "bg-white border-[var(--color-border)] text-[var(--color-textMuted)]",
                ].join(" ")}
                aria-hidden
              >
                <span className="text-xs font-semibold">{i + 1}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                <div className="max-w-[60%]">
                  <div className={`text-sm ${done ? "text-[var(--color-text)]" : active ? "text-[var(--color-primary)]" : "text-[var(--color-textMuted)]"} font-medium`}>
                    {s.label}
                  </div>
                </div>
                <div className="text-xs text-[var(--color-textMuted)]">
                  {s.time ? <div>{new Date(s.time).toLocaleString()}</div> : null}
                  {s.hub ? <div className="mt-0.5">{s.hub}</div> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/* ----------------------------
   ScanPackage Page
---------------------------- */
const ScanPackage: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // step fields
  const [container, setContainer] = useState("");
  const [shelf, setShelf] = useState("");
  const [transport, setTransport] = useState("");
  const [locationUpdate, setLocationUpdate] = useState("");

  const containerOptions = [{ value: "CONT-001", label: "CONT-001" }, { value: "CONT-129", label: "CONT-129" }];
  const shelfOptions = [{ value: "Aisle A • Shelf 1", label: "Aisle A • Shelf 1" }, { value: "Aisle B • Shelf 3", label: "Aisle B • Shelf 3" }];

  const load = async (id: string) => {
    setErr(null);
    setLoading(true);
    setPkg(null);
    try {
      const p = await mockLoad(id);
      setPkg(p);
      setContainer(p.container ?? "");
      setShelf(p.shelf ?? "");
      setTransport(p.transport ?? "");
      setLocationUpdate(p.currentLocation ?? "");
    } catch (e: any) {
      setErr("Not found");
    } finally {
      setLoading(false);
    }
  };

  const doAdvance = (nextStatus: Package["status"], note?: string) => {
    if (!pkg) return;
    const at = now();
    const next: Package = {
      ...pkg,
      status: nextStatus,
      container: container || pkg.container,
      shelf: shelf || pkg.shelf,
      transport: transport || pkg.transport,
      currentLocation: locationUpdate || pkg.currentLocation,
      history: [{ at, note: note ?? `Advanced to ${nextStatus}`, hub: container || pkg.container || undefined }, ...pkg.history],
    };
    setPkg(next);
  };

  // canonical steps
  const canonicalSteps = useMemo(() => [
    { key: "RECEIVED", label: "Received" },
    { key: "CONSOLIDATED", label: "Consolidated" },
    { key: "DISPATCHED", label: "Dispatched" },
    { key: "IN_TRANSIT", label: "In Transit" },
    { key: "ARRIVED", label: "Arrived" },
    { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
    { key: "COLLECTED", label: "Collected" },
  ] as { key: ShipmentStatus; label: string }[], []);

  const timeline = useMemo(() => {
    const hist = pkg?.history ?? [];
    const activeIndex = pkg ? canonicalSteps.findIndex((s) => s.key === pkg.status) : -1;
    return canonicalSteps.map((s, idx) => {
      const histEntry = hist.find((h) => h.note?.toLowerCase().includes(s.label.toLowerCase()) || h.note?.toLowerCase().includes(s.key?.toLowerCase()));
      return { key: s.key, label: s.label, time: histEntry?.at, hub: histEntry?.hub, done: idx < activeIndex, active: idx === activeIndex } as TimelineStep;
    });
  }, [pkg, canonicalSteps]);

  // UI for step controls
  function RenderStepControls() {
    if (!pkg) return null;
    switch (pkg.status) {
      case "RECEIVED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Assign container & shelf to move to Consolidation</div>
            <div className="grid gap-2 mt-2">
              <Select options={containerOptions} value={container} onChange={setContainer} placeholder="Select container" searchable />
              <Select options={shelfOptions} value={shelf} onChange={setShelf} placeholder="Select shelf" searchable />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { setContainer(pkg.container ?? ""); setShelf(pkg.shelf ?? ""); }}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("CONSOLIDATED", "Assigned container & moved to consolidation")}>Move to Consolidation</Button>
            </div>
          </>
        );

      case "CONSOLIDATED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Assign transport and dispatch</div>
            <div className="grid gap-2 mt-2">
              <Input value={transport} onValueChange={setTransport} placeholder="Transport / Vehicle ID" />
              <Input value={locationUpdate} onValueChange={setLocationUpdate} placeholder="Current hub/location" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { setTransport(pkg.transport ?? ""); setLocationUpdate(pkg.currentLocation ?? ""); }}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("DISPATCHED", "Assigned transport and dispatched")}>Dispatch</Button>
            </div>
          </>
        );

      case "DISPATCHED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Mark In Transit or update location</div>
            <div className="grid gap-2 mt-2">
              <Input value={locationUpdate} onValueChange={setLocationUpdate} placeholder="Current location / hub" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setLocationUpdate(pkg.currentLocation ?? "")}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("IN_TRANSIT", "Marked as In Transit")}>Mark In Transit</Button>
            </div>
          </>
        );

      case "IN_TRANSIT":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Update live location or mark Arrived at destination hub</div>
            <div className="grid gap-2 mt-2">
              <Input value={locationUpdate} onValueChange={setLocationUpdate} placeholder="Current location" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setLocationUpdate(pkg.currentLocation ?? "")}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("ARRIVED", "Arrived at destination hub")}>Mark Arrived</Button>
            </div>
          </>
        );

      case "ARRIVED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Mark package ready for pickup</div>
            <div className="grid gap-2 mt-2">
              <Input value={locationUpdate} onValueChange={setLocationUpdate} placeholder="Destination shelf / location (optional)" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setLocationUpdate(pkg.currentLocation ?? "")}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("READY_FOR_PICKUP", "Marked ready for pickup")}>Ready for Pickup</Button>
            </div>
          </>
        );

      case "READY_FOR_PICKUP":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Package ready. Confirm pickup to complete.</div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { /* hold */ }}>Hold</Button>
              <Button tone="primary" onClick={() => doAdvance("COLLECTED", "Package collected")}>Mark Collected</Button>
            </div>
          </>
        );

      case "COLLECTED":
        return <div className="text-sm text-[var(--color-textMuted)]">Package has been collected. Flow complete.</div>;
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 xl:col-span-8 space-y-6">
        <ComponentCard title="Scan / Load Package">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Scan or enter WR / Tracking ID</Label>
              <div className="flex gap-2 mt-2">
                <Input value={q} onValueChange={setQ} placeholder="WR-..." onKeyDown={(e: any) => e.key === "Enter" && load(q)} />
                <Button tone="primary" loading={loading} onClick={() => load(q)}><UIIcon name="search" className="h-4 w-4 mr-2" />Load</Button>
                <Button variant="outline" onClick={() => { setQ(""); setPkg(null); setErr(null); }}>Clear</Button>
              </div>
              <div className="mt-2 text-xs text-[var(--color-textMuted)]">The form below adapts to the current package status. Use controls to progress the package through the flow.</div>
            </div>

            <div className="text-right">
              <div className="text-xs text-[var(--color-textMuted)]">Quick actions</div>
              <div className="mt-2 flex justify-end gap-2">
                <Button onClick={() => navigate("/shipments/new")}>New Shipment</Button>
                <Button onClick={() => navigate("/shipments/update")}>Update Shipment</Button>
              </div>
            </div>
          </div>
        </ComponentCard>

        {pkg ? (
          <ComponentCard title={`Package: ${pkg.id}`} right={<div className="text-sm text-[var(--color-textMuted)]">Status: <strong>{pkg.status}</strong></div>}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                    <div className="text-xs text-[var(--color-textMuted)]">Shipper</div>
                    <div className="font-medium mt-1">{pkg.shipper}</div>
                  </div>
                  <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                    <div className="text-xs text-[var(--color-textMuted)]">Consignee</div>
                    <div className="font-medium mt-1">{pkg.consignee}</div>
                  </div>
                  <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                    <div className="text-xs text-[var(--color-textMuted)]">Origin</div>
                    <div className="font-medium mt-1">{pkg.origin}</div>
                  </div>
                  <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                    <div className="text-xs text-[var(--color-textMuted)]">Destination</div>
                    <div className="font-medium mt-1">{pkg.destination}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Items</div>
                  <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Units</th>
                          <th className="px-3 py-2">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {pkg.items?.map((it, idx) => (
                          <tr key={it.id}>
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{it.description}</td>
                            <td className="px-3 py-2">{it.pkg} pkgs / {it.pcs} pcs</td>
                            <td className="px-3 py-2">{it.weight} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">History</div>
                  <div className="space-y-2">
                    {pkg.history.map((h, i) => (
                      <div key={i} className="rounded-xl border p-3 bg-[var(--color-surface)]">
                        <div className="text-sm">{h.note}</div>
                        <div className="text-xs text-[var(--color-textMuted)] mt-1">{h.at} {h.hub ? `• ${h.hub}` : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border p-4 bg-[var(--color-surface)]">
                  <div className="text-xs text-[var(--color-textMuted)]">Current</div>
                  <div className="font-semibold text-[var(--color-text)] mb-3">{pkg.status}</div>

                  <div className="space-y-3">
                    {RenderStepControls()}
                  </div>
                </div>

                <div className="rounded-xl border p-4 bg-[var(--color-surface)] text-sm text-[var(--color-textMuted)]">
                  <div className="font-medium mb-2">Tips</div>
                  <ol className="pl-4 list-decimal">
                    <li>Follow the on-screen step controls to advance the package through the flow.</li>
                    <li>Always scan after assignment to create an audit trail.</li>
                  </ol>
                </div>
              </div>
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard title="No package loaded">
            <div className="p-6 text-sm text-[var(--color-textMuted)]">{err ? <span className="text-[var(--color-danger)]">{err}</span> : "Load a package using the scan input above."}</div>
          </ComponentCard>
        )}
      </div>

      <div className="col-span-12 xl:col-span-4">
        <div className="rounded-2xl border p-4 bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--color-surfaceMuted)] text-[var(--color-primary)]"><Icon name="scan" /></div>
            <div>
              <div className="text-sm text-[var(--color-textMuted)]">Scan your package details</div>
              <div className="text-lg font-bold">Update and Track the package</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-[var(--color-textMuted)]">
            Use this panel to scan or load a tracking ID and advance it through the logistics flow. The timeline and controls will automatically adapt.
          </div>
        </div>
        {pkg && (
        <div className="rounded-2xl border p-4 bg-[var(--color-surface)] mt-4 text-sm text-[var(--color-textMuted)]">
                  <div className="text-sm font-medium mb-3">Timeline</div>
                  <VerticalTimeline steps={timeline} activeKey={pkg?.status} />
                
        </div>
        )}
      </div>
    </div>
  );
};

export default ScanPackage;
