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
type Mode = "AIR" | "OCEAN" | "ROAD";
type CargoType = "Others" | "Automobile";

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
};

type FormState = {
  // Header (from screenshot)
  wrNo: string;
  receivedAt: string; // *Received Date/Time
  loadedAt?: string; // Loaded Date/Time
  location: string; // Location (hub/warehouse)
  shipper: Party | null; // Shipper (Customer)
  consignee: Party | null; // Consignee (Receiver)
  deliveredCarrier?: string; // Delivered Carrier
  cargoType: CargoType; // Cargo Type
  receivedBy?: string; // Received By
  maker?: string; // Maker
  deliveredBy?: string; // Delivered By
  office?: string; // *Office
  poNo?: string; // P.O. No.
  remark?: string; // Remark
  truckBlNo?: string; // Truck B/L No.
  amount?: number | ""; // Amount
  hazardous?: boolean; // Hazardous Goods
  heatTreatedPallets?: boolean; // Heat Treated Pallets
  checkNo?: string; // Check No.
  commodity?: string; // Commodity

  // Route / Mode
  mode: Mode;
  originCountry: string;
  originHub: string;
  destCountry: string;
  destHub: string;

  // Items table
  items: PackageRow[];

  // Notify
  emailNotify: boolean;
}

/* =========================
   Data (mock - replace with API)
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
========================= */
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div className="space-y-1">
    <Label>
      {label} {required ? <span className="text-[var(--color-danger)]">*</span> : null}
    </Label>
    {children}
  </div>
);

// Unit conversions (single definitions)
const cmToCbm = (l?: number | "", w?: number | "", h?: number | "") =>
  l && w && h ? (Number(l) * Number(w) * Number(h)) / 1_000_000 : 0;
const inchToCft = (l?: number | "", w?: number | "", h?: number | "") =>
  l && w && h ? (Number(l) * Number(w) * Number(h)) / 1728 : 0;
const kgToLbs = (kg?: number | "") => (kg ? Number(kg) * 2.20462 : 0);

