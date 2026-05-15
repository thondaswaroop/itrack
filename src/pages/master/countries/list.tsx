import React, { useState, useEffect } from "react";
import { Button, Icon, Modal, Input } from "../../../components";
import { masterService, type Country as APICountry } from "../../../services";

type CountryForm = {
  country_code: string;
  country_name: string;
  currency_code: string;
  phone_code: string;
  status: 'active' | 'inactive';
};

const CountriesList: React.FC = () => {
  const [countries, setCountries] = useState<APICountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<APICountry | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [form, setForm] = useState<CountryForm>({
    country_code: '',
    country_name: '',
    currency_code: '',
    phone_code: '',
    status: 'active',
  });
  
  // Load countries
  useEffect(() => {
    loadCountries();
  }, []);
  
  const loadCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await masterService.getCountries('all');
      setCountries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };
  
  const openAddModal = () => {
    setEditing(null);
    setForm({
      country_code: '',
      country_name: '',
      currency_code: '',
      phone_code: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };
  
  const openEditModal = (country: APICountry) => {
    setEditing(country);
    setForm({
      country_code: country.country_code,
      country_name: country.country_name,
      currency_code: country.currency_code || '',
      phone_code: country.phone_code || '',
      status: country.status,
    });
    setIsModalOpen(true);
  };
  
  const handleSave = async () => {
    if (!form.country_code || !form.country_name) {
      alert('Country code and name are required');
      return;
    }
    
    try {
      setSaving(true);
      if (editing) {
        await masterService.updateCountry({
          id: editing.id,
          ...form,
        });
      } else {
        await masterService.createCountry(form);
      }
      await loadCountries();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save country');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this country?')) return;
    
    try {
      await masterService.deleteCountry(id);
      await loadCountries();
    } catch (err: any) {
      alert(err.message || 'Failed to delete country');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Countries</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage countries and their settings.</p>
        </div>
        <Button
          variant="solid"
          tone="primary"
          size="md"
          leadingIcon={<Icon name="plus" className="h-4 w-4" />}
          onClick={openAddModal}
        >
          Add Country
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-textMuted)]">
            Loading countries...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadCountries} variant="outline" tone="primary">Retry</Button>
          </div>
        ) : countries.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-textMuted)]">
            No countries found. Add your first country.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Country Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Currency
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Phone Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {countries.map((country) => (
                <tr key={country.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{country.country_code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">{country.country_name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{country.currency_code || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{country.phone_code || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      country.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {country.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        tone="primary"
                        size="sm"
                        onClick={() => openEditModal(country)}
                        leadingIcon={<Icon name="edit" className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        tone="danger"
                        size="sm"
                        onClick={() => handleDelete(country.id)}
                        leadingIcon={<Icon name="trash" className="h-4 w-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={editing ? 'Edit Country' : 'Add Country'}
        size="md"
      >
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country Code *"
              value={form.country_code}
              onValueChange={(v) => setForm(f => ({ ...f, country_code: v }))}
              placeholder="US"
            />
            <Input
              label="Country Name *"
              value={form.country_name}
              onValueChange={(v) => setForm(f => ({ ...f, country_name: v }))}
              placeholder="United States"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Currency Code"
              value={form.currency_code}
              onValueChange={(v) => setForm(f => ({ ...f, currency_code: v }))}
              placeholder="USD"
            />
            <Input
              label="Phone Code"
              value={form.phone_code}
              onValueChange={(v) => setForm(f => ({ ...f, phone_code: v }))}
              placeholder="+1"
            />
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Status
              </label>
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
          <Button
            variant="outline"
            tone="neutral"
            onClick={() => setIsModalOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            tone="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CountriesList;
