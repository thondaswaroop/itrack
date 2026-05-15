// src/pages/shipments/Arrival.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import { Button } from "../../components";
import UIIcon from "../../utils/uiIcon";
import { shipmentService } from "../../services";
import { SHIPMENT_STAGES } from "../../constants/shipmentStatus";
import Badge from "../../components/ui/badge/Badge";

type ScannedPackage = {
  id: number;
  package_code: string;
  shipment_id: number;
  tracking_number?: string;
  wr_number?: string;
  shipper_name?: string;
  consignee_name?: string;
  origin_hub_name?: string;
  destination_hub_name?: string;
  current_hub_name?: string;
  previous_status?: string;
  new_status?: string;
  message?: string;
  status_updated?: boolean;
  scanned_at: Date;
};

const Arrival: React.FC = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedPackages, setScannedPackages] = useState<ScannedPackage[]>([]);

  // Helper to get status label
  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Unknown';
    const stage = SHIPMENT_STAGES.find(s => s.key === status);
    return stage?.label || status;
  };

  // Auto-focus on input
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const scanPackage = async () => {
    if (!scanInput.trim()) return;

    setScanError(null);
    setLoading(true);

    try {
      const response = await shipmentService.scanPackageAtHub(scanInput.trim());
      
      if (!response.packages || response.packages.length === 0) {
        setScanError('No packages found for this code');
        setLoading(false);
        return;
      }

      // Get the first package
      const packageData = response.packages[0];

      // Check if already scanned in this session
      if (scannedPackages.some(p => p.id === packageData.id)) {
        setScanError('Package already scanned in this session');
        setLoading(false);
        return;
      }

      // Add to scanned packages list
      const newPackage: ScannedPackage = {
        id: packageData.id,
        package_code: packageData.package_code,
        shipment_id: packageData.shipment_id,
        tracking_number: response.shipment?.tracking_number,
        wr_number: response.shipment?.wr_number,
        shipper_name: response.shipment?.shipper_name,
        consignee_name: response.shipment?.consignee_name,
        origin_hub_name: response.shipment?.origin_hub_name,
        destination_hub_name: response.shipment?.destination_hub_name,
        current_hub_name: response.shipment?.current_hub_name,
        previous_status: response.shipment?.current_status as string,
        new_status: (response.new_status || response.shipment?.current_status) as string,
        message: response.message,
        status_updated: response.status_updated,
        scanned_at: new Date(),
      };

      setScannedPackages(prev => [newPackage, ...prev]);
      setScanInput('');
      
      // Success beep
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnk77RgGwU7k9n0yoQpBSh+zPLaizsKGGS56+mlUhELTKXh8bllHAU2jdXzzn0qBSl+zO/aiDkLF2S56Om');
      audio.play().catch(() => {});

    } catch (error: any) {
      setScanError(error.message || 'Failed to scan package');
    } finally {
      setLoading(false);
      // Refocus on input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      scanPackage();
    }
  };

  const getStatusBadgeColor = (status: string | undefined): "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" => {
    if (!status) return 'light';
    
    switch (status) {
      case 'RECEIVED': return 'light';
      case 'CONSOLIDATED': return 'primary';
      case 'READY_TO_SHIP': return 'info';
      case 'DISPATCHED': return 'warning';
      case 'IN_TRANSIT': return 'info';
      case 'ARRIVED': return 'success';
      case 'READY_FOR_PICKUP': return 'success';
      case 'OUT_FOR_DELIVERY': return 'info';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'light';
    }
  };

  const clearHistory = () => {
    setScannedPackages([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ComponentCard
        title="Transit & Arrival Tracking"
        right={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/newshipment')}>
              <UIIcon name="receipt" className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
            <Button variant="outline" onClick={() => navigate('/load')}>
              <UIIcon name="warehouse" className="h-4 w-4 mr-2" />
              Load Management
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <UIIcon name="info" className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Transit & Arrival Scanning</p>
                <p className="text-blue-700 mb-3">
                  Scan packages when they arrive at your hub during transit. This updates location tracking and shipment status as packages move from origin to destination hub.
                </p>
                <div className="bg-white border border-blue-200 rounded p-3 text-xs text-blue-800">
                  <p className="font-medium mb-1">📦 Required Workflow:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Package must be <strong>received</strong> at origin hub</li>
                    <li>Package must be <strong>consolidated</strong> (loaded in container/shelf)</li>
                    <li>Package must be <strong>dispatched</strong> from origin hub</li>
                    <li>Then it can be scanned at transit/destination hubs</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Scan Input */}
          <div className="space-y-3">
            <Label>Scan Package / Tracking Number / WR Number</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Scan barcode or enter code"
                  value={scanInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScanInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
              </div>
              <Button
                onClick={scanPackage}
                loading={loading}
                disabled={!scanInput.trim()}
              >
                <UIIcon name="scan" className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>

            {/* Error Message */}
            {scanError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <UIIcon name="warning" className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 mb-1">Cannot Scan Package</p>
                  <p className="text-sm text-red-800 whitespace-pre-wrap">{scanError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {scannedPackages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{scannedPackages.length}</div>
                <div className="text-sm text-gray-600">Total Scanned</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">
                  {scannedPackages.filter(p => p.status_updated).length}
                </div>
                <div className="text-sm text-green-600">Status Updated</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">
                  {scannedPackages.filter(p => !p.status_updated).length}
                </div>
                <div className="text-sm text-blue-600">Already Updated</div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Scanned Packages List */}
      {scannedPackages.length > 0 && (
        <ComponentCard
          title="Scanned Packages"
          right={
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <UIIcon name="delete" className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          }
        >
          <div className="space-y-3">
            {scannedPackages.map((pkg) => (
              <div
                key={`${pkg.id}-${pkg.scanned_at.getTime()}`}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${pkg.status_updated ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <div className="font-medium text-gray-900">{pkg.package_code}</div>
                      <div className="text-sm text-gray-500">
                        {pkg.tracking_number || pkg.wr_number}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {pkg.scanned_at.toLocaleTimeString()}
                  </div>
                </div>

                {/* Status Change */}
                {pkg.status_updated ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <UIIcon name="check" className="h-4 w-4 text-green-600" />
                      <span className="text-green-900 font-medium">Status Updated</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Badge color={getStatusBadgeColor(pkg.previous_status)}>
                        {getStatusLabel(pkg.previous_status)}
                      </Badge>
                      <UIIcon name="right" className="h-4 w-4 text-gray-400" />
                      <Badge color={getStatusBadgeColor(pkg.new_status)}>
                        {getStatusLabel(pkg.new_status)}
                      </Badge>
                    </div>
                    {pkg.message && (
                      <p className="text-xs text-green-700 mt-2">{pkg.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UIIcon name="info" className="h-4 w-4" />
                      <span>Package already processed - no status change needed</span>
                    </div>
                  </div>
                )}

                {/* Package Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Shipper</div>
                    <div className="text-gray-900 font-medium">{pkg.shipper_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Consignee</div>
                    <div className="text-gray-900 font-medium">{pkg.consignee_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Origin</div>
                    <div className="text-gray-900">{pkg.origin_hub_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Destination</div>
                    <div className="text-gray-900">{pkg.destination_hub_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Current Location</div>
                    <div className="text-gray-900 font-medium">{pkg.current_hub_name || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

      {/* Empty State */}
      {scannedPackages.length === 0 && (
        <ComponentCard title="">
          <div className="text-center py-12">
            <UIIcon name="scan" className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Packages Scanned</h3>
            <p className="text-gray-500 mb-6">
              Start scanning incoming packages to update their arrival status
            </p>
          </div>
        </ComponentCard>
      )}
    </div>
  );
};

export default Arrival;
