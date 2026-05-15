import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon } from "../components";
import { masterService, type FleetManager } from "../services";

const FleetManagers: React.FC = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<FleetManager[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await masterService.getFleetManagers();
      setManagers(data);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Fleet Managers (Associates)</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage fleet managers and associates.</p>
        </div>
        <Button 
          variant="solid" 
          tone="primary" 
          leadingIcon={<Icon name="plus" className="h-4 w-4" />}
          onClick={() => navigate('/associates/manage')}
        >
          Add Manager
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-textMuted)]">Loading...</div>
        ) : managers.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-textMuted)]">No associates found.</div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Hub</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Employee Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Designation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {managers.map((mgr) => (
                <tr key={mgr.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">{mgr.full_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{mgr.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    <div className="flex flex-col">
                      <span className="font-medium">{mgr.vendor_name || '—'}</span>
                      {mgr.vendor_code && <span className="text-xs text-[var(--color-textMuted)]">{mgr.vendor_code}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{mgr.hub_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{mgr.employee_code || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{mgr.designation || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mgr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mgr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      tone="primary"
                      size="sm"
                      onClick={() => navigate(`/associates/manage?id=${mgr.id}`)}
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
    </div>
  );
};

export default FleetManagers;
