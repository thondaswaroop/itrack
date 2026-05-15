import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

interface UserDebugInfo {
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
  };
  role: string;
  hub_id: number | null;
  is_super_admin: boolean;
  fleet_manager_record: any;
  vendor_record: any;
}

export default function AccountDiagnostics() {
  const [debugInfo, setDebugInfo] = useState<UserDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await apiGet('debugUserInfo');
      console.log('Debug Info:', response);
      setDebugInfo(response.debug);
    } catch (err: any) {
      console.error('Failed to load debug info:', err);
      setError(err.message || 'Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Account Diagnostics</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Account Diagnostics</h1>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!debugInfo) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Account Diagnostics
      </h1>

      {/* User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          User Information
        </h2>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">User ID:</span>
            <span className="text-gray-900 dark:text-white">{debugInfo.user.id}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Username:</span>
            <span className="text-gray-900 dark:text-white">{debugInfo.user.username}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Email:</span>
            <span className="text-gray-900 dark:text-white">{debugInfo.user.email}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Full Name:</span>
            <span className="text-gray-900 dark:text-white">{debugInfo.user.full_name}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Role:</span>
            <span className="text-gray-900 dark:text-white">{debugInfo.user.role}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Status:</span>
            <span className="text-gray-900 dark:text-white">{debugInfo.user.status}</span>
          </div>
        </div>
      </div>

      {/* Hub Assignment Status */}
      <div className={`rounded-lg shadow p-6 mb-6 ${
        debugInfo.hub_id 
          ? 'bg-green-50 dark:bg-green-900/20' 
          : 'bg-red-50 dark:bg-red-900/20'
      }`}>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Hub Assignment Status
        </h2>
        {debugInfo.hub_id ? (
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 dark:text-green-200">
              Assigned to Hub ID: <strong>{debugInfo.hub_id}</strong>
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-800 dark:text-red-200 font-semibold">
                Not assigned to any hub
              </span>
            </div>
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-red-300 dark:border-red-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>How to fix this:</strong>
              </p>
              <ol className="text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside space-y-1">
                <li>Contact your system administrator</li>
                <li>They need to add a record in the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">fleet_managers</code> table</li>
                <li>Or run the SQL commands in <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">api_db/fix_hub_assignment.sql</code></li>
                <li>After fixing, log out and log back in</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Fleet Manager Record */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Fleet Manager Record
        </h2>
        {debugInfo.fleet_manager_record ? (
          <div className="overflow-x-auto">
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded">
              {JSON.stringify(debugInfo.fleet_manager_record, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No fleet manager record found
          </p>
        )}
      </div>

      {/* Vendor Record */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Vendor Record
        </h2>
        {debugInfo.vendor_record ? (
          <div className="overflow-x-auto">
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded">
              {JSON.stringify(debugInfo.vendor_record, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No vendor record found
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-200">
          Need Help?
        </h2>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
          If your account isn't assigned to a hub, you won't be able to:
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1 mb-4">
          <li>View or create shelves and containers</li>
          <li>Scan packages for consolidation or arrival</li>
          <li>Load packages for dispatch</li>
          <li>View hub-specific shipment data</li>
        </ul>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Contact your administrator or check the <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">api_db/fix_hub_assignment.sql</code> file for instructions to fix this.
        </p>
      </div>
    </div>
  );
}
