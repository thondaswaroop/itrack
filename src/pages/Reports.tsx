// src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { Icon } from '../utils/icons';
import { Button, Select } from '../components';
import ComponentCard from '../components/common/ComponentCard';
import Input from '../components/form/input/Input';
import Label from '../components/form/Label';
import { shipmentService, dashboardService } from '../services';

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  hub: string;
  reportType: string;
}

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    hub: 'all',
    reportType: 'shipments',
  });

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  const reportTypes = [
    { value: 'shipments', label: 'Shipments Summary' },
    { value: 'packages', label: 'Packages Report' },
    { value: 'status', label: 'Status Analysis' },
    { value: 'performance', label: 'Performance Metrics' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CONSOLIDATED', label: 'Consolidated' },
    { value: 'DISPATCHED', label: 'Dispatched from Hub' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'ARRIVED', label: 'Arrived at Destination' },
    { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'COLLECTED', label: 'Collected by Customer' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Fetch shipments based on filters
      const shipments = await shipmentService.getRecentShipments(
        undefined,
        100
      );
      setReportData(shipments);
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Shipment ID', 'From', 'To', 'Status', 'Mode', 'Packages', 'ETA'];
    const rows = reportData.map(s => [
      s.id || s.tracking_number || s.wr_number,
      s.from || s.origin_hub_name,
      s.to || s.destination_hub_name,
      s.status || s.current_status,
      s.mode || s.transport_mode,
      s.packages || s.package_count || 0,
      s.eta || s.estimated_delivery || s.etd || 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Reports & Analytics</h1>
          <p className="text-sm text-[var(--color-textMuted)] mt-1">
            Generate and export detailed reports for your shipments
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-50)] flex items-center justify-center">
          <Icon name="reports" className="text-[var(--color-brand-600)]" />
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Total Shipments</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{stats.total_shipments || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Icon name="shipment" className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Today's Shipments</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{stats.today_shipments || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Icon name="package" className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">In Transit</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
                  {stats.by_status?.find((s: any) => s.current_status === 'IN_TRANSIT')?.count || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <Icon name="vehicle" className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-textMuted)] uppercase tracking-wide">Delivered</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
                  {stats.by_status?.find((s: any) => s.current_status === 'COLLECTED')?.count || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Icon name="success" className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <ComponentCard title="Report Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Report Type</Label>
            <Select
              options={reportTypes}
              value={filters.reportType}
              onChange={(val) => setFilters({ ...filters, reportType: val })}
              placeholder="Select type"
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val })}
              placeholder="Select status"
              searchable
            />
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onValueChange={(val) => setFilters({ ...filters, startDate: val })}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onValueChange={(val) => setFilters({ ...filters, endDate: val })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button tone="primary" onClick={generateReport} loading={loading}>
            <Icon name="search" className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
            <Icon name="download" className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </ComponentCard>

      {/* Report Results */}
      {reportData.length > 0 && (
        <ComponentCard title={`Report Results (${reportData.length} records)`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
                <tr>
                  <th className="px-4 py-3">Shipment ID</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Packages</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {reportData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-surfaceMuted)]/30">
                    <td className="px-4 py-3 font-medium">{item.id || item.tracking_number || item.wr_number}</td>
                    <td className="px-4 py-3">{item.from || item.origin_hub_name || 'N/A'}</td>
                    <td className="px-4 py-3">{item.to || item.destination_hub_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                        {item.status || item.current_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.mode || item.transport_mode || 'N/A'}</td>
                    <td className="px-4 py-3">{item.packages || item.package_count || 0}</td>
                    <td className="px-4 py-3">{item.eta || item.created_at || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      )}

      {/* Status Distribution */}
      {stats && stats.by_status && stats.by_status.length > 0 && (
        <ComponentCard title="Status Distribution">
          <div className="space-y-3">
            {stats.by_status.map((statusItem: any) => {
              const percentage = stats.total_shipments > 0 
                ? (statusItem.count / stats.total_shipments) * 100 
                : 0;
              
              return (
                <div key={statusItem.current_status || 'unknown'} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text)] font-medium">
                      {statusItem.current_status ? statusItem.current_status.replaceAll('_', ' ') : 'Unknown'}
                    </span>
                    <span className="text-[var(--color-textMuted)]">
                      {statusItem.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--color-surfaceMuted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-brand-600)] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ComponentCard>
      )}
    </div>
  );
};

export default Reports;
