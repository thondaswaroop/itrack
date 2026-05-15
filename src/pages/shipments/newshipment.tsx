// src/pages/shipments/newshipment.tsx - Fully Dynamic Version
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Modal, Select } from "../../components";
import Label from "../../components/form/Label";
import { Icon } from "../../utils/icons";
import ComponentCard from "../../components/common/ComponentCard";
import { shipmentService, masterService, type Party, type Hub } from "../../services";
import { getUser } from "../../utils/auth";
import { Role } from "../../constants/common";

/* =========================
   Types
========================= */
type Mode = "AIR" | "OCEAN" | "GROUND";
type PaymentTerm = "PREPAID" | "COLLECT" | "PARTIAL_PAYMENT";

type DimUnit = "CM" | "INCH" | "METERS" | "FEET";

type PackageRow = {
  id: string;
  length: number | "";
  width: number | "";
  height: number | "";
  dimUnit: DimUnit;
  weight: number | "";
  description: string;
  declaredValue?: number | "";
};

type FormState = {
  wrNo: string; // Serves as both WR Number and Tracking Number
  receivedAt: string;
  locationHubId: number | "";
  shipper: Party | null;
  consignee: Party | null;
  remark?: string;
  amount?: number | "";
  paidAmount?: number | ""; // Amount already collected for prepaid/partial payment

  paymentTerm: PaymentTerm;

  mode: Mode;
  originHubId: number | "";
  destHubId: number | "";

  items: PackageRow[];

  emailNotify: boolean;
};