/* =========================
   Party selection (keeps your behaviour)
========================= */
const PartySelect: React.FC<{
  value: Party | null;
  label: string;
  onSelect: (p: Party) => void;
  onClear: () => void;
  placeholder: string;
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
   Page: NewShipment (with Select-driven countries/hubs)
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

      deliveredCarrier: "",
      cargoType: "Others",
      receivedBy: "Super Admin",
      office: "HCT",
      poNo: "",
      remark: "",
      truckBlNo: "MANUAL123",
      amount: "",
      hazardous: false,
      heatTreatedPallets: false,
      checkNo: "",
      commodity: "",

      mode: "ROAD",
      originCountry: "India",
      originHub: "HYD-001",
      destCountry: "",
      destHub: "",

      items: [{ id: crypto.randomUUID(), length: 100, width: 100, height: 120, dimUnit: "CM", pkg: 1, pcs: 200, unit: "CARTON(S)", actWeightKg: 0 }],

      emailNotify: true,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Modals (shipper/consignee)
  const [openNewShipper, setOpenNewShipper] = useState(false);
  const [openNewConsignee, setOpenNewConsignee] = useState(false);

  // flatten hubs (all hubs) for header Location select
  const allHubs = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    Object.entries(HUBS_BY_COUNTRY).forEach(([country, hubs]) => {
      hubs.forEach((h) => list.push({ value: h, label: `${h} — ${country}` }));
    });
    return list;
  }, []);

  // Select-friendly country options
  const countryOptions = useMemo(() => COUNTRIES.map((c) => ({ value: c, label: c })), []);
  // hubs for selected origin/dest country
  const originHubOptions = useMemo(() => (HUBS_BY_COUNTRY[state.originCountry] ?? []).map((h) => ({ value: h, label: h })), [state.originCountry]);
  const destHubOptions = useMemo(() => (HUBS_BY_COUNTRY[state.destCountry] ?? []).map((h) => ({ value: h, label: h })), [state.destCountry]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  /* ---- Items table helpers ---- */
  const addRow = () =>
    setState((s) => ({
      ...s,
      items: [...s.items, { id: crypto.randomUUID(), length: "", width: "", height: "", dimUnit: "CM", pkg: "", pcs: "", unit: "CARTON(S)", actWeightKg: "" }],
    }));
  const updRow = (id: string, patch: Partial<PackageRow>) =>
    setState((s) => ({ ...s, items: s.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const delRow = (id: string) => setState((s) => ({ ...s, items: s.items.filter((r) => r.id !== id) }));

  /* ---- totals ---- */
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

  /* ---- validate & save ---- */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.receivedAt || !String(state.receivedAt).trim()) e.receivedAt = "Required";
    if (!state.location || !String(state.location).trim()) e.location = "Required";
    if (!state.consignee || !state.consignee.name) e.consignee = "Select or create consignee";
    if (!state.destCountry || !String(state.destCountry).trim()) e.destCountry = "Required";
    if (!state.destHub || !String(state.destHub).trim()) e.destHub = "Required";
    if (!state.items || state.items.length === 0) e.items = "Add at least one row";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // TODO: POST to PHP API — for now just delay and navigate (or keep on page)
      await new Promise((r) => setTimeout(r, 700));
      // console for payload (use this payload to send)
      const payload = { ...state };
      console.log("NEW_WAREHOUSE_RECEIPT_PAYLOAD", payload);
      navigate("/home");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6 overflow-x-clip">
      {/* LEFT column */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        {/* Header form */}
        <ComponentCard title="Warehouse Receipt">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input value={state.wrNo} onValueChange={(v) => setField("wrNo", v)} label="* Warehouse Receipt No." />

            <Input type="datetime-local" label="* Received Date/Time" value={state.receivedAt} onValueChange={(v) => setField("receivedAt", v)} />
            {errors.receivedAt && <p className="text-xs text-[var(--color-danger)]">{errors.receivedAt}</p>}

            {/* Location/HUB (select all hubs) */}
            <div>
              <Label>Location/HUB *</Label>
              <Select
                options={allHubs}
                value={state.location}
                onChange={(v) => setField("location", v)}
                placeholder="Select Hub"
                searchable
                searchPlaceholder="Search hubs..."
                errorMessage={errors.location}
              />
            </div>

            <PartySelect label="Shipper (Customer)" value={state.shipper} onSelect={(p) => setField("shipper", p)} onClear={() => setField("shipper", null)} placeholder="Search shipper" onCreateNew={() => setOpenNewShipper(true)} />

            <PartySelect label="Consignee (Receiver) *" value={state.consignee} onSelect={(p) => setField("consignee", p)} onClear={() => setField("consignee", null)} placeholder="Search consignee" onCreateNew={() => setOpenNewConsignee(true)} />
            {errors.consignee && <p className="text-xs text-[var(--color-danger)]">{errors.consignee}</p>}

            <Input label="Estimated Price" type="number" value={String(state.amount ?? "")} onValueChange={(v) => setField("amount", v ? Number(v) : "")} placeholder="0" />
          </div>

          <div className="grid mt-4">
            <Input value={state.remark ?? ""} onValueChange={(v) => setField("remark", v)} label="Any specific remarks / comments about the package" />
          </div>
        </ComponentCard>

        {/* Route & Mode */}
        <ComponentCard
          title="Route & Mode"
          right={
            <div className="flex items-center gap-2">
              {(["AIR", "OCEAN", "ROAD"] as Mode[]).map((m) => (
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
            {/* Origin country + hub */}
            <div>
              <Label>Origin Country</Label>
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
            </div>

            <div>
              <Label>Origin Hub</Label>
              <Select options={originHubOptions} value={state.originHub} onChange={(v) => setField("originHub", v)} placeholder="Select origin hub" searchable searchPlaceholder="Search hubs..." />
            </div>

            {/* Destination country + hub */}
            <div>
              <Label>Destination Country</Label>
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
                errorMessage={errors.destCountry}
              />
              {errors.destCountry && <p className="text-xs text-[var(--color-danger)]">{errors.destCountry}</p>}
            </div>

            <div>
              <Label>Destination Hub</Label>
              <Select options={destHubOptions} value={state.destHub} onChange={(v) => setField("destHub", v)} placeholder="Select destination hub" searchable searchPlaceholder="Search hubs..." errorMessage={errors.destHub} />
              {errors.destHub && <p className="text-xs text-[var(--color-danger)]">{errors.destHub}</p>}
            </div>
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
          {errors.items && <p className="mt-2 text-xs text-[var(--color-danger)]">{errors.items}</p>}
        </ComponentCard>

        {/* Action Bar */}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={state.emailNotify} onChange={(e) => setField("emailNotify", e.target.checked)} />
            Notify customer by email
          </label>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save</Button>
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
              <div className="text-[var(--color-text)]">{state.originCountry} {state.originHub ? `• ${state.originHub}` : ""}</div>

              <div className="text-[var(--color-textMuted)]">Destination</div>
              <div className="text-[var(--color-text)]">{state.destCountry || "—"} {state.destHub ? `• ${state.destHub}` : ""}</div>

              <div className="text-[var(--color-textMuted)]">Shipper</div>
              <div className="text-[var(--color-text)]">{state.shipper?.name ?? "—"}</div>

              <div className="text-[var(--color-textMuted)]">Consignee</div>
              <div className="text-[var(--color-text)]">{state.consignee?.name ?? "—"}</div>
            </div>
          </ComponentCard>
        </div>
      </div>

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
