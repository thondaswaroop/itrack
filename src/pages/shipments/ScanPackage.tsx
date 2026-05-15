// src/pages/scan/ScanPackage.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import JsBarcode from 'jsbarcode';
import Icon from "../../utils/icons";
import UIIcon from "../../utils/uiIcon";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/Input";
import { Button, Select } from "../../components";
import ComponentCard from "../../components/common/ComponentCard";
import { shipmentService, masterService, type Hub, type Container, type Shelf } from "../../services";
import ShipmentStageProgress from "../../components/shipments/ShipmentStageProgress";
import { type ShipmentStatus } from "../../constants/shipmentStatus";
import { getUser } from "../../utils/auth";

/* ----------------------------
   Types
---------------------------- */

type Package = {
  id: number;
  shipment_id: number;
  package_code: string;
  status: ShipmentStatus;
  shipper_name?: string;
  consignee_name?: string;
  origin_hub_name?: string;
  destination_hub_name?: string;
  container_code?: string | null;
  shelf_code?: string | null;
  transport_mode?: string | null;
  current_hub_name?: string | null;
  weight?: number;
  description?: string;
  quantity?: number;
  declared_value?: number;
  container_id?: number | null;
  shelf_id?: number | null;
};



/* ----------------------------
   ScanPackage Page - Dynamic API Integration
---------------------------- */
const ScanPackage: React.FC = () => {
  // const navigate = useNavigate();
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [q, setQ] = useState("");
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Dynamic data
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  // Use the logged-in user's hub — container/shelf assignment is always at the scanner's hub.
  const loggedInHubId = useMemo(() => {
    const u = getUser();
    return u?.hubId ? Number(u.hubId) : null;
  }, []);
  const [currentHubId, setCurrentHubId] = useState<number | null>(loggedInHubId);

  // step fields
  const [container, setContainer] = useState("");
  const [shelf, setShelf] = useState("");
  
  // Transport-specific fields
  const [vehicleId, setVehicleId] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [vesselNumber, setVesselNumber] = useState("");
  const [carrierName, setCarrierName] = useState("");
  
  // Container packages list
  const [containerPackages, setContainerPackages] = useState<any[]>([]);
  const [loadingContainerPackages, setLoadingContainerPackages] = useState(false);

  // Load hubs on mount
  useEffect(() => {
    const loadHubs = async () => {
      try {
        const hubsData = await masterService.getHubs();
        setHubs(hubsData);
      } catch (err) {
        console.error('Error loading hubs:', err);
      }
    };
    loadHubs();
  }, []);

  // Load containers and shelves when hub changes
  useEffect(() => {
    if (!currentHubId) return;
    
    const loadWarehouseData = async () => {
      try {
        const [containersData, shelvesData] = await Promise.all([
          masterService.getContainers(currentHubId),
          masterService.getShelves(currentHubId),
        ]);
        setContainers(containersData);
        setShelves(shelvesData);
      } catch (err) {
        console.error('Error loading warehouse data:', err);
      }
    };
    loadWarehouseData();
  }, [currentHubId]);

  // Load packages in selected container
  useEffect(() => {
    if (!container) {
      setContainerPackages([]);
      return;
    }
    
    const loadContainerPackages = async () => {
      setLoadingContainerPackages(true);
      try {
        const packages = await shipmentService.getPackagesByContainer(Number(container));
        setContainerPackages(packages);
      } catch (err) {
        console.error('Error loading container packages:', err);
        setContainerPackages([]);
      } finally {
        setLoadingContainerPackages(false);
      }
    };
    
    loadContainerPackages();
  }, [container]);

  // Generate barcode when shipment data is loaded
  useEffect(() => {
    if (barcodeRef.current && shipmentData) {
      const barcodeValue = shipmentData.tracking_number || shipmentData.wr_number;
      if (barcodeValue) {
        try {
          JsBarcode(barcodeRef.current, barcodeValue, {
            format: 'CODE128',
            width: 1.5,
            height: 50,
            displayValue: false,
            margin: 0,
          });
        } catch (err) {
          console.error('Failed to generate barcode:', err);
        }
      }
    }
  }, [shipmentData]);

  const containerOptions = useMemo(
    () => containers.map(c => ({ value: c.id.toString(), label: `${c.container_code} (${c.container_type})` })),
    [containers]
  );

  const shelfOptions = useMemo(
    () => shelves.map(s => ({ value: s.id.toString(), label: `${s.shelf_code}${s.aisle ? ` - Aisle ${s.aisle}` : ''}` })),
    [shelves]
  );

  const load = async (id: string) => {
    setErr(null);
    setLoading(true);
    setShipmentData(null);
    setPackages([]);
    setSelectedPackage(null);
    try {
      const response = await shipmentService.scanPackageAtHub(id);
      
      // Show message if status was automatically updated
      if (response.status_updated && response.message) {
        alert(`✓ ${response.message}`);
      }
      
      setShipmentData(response.shipment);
      const pkgs = (response.packages || []).map(p => ({
        id: p.id,
        shipment_id: p.shipment_id,
        package_code: p.package_code,
        status: (p.status || "RECEIVED") as ShipmentStatus,
        shipper_name: response.shipment?.shipper_name,
        consignee_name: response.shipment?.consignee_name,
        origin_hub_name: response.shipment?.origin_hub_name,
        destination_hub_name: response.shipment?.destination_hub_name,
        container_code: p.container_code,
        shelf_code: p.shelf_code,
        transport_mode: response.shipment?.transport_mode,
        current_hub_name: response.shipment?.current_hub_name,
        weight: p.weight,
        description: p.description,
        quantity: p.quantity,
        declared_value: p.declared_value,
        container_id: p.container_id,
        shelf_id: p.shelf_id,
      }));
      setPackages(pkgs);
      if (response.scanned_package) {
        const pkg = {
          id: response.scanned_package.id,
          shipment_id: response.scanned_package.shipment_id,
          package_code: response.scanned_package.package_code,
          status: (response.scanned_package.status || "RECEIVED") as ShipmentStatus,
          shipper_name: response.shipment?.shipper_name,
          consignee_name: response.shipment?.consignee_name,
          origin_hub_name: response.shipment?.origin_hub_name,
          destination_hub_name: response.shipment?.destination_hub_name,
          container_code: response.scanned_package.container_code,
          shelf_code: response.scanned_package.shelf_code,
          transport_mode: response.shipment?.transport_mode,
          current_hub_name: response.shipment?.current_hub_name,
          weight: response.scanned_package.weight,
          description: response.scanned_package.description,
          quantity: response.scanned_package.quantity,
          declared_value: response.scanned_package.declared_value,
          container_id: response.scanned_package.container_id,
          shelf_id: response.scanned_package.shelf_id,
        };
        setSelectedPackage(pkg);
      } else if (pkgs.length > 0) {
        setSelectedPackage(pkgs[0]);
      }
      setContainer("");
      setShelf("");
      // Reset transport-specific fields
      setVehicleId("");
      setFlightNumber("");
      setAirline("");
      setVesselName("");
      setVesselNumber("");
      setCarrierName("");
    } catch (e: any) {
      setErr(e.message || "Package/Shipment not found");
    } finally {
      setLoading(false);
    }
  };

  const doAdvance = async (nextStatus: ShipmentStatus, note?: string) => {
    if (!selectedPackage || !shipmentData) return;
    
    setSaving(true);
    try {
      switch (nextStatus) {
        case "CONSOLIDATED":
          if (!container) {
            alert("Please select a container");
            setSaving(false);
            return;
          }
          await shipmentService.consolidatePackage({
            package_id: selectedPackage.id,
            container_id: Number(container),
            shelf_id: shelf ? Number(shelf) : undefined,
          });
          break;
        
        case "READY_TO_SHIP":
          // Mark shipment as ready for dispatch (Air/Ocean)
          await shipmentService.updateShipmentStatus(
            shipmentData.id,
            nextStatus,
            currentHubId || undefined,
            note || `Marked as ready to ship`
          );
          break;
        
        case "DISPATCHED":
          // Different handling based on transport mode
          const transportInfo: any = {};
          
          if (shipmentData.transport_mode === 'GROUND') {
            if (!vehicleId) {
              alert("Please enter Vehicle ID for ground transport");
              setSaving(false);
              return;
            }
            transportInfo.vehicle_id = vehicleId;
          } else if (shipmentData.transport_mode === 'AIR') {
            if (!flightNumber || !airline) {
              alert("Please enter Flight Number and Airline for air transport");
              setSaving(false);
              return;
            }
            transportInfo.flight_number = flightNumber;
            transportInfo.airline = airline;
          } else if (shipmentData.transport_mode === 'OCEAN') {
            if (!vesselName || !vesselNumber) {
              alert("Please enter Vessel Name and Number for ocean transport");
              setSaving(false);
              return;
            }
            transportInfo.vessel_name = vesselName;
            transportInfo.vessel_number = vesselNumber;
            if (carrierName) {
              transportInfo.carrier_name = carrierName;
            }
          }
          
          await shipmentService.updateShipmentStatus(
            shipmentData.id,
            nextStatus,
            currentHubId || undefined,
            note || `Dispatched`,
            transportInfo
          );
          break;
        
        case "IN_TRANSIT":
        case "ARRIVED":
        case "READY_FOR_PICKUP":
        case "COLLECTED":
          await shipmentService.updateShipmentStatus(
            shipmentData.id,
            nextStatus,
            currentHubId || undefined,
            note || `Moved to ${nextStatus}`
          );
          break;
      }

      // Reload the package data
      await load(q);
      alert(`Package moved to ${nextStatus} successfully!`);
    } catch (e: any) {
      alert("Error: " + (e.message || "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  // UI for step controls
  function RenderStepControls() {
    if (!selectedPackage || !shipmentData) return null;
    const status = shipmentData.current_status as ShipmentStatus;
    
    switch (status) {
      case "RECEIVED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Assign container & shelf to move to Consolidation</div>
            {!loggedInHubId && (
              <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-2 text-xs text-yellow-800 dark:text-yellow-200">
                Your account isn't assigned to a hub. Container/shelf selection is unavailable.
              </div>
            )}
            <div className="grid gap-2 mt-2">
              <Select
                options={containerOptions}
                value={container}
                onChange={setContainer}
                placeholder={loggedInHubId ? (containerOptions.length ? "Select container" : "No containers available at your hub") : "No hub assigned"}
                disabled={!loggedInHubId || containerOptions.length === 0}
                searchable
              />
              <Select
                options={shelfOptions}
                value={shelf}
                onChange={setShelf}
                placeholder={loggedInHubId ? (shelfOptions.length ? "Select shelf (optional)" : "No shelves available at your hub") : "No hub assigned"}
                disabled={!loggedInHubId || shelfOptions.length === 0}
                searchable
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { setContainer(""); setShelf(""); }} loading={saving}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("CONSOLIDATED", "Assigned container & moved to consolidation")} loading={saving}>Move to Consolidation</Button>
            </div>
          </>
        );

      case "CONSOLIDATED":
        const transportMode = shipmentData.transport_mode;
        const isAirOrOcean = transportMode === 'AIR' || transportMode === 'OCEAN';
        
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">
              {isAirOrOcean 
                ? `Mark as ready to ship (${transportMode}). Scanning process required before dispatch.`
                : 'Assign vehicle and dispatch (GROUND transport)'}
            </div>
            
            {!isAirOrOcean && (
              <div className="grid gap-2 mt-2">
                <Input 
                  value={vehicleId} 
                  onValueChange={setVehicleId} 
                  placeholder="Vehicle / Truck ID" 
                />
                <Select 
                  options={hubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))} 
                  value={currentHubId?.toString() || ""} 
                  onChange={(v) => setCurrentHubId(v ? Number(v) : null)} 
                  placeholder="Current location" 
                  searchable 
                />
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { setVehicleId(""); }} loading={saving}>Reset</Button>
              {isAirOrOcean ? (
                <Button 
                  tone="primary" 
                  onClick={() => doAdvance("READY_TO_SHIP", `Marked as ready to ship via ${transportMode}`)} 
                  loading={saving}
                >
                  Mark Ready to Ship
                </Button>
              ) : (
                <Button 
                  tone="primary" 
                  onClick={() => doAdvance("DISPATCHED", "Assigned vehicle and dispatched")} 
                  loading={saving}
                >
                  Dispatch Now
                </Button>
              )}
            </div>
          </>
        );
      
      case "READY_TO_SHIP":
        const mode = shipmentData.transport_mode;
        
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)] mb-2">
              Enter {mode} transport details to dispatch
            </div>
            
            {mode === 'AIR' && (
              <div className="grid gap-2 mt-2">
                <Input 
                  value={flightNumber} 
                  onValueChange={setFlightNumber} 
                  placeholder="Flight Number (e.g., EK524)" 
                />
                <Input 
                  value={airline} 
                  onValueChange={setAirline} 
                  placeholder="Airline Name (e.g., Emirates)" 
                />
              </div>
            )}
            
            {mode === 'OCEAN' && (
              <div className="grid gap-2 mt-2">
                <Input 
                  value={vesselName} 
                  onValueChange={setVesselName} 
                  placeholder="Vessel/Ship Name" 
                />
                <Input 
                  value={vesselNumber} 
                  onValueChange={setVesselNumber} 
                  placeholder="Container/Vessel Number" 
                />
                <Input 
                  value={carrierName} 
                  onValueChange={setCarrierName} 
                  placeholder="Shipping Line/Carrier (optional)" 
                />
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { 
                setFlightNumber(""); 
                setAirline(""); 
                setVesselName(""); 
                setVesselNumber(""); 
                setCarrierName(""); 
              }} loading={saving}>Reset</Button>
              <Button 
                tone="primary" 
                onClick={() => doAdvance("DISPATCHED", `Dispatched via ${mode}`)} 
                loading={saving}
              >
                Dispatch via {mode}
              </Button>
            </div>
          </>
        );

      case "DISPATCHED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Mark In Transit or update location</div>
            <div className="grid gap-2 mt-2">
              <Select 
                options={hubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))} 
                value={currentHubId?.toString() || ""} 
                onChange={(v) => setCurrentHubId(v ? Number(v) : null)} 
                placeholder="Current location / hub" 
                searchable 
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => {}} loading={saving}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("IN_TRANSIT", "Marked as In Transit")} loading={saving}>Mark In Transit</Button>
            </div>
          </>
        );

      case "IN_TRANSIT":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Update live location or mark Arrived at destination hub</div>
            <div className="grid gap-2 mt-2">
              <Select 
                options={hubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))} 
                value={currentHubId?.toString() || ""} 
                onChange={(v) => setCurrentHubId(v ? Number(v) : null)} 
                placeholder="Current location" 
                searchable 
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => {}} loading={saving}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("ARRIVED", "Arrived at destination hub")} loading={saving}>Mark Arrived</Button>
            </div>
          </>
        );

      case "ARRIVED":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Mark package ready for pickup</div>
            <div className="grid gap-2 mt-2">
              <Select 
                options={shelfOptions} 
                value={shelf} 
                onChange={setShelf} 
                placeholder="Destination shelf / location (optional)" 
                searchable 
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setShelf("")} loading={saving}>Reset</Button>
              <Button tone="primary" onClick={() => doAdvance("READY_FOR_PICKUP", "Marked ready for pickup")} loading={saving}>Ready for Pickup</Button>
            </div>
          </>
        );

      case "READY_FOR_PICKUP":
        return (
          <>
            <div className="text-sm text-[var(--color-textMuted)]">Package ready. Confirm pickup to complete.</div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => { /* hold */ }} loading={saving}>Hold</Button>
              <Button tone="primary" onClick={() => doAdvance("COLLECTED", "Package collected")} loading={saving}>Mark Collected</Button>
            </div>
          </>
        );

      case "COLLECTED":
        return <div className="text-sm text-[var(--color-textMuted)]">Package has been collected. Flow complete.</div>;
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 xl:col-span-8 space-y-6">
        <ComponentCard title="Scan / Load Package">
          <div className="">
            <div className="md:col-span-2">
              <Label>Scan or enter WR / Tracking ID</Label>
              <div className="flex gap-2 mt-2">
                <Input value={q} onValueChange={setQ} placeholder="WR-..." />
                <Button tone="primary" loading={loading} onClick={() => load(q)}><UIIcon name="search" className="h-4 w-4 mr-2" />Load</Button>
                <Button variant="outline" onClick={() => { setQ(""); setShipmentData(null); setPackages([]); setSelectedPackage(null); setErr(null); setCurrentHubId(loggedInHubId); setContainer(""); setShelf(""); }}>Clear</Button>
              </div>
              <div className="mt-2 text-xs text-[var(--color-textMuted)]">The form below adapts to the current package status. Use controls to progress the package through the flow.</div>
            </div>
          </div>
        </ComponentCard>

        {shipmentData && selectedPackage ? (
          <ComponentCard title={`Package: ${selectedPackage.package_code}`} right={<div className="text-sm text-[var(--color-textMuted)]">Status: <strong>{shipmentData.current_status}</strong></div>}>
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-xs text-[var(--color-textMuted)]">Shipper</div>
                      <div className="font-medium mt-1">{shipmentData.shipper_name || 'N/A'}</div>
                    </div>
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-xs text-[var(--color-textMuted)]">Consignee</div>
                      <div className="font-medium mt-1">{shipmentData.consignee_name || 'N/A'}</div>
                    </div>
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-xs text-[var(--color-textMuted)]">Origin Hub</div>
                      <div className="font-medium mt-1">{shipmentData.origin_hub_name || 'N/A'}</div>
                    </div>
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-xs text-[var(--color-textMuted)]">Destination Hub</div>
                      <div className="font-medium mt-1">{shipmentData.destination_hub_name || 'N/A'}</div>
                    </div>
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-xs text-[var(--color-textMuted)]">Transport Mode</div>
                      <div className="font-medium mt-1">{shipmentData.transport_mode || 'N/A'}</div>
                    </div>
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-xs text-[var(--color-textMuted)]">Current Status</div>
                      <div className="font-medium mt-1">{shipmentData.current_status}</div>
                    </div>
                  </div>

                  {shipmentData.notes && (
                    <div className="rounded-xl border p-3 bg-[var(--color-surface)]">
                      <div className="text-sm font-medium mb-1">Notes</div>
                      <div className="text-sm text-[var(--color-textMuted)]">{shipmentData.notes}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border p-4 bg-[var(--color-surface)]">
                    <div className="text-xs font-medium text-[var(--color-textMuted)] mb-1">Stage Actions</div>
                    <div className="font-semibold text-[var(--color-text)] mb-3 text-sm">Current: {shipmentData.current_status}</div>

                    <div className="space-y-3">
                      {RenderStepControls()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Package Details</div>
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
                      <tr>
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Code</th>
                        <th className="px-2 py-2">Description</th>
                        <th className="px-2 py-2">Weight</th>
                        <th className="px-2 py-2">Dimensions</th>
                        <th className="px-2 py-2">Qty</th>
                        <th className="px-2 py-2">Value</th>
                        <th className="px-2 py-2">Container</th>
                        <th className="px-2 py-2">Shelf</th>
                        <th className="px-2 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {packages.map((pkg, idx) => (
                        <tr key={pkg.id} className={pkg.id === selectedPackage.id ? "bg-[var(--color-surfaceMuted)]" : ""}>
                          <td className="px-2 py-2">{idx + 1}</td>
                          <td className="px-2 py-2 font-medium">{pkg.package_code}</td>
                          <td className="px-2 py-2">{pkg.description || '-'}</td>
                          <td className="px-2 py-2">{pkg.weight ? `${pkg.weight}kg` : '-'}</td>
                          <td className="px-2 py-2 text-xs">
                            {pkg.weight ? `L${(pkg as any).length || 0} × W${(pkg as any).width || 0} × H${(pkg as any).height || 0}` : '-'}
                          </td>
                          <td className="px-2 py-2">{pkg.quantity || 1}</td>
                          <td className="px-2 py-2">${pkg.declared_value || 0}</td>
                          <td className="px-2 py-2">{pkg.container_code || '-'}</td>
                          <td className="px-2 py-2">{pkg.shelf_code || '-'}</td>
                          <td className="px-2 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                              {pkg.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ComponentCard>
        ) : (
          <div className="rounded-2xl border bg-[var(--color-surface)] p-8">
            {err ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                  <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">Package Not Found</h3>
                  <p className="text-sm text-[var(--color-textMuted)] max-w-md">{err}</p>
                </div>
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-[var(--color-textMuted)]">Suggestions:</p>
                  <ul className="text-xs text-[var(--color-textMuted)] space-y-1 text-left list-disc list-inside">
                    <li>Check if the WR number or tracking ID is correct</li>
                    <li>Ensure the package has been registered in the system</li>
                    <li>Try searching with the full tracking number</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => { setQ(""); setErr(null); }}
                  className="mt-2"
                >
                  <UIIcon name="search" className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Icon name="scan" className="h-10 w-10 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">No Package Loaded</h3>
                  <p className="text-sm text-[var(--color-textMuted)] max-w-md">Scan or enter a tracking number above to load package details and manage shipment status.</p>
                </div>
                <div className="pt-2 grid grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] text-xs font-bold mt-0.5">1</div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[var(--color-text)]">Scan Package</p>
                      <p className="text-xs text-[var(--color-textMuted)]">Use barcode scanner or type WR number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] text-xs font-bold mt-0.5">2</div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[var(--color-text)]">Update Status</p>
                      <p className="text-xs text-[var(--color-textMuted)]">Progress package through logistics flow</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="col-span-12 xl:col-span-4">
        {/* Barcode Display - MOVED TO TOP */}
        {shipmentData && (
          <div className="rounded-2xl border p-4 bg-[var(--color-surface)] text-center overflow-hidden">
            <div className="text-xs text-[var(--color-textMuted)] mb-2 font-semibold uppercase tracking-wide">Tracking Barcode</div>
            <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-200 max-w-full overflow-hidden">
              <svg ref={barcodeRef} className="mx-auto max-w-full h-auto"></svg>
              <div className="text-sm font-mono mt-2 font-bold truncate">{shipmentData.tracking_number || shipmentData.wr_number}</div>
            </div>
            <div className="text-xs text-[var(--color-textMuted)] mt-2">Scan with any barcode scanner</div>
          </div>
        )}
        
        
        {/* Container Packages List */}
        {container && (
          <div className="rounded-2xl border p-4 bg-[var(--color-surface)] mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-[var(--color-text)]">Packages in Container</div>
              {loadingContainerPackages && (
                <div className="text-xs text-[var(--color-textMuted)]">Loading...</div>
              )}
            </div>
            
            {containerPackages.length === 0 ? (
              <div className="text-center py-6 text-sm text-[var(--color-textMuted)]">
                {loadingContainerPackages ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Loading packages...
                  </div>
                ) : (
                  <div>
                    <Icon name="package" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No packages loaded yet
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <div className="text-xs text-[var(--color-textMuted)] mb-2">
                  Total: {containerPackages.length} package{containerPackages.length !== 1 ? 's' : ''}
                </div>
                {containerPackages.map((pkg, idx) => (
                  <div 
                    key={pkg.id} 
                    className="rounded-lg border border-[var(--color-border)] p-3 bg-[var(--color-surfaceMuted)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text)] truncate" title={pkg.package_code}>
                          {pkg.package_code}
                        </div>
                        {(pkg.tracking_number || pkg.wr_number) && (
                          <div className="text-xs font-mono text-[var(--color-textMuted)] truncate mt-0.5" title={pkg.tracking_number || pkg.wr_number}>
                            {pkg.tracking_number || pkg.wr_number}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-50)] px-2 py-0.5 rounded-full whitespace-nowrap">
                        #{idx + 1}
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <div className="text-xs text-[var(--color-textMuted)] mt-1 line-clamp-1" title={pkg.description}>
                        {pkg.description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-textMuted)]">
                      {pkg.weight && (
                        <span className="flex items-center gap-1">
                          <Icon name="weight" className="h-3 w-3" />
                          {pkg.weight}kg
                        </span>
                      )}
                      {pkg.quantity && (
                        <span>Qty: {pkg.quantity}</span>
                      )}
                      {pkg.status && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text)] font-medium">
                          {pkg.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Stage Progress Indicator */}
        {shipmentData && (
          <div className="rounded-2xl border p-6 bg-[var(--color-surface)] mt-4">
            <div className="text-sm font-medium mb-4 text-center text-[var(--color-text)]">Shipment Progress</div>
            <ShipmentStageProgress currentStatus={shipmentData.current_status} size={220} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPackage;
