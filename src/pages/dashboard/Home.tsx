// src/pages/dashboard/Home.tsx
import React, { useMemo, useState, useEffect } from "react";
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
import { dashboardService, shipmentService, getCurrentUser } from "../../services";
import { type ShipmentStatus } from "../../constants/shipmentStatus";

/* ---------------------------
   Types
   --------------------------- */

type ShipmentRow = {
  id: string;
  from: string;
  to: string;
  mode: "AIR" | "OCEAN" | "GROUND" | "ROAD";
  packages: number;
  eta: string;
  status: ShipmentStatus;
};

type PackageResult = {
  id: string;
  from: string;
  to: string;
  mode: "AIR" | "OCEAN" | "ROAD" | "GROUND";
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
  const map: Record<string, string> = {
    RECEIVED: "bg-gray-100 text-gray-700",
    CONSOLIDATED: "bg-blue-100 text-blue-700",
    DISPATCHED: "bg-purple-100 text-purple-700",
    SHIPPED: "bg-purple-100 text-purple-700",
    IN_TRANSIT: "bg-orange-100 text-orange-700",
    ARRIVED: "bg-green-100 text-green-700",
    READY_FOR_PICKUP: "bg-green-100 text-green-700",
    COLLECTED: "bg-green-100 text-green-700",
    DELIVERED: "bg-green-100 text-green-700",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>{status.replaceAll("_", " ")}</span>;
};

const PackageStepper: React.FC<{ current: ShipmentStatus }> = ({ current }) => {
  const steps: string[] = [
    "RECEIVED",
    "CONSOLIDATED",
    "DISPATCHED",
    "IN_TRANSIT",
    "DELIVERED",
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
const ShipmentsTable: React.FC<{ rows: ShipmentRow[]; loading: boolean; onRefresh: () => void; onViewDetails: (id: string) => void }> = ({ rows, loading, onRefresh, onViewDetails }) => (
  <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-3 pt-4 sm:px-6">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">Recent Shipments</h3>
      <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
        <UIIcon name="refresh" className="h-4 w-4 mr-1" /> Refresh
      </Button>
    </div>
    {loading ? (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />
        ))}
      </div>
    ) : rows.length === 0 ? (
      <div className="py-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-surfaceMuted)] flex items-center justify-center mb-4">
          <Icon name="vehicle" className="h-8 w-8 text-[var(--color-textMuted)]" />
        </div>
        <p className="text-[var(--color-textMuted)] mb-4">No shipments found</p>
        <Button onClick={() => window.location.href = '/newshipment'}>Create New Shipment</Button>
      </div>
    ) : (
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-[var(--color-border)]">
              <TableRow>
                {["Shipment ID", "From", "To", "Mode", "Packages", "ETA", "Status", "Actions"].map((h) => (
                  <TableCell key={h} isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-[var(--color-textMuted)]">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[var(--color-border)]">
              {rows.map((s) => (
                <TableRow key={s.id} className="hover:bg-[var(--color-surfaceMuted)]/30 transition">
                  <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-text)] font-medium">{s.id}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.from}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.to}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.mode}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.packages}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-[var(--color-textMuted)]">{s.eta}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm"><StatusPill status={s.status} /></TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm">
                    <button 
                      onClick={() => onViewDetails(s.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      View/Print
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )}
  </section>
);

/* ---------------------------
   Dashboard Page
   --------------------------- */
const Home: React.FC = () => {
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/auth/signin', { replace: true });
      return;
    }
  }, [navigate]);

  // State
  const [stats, setStats] = useState({ total_shipments: 0, today_shipments: 0, by_status: [] as any[] });
  const [recentShipments, setRecentShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const [statsData, shipmentsData] = await Promise.all([
        dashboardService.getStats(),
        shipmentService.getRecentShipments(undefined, 10)
      ]);

      setStats(statsData);
      
      // Transform shipments for table
      const transformed: ShipmentRow[] = shipmentsData.map(s => ({
        id: s.tracking_number,
        from: (s as any).origin_hub || s.shipper_city || 'N/A',
        to: (s as any).destination_hub || s.consignee_city || 'N/A',
        mode: s.transport_mode as any,
        packages: 1, // TODO: count packages from API
        eta: s.expected_delivery_date || 'TBD',
        status: s.current_status as ShipmentStatus
      }));
      
      setRecentShipments(transformed);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const kpis = useMemo(() => {
    const statusMap = stats.by_status.reduce((acc: any, item: any) => {
      acc[item.current_status] = item.count;
      return acc;
    }, {});

    return [
      { key: "customers", label: "Total Shipments", value: stats.total_shipments.toString() },
      { key: "vehicle", label: "Active Shipments", value: (statusMap['IN_TRANSIT'] || 0).toString() },
      { key: "routes", label: "Today", value: stats.today_shipments.toString() },
      { key: "master", label: "Received", value: (statusMap['RECEIVED'] || 0).toString() },
      { key: "drivers", label: "Consolidated", value: (statusMap['CONSOLIDATED'] || 0).toString() },
      { key: "bookings", label: "Delivered", value: (statusMap['DELIVERED'] || 0).toString() },
    ];
  }, [stats]);

  const quickActions = [
    { label: "New Receipt", icon: "plus", link: "/newshipment" },
    { label: "Scan Package", icon: "scan", link: "/scan" },
    { label: "Countries", icon: "routes", link: "/master/countries" },
    { label: "Hubs", icon: "vehicle", link: "/master/hubs" },
    { label: "Vendors", icon: "master", link: "/master/vendors" },
    { label: "Locations", icon: "customers", link: "/master/locations" },
  ];

  // check-package modal state
  const [trackId, setTrackId] = useState("");
  const [result, setResult] = useState<PackageResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const viewShipmentDetails = async (trackingNumber: string) => {
    try {
      const data = await shipmentService.trackByTrackingNumber(trackingNumber);
      const shipment = data.shipment;
      const packages = data.packages || [];
      
      // Navigate to receipt page with shipment data
      navigate('/receipt', {
        state: {
          wrNumber: shipment.wr_number,
          trackingNumber: shipment.tracking_number,
          receivedDate: shipment.received_date || shipment.created_at || new Date().toLocaleDateString(),
          originHub: shipment.origin_hub_name || 'N/A',
          destinationHub: shipment.destination_hub_name || 'N/A',
          shipperName: shipment.shipper_name || 'N/A',
          shipperPhone: shipment.shipper_phone || 'N/A',
          shipperAddress: shipment.shipper_address,
          consigneeName: shipment.consignee_name || 'N/A',
          consigneePhone: shipment.consignee_phone || 'N/A',
          consigneeAddress: shipment.consignee_address,
          packages: packages.map((pkg: any) => ({
            weight: pkg.weight || 0,
            length: pkg.length,
            width: pkg.width,
            height: pkg.height,
            description: pkg.description || 'Package',
            declared_value: pkg.declared_value,
            quantity: pkg.quantity || 1,
          })),
          transportMode: shipment.transport_mode || 'N/A',
          paymentType: shipment.payment_type || 'N/A',
          totalAmount: shipment.total_amount,
          paidAmount: shipment.paid_amount,
          pendingAmount: shipment.pending_amount,
          currency: shipment.currency || 'USD',
          notes: shipment.notes,
          status: shipment.current_status,
        }
      });
    } catch (err: any) {
      alert('Failed to load shipment details: ' + err.message);
    }
  };

  const searchPackage = async () => {
    if (!trackId.trim()) return;
    setShowModal(true);
    setSearchLoading(true);
    setErrorMsg(null);
    setResult(null);
    
    try {
      const data = await shipmentService.trackByTrackingNumber(trackId.trim());
      
      // Transform API response to PackageResult
      const transformed: PackageResult = {
        id: data.shipment.tracking_number,
        from: data.shipment.origin_hub_name || data.shipment.shipper_city || 'Unknown',
        to: data.shipment.destination_hub_name || data.shipment.consignee_city || 'Unknown',
        mode: data.shipment.transport_mode as any,
        pieces: data.packages.length,
        weightKg: data.packages.reduce((sum, p) => sum + (p.weight || 0), 0),
        eta: data.shipment.expected_delivery_date || 'TBD',
        status: data.shipment.current_status as ShipmentStatus,
        container: data.packages[0]?.container_code,
        shelf: data.packages[0]?.shelf_code,
        lastScanAt: data.tracking_history[data.tracking_history.length - 1]?.timestamp,
        history: data.tracking_history.map(h => ({
          at: new Date(h.timestamp).toLocaleString(),
          note: h.description,
          hub: h.hub_name
        }))
      };
      
      setResult(transformed);
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to fetch tracking details.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        
        {/* Error Alert */}
        {error && (
          <div className="col-span-12">
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4 flex items-start gap-3">
              <UIIcon name="alert" className="h-5 w-5 text-[var(--color-danger)] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-danger)]">Error loading dashboard</p>
                <p className="text-xs text-[var(--color-danger)]/80 mt-1">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => loadDashboardData()}>Retry</Button>
            </div>
          </div>
        )}

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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--color-surfaceMuted)]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kpis.map((k) => (
                <div key={k.key} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm hover:shadow-md transition-shadow">
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
          )}
        </div>

        {/* Check package */}
        <div className="col-span-12 xl:col-span-4">
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm h-full flex flex-col">
            <Label>Track Package</Label>
            <div className="mt-3 flex gap-2">
              <Input 
                value={trackId} 
                onValueChange={setTrackId} 
                onKeyDown={(e) => e.key === "Enter" && searchPackage()} 
                placeholder="Enter tracking ID or WR number" 
              />
              <Button tone="primary" onClick={searchPackage} disabled={!trackId.trim()}>
                <UIIcon name="search" className="h-4 w-4 mr-1" /> Search
              </Button>
            </div>
            <p className="text-xs text-[var(--color-textMuted)] mt-2">
              Enter tracking number (ITK...) or warehouse receipt (WR...)
            </p>
          </div>
        </div>

        {/* Shipments table */}
        <div className="col-span-12">
          <ShipmentsTable rows={recentShipments} loading={loading} onRefresh={() => loadDashboardData()} onViewDetails={viewShipmentDetails} />
        </div>
      </div>

      {/* Track Package Modal */}
      <Modal title="Package Status" isOpen={showModal} onClose={() => setShowModal(false)} size="xl">{!showModal ? null : (
        <div className="min-w-[280px] max-w-full">
          {searchLoading ? (
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
      )}</Modal>
    </>
  );
};

export default Home;
