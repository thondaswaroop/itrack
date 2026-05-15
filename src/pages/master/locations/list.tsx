import React, { useState, useEffect } from "react";
import { Button, Icon, Modal, Input, Select } from "../../../components";
import { masterService, type Location, type Country } from "../../../services";
import type { Option } from "../../../components/form/Select";

const LocationsList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    location_code: '',
    location_name: '',
    country_id: 0,
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [locData, countryData] = await Promise.all([
        masterService.getLocations('all'),
        masterService.getCountries('active'),
      ]);
      setLocations(locData);
      setCountries(countryData);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({
      location_code: '',
      location_name: '',
      country_id: 0,
      address: '',
      city: '',
      state: '',
      postal_code: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.location_code || !form.location_name) {
      alert('Location code and name are required');
      return;
    }
    if (!form.country_id || form.country_id === 0) {
      alert('Please select a country');
      return;
    }
    setSaving(true);
    try {
      await masterService.createLocation(form);
      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Locations</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage delivery locations.</p>
        </div>
        <Button variant="solid" tone="primary" leadingIcon={<Icon name="plus" className="h-4 w-4" />} onClick={openAddModal}>
          Add Location
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center">No locations found.</div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm font-mono">{loc.location_code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{loc.location_name}</td>
                  <td className="px-4 py-3 text-sm">{loc.city || '—'}</td>
                  <td className="px-4 py-3 text-sm">{loc.country_name || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${loc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {loc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Location Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title="Add Location" size="lg">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location Code *"
              value={form.location_code}
              onValueChange={(v) => setForm(f => ({ ...f, location_code: v }))}
              placeholder="LOC001"
            />
            <Input
              label="Location Name *"
              value={form.location_name}
              onValueChange={(v) => setForm(f => ({ ...f, location_name: v }))}
              placeholder="Downtown Warehouse"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Country *"
              placeholder={`Select Country (${countries.length} available)`}
              searchable={true}
              searchPlaceholder="Search countries..."
              value={form.country_id ? String(form.country_id) : ""}
              onChange={(val) => {
                const selectedId = Number(val);
                console.log('Country selected:', selectedId);
                setForm(f => ({ ...f, country_id: selectedId }));
              }}
              options={[
                { value: "0", label: `Select Country (${countries.length} available)`, disabled: true },
                ...countries.map(c => ({
                  value: String(c.id),
                  label: `${c.country_name} (${c.country_code})`
                }))
              ]}
              errorMessage={countries.length === 0 ? "No countries available. Please add countries first." : undefined}
            />
            <Input label="City" value={form.city} onValueChange={(v) => setForm(f => ({ ...f, city: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="State" value={form.state} onValueChange={(v) => setForm(f => ({ ...f, state: v }))} />
            <Input label="Postal Code" value={form.postal_code} onValueChange={(v) => setForm(f => ({ ...f, postal_code: v }))} />
          </div>
          <Input label="Address" value={form.address} onValueChange={(v) => setForm(f => ({ ...f, address: v }))} />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="outline" tone="neutral" onClick={() => setIsModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="solid" tone="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Location'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LocationsList;