/* =========================
   Small UI helpers
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

/* =========================
   PartySelect - Dynamic
========================= */
const PartySelect: React.FC<{
  value: Party | null;
  label: string;
  onSelect: (p: Party) => void;
  onClear: () => void;
  placeholder?: string;
  onCreateNew: () => void;
  error?: string;
}> = ({ value, label, onSelect, onClear, placeholder, onCreateNew, error }) => {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);

  // Search parties
  useEffect(() => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const searchParties = async () => {
      setLoading(true);
      try {
        const results = await shipmentService.getParties(q);
        setSuggestions(results);
      } catch (err) {
        console.error('Error searching parties:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchParties, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const showDropdown = !value && q.length >= 2;

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
            {loading ? (
              <div className="p-4 text-center text-sm text-[var(--color-textMuted)]">Searching...</div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--color-textMuted)]">
                No results. <button type="button" onClick={onCreateNew} className="text-[var(--color-primary)] underline">Create new</button>
              </div>
            ) : (
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
                        <div className="text-xs text-[var(--color-textMuted)]">
                          {s.email ?? "—"} {s.country ? `• ${s.country}` : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
                <li className="border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--color-primary)] hover:bg-[var(--color-surfaceMuted)]"
                    onClick={onCreateNew}
                  >
                    <Icon name="plus" className="h-4 w-4" /> Create new
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)] mt-1">{error}</p>}
    </div>
  );
};

/* =========================
   Page: NewShipment (Fully Dynamic)
========================= */
const NewShipment: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic Data
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState<FormState>(() => {
    const now = new Date();
    const wr = `WR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    return {
      wrNo: wr,
      receivedAt: now.toISOString().slice(0, 16),
      locationHubId: "",
      shipper: null,
      consignee: null,
      remark: "",
      amount: "",
      paidAmount: "",
      paymentTerm: "COLLECT",
      mode: "GROUND",
      originHubId: "",
      destHubId: "",
      items: [
        {
          id: crypto.randomUUID(),
          length: "",
          width: "",
          height: "",
          dimUnit: "CM",
          weight: "",
          description: "",
          declaredValue: "",
        },
      ],
      emailNotify: true,
    } as FormState;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openNewShipper, setOpenNewShipper] = useState(false);
  const [openNewConsignee, setOpenNewConsignee] = useState(false);

  // Get current user for hub auto-detection
  const currentUser = getUser();
  const isAdmin = currentUser?.roleId === Role.ADMIN;
  const userHubId = currentUser?.hubId ? Number(currentUser.hubId) : null;

  // Load dynamic data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const hubsData = await masterService.getHubs();
        setHubs(hubsData);
        
        // Auto-populate hub for non-admin users
        if (!isAdmin && userHubId) {
          console.log('NewShipment: Auto-populating hub for non-admin user. Hub ID:', userHubId);
          setState(prev => ({
            ...prev,
            locationHubId: userHubId,
            originHubId: userHubId,
          }));
        } else if (hubsData.length > 0) {
          // Admin users: set default to first hub
          setState(prev => ({
            ...prev,
            locationHubId: hubsData[0].id,
            originHubId: hubsData[0].id,
          }));
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin, userHubId]);

  // Options for dropdowns
  const hubOptions = useMemo(() => 
    hubs.map(h => ({ 
      value: h.id.toString(), 
      label: `${h.hub_name} (${h.hub_code}) - ${h.location_name || ''}` 
    })),
    [hubs]
  );

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  /* items helpers */
  const addRow = () =>
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        {
          id: crypto.randomUUID(),
          length: "",
          width: "",
          height: "",
          dimUnit: "CM",
          weight: "",
          description: "",
          declaredValue: "",
        },
      ],
    }));
    
  const updRow = (id: string, patch: Partial<PackageRow>) =>
    setState((s) => ({ ...s, items: s.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    
  const delRow = (id: string) => setState((s) => ({ ...s, items: s.items.filter((r) => r.id !== id) }));

  /* totals */
  const totals = useMemo(() => {
    let cbm = 0, totalWeight = 0;
    state.items.forEach((r) => {
      if (r.dimUnit === "CM") cbm += cmToCbm(r.length, r.width, r.height);
      totalWeight += Number(r.weight || 0);
    });
    return { cbm, totalWeight };
  }, [state.items]);

  /* validation */
  const validate = () => {
    const e: Record<string, string> = {};
    
    // Basic required fields
    if (!state.receivedAt || !String(state.receivedAt).trim()) e.receivedAt = "Required";
    if (!state.locationHubId) e.locationHubId = "Required";
    if (!state.consignee || !state.consignee.name) e.consignee = "Select or create consignee";
    if (!state.destHubId) e.destHubId = "Required";
    if (!state.originHubId) e.originHubId = "Origin hub is required";
    if (!state.items || state.items.length === 0) e.items = "Add at least one package";

    // Logistics validations
    // 1. Shipper and Consignee cannot be the same person
    if (state.shipper && state.consignee) {
      if (state.shipper.id && state.consignee.id && state.shipper.id === state.consignee.id) {
        e.consignee = "Shipper and consignee cannot be the same party";
      } else if (state.shipper.name && state.consignee.name && 
                 state.shipper.name.toLowerCase().trim() === state.consignee.name.toLowerCase().trim() &&
                 state.shipper.email && state.consignee.email &&
                 state.shipper.email.toLowerCase().trim() === state.consignee.email.toLowerCase().trim()) {
        e.consignee = "Shipper and consignee cannot be the same person";
      }
    }

    // 2. Origin and Destination hubs cannot be the same
    if (state.originHubId && state.destHubId && state.originHubId === state.destHubId) {
      e.destHubId = "Destination hub must be different from origin hub";
    }

    // 3. Location hub should match origin hub for new shipments
    if (state.locationHubId && state.originHubId && state.locationHubId !== state.originHubId) {
      e.locationHubId = "Receiving location should match origin hub";
    }

    // Package validations
    const missingDesc = state.items.some((it) => !it.description || !String(it.description).trim());
    if (missingDesc) e.items = "Each package must include a description";

    const missingWeight = state.items.some((it) => !it.weight || Number(it.weight) <= 0);
    if (missingWeight) e.items = "Each package must have a valid weight";

    // At least one dimension should be provided for volumetric calculations
    const missingDimensions = state.items.some((it) => {
      const hasLength = it.length && Number(it.length) > 0;
      const hasWidth = it.width && Number(it.width) > 0;
      const hasHeight = it.height && Number(it.height) > 0;
      return !(hasLength && hasWidth && hasHeight);
    });
    if (missingDimensions && !e.items) {
      e.items = "Each package should have dimensions (length, width, height) for volumetric weight calculation";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* === Save shipment === */
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        wr_number: state.wrNo,
        tracking_number: state.wrNo, // Same value for both WR Number and Tracking Number
        origin_hub_id: Number(state.originHubId),
        destination_hub_id: Number(state.destHubId),
        transport_mode: state.mode,
        payment_type: state.paymentTerm.toLowerCase() as 'prepaid' | 'collect' | 'partial_payment',
        total_amount: Number(state.amount) || 0,
        paid_amount: state.paymentTerm === "PARTIAL_PAYMENT" || state.paymentTerm === "PREPAID" ? Number(state.paidAmount) || 0 : 0,
        
        // Party references
        shipper_id: state.shipper?.id,
        consignee_id: state.consignee?.id,
        
        // Inline shipper data (if no party selected)
        ...(!state.shipper?.id && state.shipper ? {
          shipper_name: state.shipper.name,
          shipper_email: state.shipper.email,
          shipper_phone: state.shipper.phone,
          shipper_address: state.shipper.address,
          shipper_city: state.shipper.city,
          shipper_country: state.shipper.country,
          shipper_postal_code: state.shipper.postal_code,
        } : {}),
        
        // Inline consignee data (if no party selected)
        ...(!state.consignee?.id && state.consignee ? {
          consignee_name: state.consignee.name,
          consignee_email: state.consignee.email,
          consignee_phone: state.consignee.phone,
          consignee_address: state.consignee.address,
          consignee_city: state.consignee.city,
          consignee_country: state.consignee.country,
          consignee_postal_code: state.consignee.postal_code,
        } : {}),
        
        packages: state.items.map(it => ({
          weight: Number(it.weight || 0),
          length: Number(it.length || 0),
          width: Number(it.width || 0),
          height: Number(it.height || 0),
          description: it.description,
          declared_value: Number(it.declaredValue || 0),
          quantity: 1,
        })),
        
        currency: 'USD',
        notes: state.remark,
      };

      const result = await shipmentService.createShipment(payload);
      
      // Navigate to receipt page with shipment data
      navigate('/receipt', {
        state: {
          wrNumber: result.wr_number || state.wrNo,
          trackingNumber: result.tracking_number || state.wrNo,
          receivedDate: state.receivedAt,
          originHub: hubs.find(h => h.id === state.originHubId)?.hub_name || 'Unknown',
          destinationHub: hubs.find(h => h.id === state.destHubId)?.hub_name || 'Unknown',
          shipperName: state.shipper?.name || '',
          shipperPhone: state.shipper?.phone || '',
          shipperAddress: state.shipper?.address,
          consigneeName: state.consignee?.name || '',
          consigneePhone: state.consignee?.phone || '',
          consigneeAddress: state.consignee?.address,
          packages: state.items.map(it => ({
            weight: Number(it.weight || 0),
            length: Number(it.length || 0),
            width: Number(it.width || 0),
            height: Number(it.height || 0),
            description: it.description,
            declared_value: Number(it.declaredValue || 0),
            quantity: 1,
          })),
          transportMode: state.mode,
          paymentType: state.paymentTerm.toLowerCase(),
          totalAmount: Number(state.amount) || 0,
          paidAmount: Number(state.paidAmount) || 0,
          pendingAmount: (Number(state.amount) || 0) - (Number(state.paidAmount) || 0),
          currency: 'USD',
          notes: state.remark,
          status: 'RECEIVED' as const
        }
      });
      setSaving(false);
    } catch (err: any) {
      alert('Error creating shipment: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  /* Create party from modal */
  const handleCreateParty = async (isShipper: boolean, partyData: Partial<Party>) => {
    try {
      const newParty = await shipmentService.createParty({
        name: partyData.name || '',
        email: partyData.email,
        phone: partyData.phone,
        address: partyData.address,
        city: partyData.city,
        country: partyData.country,
        postal_code: partyData.postal_code,
        party_type: 'both',
      });
      
      if (isShipper) {
        setField('shipper', newParty);
        setOpenNewShipper(false);
      } else {
        setField('consignee', newParty);
        setOpenNewConsignee(false);
      }
    } catch (err: any) {
      alert('Error creating party: ' + (err.message || 'Unknown error'));
    }
  };

  /* Helper functions */
  const generateWRNumber = () => {
    const now = new Date();
    const wr = `WR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setField("wrNo", wr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[var(--color-textMuted)]">Loading...</div>
      </div>
    );
  }

  /* =========================
     Render
  ========================= */
  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6 overflow-x-clip">
      {/* LEFT column */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        {/* Header form */}
        <ComponentCard title="New Shipment / Warehouse Receipt">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="WR Number / Tracking Number" required>
              <div className="flex gap-2">
                <Input 
                  value={state.wrNo} 
                  onValueChange={(v) => setField("wrNo", v)} 
                  placeholder="Enter or auto-generate" 
                  
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateWRNumber}
                  title="Generate new number"
                >
                  🔄
                </Button>
              </div>
            </Field>

            <Field label="Received Date/Time" error={errors.receivedAt} required>
              <Input type="datetime-local" value={state.receivedAt} onValueChange={(v) => setField("receivedAt", v)} />
            </Field>

            <Field label="Receiving Location/Hub" error={errors.locationHubId} required>
              <Select
                options={hubOptions}
                value={state.locationHubId?.toString() || ''}
                onChange={(v) => setField("locationHubId", Number(v))}
                placeholder="Select Hub"
                searchable
                searchPlaceholder="Search hubs..."
              />
            </Field>

            <div>
              <PartySelect 
                label="Shipper (Customer)" 
                value={state.shipper} 
                onSelect={(p) => setField("shipper", p)} 
                onClear={() => setField("shipper", null)} 
               
                placeholder="Search shipper..." 
                onCreateNew={() => setOpenNewShipper(true)} 
              />
            </div>

            <div>
              <PartySelect 
                label="Consignee (Receiver)" 
                value={state.consignee} 
                onSelect={(p) => setField("consignee", p)} 
                onClear={() => setField("consignee", null)} 
               
                placeholder="Search consignee..." 
                onCreateNew={() => setOpenNewConsignee(true)} 
                error={errors.consignee}
                required
              />
            </div>

            <Field label="Payment Term" required>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  className={`rounded-lg border px-3 py-1.5 text-sm ${state.paymentTerm === "COLLECT" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} 
                  onClick={() => setField("paymentTerm", "COLLECT")}
                >
                  Collect
                </button>
                <button 
                  type="button" 
                  className={`rounded-lg border px-3 py-1.5 text-sm ${state.paymentTerm === "PREPAID" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} 
                  onClick={() => setField("paymentTerm", "PREPAID")}
                >
                  Prepaid
                </button>
                <button 
                  type="button" 
                  className={`rounded-lg border px-3 py-1.5 text-sm ${state.paymentTerm === "PARTIAL_PAYMENT" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-textMuted)]"}`} 
                  onClick={() => setField("paymentTerm", "PARTIAL_PAYMENT")}
                >
                  Partial Payment
                </button>
              </div>
            </Field>

            <Field label="Estimated Amount">
              <Input type="number" value={String(state.amount ?? "")} onValueChange={(v) => setField("amount", v ? Number(v) : "")} placeholder="0" />
            </Field>

            {(state.paymentTerm === "PREPAID" || state.paymentTerm === "PARTIAL_PAYMENT") && (
              <Field label={state.paymentTerm === "PREPAID" ? "Prepaid Amount" : "Amount Already Collected"}>
                <Input 
                  type="number" 
                  value={String(state.paidAmount ?? "")} 
                  onValueChange={(v) => setField("paidAmount", v ? Number(v) : "")} 
                  placeholder="0" 
                  
                />
              </Field>
            )}

            <Field label="Remarks" className="md:col-span-2 lg:col-span-3">
              <Input value={state.remark ?? ""} onValueChange={(v) => setField("remark", v)} placeholder="Any additional notes..." />
            </Field>
          </div>
        </ComponentCard>

        {/* Route & Mode */}
        <ComponentCard
          title="Route & Transport Mode"
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
            <Field label="Origin Hub">
              <Select 
                options={hubOptions} 
                value={state.originHubId?.toString() || ''} 
                onChange={(v) => setField("originHubId", Number(v))} 
                placeholder="Select origin hub" 
                searchable 
                searchPlaceholder="Search hubs..." 
              />
            </Field>

            <Field label="Destination Hub" error={errors.destHubId} required>
              <Select 
                options={hubOptions} 
                value={state.destHubId?.toString() || ''} 
                onChange={(v) => setField("destHubId", Number(v))} 
                placeholder="Select destination hub" 
                searchable 
                searchPlaceholder="Search hubs..." 
              />
            </Field>
          </div>
        </ComponentCard>

        {/* Packages table */}
        <ComponentCard
          title="Packages"
          right={
            <Button variant="outline" onClick={addRow}>
              <Icon name="plus" className="h-4 w-4" /> Add Package
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
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Weight (kg)</th>
                  <th className="px-3 py-2">Description *</th>
                  <th className="px-3 py-2">Value</th>
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
                      <select 
                        className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-[var(--color-text)] outline-none" 
                        value={r.dimUnit} 
                        onChange={(e) => updRow(r.id, { dimUnit: e.target.value as DimUnit })}
                      >
                        <option value="CM">CM</option>
                        <option value="INCH">INCH</option>
                        <option value="METERS">METERS</option>
                        <option value="FEET">FEET</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 min-w-28">
                      <Input type="number" value={String(r.weight ?? "")} onValueChange={(v) => updRow(r.id, { weight: v ? Number(v) : "" })} placeholder="0" />
                    </td>
                    <td className="px-3 py-2 min-w-36">
                      <Input value={r.description ?? ""} onValueChange={(v) => updRow(r.id, { description: v })} placeholder="Package contents" />
                    </td>
                    <td className="px-3 py-2 min-w-28">
                      <Input type="number" value={String(r.declaredValue ?? "")} onValueChange={(v) => updRow(r.id, { declaredValue: v ? Number(v) : "" })} placeholder="0" />
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

          <div className="mt-3 text-sm text-[var(--color-textMuted)]">
            Totals: Packages {state.items.length} • CBM {totals.cbm.toFixed(3)} • Weight {totals.totalWeight.toFixed(2)} kg
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
            <Button loading={saving} onClick={handleSave}>Create Shipment</Button>
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
              <div className="font-medium text-[var(--color-text)]">
                {hubs.find(h => h.id === state.originHubId)?.hub_name || '—'}
              </div>

              <div className="text-[var(--color-textMuted)]">Destination</div>
              <div className="font-medium text-[var(--color-text)]">
                {hubs.find(h => h.id === state.destHubId)?.hub_name || '—'}
              </div>

              <div className="text-[var(--color-textMuted)]">Shipper</div>
              <div className="font-medium text-[var(--color-text)]">{state.shipper?.name ?? "—"}</div>

              <div className="text-[var(--color-textMuted)]">Consignee</div>
              <div className="font-medium text-[var(--color-text)]">{state.consignee?.name ?? "—"}</div>

              <div className="text-[var(--color-textMuted)]">Total Packages</div>
              <div className="font-medium text-[var(--color-text)]">{state.items.length}</div>

              <div className="text-[var(--color-textMuted)]">Total Weight</div>
              <div className="font-medium text-[var(--color-text)]">{totals.totalWeight.toFixed(2)} kg</div>
            </div>
          </ComponentCard>
        </div>
      </div>

      {/* New Shipper modal */}
      <Modal 
        isOpen={openNewShipper} 
        onClose={() => setOpenNewShipper(false)} 
        title="New Shipper" 
        size="lg" 
        dismissible 
        showCloseIcon 
        footer={
          <CreatePartyFooter 
            onCancel={() => setOpenNewShipper(false)} 
            onSave={(data) => handleCreateParty(true, data)} 
          />
        }
      >
        <CreatePartyBody />
      </Modal>

      {/* New Consignee modal */}
      <Modal 
        isOpen={openNewConsignee} 
        onClose={() => setOpenNewConsignee(false)} 
        title="New Consignee" 
        size="lg" 
        dismissible 
        showCloseIcon 
        footer={
          <CreatePartyFooter 
            onCancel={() => setOpenNewConsignee(false)} 
            onSave={(data) => handleCreateParty(false, data)} 
          />
        }
      >
        <CreatePartyBody />
      </Modal>
    </div>
  );
};

export default NewShipment;

/* =========================
   Modal bodies & footers (shipper/consignee)
========================= */

type PartyDraft = Partial<Party>;

const CreatePartyBody: React.FC = () => {
  const [form, setForm] = useState<PartyDraft>({});
  (window as any).__partyDraft = form;
  const set = <K extends keyof PartyDraft>(k: K, v: PartyDraft[K]) => {
    const newForm = { ...form, [k]: v };
    setForm(newForm);
    (window as any).__partyDraft = newForm;
  };

  return (
    <div className="space-y-4 p-2">
      <Field label="Name" required>
        <Input value={form.name || ''} onValueChange={(v) => set("name", v)} placeholder="Full name / Company" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input value={form.email ?? ""} onValueChange={(v) => set("email", v)} placeholder="name@domain.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone ?? ""} onValueChange={(v) => set("phone", v)} placeholder="+91 90000 00000" />
        </Field>
      </div>

      <Field label="Country">
        <Input value={form.country ?? ""} onValueChange={(v) => set("country", v)} placeholder="Country" />
      </Field>

      <Field label="Address">
        <Input value={form.address ?? ""} onValueChange={(v) => set("address", v)} placeholder="Address" />
      </Field>
    </div>
  );
};

const CreatePartyFooter: React.FC<{ onCancel: () => void; onSave: (p: PartyDraft) => void }> = ({ onCancel, onSave }) => {
  const handleSave = () => {
    const draft: PartyDraft | undefined = (window as any).__partyDraft;
    if (!draft?.name?.trim()) {
      alert('Party name is required');
      return;
    }
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
