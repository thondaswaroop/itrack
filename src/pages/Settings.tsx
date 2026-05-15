// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Icon } from '../utils/icons';
import { Button, Select } from '../components';
import ComponentCard from '../components/common/ComponentCard';
import Input from '../components/form/input/Input';
import Label from '../components/form/Label';
import { getCurrentUser, settingsService } from '../services';

// Simple controlled toggle component
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-[var(--color-brand-600)]' : 'bg-gray-200 dark:bg-gray-700'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

interface UserSettings {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
}

interface SystemPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  theme: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  shipmentUpdates: boolean;
  deliveryAlerts: boolean;
  systemAlerts: boolean;
}

const Settings: React.FC = () => {
  const currentUser = getCurrentUser();
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    fullName: currentUser?.full_name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    role: currentUser?.role || '',
    organization: 'iTrack Logistics',
  });

  const [systemPrefs, setSystemPrefs] = useState<SystemPreferences>({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    theme: 'system',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    shipmentUpdates: true,
    deliveryAlerts: true,
    systemAlerts: true,
  });

  const [passwordChange, setPasswordChange] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await settingsService.getUserPreferences();
      
      // Update notification settings
      if (prefs.email_notifications !== undefined) {
        setNotifications(prev => ({
          ...prev,
          emailNotifications: prefs.email_notifications || false,
          smsNotifications: prefs.sms_notifications || false,
          shipmentUpdates: prefs.shipment_updates !== undefined ? prefs.shipment_updates : true,
          deliveryAlerts: prefs.delivery_alerts !== undefined ? prefs.delivery_alerts : true,
          systemAlerts: prefs.system_alerts !== undefined ? prefs.system_alerts : true,
        }));
      }
      
      // Update system preferences
      if (prefs.language || prefs.timezone || prefs.date_format || prefs.currency || prefs.theme) {
        setSystemPrefs(prev => ({
          ...prev,
          language: prefs.language || prev.language,
          timezone: prefs.timezone || prev.timezone,
          dateFormat: prefs.date_format || prev.dateFormat,
          currency: prefs.currency || prev.currency,
          theme: prefs.theme || prev.theme,
        }));
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'INR', label: 'INR - Indian Rupee' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System Default' },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await settingsService.updateUserProfile({
        full_name: userSettings.fullName,
        email: userSettings.email,
        phone: userSettings.phone,
      });
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert('Failed to update profile: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await settingsService.updateUserPreferences({
        language: systemPrefs.language,
        timezone: systemPrefs.timezone,
        date_format: systemPrefs.dateFormat,
        currency: systemPrefs.currency,
        theme: systemPrefs.theme,
      });
      alert('Preferences updated successfully!');
    } catch (err: any) {
      alert('Failed to update preferences: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await settingsService.updateUserPreferences({
        email_notifications: notifications.emailNotifications,
        sms_notifications: notifications.smsNotifications,
        shipment_updates: notifications.shipmentUpdates,
        delivery_alerts: notifications.deliveryAlerts,
        system_alerts: notifications.systemAlerts,
      });
      alert('Notification settings updated successfully!');
    } catch (err: any) {
      alert('Failed to update notification settings: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChange.currentPassword) {
      alert('Please enter your current password');
      return;
    }
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordChange.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      await settingsService.changePassword({
        current_password: passwordChange.currentPassword,
        new_password: passwordChange.newPassword,
      });
      alert('Password changed successfully!');
      setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      alert('Failed to change password: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'customers' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'security', label: 'Security', icon: 'lock' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
          <p className="text-sm text-[var(--color-textMuted)] mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-50)] flex items-center justify-center">
          <Icon name="settings" className="text-[var(--color-brand-600)]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--color-brand-600)] text-white'
                  : 'text-[var(--color-textMuted)] hover:bg-[var(--color-surfaceMuted)]'
              }`}
            >
              <Icon name={tab.icon as any} className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <ComponentCard title="Profile Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={userSettings.fullName}
                  onValueChange={(val) => setUserSettings({ ...userSettings, fullName: val })}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={userSettings.email}
                  onValueChange={(val) => setUserSettings({ ...userSettings, email: val })}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={userSettings.phone}
                  onValueChange={(val) => setUserSettings({ ...userSettings, phone: val })}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label>Role</Label>
                <Input
                  value={userSettings.role}
                  disabled
                  placeholder="Your role"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Organization</Label>
                <Input
                  value={userSettings.organization}
                  onValueChange={(val) => setUserSettings({ ...userSettings, organization: val })}
                  placeholder="Organization name"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setUserSettings({
                fullName: currentUser?.full_name || '',
                email: currentUser?.email || '',
                phone: currentUser?.phone || '',
                role: currentUser?.role || '',
                organization: 'iTrack Logistics',
              })}>
                Reset
              </Button>
              <Button tone="primary" onClick={handleSaveProfile} loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </ComponentCard>
      )}

      {/* System Preferences */}
      {activeTab === 'preferences' && (
        <ComponentCard title="System Preferences">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Language</Label>
                <Select
                  options={languageOptions}
                  value={systemPrefs.language}
                  onChange={(val) => setSystemPrefs({ ...systemPrefs, language: val })}
                  placeholder="Select language"
                />
              </div>

              <div>
                <Label>Timezone</Label>
                <Select
                  options={timezoneOptions}
                  value={systemPrefs.timezone}
                  onChange={(val) => setSystemPrefs({ ...systemPrefs, timezone: val })}
                  placeholder="Select timezone"
                  searchable
                />
              </div>

              <div>
                <Label>Date Format</Label>
                <Select
                  options={dateFormatOptions}
                  value={systemPrefs.dateFormat}
                  onChange={(val) => setSystemPrefs({ ...systemPrefs, dateFormat: val })}
                  placeholder="Select date format"
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  options={currencyOptions}
                  value={systemPrefs.currency}
                  onChange={(val) => setSystemPrefs({ ...systemPrefs, currency: val })}
                  placeholder="Select currency"
                  searchable
                />
              </div>

              <div>
                <Label>Theme</Label>
                <Select
                  options={themeOptions}
                  value={systemPrefs.theme}
                  onChange={(val) => setSystemPrefs({ ...systemPrefs, theme: val })}
                  placeholder="Select theme"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline">Reset to Default</Button>
              <Button tone="primary" onClick={handleSavePreferences} loading={saving}>
                Save Preferences
              </Button>
            </div>
          </div>
        </ComponentCard>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <ComponentCard title="Notification Preferences">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg border">
                <div>
                  <p className="font-medium text-[var(--color-text)]">Email Notifications</p>
                  <p className="text-sm text-[var(--color-textMuted)]">Receive notifications via email</p>
                </div>
                <ToggleSwitch
                  checked={notifications.emailNotifications}
                  onChange={(checked: boolean) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg border">
                <div>
                  <p className="font-medium text-[var(--color-text)]">SMS Notifications</p>
                  <p className="text-sm text-[var(--color-textMuted)]">Receive notifications via SMS</p>
                </div>
                <ToggleSwitch
                  checked={notifications.smsNotifications}
                  onChange={(checked: boolean) => setNotifications({ ...notifications, smsNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg border">
                <div>
                  <p className="font-medium text-[var(--color-text)]">Shipment Updates</p>
                  <p className="text-sm text-[var(--color-textMuted)]">Get updates on shipment status changes</p>
                </div>
                <ToggleSwitch
                  checked={notifications.shipmentUpdates}
                  onChange={(checked: boolean) => setNotifications({ ...notifications, shipmentUpdates: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg border">
                <div>
                  <p className="font-medium text-[var(--color-text)]">Delivery Alerts</p>
                  <p className="text-sm text-[var(--color-textMuted)]">Alerts when packages are delivered</p>
                </div>
                <ToggleSwitch
                  checked={notifications.deliveryAlerts}
                  onChange={(checked: boolean) => setNotifications({ ...notifications, deliveryAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg border">
                <div>
                  <p className="font-medium text-[var(--color-text)]">System Alerts</p>
                  <p className="text-sm text-[var(--color-textMuted)]">Important system notifications and updates</p>
                </div>
                <ToggleSwitch
                  checked={notifications.systemAlerts}
                  onChange={(checked: boolean) => setNotifications({ ...notifications, systemAlerts: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline">Disable All</Button>
              <Button tone="primary" onClick={handleSaveNotifications} loading={saving}>
                Save Settings
              </Button>
            </div>
          </div>
        </ComponentCard>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <ComponentCard title="Change Password">
            <div className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordChange.currentPassword}
                  onValueChange={(val) => setPasswordChange({ ...passwordChange, currentPassword: val })}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordChange.newPassword}
                  onValueChange={(val) => setPasswordChange({ ...passwordChange, newPassword: val })}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-[var(--color-textMuted)] mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordChange.confirmPassword}
                  onValueChange={(val) => setPasswordChange({ ...passwordChange, confirmPassword: val })}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' })}>
                  Cancel
                </Button>
                <Button tone="primary" onClick={handleChangePassword} loading={saving}>
                  Change Password
                </Button>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Security Options">
            <div className="space-y-4">
              <div className="p-4 bg-[var(--color-surface)] rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="lock" className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-text)]">Two-Factor Authentication</p>
                    <p className="text-sm text-[var(--color-textMuted)] mt-1">
                      Add an extra layer of security to your account
                    </p>
                    <Button size="sm" variant="outline" className="mt-3">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[var(--color-surface)] rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="success" className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-text)]">Active Sessions</p>
                    <p className="text-sm text-[var(--color-textMuted)] mt-1">
                      View and manage your active login sessions
                    </p>
                    <Button size="sm" variant="outline" className="mt-3">
                      View Sessions
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[var(--color-surface)] rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="warning" className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-text)]">Login History</p>
                    <p className="text-sm text-[var(--color-textMuted)] mt-1">
                      Review your recent login activity
                    </p>
                    <Button size="sm" variant="outline" className="mt-3">
                      View History
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      )}
    </div>
  );
};

export default Settings;
