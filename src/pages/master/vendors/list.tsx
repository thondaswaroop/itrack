import React, { useMemo, useState } from "react";
import { Button, Icon, Modal } from "../../../components";
import { useModal } from "../../../hooks/useModal";
import ManageVendor, { type VendorPayload } from "./manage";
import { countriesMockData, locationsMockData, hubsMockData } from "../../../mockData";

/**
 * Vendors Page
 * - Manage vendors linked to country -> location -> hub
 * - Uses ManageVendor modal component for Add/Edit
 */

const Vendors: React.FC = () => {
  // state for master data (replace with API calls later)
  const [vendors, setVendors] = useState<VendorPayload[]>([
    {
      id: "VND-1001",
      name: "Blue Freight Pvt Ltd",
      countryId: 1,
      locationId: "HYD-001",
      hubId: "HYD-HUB-01",
      contactPerson: "Ramesh",
      email: "ops@bluefreight.com",
      phone: "+91 90000 12345",
      address: "Plot 12, Industrial Area, Hyderabad",
      gst: "29ABCDE1234F2Z5",
      active: true,
      notes: "Primary vendor for Telangana region",
    },
    {
      id: "VND-1002",
      name: "Sky Logistics",
      countryId: 1,
      locationId: "BLR-002",
      hubId: "BLR-HUB-01",
      contactPerson: "Anita",
      email: "anita@skylog.com",
      phone: "+91 98000 54321",
      address: "No 9, Tech Park, Bangalore",
      gst: "",
      active: true,
      notes: "",
    },
  ]);

  // Manage modal
  const manage = useModal(false);
  const confirm = useModal(false);

  const [editing, setEditing] = useState<VendorPayload | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    manage.openModal();
  };

  const openEdit = (v: VendorPayload) => {
    setEditing(v);
    manage.openModal();
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    confirm.openModal();
  };

  const doDelete = () => {
    if (toDeleteId) setVendors((prev) => prev.filter((v) => v.id !== toDeleteId));
    confirm.closeModal();
    setToDeleteId(null);
  };

  const saveVendor = (data: VendorPayload) => {
    setVendors((prev) => {
      const exists = prev.find((v) => v.id === data.id);
      if (exists) return prev.map((v) => (v.id === data.id ? data : v));
      return [data, ...prev];
    });
    manage.closeModal();
    setEditing(null);
  };

  const getCountryLabel = (cid?: number | string) =>
    countriesMockData.find((c) => String(c.id) === String(cid))?.title ?? "—";

  const getLocationLabel = (lid?: string) =>
    locationsMockData.find((l) => l.id === lid)?.title ?? "—";

  const getHubLabel = (hid?: string) =>
    hubsMockData.find((h) => h.id === hid)?.title ?? "—";

  const activeCount = useMemo(() => vendors.filter((v) => v.active).length, [vendors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Vendors</h1>
          <p className="text-sm text-[var(--color-textMuted)]">
            Manage vendor records linked to countries, locations, and hubs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="solid"
            tone="primary"
            size="md"
            leadingIcon={<Icon name="plus" className="h-4 w-4" />}
            onClick={openAdd}
          >
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-textMuted)]">
        Total Vendors: <strong className="text-[var(--color-text)]">{vendors.length}</strong> • Active:{" "}
        <strong className="text-[var(--color-success)]">{activeCount}</strong>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hub</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Phone / Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Active</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">{v.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-textMuted)]">
                    {getCountryLabel(v.countryId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-textMuted)]">
                    {getLocationLabel(v.locationId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-textMuted)]">
                    {getHubLabel(v.hubId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-textMuted)]">
                    {v.contactPerson ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-textMuted)]">
                    <div>{v.phone ?? "—"}</div>
                    <div className="text-xs text-[var(--color-textMuted)]">{v.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {v.active ? (
                      <span className="inline-flex items-center rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-success)]">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-danger)]">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        tone="primary"
                        size="sm"
                        leadingIcon={<Icon name="edit" className="h-4 w-4" />}
                        onClick={() => openEdit(v)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        tone="danger"
                        size="sm"
                        leadingIcon={<Icon name="trash" className="h-4 w-4" />}
                        onClick={() => askDelete(v.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {vendors.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-[var(--color-textMuted)]"
                  >
                    No vendors yet. Click <strong>Add Vendor</strong> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage modal */}
      <ManageVendor
        isOpen={manage.isOpen}
        initialData={editing ?? undefined}
        onClose={() => {
          manage.closeModal();
          setEditing(null);
        }}
        onSave={saveVendor}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={confirm.isOpen}
        onClose={confirm.closeModal}
        title="Delete Vendor"
        size="sm"
        dismissible
        showCloseIcon
        footer={
          <>
            <Button variant="outline" tone="neutral" onClick={confirm.closeModal}>
              Cancel
            </Button>
            <Button variant="solid" tone="danger" onClick={doDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-textMuted)]">
          Are you sure you want to delete this vendor? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Vendors;
