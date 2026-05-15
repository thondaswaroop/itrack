// src/pages/Customers.tsx
import React, { useState, useEffect } from 'react';
import { Icon } from '../utils/icons';
import UIIcon from '../utils/uiIcon';
import { Button, Select } from '../components';
import ComponentCard from '../components/common/ComponentCard';
import Input from '../components/form/input/Input';
import Label from '../components/form/Label';
import { Modal } from '../components';
import { shipmentService, type Party, type CreatePartyRequest } from '../services';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Party | null>(null);
  const [formData, setFormData] = useState<CreatePartyRequest>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    company_name: '',
    tax_id: '',
    party_type: 'customer',
  });
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const partyTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'customer', label: 'Customer' },
    { value: 'shipper', label: 'Shipper' },
    { value: 'consignee', label: 'Consignee' },
    { value: 'both', label: 'Both (Shipper & Consignee)' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await shipmentService.getParties(searchQuery);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCustomers();
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      company_name: '',
      tax_id: '',
      party_type: 'customer',
    });
    setFormStatus('active');
    setShowModal(true);
  };

  const handleEdit = (customer: Party) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      postal_code: customer.postal_code || '',
      company_name: customer.company_name || '',
      tax_id: customer.tax_id || '',
      party_type: customer.party_type,
    });
    setFormStatus(customer.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = { ...formData, status: formStatus };
      if (editingCustomer) {
        await shipmentService.updateParty(editingCustomer.id, dataToSave as any);
        alert('Customer updated successfully!');
      } else {
        await shipmentService.createParty(dataToSave as any);
        alert('Customer created successfully!');
      }
      setShowModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (filterType !== 'all' && customer.party_type !== filterType) {
      return false;
    }
    return true;
  });

  const getPartyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-700',
      shipper: 'bg-green-100 text-green-700',
      consignee: 'bg-purple-100 text-purple-700',
      both: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Customers Management</h1>
          <p className="text-sm text-[var(--color-textMuted)] mt-1">
            Manage customers, shippers, and consignees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-50)] flex items-center justify-center">
            <Icon name="customers" className="text-[var(--color-brand-600)]" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{customers.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Icon name="customers" className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Customers</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
                {customers.filter(c => c.party_type === 'customer').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Icon name="customers" className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Shippers</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
                {customers.filter(c => c.party_type === 'shipper' || c.party_type === 'both').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Icon name="shipment" className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <Icon name="success" className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <ComponentCard title="Search & Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Search</Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onValueChange={setSearchQuery}
                placeholder="Search by name, email, phone, or company"
              />
              <Button tone="primary" onClick={handleSearch} loading={loading}>
                <Icon name="search" className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div>
            <Label>Filter by Type</Label>
            <Select
              options={partyTypeOptions}
              value={filterType}
              onChange={setFilterType}
              placeholder="Select type"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button tone="primary" onClick={handleAddNew}>
            <Icon name="plus" className="h-4 w-4 mr-2" />
            Add New Customer
          </Button>
        </div>
      </ComponentCard>

      {/* Customers Table */}
      <ComponentCard title={`Customers (${filteredCustomers.length})`}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-surfaceMuted)]" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-[var(--color-surfaceMuted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="customers" className="h-8 w-8 text-[var(--color-textMuted)]" />
            </div>
            <p className="text-[var(--color-textMuted)] mb-4">No customers found</p>
            <Button onClick={handleAddNew}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Add First Customer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[var(--color-surfaceMuted)]/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-text)]">{customer.name}</div>
                      {customer.email && (
                        <div className="text-xs text-[var(--color-textMuted)]">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-textMuted)]">
                      {customer.company_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {getPartyTypeBadge(customer.party_type)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-textMuted)]">
                      {customer.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-textMuted)]">
                      {customer.city && customer.country ? `${customer.city}, ${customer.country}` : customer.city || customer.country || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <UIIcon name="edit" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onValueChange={(val) => setFormData({ ...formData, name: val })}
                placeholder="Enter name"
              />
            </div>

            <div>
              <Label>Company Name</Label>
              <Input
                value={formData.company_name || ''}
                onValueChange={(val) => setFormData({ ...formData, company_name: val })}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                options={partyTypeOptions.filter(opt => opt.value !== 'all')}
                value={formData.party_type || 'customer'}
                onChange={(val) => setFormData({ ...formData, party_type: val as any })}
                placeholder="Select type"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                options={statusOptions}
                value={formStatus}
                onChange={(val) => setFormStatus(val as any)}
                placeholder="Select status"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={formData.email || ''}
                onValueChange={(val) => setFormData({ ...formData, email: val })}
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone || ''}
                onValueChange={(val) => setFormData({ ...formData, phone: val })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input
                value={formData.address || ''}
                onValueChange={(val) => setFormData({ ...formData, address: val })}
                placeholder="Enter address"
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                value={formData.city || ''}
                onValueChange={(val) => setFormData({ ...formData, city: val })}
                placeholder="Enter city"
              />
            </div>

            <div>
              <Label>State/Province</Label>
              <Input
                value={formData.state || ''}
                onValueChange={(val) => setFormData({ ...formData, state: val })}
                placeholder="Enter state or province"
              />
            </div>

            <div>
              <Label>Country</Label>
              <Input
                value={formData.country || ''}
                onValueChange={(val) => setFormData({ ...formData, country: val })}
                placeholder="Enter country"
              />
            </div>

            <div>
              <Label>Postal Code</Label>
              <Input
                value={formData.postal_code || ''}
                onValueChange={(val) => setFormData({ ...formData, postal_code: val })}
                placeholder="Enter postal code"
              />
            </div>

            <div>
              <Label>Tax ID</Label>
              <Input
                value={formData.tax_id || ''}
                onValueChange={(val) => setFormData({ ...formData, tax_id: val })}
                placeholder="Enter tax ID"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button tone="primary" onClick={handleSave} loading={saving}>
              {editingCustomer ? 'Update' : 'Create'} Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
