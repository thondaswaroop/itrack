import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Icon, Input, Select } from "../../../components";
import { masterService, authService, type Vendor } from "../../../services";

const ManageAssociate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const associateId = searchParams.get('id');
  const isEdit = !!associateId;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    // User details
    createNewUser: !isEdit,
    full_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    // Fleet manager details
    user_id: 0,
    vendor_id: 0,
    employee_code: '',
    designation: '',
    department: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const vendorsData = await masterService.getVendors('active');
      setVendors(vendorsData);
      
      if (isEdit && associateId) {
        const managers = await masterService.getFleetManagers();
        const manager = managers.find(m => m.id === Number(associateId));
        if (manager) {
          setForm({
            createNewUser: false,
            full_name: manager.full_name || '',
            username: manager.username || '',
            email: manager.email || '',
            password: '',
            phone: manager.phone || '',
            user_id: manager.user_id,
            vendor_id: manager.vendor_id,
            employee_code: manager.employee_code || '',
            designation: manager.designation || '',
            department: manager.department || '',
          });
        }
      } else {
        setForm(f => ({ ...f, vendor_id: vendorsData[0]?.id || 0 }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.vendor_id) {
      alert('Please select a vendor');
      return;
    }

    setSaving(true);
    try {
      let userId = form.user_id;

      // Create new user if needed
      if (form.createNewUser) {
        if (!form.full_name || !form.username || !form.email || !form.password) {
          alert('Please fill in all user details (name, username, email, password)');
          setSaving(false);
          return;
        }

        // Register new associate user
        const registerResponse = await authService.register({
          full_name: form.full_name,
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: 'associate',
        });

        console.log('User registered successfully:', registerResponse);
        
        if (!registerResponse.id) {
          console.error('No user ID returned from registration:', registerResponse);
          alert('Failed to create user account - no ID returned');
          setSaving(false);
          return;
        }
        
        console.log('Using user ID:', registerResponse.id);
        userId = registerResponse.id;
      }

      if (!userId) {
        alert('User ID is required');
        setSaving(false);
        return;
      }

      // Create or update fleet manager
      if (isEdit) {
        // Update user details (username, email, name, phone, password)
        const updateData: any = {
          user_id: form.user_id,
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
        };
        
        // Only include password if it's been filled in
        if (form.password && form.password.trim() !== '') {
          updateData.password = form.password;
        }
        
        await authService.updateUserByAdmin(updateData);

        // Update fleet manager record
        await masterService.updateFleetManager({
          id: Number(associateId),
          vendor_id: form.vendor_id,
          employee_code: form.employee_code,
          designation: form.designation,
          department: form.department,
        });
        
        alert('Associate updated successfully!');
        navigate('/associates');
      } else {
        console.log('Creating fleet manager with:', {
          user_id: userId,
          vendor_id: form.vendor_id,
          employee_code: form.employee_code,
          designation: form.designation,
          department: form.department,
        });
        
        const createResult = await masterService.createFleetManager({
          user_id: userId,
          vendor_id: form.vendor_id,
          employee_code: form.employee_code,
          designation: form.designation,
          department: form.department,
        });
        
        console.log('Fleet manager creation result:', createResult);
        
        alert('Associate created successfully!');
        navigate('/associates');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save associate');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-[var(--color-text)]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            {isEdit ? 'Edit Associate' : 'Add New Associate'}
          </h1>
          <p className="text-sm text-[var(--color-textMuted)] mt-1">
            {isEdit ? 'Update associate information' : 'Create a new fleet manager / associate'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Account Section */}
        {!isEdit && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">User Account</h2>
                <p className="text-sm text-[var(--color-textMuted)] mt-1">
                  Create a new user account with 'associate' role
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.createNewUser}
                  onChange={(e) => setForm(f => ({ ...f, createNewUser: e.target.checked }))}
                  className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm font-medium text-[var(--color-text)]">Create new user</span>
              </label>
            </div>

            {form.createNewUser && (
              <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    value={form.full_name}
                    onValueChange={(v) => setForm(f => ({ ...f, full_name: v }))}
                    placeholder="John Doe"
                  />
                  <Input
                    label="Username *"
                    value={form.username}
                    onValueChange={(v) => setForm(f => ({ ...f, username: v }))}
                    placeholder="john.doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email *"
                    type="email"
                    value={form.email}
                    onValueChange={(v) => setForm(f => ({ ...f, email: v }))}
                    placeholder="john@example.com"
                  />
                  <Input
                    label="Password *"
                    type="password"
                    value={form.password}
                    onValueChange={(v) => setForm(f => ({ ...f, password: v }))}
                    placeholder="Enter password"
                  />
                </div>
                <Input
                  label="Phone"
                  value={form.phone}
                  onValueChange={(v) => setForm(f => ({ ...f, phone: v }))}
                  placeholder="+1234567890"
                />
              </div>
            )}
          </div>
        )}

        {/* User Details Section (for editing) */}
        {isEdit && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">User Details</h2>
              <p className="text-sm text-[var(--color-textMuted)] mt-1">
                Current user account information
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={form.full_name}
                  onValueChange={(v) => setForm(f => ({ ...f, full_name: v }))}
                  placeholder="John Doe"
                />
                <Input
                  label="Username"
                  value={form.username}
                  onValueChange={(v) => setForm(f => ({ ...f, username: v }))}
                  placeholder="john.doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onValueChange={(v) => setForm(f => ({ ...f, email: v }))}
                  placeholder="john@example.com"
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onValueChange={(v) => setForm(f => ({ ...f, phone: v }))}
                  placeholder="+1234567890"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 mb-2">
                  <strong>Change Password:</strong> Leave blank to keep current password
                </p>
                <Input
                  label="New Password (optional)"
                  type="password"
                  value={form.password}
                  onValueChange={(v) => setForm(f => ({ ...f, password: v }))}
                  placeholder="Enter new password to change"
                />
              </div>
            </div>
          </div>
        )}

        {/* Fleet Manager Details Section */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Associate Details</h2>
            <p className="text-sm text-[var(--color-textMuted)] mt-1">
              Associate information and vendor/hub assignment
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Each associate is automatically linked to their vendor's hub. Make sure the vendor is assigned to a hub first.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Vendor *"
                placeholder="Select Vendor"
                searchable={true}
                searchPlaceholder="Search vendors..."
                value={form.vendor_id ? String(form.vendor_id) : ""}
                onChange={(val) => setForm(f => ({ ...f, vendor_id: Number(val) || 0 }))}
                options={[
                  { value: "0", label: "Select Vendor", disabled: true },
                  ...vendors.map(v => ({
                    value: String(v.id),
                    label: `${v.vendor_name} (${v.vendor_code})`
                  }))
                ]}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Employee Code"
                value={form.employee_code}
                onValueChange={(v) => setForm(f => ({ ...f, employee_code: v }))}
                placeholder="EMP001"
              />
              <Input
                label="Designation"
                value={form.designation}
                onValueChange={(v) => setForm(f => ({ ...f, designation: v }))}
                placeholder="Warehouse Manager"
              />
              <Input
                label="Department"
                value={form.department}
                onValueChange={(v) => setForm(f => ({ ...f, department: v }))}
                placeholder="Operations"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
          <Button
            type="button"
            variant="outline"
            tone="neutral"
            onClick={() => navigate('/associates')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            disabled={saving}
            leadingIcon={saving ? undefined : <Icon name="plus" className="h-4 w-4" />}
          >
            {saving ? 'Saving...' : (isEdit ? 'Update Associate' : 'Create Associate')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManageAssociate;
