// LoadManagement - Shelf and Container Loading Interface with Barcode Scanning
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ComponentCard from '../../components/common/ComponentCard';
import { Button, Select } from '../../components';
import Label from '../../components/form/Label';
import { masterService, shipmentService, type Hub, type Container, type Shelf, type Country, type Location } from '../../services';
import UIIcon from '../../utils/uiIcon';
import { getUser } from '../../utils/auth';
import { Role } from '../../constants/common';

interface LoadedPackage {
  id: number;
  package_code: string;
  shipment_id: number;
  weight?: number;
  description?: string;
  status: string;
  tracking_number?: string;
  wr_number?: string;
}

const LoadManagement: React.FC = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Get current user details
  const currentUser = getUser();
  const isAdmin = currentUser?.roleId === Role.ADMIN;
  const userHubId = currentUser?.hubId ? Number(currentUser.hubId) : null;

  // State
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [loadedPackages, setLoadedPackages] = useState<LoadedPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  // View mode: 'shelves' | 'containers' | 'loading'
  const [viewMode, setViewMode] = useState<'shelves' | 'containers' | 'loading'>('shelves');

  // Load data on mount
  useEffect(() => {
    console.log('LoadManagement mounted. isAdmin:', isAdmin, 'userHubId:', userHubId);
    if (isAdmin) {
      // Admin: Load countries for selection
      loadCountries();
    } else if (userHubId) {
      // Associate/Vendor: Auto-set their hub and load shelves
      console.log('Setting selectedHubId to:', userHubId);
      setSelectedHubId(userHubId);
      // loadShelves will be called by useEffect when selectedHubId changes
    } else {
      // No hub assigned - show error
      console.error('No hub assigned to user');
      alert('Your account is not assigned to any hub. Please contact administration.');
    }
  }, []);

  // Load shelves when hub selected (for admin flow)
  useEffect(() => {
    if (selectedCountryId) {
      loadLocations();
      setSelectedLocationId(null);
      setSelectedHubId(null);
      setHubs([]);
    }
  }, [selectedCountryId]);

  useEffect(() => {
    if (selectedLocationId) {
      loadHubs();
      setSelectedHubId(null);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (selectedHubId) {
      // Load shelves when hub is selected (for both admin and non-admin)
      console.log('selectedHubId changed to:', selectedHubId, 'loading shelves...');
      loadShelves();
    }
  }, [selectedHubId]);

  // Load containers when shelf selected
  useEffect(() => {
    if (selectedShelf) {
      loadContainers();
    }
  }, [selectedShelf]);

  // Auto-focus on barcode input when in loading mode
  useEffect(() => {
    if (viewMode === 'loading' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [viewMode]);

  const loadCountries = async () => {
    try {
      const data = await masterService.getCountries();
      setCountries(data);
    } catch (error: any) {
      console.error('Failed to load countries:', error);
    }
  };

  const loadLocations = async () => {
    if (!selectedCountryId) return;
    try {
      const allLocations = await masterService.getLocations();
      const filtered = allLocations.filter(loc => loc.country_id === selectedCountryId);
      setLocations(filtered);
    } catch (error: any) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadHubs = async () => {
    if (!selectedLocationId) return;
    try {
      const allHubs = await masterService.getHubs();
      const filtered = allHubs.filter(hub => hub.location_id === selectedLocationId);
      setHubs(filtered);
    } catch (error: any) {
      console.error('Failed to load hubs:', error);
    }
  };

  const loadShelves = async () => {
    if (!selectedHubId) {
      console.error('loadShelves called but no selectedHubId');
      return;
    }
    console.log('Loading shelves for hub:', selectedHubId);
    setLoading(true);
    try {
      // Load hub info if not already loaded (for non-admin users)
      if (hubs.length === 0 || !hubs.find(h => h.id === selectedHubId)) {
        console.log('Loading hub info for hub:', selectedHubId);
        const allHubs = await masterService.getHubs();
        const hub = allHubs.find(h => h.id === selectedHubId);
        if (hub) {
          console.log('Found hub:', hub.hub_name, hub.hub_code);
          setHubs([hub]);
        } else {
          console.error('Hub not found with id:', selectedHubId);
          alert(`Hub with ID ${selectedHubId} not found. Please contact support.`);
          return;
        }
      }
      
      console.log('Fetching shelves for hub:', selectedHubId);
      const data = await masterService.getShelvesByHub(selectedHubId);
      console.log('Shelves received:', data.length, 'shelves');
      setShelves(data);
      
      if (data.length === 0) {
        console.warn('No shelves found for hub:', selectedHubId);
      }
    } catch (error: any) {
      console.error('Failed to load shelves:', error);
      alert('Failed to load shelves: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadContainers = async () => {
    if (!selectedShelf) return;
    setLoading(true);
    try {
      const data = await masterService.getContainersByHub(selectedHubId!);
      // Filter containers by shelf and exclude full containers
      const filtered = data.filter(c => 
        c.shelf_id === selectedShelf.id && 
        c.current_status !== 'full' && 
        c.current_status !== 'dispatched' &&
        c.current_status !== 'in_transit'
      );
      setContainers(filtered);
      setViewMode('containers');
    } catch (error: any) {
      console.error('Failed to load containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openContainer = async (container: Container) => {
    setSelectedContainer(container);
    setViewMode('loading');
    setScanError(null);
    setLoading(true);
    
    try {
      // Load existing packages in this container
      const response = await shipmentService.getPackagesByContainer(container.id);
      if (response && response.length > 0) {
        const packages: LoadedPackage[] = response.map((pkg: any) => ({
          id: pkg.id,
          package_code: pkg.package_code,
          shipment_id: pkg.shipment_id,
          weight: pkg.weight,
          description: pkg.description,
          status: pkg.status,
          tracking_number: pkg.tracking_number,
          wr_number: pkg.wr_number,
        }));
        setLoadedPackages(packages);
      } else {
        setLoadedPackages([]);
      }
    } catch (error: any) {
      console.error('Failed to load packages:', error);
      setLoadedPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const scanPackage = async () => {
    if (!scanInput.trim() || !selectedContainer) return;

    setScanError(null);
    setLoading(true);

    try {
      // Scan the package to get shipment data
      const response = await shipmentService.scanPackage(scanInput.trim());
      
      if (!response.packages || response.packages.length === 0) {
        setScanError('No packages found for this code');
        setLoading(false);
        return;
      }

      // Get the first package
      const packageData = response.packages[0];

      // Check if already loaded
      if (loadedPackages.some(p => p.id === packageData.id)) {
        setScanError('Package already loaded in this container');
        setLoading(false);
        return;
      }

      // Consolidate the package to this container
      await shipmentService.consolidatePackage({
        package_id: packageData.id,
        container_id: selectedContainer.id,
        shelf_id: selectedShelf?.id,
      });

      // Add to loaded packages list
      const newPackage: LoadedPackage = {
        id: packageData.id,
        package_code: packageData.package_code,
        shipment_id: packageData.shipment_id,
        weight: packageData.weight,
        description: packageData.description,
        status: 'CONSOLIDATED',
        tracking_number: response.shipment?.tracking_number,
        wr_number: response.shipment?.wr_number,
      };

      setLoadedPackages(prev => [...prev, newPackage]);
      setScanInput('');
      
      // Success feedback
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnk77RgGwU7k9n0yoQpBSh+zPLaizsKGGS56+mlUhELTKXh8bllHAU2jdXzzn0qBSl+zO/aiDkLF2S56Om');
      audio.play().catch(() => {}); // Beep sound on success

    } catch (error: any) {
      setScanError(error.message || 'Failed to load package');
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
      scanPackage();
    }
  };

  const backToContainers = () => {
    setViewMode('containers');
    setSelectedContainer(null);
    setLoadedPackages([]);
    setScanInput('');
    setScanError(null);
  };

  const backToShelves = () => {
    setViewMode('shelves');
    setSelectedShelf(null);
    setContainers([]);
  };

  const removePackage = async (packageId: number) => {
    if (!confirm('Remove this package from the container?')) return;
    
    setLoadedPackages(prev => prev.filter(p => p.id !== packageId));
  };

  const markContainerAsFull = async () => {
    if (!selectedContainer) return;
    
    if (!confirm(`Mark container ${selectedContainer.container_code} as FULL? This will make it unavailable for new packages.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await masterService.markContainerFull(selectedContainer.id);
      alert('Container marked as FULL! You can now select another container.');
      
      // Go back to container selection to pick a new one
      backToContainers();
    } catch (error: any) {
      alert('Failed to mark container as full: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ComponentCard title="Load Management" right={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/containers')}>
            <UIIcon name="settings" className="h-4 w-4 mr-2" />
            Manage Containers
          </Button>
          <Button variant="outline" onClick={() => navigate('/shelves')}>
            <UIIcon name="settings" className="h-4 w-4 mr-2" />
            Manage Shelves
          </Button>
        </div>
      }>
        {isAdmin ? (
          /* Admin: Show Country/Location/Hub Selectors */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country Selection */}
            <div>
              <Label>Select Country</Label>
              <Select
                options={countries.map(c => ({ value: c.id.toString(), label: c.country_name }))}
                value={selectedCountryId?.toString() || ''}
                onChange={(v) => {
                  setSelectedCountryId(v ? Number(v) : null);
                  setSelectedLocationId(null);
                  setSelectedHubId(null);
                  setSelectedShelf(null);
                  setSelectedContainer(null);
                  setViewMode('shelves');
                }}
                placeholder="Select Country"
                searchable
              />
            </div>

            {/* Location Selection */}
            <div>
              <Label>Select Location</Label>
              <Select
                options={locations.map(l => ({ value: l.id.toString(), label: l.location_name }))}
                value={selectedLocationId?.toString() || ''}
                onChange={(v) => {
                  setSelectedLocationId(v ? Number(v) : null);
                  setSelectedHubId(null);
                  setSelectedShelf(null);
                  setSelectedContainer(null);
                  setViewMode('shelves');
                }}
                placeholder={selectedCountryId ? "Select Location" : "Select country first"}
                searchable
                disabled={!selectedCountryId}
              />
            </div>

            {/* Hub Selection */}
            <div>
              <Label>Select Hub</Label>
              <Select
                options={hubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))}
                value={selectedHubId?.toString() || ''}
                onChange={(v) => {
                  setSelectedHubId(v ? Number(v) : null);
                  setSelectedShelf(null);
                  setSelectedContainer(null);
                  setViewMode('shelves');
                }}
                placeholder={selectedLocationId ? "Select Hub" : "Select location first"}
                searchable
                disabled={!selectedLocationId}
              />
            </div>
          </div>
        ) : (
          /* Associate/Vendor: Show Hub Info (Read-Only) */
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UIIcon name="hub" className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Your Hub</div>
                <div className="text-lg font-bold text-gray-900">
                  {hubs.find(h => h.id === selectedHubId)?.hub_name || 'Loading...'}
                </div>
                <div className="text-sm text-gray-600">
                  {hubs.find(h => h.id === selectedHubId)?.hub_code || ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation - Show for all */}
        {(selectedShelf || selectedContainer) && (
          <div className="md:col-span-3 flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
            <UIIcon name="hub" className="h-4 w-4" />
            <span className="font-medium">{hubs.find(h => h.id === selectedHubId)?.hub_name || 'Select Hub'}</span>
            {selectedShelf && (
              <>
                <span>/</span>
                <span className="font-medium">{selectedShelf.shelf_code}</span>
              </>
            )}
            {selectedContainer && (
              <>
                <span>/</span>
                <span className="font-medium text-blue-600">{selectedContainer.container_code}</span>
              </>
            )}
          </div>
        )}
      </ComponentCard>

      {/* Shelves View */}
      {viewMode === 'shelves' && selectedHubId && (
        <ComponentCard title="Shelves" right={
          <div className="text-sm text-gray-500">{shelves.length} shelves</div>
        }>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : shelves.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium mb-2">No shelves found in this hub</p>
              <p className="text-sm text-gray-500 mb-4">
                {isAdmin 
                  ? 'Create shelves in this hub to start loading packages.'
                  : 'No shelves are available in your hub. Please contact your administrator to create shelves.'}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Hub ID: {selectedHubId} | Check browser console (F12) for detailed logs
              </p>
              <Button className="mt-4" onClick={() => navigate('/shelves')}>
                {isAdmin ? 'Create Shelf' : 'View Shelves Management'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shelves.map(shelf => (
                <button
                  key={shelf.id}
                  onClick={() => {
                    setSelectedShelf(shelf);
                    loadContainers();
                  }}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <UIIcon name="master" className="h-6 w-6 text-blue-600 group-hover:text-white" />
                    </div>
                  </div>
                  <div className="font-bold text-lg text-gray-900">{shelf.shelf_code}</div>
                  <div className="text-sm text-gray-500">{shelf.shelf_name || 'No name'}</div>
                  {shelf.aisle && (
                    <div className="text-xs text-gray-400 mt-1">Aisle: {shelf.aisle}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ComponentCard>
      )}

      {/* Containers View */}
      {viewMode === 'containers' && selectedShelf && (
        <ComponentCard title={`Containers in ${selectedShelf.shelf_code}`} right={
          <Button variant="outline" onClick={backToShelves}>
            <UIIcon name="arrowLeft" className="h-4 w-4 mr-2" />
            Back to Shelves
          </Button>
        }>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : containers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <UIIcon name="vehicle" className="h-16 w-16 mx-auto" />
              </div>
              <p className="text-gray-500">No containers on this shelf</p>
              <Button className="mt-4" onClick={() => navigate('/containers')}>
                Add Container
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {containers.map(container => (
                <button
                  key={container.id}
                  onClick={() => openContainer(container)}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                      <UIIcon name="vehicle" className="h-8 w-8 text-green-600 group-hover:text-white" />
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      container.current_status === 'empty' ? 'bg-gray-100 text-gray-600' :
                      container.current_status === 'in_use' ? 'bg-blue-100 text-blue-600' :
                      container.current_status === 'full' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {container.current_status}
                    </div>
                  </div>
                  <div className="font-bold text-lg text-gray-900">{container.container_code}</div>
                  <div className="text-sm text-gray-500 capitalize">{container.container_type} Container</div>
                  <div className="mt-3 text-xs text-gray-400">Click to load packages</div>
                </button>
              ))}
            </div>
          )}
        </ComponentCard>
      )}

      {/* Loading Interface */}
      {viewMode === 'loading' && selectedContainer && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <ComponentCard title={`Loading: ${selectedContainer.container_code}`} right={
              <Button variant="outline" onClick={backToContainers}>
                <UIIcon name="arrowLeft" className="h-4 w-4 mr-2" />
                Back to Containers
              </Button>
            }>
              <div className="space-y-6">
                {/* Barcode Scanner Input */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <UIIcon name="scan" className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900">Scan Package Barcode</div>
                      <div className="text-sm text-gray-600">Use barcode scanner or enter manually</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="Scan or enter WR/Tracking number..."
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 text-lg font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <Button 
                      tone="primary" 
                      onClick={scanPackage}
                      loading={loading}
                      disabled={!scanInput.trim()}
                      size="lg"
                    >
                      <UIIcon name="plus" className="h-5 w-5 mr-2" />
                      Load Package
                    </Button>
                  </div>

                  {scanError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {scanError}
                    </div>
                  )}

                  <div className="mt-4 text-xs text-gray-500">
                    💡 Tip: Connect a barcode scanner and scan packages directly. Press Enter or click "Load Package" to add.
                  </div>
                </div>

                {/* Loaded Packages List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Loaded Packages ({loadedPackages.length})
                    </h3>
                  </div>

                  {loadedPackages.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-gray-400 mb-2">
                        <UIIcon name="inbox" className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-500">No packages loaded yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start scanning to add packages</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">#</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Package Code</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">WR Number</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Weight</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {loadedPackages.map((pkg, idx) => (
                            <tr key={pkg.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-blue-600">{pkg.package_code}</td>
                              <td className="px-4 py-3">{pkg.wr_number || '-'}</td>
                              <td className="px-4 py-3">{pkg.description || '-'}</td>
                              <td className="px-4 py-3">{pkg.weight ? `${pkg.weight}kg` : '-'}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  {pkg.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => removePackage(pkg.id)}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </ComponentCard>
          </div>

          {/* Right Sidebar - Container Info */}
          <div className="col-span-12 lg:col-span-4">
            <ComponentCard title="Container Details">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500">Container Code</div>
                  <div className="font-bold text-lg text-gray-900">{selectedContainer.container_code}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="font-medium capitalize">{selectedContainer.container_type}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Shelf</div>
                  <div className="font-medium">{selectedShelf?.shelf_code || 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedContainer.current_status === 'empty' ? 'bg-gray-100 text-gray-700' :
                    selectedContainer.current_status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                    selectedContainer.current_status === 'full' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedContainer.current_status}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-2">Packages Loaded</div>
                  <div className="text-3xl font-bold text-blue-600">{loadedPackages.length}</div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Quick Actions" className="mt-6">
              <div className="space-y-2">
                <Button 
                  tone="primary"
                  className="w-full justify-start"
                  onClick={markContainerAsFull}
                  disabled={loading || loadedPackages.length === 0}
                >
                  <UIIcon name="success" className="h-4 w-4 mr-2" />
                  Mark Container Full
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={backToContainers}>
                  <UIIcon name="arrowLeft" className="h-4 w-4 mr-2" />
                  Switch Container
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={backToShelves}>
                  <UIIcon name="master" className="h-4 w-4 mr-2" />
                  Change Shelf
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setScanInput('');
                    setScanError(null);
                    if (barcodeInputRef.current) barcodeInputRef.current.focus();
                  }}
                >
                  <UIIcon name="refresh" className="h-4 w-4 mr-2" />
                  Clear Input
                </Button>
              </div>
            </ComponentCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadManagement;
