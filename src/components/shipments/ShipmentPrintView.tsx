// ShipmentPrintView - Reusable component for displaying and printing shipment details
import React from 'react';
import ShipmentStageProgress from './ShipmentStageProgress';

interface Package {
  id: number;
  package_code: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  description?: string;
  quantity?: number;
  declared_value?: number;
  status: string;
  container_code?: string;
  shelf_code?: string;
}

interface ShipmentPrintViewProps {
  shipment: any;
  packages?: Package[];
  showBarcode?: boolean;
  showProgress?: boolean;
  onPrint?: () => void;
}

export const ShipmentPrintView: React.FC<ShipmentPrintViewProps> = ({
  shipment,
  packages = [],
  showBarcode = true,
  showProgress = true,
  onPrint
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 print:shadow-none print:border-0">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h2 className="text-xl font-bold text-gray-900">Shipment Details</h2>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Shipment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode - MOVED TO TOP */}
          {showBarcode && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-xs text-gray-500 mb-3 text-center font-semibold">SCAN TO TRACK</div>
              <div className="bg-white p-4 rounded text-center">
                <svg className="mx-auto" width="180" height="80">
                  {/* Barcode visualization */}
                  {[...Array(15)].map((_, i) => {
                    const width = [3, 2, 5, 2, 3, 4, 2, 5, 3, 2, 4, 3, 2, 5, 3][i];
                    const x = i * 12;
                    return (
                      <rect key={i} x={x} y="0" width={width} height="60" fill="#000" />
                    );
                  })}
                </svg>
                <div className="text-sm font-mono font-bold mt-2">{shipment.wr_number}</div>
                <div className="text-xs text-gray-500 mt-1">{shipment.tracking_number}</div>
              </div>
            </div>
          )}

          {/* Tracking Info */}
          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">WR Number</div>
                <div className="text-lg font-bold text-gray-900">{shipment.wr_number}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tracking Number</div>
                <div className="text-lg font-bold text-gray-900">{shipment.tracking_number}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Current Status</div>
                <div className="text-sm font-semibold text-blue-600">{shipment.current_status}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Transport Mode</div>
                <div className="text-sm font-semibold text-gray-900">{shipment.transport_mode || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Shipper & Consignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">SHIPPER</div>
              <div className="font-bold text-gray-900">{shipment.shipper_name}</div>
              <div className="text-sm text-gray-600 mt-1">{shipment.shipper_phone}</div>
              <div className="text-sm text-gray-600">{shipment.shipper_email}</div>
              <div className="text-xs text-gray-500 mt-2">{shipment.shipper_address}</div>
              <div className="text-xs text-gray-500">{shipment.shipper_city}, {shipment.shipper_country}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">CONSIGNEE</div>
              <div className="font-bold text-gray-900">{shipment.consignee_name}</div>
              <div className="text-sm text-gray-600 mt-1">{shipment.consignee_phone}</div>
              <div className="text-sm text-gray-600">{shipment.consignee_email}</div>
              <div className="text-xs text-gray-500 mt-2">{shipment.consignee_address}</div>
              <div className="text-xs text-gray-500">{shipment.consignee_city}, {shipment.consignee_country}</div>
            </div>
          </div>

          {/* Route Info */}
          <div className="border rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-3">ROUTE</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500">Origin Hub</div>
                <div className="font-semibold text-gray-900">{shipment.origin_hub_name || 'N/A'}</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Current Hub</div>
                <div className="font-semibold text-gray-900">{shipment.current_hub_name || 'N/A'}</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Destination Hub</div>
                <div className="font-semibold text-gray-900">{shipment.destination_hub_name || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          {packages && packages.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-3">PACKAGES ({packages.length})</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Code</th>
                      <th className="px-2 py-2 text-left">Description</th>
                      <th className="px-2 py-2 text-left">Weight</th>
                      <th className="px-2 py-2 text-left">Dimensions</th>
                      <th className="px-2 py-2 text-left">Qty</th>
                      <th className="px-2 py-2 text-left">Value</th>
                      <th className="px-2 py-2 text-left">Container</th>
                      <th className="px-2 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {packages.map((pkg, idx) => (
                      <tr key={pkg.id}>
                        <td className="px-2 py-2">{idx + 1}</td>
                        <td className="px-2 py-2 font-medium">{pkg.package_code}</td>
                        <td className="px-2 py-2">{pkg.description || '-'}</td>
                        <td className="px-2 py-2">{pkg.weight ? `${pkg.weight}kg` : '-'}</td>
                        <td className="px-2 py-2">{pkg.length ? `${pkg.length}×${pkg.width}×${pkg.height}` : '-'}</td>
                        <td className="px-2 py-2">{pkg.quantity || 1}</td>
                        <td className="px-2 py-2">${pkg.declared_value || 0}</td>
                        <td className="px-2 py-2">{pkg.container_code || '-'}</td>
                        <td className="px-2 py-2">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                            {pkg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="border rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-3">PAYMENT</div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500">Payment Type</div>
                <div className="font-semibold text-gray-900">{shipment.payment_type?.toUpperCase() || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Amount</div>
                <div className="font-semibold text-gray-900">{shipment.currency} {shipment.total_amount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Paid Amount</div>
                <div className="font-semibold text-green-600">{shipment.currency} {shipment.paid_amount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Pending Amount</div>
                <div className="font-semibold text-orange-600">{shipment.currency} {shipment.pending_amount || 0}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {shipment.notes && (
            <div className="border rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">NOTES</div>
              <div className="text-sm text-gray-700">{shipment.notes}</div>
            </div>
          )}
        </div>

        {/* Right Column - Progress & Timestamps */}
        <div className="space-y-6">
          {/* Shipment Progress */}
          {showProgress && (
            <div className="border rounded-lg p-6">
              <div className="text-xs text-gray-500 mb-4 text-center">SHIPMENT PROGRESS</div>
              <ShipmentStageProgress currentStatus={shipment.current_status} size={200} />
            </div>
          )}

          {/* Timestamps */}
          <div className="border rounded-lg p-4 text-xs">
            <div className="text-gray-500 mb-3">TIMELINE</div>
            <div className="space-y-2">
              {shipment.received_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Received:</span>
                  <span className="font-medium">{new Date(shipment.received_at).toLocaleDateString()}</span>
                </div>
              )}
              {shipment.consolidated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Consolidated:</span>
                  <span className="font-medium">{new Date(shipment.consolidated_at).toLocaleDateString()}</span>
                </div>
              )}
              {shipment.dispatched_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dispatched:</span>
                  <span className="font-medium">{new Date(shipment.dispatched_at).toLocaleDateString()}</span>
                </div>
              )}
              {shipment.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivered:</span>
                  <span className="font-medium">{new Date(shipment.delivered_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-8 pt-4 border-t text-xs text-gray-500 text-center">
        <p>Printed on {new Date().toLocaleString()}</p>
        <p className="mt-1">For inquiries, contact support@itrack.com</p>
      </div>
    </div>
  );
};

export default ShipmentPrintView;
