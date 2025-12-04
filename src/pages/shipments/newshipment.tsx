// src/pages/shipments/NewShipment.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input, Button, Modal, Select } from "../../components";
import Label from "../../components/form/Label";
import { Icon } from "../../utils/icons";
import ComponentCard from "../../components/common/ComponentCard";

/* =========================
   Types
========================= */
type Mode = "AIR" | "OCEAN" | "GROUND";
type CargoType = "Others" | "Automobile";
type PaymentTerm = "PREPAID" | "COLLECT";
type Condition = "GOOD" | "DAMAGED" | "HOLD";

type Party = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
};

type DimUnit = "CM" | "INCH";
type UnitType = "CARTON(S)" | "PALLET(S)" | "BAG(S)" | "BOX(ES)";

type PackageRow = {
  id: string;
  packageId?: string;
  qrCode?: string;
  length: number | "";
  width: number | "";
  height: number | "";
  dimUnit: DimUnit;
  pkg: number | "";
  pcs: number | "";
  unit: UnitType;
  sku?: string;
  pallet?: string;
  actWeightKg: number | "";
  date?: string;
  blNo?: string;
  description: string; // REQUIRED
  declaredValue?: number | "";
  storageShelf?: string;
};

type UploadedDoc = { id: string; name: string; size: number };

type FormState = {
  // Header
  wrNo: string;
  receivedAt: string;
  loadedAt?: string;
  location: string;
  shipper: Party | null;
  consignee: Party | null;
  cargoType: CargoType;
  receivedBy?: string;
  receivedByUserId?: string;
  office?: string;
  poNo?: string;
  remark?: string;
  truckBlNo?: string;
  amount?: number | "";
  hazardous?: boolean;
  heatTreatedPallets?: boolean;
  checkNo?: string;
  commodity?: string;

  // Receiving specific
  paymentTerm: PaymentTerm;
  packageCondition: Condition;
  holdReason?: string;
  documents?: UploadedDoc[];
  customerBoxId?: string;

  // Route / Mode
  mode: Mode;
  originCountry: string;
  originHub: string;
  destCountry: string;
  destHub: string;

  // Items
  items: PackageRow[];

  // Notify
  emailNotify: boolean;
}

/* =========================
   Mock data
========================= */
const COUNTRIES = ["India", "United Arab Emirates", "USA", "UK", "Germany", "Singapore"];
const HUBS_BY_COUNTRY: Record<string, string[]> = {
  India: ["HYD-001", "BLR-002", "MAA-003", "MUM-004", "DEL-005"],
  "United Arab Emirates": ["DXB-01", "AUH-02", "SHJ-03"],
  USA: ["LAX-1", "JFK-2", "ATL-3"],
  UK: ["LHR-1", "MAN-2"],
  Germany: ["FRA-1", "HAM-2"],
  Singapore: ["SIN-1"],
};

/* =========================
   Small UI helpers
   - unified Field (fixes inline error placement)
========================= */
const Field: React.FC<{
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, error, className = "", children }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <Label className="mb-1">
          {label} {required ? <span className="text-[var(--color-danger)]">*</span> : null}
        </Label>
      )}
      <div className="w-full">{children}</div>
      {error && <p className="text-xs text-[var(--color-danger)] mt-1 leading-tight">{error}</p>}
    </div>
  );
};

// Unit conversions
const cmToCbm = (l?: number | "", w?: number | "", h?: number | "") =>
  l && w && h ? (Number(l) * Number(w) * Number(h)) / 1_000_000 : 0;
const inchToCft = (l?: number | "", w?: number | "", h?: number | "") =>
  l && w && h ? (Number(l) * Number(w) * Number(h)) / 1728 : 0;
const kgToLbs = (kg?: number | "") => (kg ? Number(kg) * 2.20462 : 0);

