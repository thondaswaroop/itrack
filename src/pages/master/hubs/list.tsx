import React, { useState, useEffect } from "react";
import { Button, Icon, Modal, Input, Select } from "../../../components";
import { masterService, type Hub as APIHub, type Location } from "../../../services";
import type { Option } from "../../../components/form/Select";

type HubForm = {
  hub_name: string;
  hub_code: string;
  location_id: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  hub_type: 'origin' | 'transit' | 'destination' | 'all';
  status?: 'active' | 'inactive';
};

const HubsList: React.FC = () => {
  const [hubs, setHubs] = useState<APIHub[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<APIHub | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [form, setForm] = useState<HubForm>({
    hub_name: '',
    hub_code: '',
    location_id: 0,
    hub_type: 'all',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hubsData, locationsData] = await Promise.all([
        masterService.getHubs({ status: 'all' }),
        masterService.getLocations('active'),
      ]);
      setHubs(hubsData);
      setLocations(locationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const openAddModal = () => {
    setEditing(null);
    setForm({
      hub_name: '',
      hub_code: '',
      location_id: locations[0]?.id || 0,
      hub_type: 'all',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
    });
    setIsModalOpen(true);
  };
  
  const openEditModal = (hub: APIHub) => {
    setEditing(hub);
    setForm({
      hub_name: hub.hub_name,
      hub_code: hub.hub_code,
      location_id: hub.location_id,
      address: hub.address || '',
      city: hub.city || '',
      state: hub.state || '',
      postal_code: hub.postal_code || '',
      contact_person: hub.contact_person || '',
      contact_phone: hub.contact_phone || '',
      contact_email: hub.contact_email || '',
      hub_type: hub.hub_type,
      status: hub.status,
    });
    setIsModalOpen(true);
  };
  
  const handleSave = async () => {
    if (!form.hub_name || !form.hub_code || !form.location_id) {
      alert('Hub name, code, and location are required');
      return;
    }
    
    try {
      setSaving(true);
      if (editing) {
        await masterService.updateHub(editing.id, form);
      } else {
        await masterService.createHub(form);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save hub');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Hubs</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage warehouses and distribution hubs.</p>
        </div>
        <Button
          variant="solid"
          tone="primary"
          size="md"
          leadingIcon={<Icon name="plus" className="h-4 w-4" />}
          onClick={openAddModal}
        >
          Add Hub
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-textMuted)]">Loading hubs...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData} variant="outline" tone="primary">Retry</Button>
          </div>
        ) : hubs.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-textMuted)]">No hubs found.</div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Hub Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Hub Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {hubs.map((hub) => (
                <tr key={hub.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{hub.hub_code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">{hub.hub_name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{hub.location_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{hub.city || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)] capitalize">{hub.hub_type}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {hub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      tone="primary"
                      size="sm"
                      onClick={() => openEditModal(hub)}
                      leadingIcon={<Icon name="edit" className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={editing ? 'Edit Hub' : 'Add Hub'}
        size="lg"
      >
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hub Code *"
              value={form.hub_code}
              onValueChange={(v) => setForm(f => ({ ...f, hub_code: v }))}
              placeholder="HUB001"
            />
            <Input
              label="Hub Name *"
              value={form.hub_name}
              onValueChange={(v) => setForm(f => ({ ...f, hub_name: v }))}
              placeholder="Main Warehouse"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Location *"
              placeholder="Select Location"
              searchable={true}
              searchPlaceholder="Search locations..."
              value={form.location_id ? String(form.location_id) : ""}
              onChange={(val) => setForm(f => ({ ...f, location_id: Number(val) || 0 }))}
              options={[
                { value: "0", label: "Select Location", disabled: true },
                ...locations.map(l => ({
                  value: String(l.id),
                  label: l.location_name
                }))
              ]}
            />
            <Select
              label="Hub Type"
              placeholder="Select Hub Type"
              value={form.hub_type}
              onChange={(val) => setForm(f => ({ ...f, hub_type: val as any }))}
              options={[
                { value: "all", label: "All (Origin + Transit + Destination)" },
                { value: "origin", label: "Origin Only" },
                { value: "transit", label: "Transit Only" },
                { value: "destination", label: "Destination Only" }
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={form.city || ''}
              onValueChange={(v) => setForm(f => ({ ...f, city: v }))}
            />
            <Input
              label="State"
              value={form.state || ''}
              onValueChange={(v) => setForm(f => ({ ...f, state: v }))}
            />
            <Input
              label="Postal Code"
              value={form.postal_code || ''}
              onValueChange={(v) => setForm(f => ({ ...f, postal_code: v }))}
            />
          </div>
          <Input
            label="Address"
            value={form.address || ''}
            onValueChange={(v) => setForm(f => ({ ...f, address: v }))}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Contact Person"
              value={form.contact_person || ''}
              onValueChange={(v) => setForm(f => ({ ...f, contact_person: v }))}
            />
            <Input
              label="Contact Phone"
              value={form.contact_phone || ''}
              onValueChange={(v) => setForm(f => ({ ...f, contact_phone: v }))}
            />
            <Input
              label="Contact Email"
              value={form.contact_email || ''}
              onValueChange={(v) => setForm(f => ({ ...f, contact_email: v }))}
            />
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="outline" tone="neutral" onClick={() => setIsModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="solid" tone="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default HubsList;
