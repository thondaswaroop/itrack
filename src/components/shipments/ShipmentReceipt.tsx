// src/components/shipments/ShipmentReceipt.tsx
import React from 'react';
import { Button } from '../';

interface Package {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  description: string;
  declared_value?: number;
  quantity?: number;
}

interface ShipmentReceiptProps {
  wrNumber: string;
  receivedDate: string;
  originHub: string;
  destinationHub: string;
  shipperName: string;
  shipperPhone: string;
  shipperAddress?: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress?: string;
  packages: Package[];
  transportMode: string;
  paymentType: string;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  currency?: string;
  notes?: string;
  onClose?: () => void;
}

export const ShipmentReceipt: React.FC<ShipmentReceiptProps> = ({
  wrNumber,
  receivedDate,
  originHub,
  destinationHub,
  shipperName,
  shipperPhone,
  shipperAddress,
  consigneeName,
  consigneePhone,
  consigneeAddress,
  packages,
  transportMode,
  paymentType,
  totalAmount = 0,
  paidAmount = 0,
  pendingAmount = 0,
  currency = 'USD',
  notes,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalWeight = packages.reduce((sum, pkg) => sum + (pkg.weight || 0), 0);
  const totalPieces = packages.reduce((sum, pkg) => sum + (pkg.quantity || 1), 0);

  return (
    <div className="receipt-container fixed inset-0 z-[99999] overflow-y-auto bg-black/70 print:bg-white print:relative print:z-auto">
      <div className="min-h-screen flex items-start justify-center py-6 print:p-0 print:block">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl print:shadow-none print:max-w-full print:rounded-none my-4">
          {/* No-Print Controls */}
          <div className="flex justify-between items-center gap-3 px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-orange-400 rounded-t-xl print:hidden">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Shipment Receipt</h2>
              <p className="text-xs text-gray-500 mt-0.5">Document for tracking and reference</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>✕ Close</Button>
              <Button onClick={handlePrint} leadingIcon={<span>🖨️</span>}>Print Receipt</Button>
            </div>
          </div>

          {/* Printable Receipt */}
          <div className="p-8 print:p-6">
            {/* Header */}
            <div className="border-b-2 border-gray-900 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">MPJ LOGISTICS</h1>
                  <p className="text-sm text-gray-600">International Freight & Cargo Services</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shipment Receipt</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(receivedDate)}</p>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            <div className="mb-6 bg-gray-50 border border-gray-300 p-6">
              <div className="text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-semibold">Tracking Number / WR Number</p>
                <p className="text-3xl font-bold text-gray-900 font-mono tracking-wider">{wrNumber}</p>
                <p className="text-xs text-gray-500 mt-2">Use this number to track your shipment</p>
              </div>
            </div>

            {/* Route Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-300 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</p>
                <p className="text-base font-semibold text-gray-900">{originHub}</p>
              </div>
              <div className="border border-gray-300 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">To</p>
                <p className="text-base font-semibold text-gray-900">{destinationHub}</p>
              </div>
            </div>

          {/* Shipper & Consignee Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-300 p-4">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">Shipper</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{shipperName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-700">{shipperPhone}</p>
                </div>
                {shipperAddress && (
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-gray-700">{shipperAddress}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-300 p-4">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">Consignee</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{consigneeName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-700">{consigneePhone}</p>
                </div>
                {consigneeAddress && (
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-gray-700">{consigneeAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Package Details</h3>
            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Weight (kg)</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Dimensions</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Value ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {packages.map((pkg, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                      <td className="px-3 py-2 text-gray-900">{pkg.description || '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{pkg.weight.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {pkg.length && pkg.width && pkg.height 
                          ? `${pkg.length} × ${pkg.width} × ${pkg.height}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900">{pkg.quantity || 1}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{(pkg.declared_value || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 font-semibold text-gray-900">Total</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{totalPieces} piece(s)</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Shipment & Payment Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-300 p-4">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">Shipment Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transport Mode:</span>
                  <span className="font-semibold text-gray-900">{transportMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Type:</span>
                  <span className="font-semibold text-gray-900 capitalize">{paymentType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 p-4">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-semibold text-gray-900">{currency} {totalAmount.toFixed(2)}</span>
                </div>
                {paymentType !== 'collect' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid Amount:</span>
                    <span className="font-semibold text-gray-900">{currency} {paidAmount.toFixed(2)}</span>
                  </div>
                )}
                {pendingAmount > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-900 font-semibold">Pending:</span>
                    <span className="font-semibold text-gray-900">{currency} {pendingAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="mb-6 border border-gray-300 p-4">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Remarks</h3>
              <p className="text-sm text-gray-700">{notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-900">
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Customer Signature</p>
                <div className="border-b border-gray-400 h-16"></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Authorized Signature</p>
                <div className="border-b border-gray-400 h-16"></div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 p-4 text-center">
              <p className="text-sm text-gray-900 mb-1">Please retain this receipt for tracking and reference</p>
              <p className="text-xs text-gray-600">For queries: <span className="font-semibold">support@mpjlogistics.com</span> | <span className="font-semibold">+1 800 MPJ TRACK</span></p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          
          body > *:not(.receipt-container) {
            display: none !important;
          }
          
          .receipt-container {
            position: static !important;
            background: white !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .receipt-container * {
            visibility: visible !important;
          }
          
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  );
};

export default ShipmentReceipt;