/* =========================
   PartySelect (keeps behaviour)
========================= */
const PartySelect: React.FC<{
  value: Party | null;
  label: string;
  onSelect: (p: Party) => void;
  onClear: () => void;
  placeholder?: string;
  onCreateNew: () => void;
}> = ({ value, label, onSelect, onClear, placeholder, onCreateNew }) => {
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
        <Input
          value={value ? value.name : q}
          onValueChange={(v) => {
            if (value) onClear();
            setQ(v);
          }}
          placeholder={placeholder}
        />

        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
          {value ? (
            <Button variant="ghost" tone="neutral" size="sm" className="pointer-events-auto" onClick={onClear}>
              Clear
            </Button>
          ) : (
            <Button variant="ghost" tone="primary" size="sm" className="pointer-events-auto" onClick={onCreateNew} leadingIcon={<Icon name="plus" className="h-4 w-4" />}>
              New
            </Button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
            <ul className="max-h-56 overflow-auto text-sm">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(s);
                      setQ("");
                    }}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-[var(--color-surfaceMuted)]"
                  >
                    <span className="mt-0.5 rounded bg-[var(--color-brand-50)] px-2 py-0.5 text-xs text-[var(--color-brand-500)]">ID</span>
                    <div>
                      <div className="font-medium text-[var(--color-text)]">{s.name}</div>
                      <div className="text-xs text-[var(--color-textMuted)]">{s.email ?? "—"} {s.country ? `• ${s.country}` : ""}</div>
                    </div>
                  </button>
                </li>
              ))}
              <li className="border-t border-[var(--color-border)]">
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--color-primary)] hover:bg-[var(--color-surfaceMuted)]" onClick={onCreateNew}>
                  <Icon name="plus" className="h-4 w-4" /> Create new
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
   ConfirmReceiptModal
