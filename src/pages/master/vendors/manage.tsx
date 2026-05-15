import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Select } from "../../../components";
import { hubsMockData } from "../../../mockData";

/**
 * ManageVendor modal
 * Hierarchy: Hubs → Vendors
 * - Can be reused for both Add & Edit vendor flows
 */

export type VendorPayload = {
  id: string;
  name: string;
  hubId: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst?: string;
  notes?: string;
  active?: boolean;
};

type Props = {
  isOpen: boolean;
  initialData?: VendorPayload;
  onSave: (v: VendorPayload) => void;
  onClose: () => void;
};

const ManageVendor: React.FC<Props> = ({ isOpen, initialData, onSave, onClose }) => {
  const [form, setForm] = useState<VendorPayload>({
    id: "",
    name: "",
    hubId: "",
    active: true,
  });

  const [errors, setErrors] = useState<{ name?: string; hubId?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        id: initialData?.id ?? "",
        name: initialData?.name ?? "",
        hubId: initialData?.hubId ?? "",
        contactPerson: initialData?.contactPerson ?? "",
        email: initialData?.email ?? "",
        phone: initialData?.phone ?? "",
        address: initialData?.address ?? "",
        gst: initialData?.gst ?? "",
        notes: initialData?.notes ?? "",
        active: initialData?.active ?? true,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const set = (key: keyof VendorPayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const hubOptions = hubsMockData.map((h) => ({ value: h.id, label: h.title }));

  // --- validation ---
  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Vendor name is required";
    if (!form.hubId) e.hubId = "Hub is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      id: form.id || `VND-${Date.now()}`,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Vendor" : "Add Vendor"}
      size="lg"
      dismissible
      showCloseIcon
      footer={
        <>
          <Button variant="outline" tone="neutral" onClick={onClose}>Cancel</Button>
          <Button variant="solid" tone="primary" onClick={handleSave}>
            {initialData ? "Save Changes" : "Create Vendor"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Vendor Name *"
          value={form.name}
          onValueChange={(v) => set("name", v)}
          placeholder="Vendor / Company name"
          errorMessage={errors.name}
        />

        <Select
          label="Hub *"
          options={hubOptions}
          value={form.hubId ?? ""}
          onChange={(v) => { set("hubId", v); setErrors({ ...errors, hubId: undefined }); }}
          placeholder="Select hub"
          searchable
          searchPlaceholder="Search hubs..."
          errorMessage={errors.hubId}
        />

        <Input label="Contact Person" value={form.contactPerson ?? ""} onValueChange={(v) => set("contactPerson", v)} />
        <Input label="Email" value={form.email ?? ""} onValueChange={(v) => set("email", v)} />
        <Input label="Phone" value={form.phone ?? ""} onValueChange={(v) => set("phone", v)} />
        <Input label="GST / Tax ID" value={form.gst ?? ""} onValueChange={(v) => set("gst", v)} />
        <div className="md:col-span-2">
          <Input label="Address" value={form.address ?? ""} onValueChange={(v) => set("address", v)} />
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            <span className="text-sm text-[var(--color-text)]">Active</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <Input label="Notes" value={form.notes ?? ""} onValueChange={(v) => set("notes", v)} placeholder="Any internal notes" />
        </div>
      </div>
    </Modal>
  );
};

export default ManageVendor;
