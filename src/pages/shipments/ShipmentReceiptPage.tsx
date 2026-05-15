// src/pages/shipments/ShipmentReceiptPage.tsx
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { type ShipmentStatus } from '../../constants/shipmentStatus';
import { Button } from '../../components';

interface Package {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  description: string;
  declared_value?: number;
  quantity?: number;
}

interface ReceiptData {
  wrNumber: string;
  trackingNumber?: string;
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
  status?: ShipmentStatus;
}

const ShipmentReceiptPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const receiptData = location.state as ReceiptData;
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Redirect if no data
  if (!receiptData) {
    React.useEffect(() => {
      navigate('/home');
    }, [navigate]);
    return null;
  }

  const {
    wrNumber,
    trackingNumber,
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
    totalAmount: rawTotalAmount = 0,
    paidAmount: rawPaidAmount = 0,
    pendingAmount: rawPendingAmount = 0,
    currency = 'USD',
    notes
  } = receiptData;

  const totalAmount = Number(rawTotalAmount || 0);
  const paidAmount = Number(rawPaidAmount || 0);
  const pendingAmount = Number(rawPendingAmount || 0);

  // Generate barcode
  useEffect(() => {
    if (barcodeRef.current && wrNumber) {
      try {
        JsBarcode(barcodeRef.current, wrNumber, {
          format: 'CODE128',
          width: 1,
          height: 40,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error('Failed to generate barcode:', err);
      }
    }
  }, [wrNumber]);

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

  const totalWeight = packages.reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0);
  const totalPieces = packages.reduce((sum, pkg) => sum + Number(pkg.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* No-Print Controls */}
      <div className="bg-white border-b shadow-sm print:hidden sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Shipment Receipt</h1>
            <p className="text-sm text-gray-500">Document for tracking and reference</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/home')}>
              ← Back to Dashboard
            </Button>
            <Button onClick={handlePrint} leadingIcon={<span>🖨️</span>}>
              Print Receipt
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Content */}
      <div className="max-w-5xl mx-auto p-6 print:p-0">
        <div className="bg-white shadow-lg print:shadow-none">
          <div className="p-8 print:p-4">
            {/* Header */}
            <div className="border-b-2 border-gray-900 pb-4 mb-4 print:pb-3 print:mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1 print:text-2xl">MPJ LOGISTICS</h1>
                  <p className="text-sm text-gray-600 print:text-xs">International Freight & Cargo Services</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shipment Receipt</p>
                  <p className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(receivedDate)}</p>
                </div>
              </div>
            </div>

            {/* Route Information & Tracking Barcode - Two Column Layout */}
            <div className="grid grid-cols-5 gap-4 mb-4 print:gap-3 print:mb-3">
              {/* Left: Route & Shipment Details (3/5 width) */}
              <div className="col-span-3 space-y-3 print:space-y-2">
                {/* Route Information */}
                <div className="grid grid-cols-2 gap-3 print:gap-2">
                  <div className="border border-gray-300 p-3 print:p-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</p>
                    <p className="text-base font-semibold text-gray-900 print:text-sm">{originHub}</p>
                  </div>
                  <div className="border border-gray-300 p-3 print:p-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">To</p>
                    <p className="text-base font-semibold text-gray-900 print:text-sm">{destinationHub}</p>
                  </div>
                </div>

                {/* Shipment Meta Info */}
                <div className="border border-gray-300 p-3 print:p-2">
                  <div className="grid grid-cols-2 gap-3 print:gap-2 text-sm print:text-xs">
                    <div>
                      <p className="text-xs text-gray-500 print:text-[10px]">Transport Mode</p>
                      <p className="font-semibold text-gray-900">{transportMode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 print:text-[10px]">Payment Type</p>
                      <p className="font-semibold text-gray-900 capitalize">{paymentType.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Barcode & Tracking Number (2/5 width) */}
              <div className="col-span-2 bg-gray-50 border border-gray-300 p-3 print:p-2 flex flex-col justify-center overflow-hidden">
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-semibold print:mb-1 print:text-[10px]">Tracking Number</p>
                  
                  {/* Barcode */}
                  <div className="bg-white border border-gray-300 p-1.5 print:p-1 inline-block mb-2 print:mb-1 max-w-full">
                    <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
                  </div>
                  
                  <p className="text-xl font-bold text-gray-900 font-mono tracking-wider print:text-base">{wrNumber}</p>
                  {trackingNumber && trackingNumber !== wrNumber && (
                    <p className="text-xs text-gray-600 mt-1 print:text-[10px] print:mt-0.5">Ref: {trackingNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipper & Consignee Information */}
            <div className="grid grid-cols-2 gap-4 mb-4 print:gap-3 print:mb-3">
              <div className="border border-gray-300 p-3 print:p-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b print:mb-1">Shipper</h3>
                <div className="space-y-1.5 text-sm print:text-xs">
                  <div>
                    <p className="text-xs text-gray-500 print:text-[10px]">Name</p>
                    <p className="font-semibold text-gray-900">{shipperName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 print:text-[10px]">Phone</p>
                    <p className="text-gray-700">{shipperPhone}</p>
                  </div>
                  {shipperAddress && (
                    <div>
                      <p className="text-xs text-gray-500 print:text-[10px]">Address</p>
                      <p className="text-gray-700">{shipperAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-300 p-3 print:p-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b print:mb-1">Consignee</h3>
                <div className="space-y-1.5 text-sm print:text-xs">
                  <div>
                    <p className="text-xs text-gray-500 print:text-[10px]">Name</p>
                    <p className="font-semibold text-gray-900">{consigneeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 print:text-[10px]">Phone</p>
                    <p className="text-gray-700">{consigneePhone}</p>
                  </div>
                  {consigneeAddress && (
                    <div>
                      <p className="text-xs text-gray-500 print:text-[10px]">Address</p>
                      <p className="text-gray-700">{consigneeAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="mb-4 print:mb-3">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 print:mb-1">Package Details</h3>
              <div className="overflow-x-auto border border-gray-300">
                <table className="w-full text-sm print:text-xs">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-2 py-1.5 print:px-1.5 print:py-1 text-left text-xs font-semibold text-gray-900">#</th>
                      <th className="px-2 py-1.5 print:px-1.5 print:py-1 text-left text-xs font-semibold text-gray-900">Description</th>
                      <th className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-xs font-semibold text-gray-900">Weight (kg)</th>
                      <th className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-xs font-semibold text-gray-900">Dimensions</th>
                      <th className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-xs font-semibold text-gray-900">Qty</th>
                      <th className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-xs font-semibold text-gray-900">Value ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {packages.map((pkg, index) => (
                      <tr key={index}>
                        <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-gray-600">{index + 1}</td>
                        <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-gray-900">{pkg.description || '—'}</td>
                        <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-gray-900">{Number(pkg.weight || 0).toFixed(2)}</td>
                        <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-gray-700">
                          {pkg.length && pkg.width && pkg.height
                            ? `${pkg.length}×${pkg.width}×${pkg.height}`
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-gray-900">{pkg.quantity || 1}</td>
                        <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-right text-gray-900">{Number(pkg.declared_value || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                    <tr>
                      <td colSpan={2} className="px-2 py-1.5 print:px-1.5 print:py-1 font-semibold text-gray-900">Total</td>
                      <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-right font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</td>
                      <td className="px-2 py-1.5 print:px-1.5 print:py-1 text-right font-semibold text-gray-900">{totalPieces} piece(s)</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border border-gray-300 p-3 print:p-2 mb-4 print:mb-3">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b print:mb-1">Payment Details</h3>
              <div className="grid grid-cols-3 gap-4 print:gap-3 text-sm print:text-xs">
                <div>
                  <p className="text-xs text-gray-500 print:text-[10px]">Total Amount</p>
                  <p className="font-semibold text-gray-900 text-base print:text-sm">{currency} {totalAmount.toFixed(2)}</p>
                </div>
                {paymentType !== 'collect' && (
                  <div>
                    <p className="text-xs text-gray-500 print:text-[10px]">Paid Amount</p>
                    <p className="font-semibold text-gray-900 text-base print:text-sm">{currency} {paidAmount.toFixed(2)}</p>
                  </div>
                )}
                {pendingAmount > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 print:text-[10px]">Pending Amount</p>
                    <p className="font-semibold text-red-600 text-base print:text-sm">{currency} {pendingAmount.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="mb-4 print:mb-3 border border-gray-300 p-3 print:p-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1">Remarks</h3>
                <p className="text-sm text-gray-700 print:text-xs">{notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 print:mt-4 print:pt-3 border-t-2 border-gray-900">
              <div className="grid grid-cols-2 gap-6 mb-4 print:gap-4 print:mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 print:mb-1">Customer Signature</p>
                  <div className="border-b border-gray-400 h-12 print:h-10"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 print:mb-1">Authorized Signature</p>
                  <div className="border-b border-gray-400 h-12 print:h-10"></div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 p-3 print:p-2 text-center">
                <p className="text-sm text-gray-900 mb-1 print:text-xs print:mb-0.5">Please retain this receipt for tracking and reference</p>
                <p className="text-xs text-gray-600 print:text-[10px]">For queries: <span className="font-semibold">support@mpjlogistics.com</span> | <span className="font-semibold">+1 800 MPJ TRACK</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            font-size: 11pt;
          }
          
          @page {
            margin: 0.5cm 0.75cm;
            size: A4 portrait;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          /* Force page breaks to avoid */
          table {
            page-break-inside: avoid;
          }
          
          .border-gray-300 {
            border-color: #d1d5db !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ShipmentReceiptPage;