========================= */
const ConfirmReceiptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  formState: FormState;
  totals: { totalPkg: number; totalPcs: number; cbm: number; cft: number; actKg: number; actLbs: number };
}> = ({ isOpen, onClose, onConfirm, formState, totals }) => {
  if (!isOpen) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Warehouse Receipt"
      size="lg"
      dismissible
      showCloseIcon
      footer={
        <>
          <Button variant="outline" tone="neutral" onClick={onClose}>Cancel</Button>
          <Button variant="solid" tone="primary" onClick={onConfirm}>Confirm & Print</Button>
        </>
      }
    >
      <div className="space-y-4 p-2">
        <div className="text-sm">
          <div><strong>WR No:</strong> {formState.wrNo}</div>
          <div><strong>Received At:</strong> {new Date(formState.receivedAt).toLocaleString()}</div>
          <div><strong>Location:</strong> {formState.location}</div>
          <div><strong>Payment:</strong> {formState.paymentTerm}</div>
          <div><strong>Condition:</strong> {formState.packageCondition}{formState.packageCondition !== "GOOD" && formState.holdReason ? ` — ${formState.holdReason}` : ""}</div>
        </div>

        <hr />

        <div>
          <div className="font-medium mb-2">Shipper</div>
          <div className="text-sm">{formState.shipper?.name ?? "—"} {formState.shipper?.email ? `• ${formState.shipper.email}` : ""}</div>
        </div>

        <div>
          <div className="font-medium mt-3 mb-2">Consignee</div>
          <div className="text-sm">{formState.consignee?.name ?? "—"} {formState.consignee?.email ? `• ${formState.consignee.email}` : ""}</div>
        </div>

        <div>
          <div className="font-medium mt-3 mb-2">Packages</div>
          <div className="max-h-48 overflow-auto border rounded p-2">
            <table className="w-full text-sm">
              <thead className="text-[var(--color-textMuted)] text-xs">
                <tr><th className="p-1">#</th><th className="p-1">Dim (L×W×H)</th><th className="p-1">Unit</th><th className="p-1">Wt (kg)</th><th className="p-1">Description</th></tr>
              </thead>
              <tbody>
                {formState.items.map((it, i) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-1 text-xs">{i + 1}</td>
                    <td className="p-1 text-xs">{it.length || "-"} × {it.width || "-"} × {it.height || "-"} {it.dimUnit}</td>
                    <td className="p-1 text-xs">{it.unit} / {it.pkg || 0} pkgs</td>
                    <td className="p-1 text-xs">{it.actWeightKg || 0}</td>
                    <td className="p-1 text-xs">{it.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 text-sm">
          <div><strong>Totals:</strong> Packages {totals.totalPkg} • Pieces {totals.totalPcs} • CBM {totals.cbm.toFixed(3)} • Weight {totals.actKg} kg</div>
        </div>

        <div className="mt-3 text-sm text-[var(--color-textMuted)]">
          You will be able to preview and print the receipt after confirmation.
        </div>
      </div>
    </Modal>
  );
};

/* =========================
   Page: NewShipment (Receiving only)
========================= */
const NewShipment: React.FC = () => {
  const navigate = useNavigate();

  const [state, setState] = useState<FormState>(() => {
    const now = new Date();
    const wr = `WR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    return {
      wrNo: wr,
      receivedAt: now.toISOString().slice(0, 16),
      loadedAt: "",
      location: "HYD-001",

      shipper: null,
      consignee: null,

      cargoType: "Others",
      receivedBy: "Super Admin",
      receivedByUserId: "U-0001",
      office: "HCT",
      poNo: "",
      remark: "",
      truckBlNo: "MANUAL123",
      amount: "",
      hazardous: false,
      heatTreatedPallets: false,
      checkNo: "",
      commodity: "",

      // Receiving-specific
      paymentTerm: "COLLECT",
      packageCondition: "GOOD",
      holdReason: "",
      documents: [],
      customerBoxId: "",

      mode: "GROUND",
      originCountry: "India",
      originHub: "HYD-001",
      destCountry: "",
      destHub: "",

      items: [
        {
          id: crypto.randomUUID(),
          packageId: undefined,
          qrCode: undefined,
          length: 100,
          width: 100,
          height: 120,
          dimUnit: "CM",
          pkg: 1,
          pcs: 200,
          unit: "CARTON(S)",
          actWeightKg: 0,
          description: "",
          declaredValue: "",
          storageShelf: "",
        },
      ],

      emailNotify: true,
    } as FormState;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openNewShipper, setOpenNewShipper] = useState(false);
  const [openNewConsignee, setOpenNewConsignee] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  // flatten hubs (all hubs) for header Location select
  const allHubs = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    Object.entries(HUBS_BY_COUNTRY).forEach(([country, hubs]) => {
      hubs.forEach((h) => list.push({ value: h, label: `${h} — ${country}` }));
    });
    return list;
  }, []);

  const countryOptions = useMemo(() => COUNTRIES.map((c) => ({ value: c, label: c })), []);
  const originHubOptions = useMemo(() => (HUBS_BY_COUNTRY[state.originCountry] ?? []).map((h) => ({ value: h, label: h })), [state.originCountry]);
  const destHubOptions = useMemo(() => (HUBS_BY_COUNTRY[state.destCountry] ?? []).map((h) => ({ value: h, label: h })), [state.destCountry]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  /* items helpers */
  const addRow = () =>
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        {
          id: crypto.randomUUID(),
          packageId: undefined,
          qrCode: undefined,
          length: "",
          width: "",
          height: "",
          dimUnit: "CM",
          pkg: "",
          pcs: "",
          unit: "CARTON(S)",
          actWeightKg: "",
          description: "",
          declaredValue: "",
          storageShelf: "",
        },
      ],
    }));
  const updRow = (id: string, patch: Partial<PackageRow>) =>
    setState((s) => ({ ...s, items: s.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const delRow = (id: string) => setState((s) => ({ ...s, items: s.items.filter((r) => r.id !== id) }));

  /* totals */
  const totals = useMemo(() => {
    let totalPkg = 0, totalPcs = 0, cbm = 0, cft = 0, actKg = 0;
    state.items.forEach((r) => {
      totalPkg += Number(r.pkg || 0);
      totalPcs += Number(r.pcs || 0);
      if (r.dimUnit === "CM") cbm += cmToCbm(r.length, r.width, r.height);
      else cft += inchToCft(r.length, r.width, r.height);
      actKg += Number(r.actWeightKg || 0);
    });
    return { totalPkg, totalPcs, cbm, cft, actKg, actLbs: kgToLbs(actKg) };
  }, [state.items]);

  /* files stub */
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr: UploadedDoc[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      arr.push({ id: `DOC-${Date.now()}-${i}`, name: f.name, size: f.size });
    }
    setField("documents", [...(state.documents ?? []), ...arr] as UploadedDoc[]);
  };
  const removeDoc = (id: string) => setField("documents", (state.documents ?? []).filter((d) => d.id !== id));

  /* validation (receiving only) */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.receivedAt || !String(state.receivedAt).trim()) e.receivedAt = "Required";
    if (!state.location || !String(state.location).trim()) e.location = "Required";
    if (!state.consignee || !state.consignee.name) e.consignee = "Select or create consignee";
    if (!state.destCountry || !String(state.destCountry).trim()) e.destCountry = "Required";
    if (!state.destHub || !String(state.destHub).trim()) e.destHub = "Required";
    if (!state.items || state.items.length === 0) e.items = "Add at least one row";

    if (!state.paymentTerm) e.paymentTerm = "Select payment term";
    if (!state.packageCondition) e.packageCondition = "Select package condition";

    const missingDesc = state.items.some((it) => !it.description || !String(it.description).trim());
    if (missingDesc) e.items = "Each package must include a description of contents";

    if (state.packageCondition !== "GOOD" && (!state.holdReason || !String(state.holdReason).trim())) {
      e.holdReason = "Provide reason for holding/damage";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* === confirm/print flow === */
  const handlePreview = () => {
    if (!validate()) return;
    setOpenConfirm(true);
  };

  const doConfirmAndPrint = async () => {
    setSaving(true);
    try {
      // Build payload for server
      const payload = {
        wrNo: state.wrNo,
        receivedAt: state.receivedAt,
        location: state.location,
        shipper: state.shipper,
        consignee: state.consignee,
        paymentTerm: state.paymentTerm,
        packageCondition: state.packageCondition,
        holdReason: state.holdReason,
        customerBoxId: state.customerBoxId,
        documents: state.documents,
        receivedByUserId: state.receivedByUserId,
        office: state.office,
        remark: state.remark,
        poNo: state.poNo,
        cargoType: state.cargoType,
        mode: state.mode,
        originCountry: state.originCountry,
        originHub: state.originHub,
        destCountry: state.destCountry,
        destHub: state.destHub,
        items: state.items.map((it) => ({
          length: it.length, width: it.width, height: it.height, dimUnit: it.dimUnit,
          pkg: it.pkg, pcs: it.pcs, unit: it.unit,
          actWeightKg: it.actWeightKg, description: it.description,
          declaredValue: it.declaredValue,
        })),
        emailNotify: state.emailNotify,
      };

      // TODO: replace with actual POST to server: POST /api/warehouse-receipts
      await new Promise((r) => setTimeout(r, 800));

      // Mock server response: server returns canonical orderId and package ids, printHtml
      const mockResponse = {
        orderId: `ORD-${Date.now()}`,
        packages: state.items.map((it, idx) => ({ packageId: `PKG-${Date.now()}-${idx + 1}`, qr: `QR-${Math.random().toString(36).slice(2, 10)}` })),
        printHtml: null as string | null,
      };

      // Generate printable HTML client-side if server didn't provide printHtml / URL
      const printHtml = mockResponse.printHtml ?? generateReceiptHtml(mockResponse.orderId, payload, mockResponse.packages, totals);

      // Open print window and write
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(printHtml);
        w.document.close();
        setTimeout(() => {
          try { w.print(); } catch (err) { /* ignore */ }
        }, 500);
      }

      setOpenConfirm(false);
      console.log("RECEIVE_RESPONSE", mockResponse);
      navigate("/home");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6 overflow-x-clip">
      {/* LEFT column */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        {/* Header form */}
        <ComponentCard title="Warehouse Receipt (Receiving)">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="* Warehouse Receipt No.">
              <Input value={state.wrNo} onValueChange={(v) => setField("wrNo", v)} />
            </Field>

            <Field label="* Received Date/Time" error={errors.receivedAt}>
              <Input type="datetime-local" value={state.receivedAt} onValueChange={(v) => setField("receivedAt", v)} />
            </Field>

            <Field label="Location/HUB *" error={errors.location}>
              <Select
                options={allHubs}
                value={state.location}
                onChange={(v) => setField("location", v)}
                placeholder="Select Hub"
                searchable
                searchPlaceholder="Search hubs..."
              />
            </Field>

            <div>
              <PartySelect label="Shipper (Customer)" value={state.shipper} onSelect={(p) => setField("shipper", p)} onClear={() => setField("shipper", null)} placeholder="Search shipper" onCreateNew={() => setOpenNewShipper(true)} />
            </div>

            <div>
              <PartySelect label="Consignee (Receiver) *" value={state.consignee} onSelect={(p) => setField("consignee", p)} onClear={() => setField("consignee", null)} placeholder="Search consignee" onCreateNew={() => setOpenNewConsignee(true)} />
              {errors.consignee && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.consignee}</p>}
            </div>

            <Field label="Customer Box ID (if any)">
              <Input value={state.customerBoxId ?? ""} onValueChange={(v) => setField("customerBoxId", v)} placeholder="TNT-1234" />
            </Field>

            <Field label="Payment Term *" error={errors.paymentTerm}>
              <div className="flex gap-2">
                <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${state.paymentTerm === "COLLECT" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} onClick={() => setField("paymentTerm", "COLLECT")}>Collect</button>
                <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${state.paymentTerm === "PREPAID" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} onClick={() => setField("paymentTerm", "PREPAID")}>Prepaid</button>
              </div>
            </Field>

            <Field label="Package Condition *" error={errors.packageCondition}>
              <div className="flex gap-2">
                <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${state.packageCondition === "GOOD" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} onClick={() => setField("packageCondition", "GOOD")}>Good</button>
                <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${state.packageCondition === "DAMAGED" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} onClick={() => setField("packageCondition", "DAMAGED")}>Damaged</button>
                <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${state.packageCondition === "HOLD" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} onClick={() => setField("packageCondition", "HOLD")}>Hold</button>
              </div>
            </Field>

            {state.packageCondition !== "GOOD" && (
              <Field label="Hold / Damage Reason (required when not 'Good')" className="md:col-span-2 lg:col-span-3" error={errors.holdReason}>
                <Input value={state.holdReason ?? ""} onValueChange={(v) => setField("holdReason", v)} />
              </Field>
            )}

            <Field label="Estimated Price">
              <Input type="number" value={String(state.amount ?? "")} onValueChange={(v) => setField("amount", v ? Number(v) : "")} placeholder="0" />
            </Field>

            <Field label="Any specific remarks / comments about the package" className="md:col-span-2 lg:col-span-3">
              <Input value={state.remark ?? ""} onValueChange={(v) => setField("remark", v)} />
            </Field>
          </div>
        </ComponentCard>

        {/* Route & Mode */}
        <ComponentCard
          title="Route & Mode"
          right={
            <div className="flex items-center gap-2">
              {(["AIR", "OCEAN", "GROUND"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-sm ${state.mode === m ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)] hover:bg-[var(--color-surfaceMuted)]"}`}
                  onClick={() => setField("mode", m)}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Origin Country">
              <Select
                options={countryOptions}
                value={state.originCountry}
                onChange={(v) => {
                  setField("originCountry", v);
                  const hubs = HUBS_BY_COUNTRY[v] ?? [];
                  setField("originHub", hubs[0] ?? "");
                }}
                placeholder="Select country"
                searchable
                searchPlaceholder="Search countries..."
              />
            </Field>

            <Field label="Origin Hub">
              <Select options={originHubOptions} value={state.originHub} onChange={(v) => setField("originHub", v)} placeholder="Select origin hub" searchable searchPlaceholder="Search hubs..." />
            </Field>

            <Field label="Destination Country" error={errors.destCountry}>
              <Select
                options={countryOptions}
                value={state.destCountry}
                onChange={(v) => {
                  setField("destCountry", v);
                  const hubs = HUBS_BY_COUNTRY[v] ?? [];
                  setField("destHub", hubs[0] ?? "");
                }}
                placeholder="Select country"
                searchable
                searchPlaceholder="Search countries..."
              />
            </Field>

            <Field label="Destination Hub" error={errors.destHub}>
              <Select options={destHubOptions} value={state.destHub} onChange={(v) => setField("destHub", v)} placeholder="Select destination hub" searchable searchPlaceholder="Search hubs..." />
            </Field>
          </div>
        </ComponentCard>

        {/* Packages table */}
        <ComponentCard
          title="Packages"
          right={
            <Button variant="outline" onClick={addRow}>
              <Icon name="plus" className="h-4 w-4" /> Add
            </Button>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
                <tr>
                  <th className="px-3 py-2">Length</th>
                  <th className="px-3 py-2">Width</th>
                  <th className="px-3 py-2">Height</th>
                  <th className="px-3 py-2">Dimension</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {state.items.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 min-w-24">
                      <Input type="number" value={String(r.length ?? "")} onValueChange={(v) => updRow(r.id, { length: v ? Number(v) : "" })} />
                    </td>
                    <td className="px-3 py-2 min-w-24">
                      <Input type="number" value={String(r.width ?? "")} onValueChange={(v) => updRow(r.id, { width: v ? Number(v) : "" })} />
                    </td>
                    <td className="px-3 py-2 min-w-24">
                      <Input type="number" value={String(r.height ?? "")} onValueChange={(v) => updRow(r.id, { height: v ? Number(v) : "" })} />
                    </td>
                    <td className="px-3 py-2 min-w-28">
                      <select className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-[var(--color-text)] outline-none" value={r.dimUnit} onChange={(e) => updRow(r.id, { dimUnit: e.target.value as DimUnit })}>
                        <option value="CM">CM</option>
                        <option value="INCH">INCH</option>
                      </select>
                    </td>

                    <td className="px-3 py-2 min-w-36">
                      <Input value={r.description ?? ""} onValueChange={(v) => updRow(r.id, { description: v })} placeholder="Contents description (required)" />
                    </td>

                    <td className="px-3 py-2 min-w-16">
                      <Button variant="ghost" tone="danger" onClick={() => delRow(r.id)}>
                        <Icon name="trash" className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Items-level error (keeps it placed directly inside the Card) */}
          {errors.items && <p className="mt-2 text-xs text-[var(--color-danger)]">{errors.items}</p>}

          <div className="mt-3 text-sm text-[var(--color-textMuted)]">
            Totals: Packages {totals.totalPkg} • Pieces {totals.totalPcs} • CBM {totals.cbm.toFixed(3)} • Weight {totals.actKg} kg ({totals.actLbs.toFixed(1)} lbs)
          </div>
        </ComponentCard>

        {/* Action Bar */}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={state.emailNotify} onChange={(e) => setField("emailNotify", e.target.checked)} />
            Notify customer by email
          </label>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button loading={saving} onClick={handlePreview}>Save & Preview</Button>
          </div>
        </div>
      </div>

      {/* RIGHT summary */}
      <div className="col-span-12 xl:col-span-4">
        <div className="xl:sticky xl:top-24 space-y-6">
          <ComponentCard title="Summary">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-[var(--color-textMuted)]">Mode</div>
              <div className="font-medium text-[var(--color-text)]">{state.mode}</div>

              <div className="text-[var(--color-textMuted)]">Origin</div>
              <div className="font-medium text-[var(--color-text)]">{state.originCountry} {state.originHub ? `• ${state.originHub}` : ""}</div>

              <div className="text-[var(--color-textMuted)]">Destination</div>
              <div className="font-medium text-[var(--color-text)]">{state.destCountry || "—"} {state.destHub ? `• ${state.destHub}` : ""}</div>

              <div className="text-[var(--color-textMuted)]">Shipper</div>
              <div className="font-medium text-[var(--color-text)]">{state.shipper?.name ?? "—"}</div>

              <div className="text-[var(--color-textMuted)]">Consignee</div>
              <div className="font-medium text-[var(--color-text)]">{state.consignee?.name ?? "—"}</div>
            </div>
          </ComponentCard>

          <ComponentCard title="User / Actions">
            <div className="text-sm">
              <div><span className="text-[var(--color-textMuted)]">Received by</span> <div className="font-medium">{state.receivedBy} • {state.receivedByUserId}</div></div>
              <div className="mt-2 text-[var(--color-textMuted)] text-xs">After confirming & printing you will receive an Order ID and package QR codes for scanning and consolidation.</div>
            </div>
          </ComponentCard>
        </div>
      </div>

      {/* Confirm modal */}
      <ConfirmReceiptModal isOpen={openConfirm} onClose={() => setOpenConfirm(false)} onConfirm={doConfirmAndPrint} formState={state} totals={totals} />

      {/* New Shipper modal */}
      <Modal isOpen={openNewShipper} onClose={() => setOpenNewShipper(false)} title="New Shipper" size="lg" dismissible showCloseIcon footer={<ModalPartyFooter onCancel={() => setOpenNewShipper(false)} onSave={(p) => { setField("shipper", p); setOpenNewShipper(false); }} />}>
        <CreatePartyBody key="shipper" />
      </Modal>

      {/* New Consignee modal */}
      <Modal isOpen={openNewConsignee} onClose={() => setOpenNewConsignee(false)} title="New Consignee" size="lg" dismissible showCloseIcon footer={<ModalPartyFooter onCancel={() => setOpenNewConsignee(false)} onSave={(p) => { setField("consignee", p); setOpenNewConsignee(false); }} />}>
        <CreatePartyBody key="consignee" />
      </Modal>
    </div>
  );
};

export default NewShipment;

/* =========================
   Modal bodies & footers (shipper/consignee)
========================= */

type PartyDraft = Party;
const partyInitial = (): PartyDraft => ({ id: `NEW-${Date.now()}`, name: "", email: "", phone: "", address: "", country: "" });

const CreatePartyBody: React.FC = () => {
  const [form, setForm] = useState<PartyDraft>(partyInitial());
  (window as any).__partyDraft = form;
  const set = <K extends keyof PartyDraft>(k: K, v: PartyDraft[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 p-2">
      <Field label="Name" required>
        <Input value={form.name} onValueChange={(v) => set("name", v)} placeholder="Full name / Company" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email"><Input value={form.email ?? ""} onValueChange={(v) => set("email", v)} placeholder="name@domain.com" /></Field>
        <Field label="Phone"><Input value={form.phone ?? ""} onValueChange={(v) => set("phone", v)} placeholder="+91 90000 00000" /></Field>
      </div>

      <Field label="Country">
        <Input value={form.country ?? ""} onValueChange={(v) => set("country", v)} list="party-countries" placeholder="Country" />
        <datalist id="party-countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>

      <Field label="Address"><Input value={form.address ?? ""} onValueChange={(v) => set("address", v)} placeholder="Address" /></Field>
    </div>
  );
};

const ModalPartyFooter: React.FC<{ onCancel: () => void; onSave: (p: Party) => void }> = ({ onCancel, onSave }) => {
  const handleSave = () => {
    const draft: Party | undefined = (window as any).__partyDraft;
    if (!draft?.name?.trim()) return;
    onSave(draft);
    (window as any).__partyDraft = undefined;
  };
  return (
    <>
      <Button variant="outline" tone="neutral" onClick={onCancel}>Cancel</Button>
      <Button variant="solid" tone="primary" onClick={handleSave}>Save</Button>
    </>
  );
};

/* =========================
   Helper: generate printable HTML
   (client-side fallback - replace with server print URL)
========================= */
function generateReceiptHtml(orderId: string, payload: any, packages: { packageId: string; qr: string }[], totals: any) {
  const itemsHtml = payload.items.map((it: any, i: number) => `
    <tr>
      <td style="padding:6px;border:1px solid #ddd;">${i + 1}</td>
      <td style="padding:6px;border:1px solid #ddd;">${it.length || '-'} x ${it.width || '-'} x ${it.height || '-'} ${it.dimUnit}</td>
      <td style="padding:6px;border:1px solid #ddd;">${it.unit} / ${it.pkg || 0}</td>
      <td style="padding:6px;border:1px solid #ddd;">${it.actWeightKg || 0}</td>
      <td style="padding:6px;border:1px solid #ddd;">${it.description || '-'}</td>
    </tr>
  `).join("");

  const pkgQrHtml = packages.map(p => `<div style="display:inline-block;margin:6px;padding:8px;border:1px solid #ccc;"><div style="font-size:12px;">${p.packageId}</div><div style="font-size:10px;color:#666;">QR:${p.qr}</div></div>`).join("");

  return `
  <html>
    <head><title>Receipt ${orderId}</title></head>
    <body style="font-family:Arial,Helvetica,sans-serif;padding:20px;">
      <h2>Warehouse Receipt: ${orderId}</h2>
      <div><strong>WR No:</strong> ${payload.wrNo} • <strong>Received:</strong> ${new Date(payload.receivedAt).toLocaleString()}</div>
      <div><strong>Location:</strong> ${payload.location}</div>
      <hr />
      <h4>Shipper</h4>
      <div>${payload.shipper?.name ?? '-'}</div>
      <h4>Consignee</h4>
      <div>${payload.consignee?.name ?? '-'}</div>
      <hr />
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">#</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Dimensions</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Unit</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Weight (kg)</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Description</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top:12px;"><strong>Totals:</strong> Packages ${totals.totalPkg} • Pieces ${totals.totalPcs} • CBM ${totals.cbm.toFixed(3)} • Weight ${totals.actKg} kg</div>

      <div style="margin-top:12px;">
        <h4>Package QRs</h4>
        ${pkgQrHtml}
      </div>

      <div style="margin-top:20px;"><em>Generated by MPJ Logistics</em></div>
    </body>
  </html>
  `;
}
