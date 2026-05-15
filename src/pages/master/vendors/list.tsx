import React, { useState, useEffect } from "react";
import { Button, Icon, Modal, Input, Select } from "../../../components";
import { masterService, type Vendor, type Hub } from "../../../services";
import type { Option } from "../../../components/form/Select";
const VendorsList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vendor_name: '', vendor_code: '', email: '', phone: '', address: '', hub_id: 0
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorsData, hubsData] = await Promise.all([
        masterService.getVendors('all'),
        masterService.getHubs({ status: 'active' }),
      ]);
      setVendors(vendorsData);
      setHubs(hubsData);
    } finally {
      setLoading(false);
    }
  };
  
  const openAddModal = () => {
    setEditing(null);
    setForm({ vendor_name: '', vendor_code: '', email: '', phone: '', address: '', hub_id: hubs[0]?.id || 0 });
    setIsModalOpen(true);
  };
  
  const openEditModal = (vendor: Vendor) => {
    setEditing(vendor);
    setForm({
      vendor_name: vendor.vendor_name,
      vendor_code: vendor.vendor_code,
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      hub_id: vendor.hub_id || 0,
    });
    setIsModalOpen(true);
  };
  
  const handleSave = async () => {
    if (!form.vendor_name || !form.vendor_code) {
      alert('Vendor name and code are required');
      return;
    }
    if (!form.hub_id) {
      alert('Please select a hub for the vendor');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await masterService.updateVendor(editing.id, form);
      } else {
        await masterService.createVendor(form);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Vendors</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage vendors and partners.</p>
        </div>
        <Button variant="solid" tone="primary" leadingIcon={<Icon name="plus" className="h-4 w-4" />} onClick={openAddModal}>
          Add Vendor
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-center">No vendors found.</div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Hub</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm font-mono">{v.vendor_code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{v.vendor_name}</td>
                  <td className="px-4 py-3 text-sm">{v.email || '—'}</td>
                  <td className="px-4 py-3 text-sm">{v.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm">{v.hub_name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" tone="primary" size="sm" onClick={() => openEditModal(v)} leadingIcon={<Icon name="edit" className="h-4 w-4" />}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'} size="md">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor Code *" value={form.vendor_code} onValueChange={(v) => setForm(f => ({ ...f, vendor_code: v }))} />
            <Input label="Vendor Name *" value={form.vendor_name} onValueChange={(v) => setForm(f => ({ ...f, vendor_name: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onValueChange={(v) => setForm(f => ({ ...f, email: v }))} />
            <Input label="Phone" value={form.phone} onValueChange={(v) => setForm(f => ({ ...f, phone: v }))} />
          </div>
          <Input label="Address" value={form.address} onValueChange={(v) => setForm(f => ({ ...f, address: v }))} />
          <Select
            label="Hub *"
            placeholder="Select Hub"
            searchable={true}
            searchPlaceholder="Search hubs..."
            value={form.hub_id ? String(form.hub_id) : ""}
            onChange={(val) => setForm(f => ({ ...f, hub_id: Number(val) || 0 }))}
            options={[
              { value: "0", label: "Select Hub", disabled: true },
              ...hubs.map(h => ({
                value: String(h.id),
                label: `${h.hub_name} (${h.hub_code || ''})`
              }))
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="solid" tone="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default VendorsList;
