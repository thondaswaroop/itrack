// Shelf Management Page - CRUD for Shelves
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComponentCard from '../../components/common/ComponentCard';
import { Button, Select, Modal } from '../../components';
import Label from '../../components/form/Label';
import UIIcon from '../../utils/uiIcon';
import { masterService, type Shelf, type Hub, type Country, type Location } from '../../services';
import { getUser } from '../../utils/auth';
import { Role } from '../../constants/common';

const Shelves: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const isAdmin = currentUser?.roleId === Role.ADMIN;
  const userHubId = currentUser?.hubId ? Number(currentUser.hubId) : null;
  
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);

  // Form-specific state
  const [formCountries, setFormCountries] = useState<Country[]>([]);
  const [formLocations, setFormLocations] = useState<Location[]>([]);
  const [formHubs, setFormHubs] = useState<Hub[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    shelf_code: '',
    shelf_name: '',
    country_id: '',
    location_id: '',
    hub_id: '',
    aisle: '',
    section: '',
  });

  useEffect(() => {
    console.log('Shelves page mounted. isAdmin:', isAdmin, 'userHubId:', userHubId);
    if (isAdmin) {
      loadCountries();
    } else if (userHubId) {
      // Non-admin: auto-set their hub and load data
      console.log('Setting selectedHubId to:', userHubId);
      setSelectedHubId(userHubId);
      loadHubInfo(userHubId);
    } else {
      console.error('No hub assigned to user');
      alert('Your account is not assigned to any hub. Please contact administration.');
    }
  }, []);

  const loadHubInfo = async (hubId: number) => {
    try {
      console.log('Loading hub info for hubId:', hubId);
      const allHubs = await masterService.getHubs();
      const hub = allHubs.find(h => h.id === hubId);
      if (hub) {
        console.log('Found hub:', hub.hub_name, hub.hub_code);
        setHubs([hub]);
      } else {
        console.error('Hub not found with id:', hubId);
      }
    } catch (error: any) {
      console.error('Failed to load hub info:', error);
    }
  };

  useEffect(() => {
    if (selectedCountryId) {
      loadLocations();
      setSelectedLocationId(null);
      setSelectedHubId(null);
      setHubs([]);
      setShelves([]);
    }
  }, [selectedCountryId]);

  useEffect(() => {
    if (selectedLocationId) {
      loadHubs();
      setSelectedHubId(null);
      setShelves([]);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (selectedHubId) {
      console.log('selectedHubId changed to:', selectedHubId, '- loading shelves...');
      loadShelves();
    } else {
      console.log('selectedHubId is null, not loading shelves');
    }
  }, [selectedHubId]);

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
      const data = await masterService.getShelvesByHub(selectedHubId);
      console.log('Shelves received:', data.length, 'shelves');
      console.log('Shelf data:', data);
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

  const handleFormCountryChange = async (countryId: string) => {
    setFormData({ ...formData, country_id: countryId, location_id: '', hub_id: '' });
    setFormLocations([]);
    setFormHubs([]);
    
    if (countryId) {
      try {
        const allLocations = await masterService.getLocations();
        const filtered = allLocations.filter(loc => loc.country_id === Number(countryId));
        setFormLocations(filtered);
      } catch (error: any) {
        console.error('Failed to load locations:', error);
      }
    }
  };

  const handleFormLocationChange = async (locationId: string) => {
    setFormData({ ...formData, location_id: locationId, hub_id: '' });
    setFormHubs([]);
    
    if (locationId) {
      try {
        const allHubs = await masterService.getHubs();
        const filtered = allHubs.filter(hub => hub.location_id === Number(locationId));
        setFormHubs(filtered);
      } catch (error: any) {
        console.error('Failed to load hubs:', error);
      }
    }
  };

  const handleCreate = async () => {
    console.log('handleCreate called with formData:', formData);
    if (!formData.shelf_code || !formData.hub_id) {
      alert('Please fill in all required fields (Shelf Code and Hub)');
      return;
    }

    setLoading(true);
    try {
      if (editMode && selectedShelf) {
        console.log('Updating shelf:', selectedShelf.id);
        await masterService.updateShelf(
          selectedShelf.id,
          formData.shelf_code,
          formData.shelf_name,
          formData.aisle,
          formData.section
        );
        console.log('Shelf updated successfully');
      } else {
        console.log('Creating new shelf with hub_id:', formData.hub_id);
        const result = await masterService.createShelf(
          Number(formData.hub_id),
          formData.shelf_code,
          formData.shelf_name,
          formData.aisle,
          formData.section
        );
        console.log('Shelf created successfully:', result);
      }
      setShowModal(false);
      resetForm();
      console.log('About to reload shelves after creation/update');
      await loadShelves();
    } catch (error: any) {
      console.error('Error creating/updating shelf:', error);
      alert(error.message || `Failed to ${editMode ? 'update' : 'create'} shelf`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (shelf: Shelf) => {
    setEditMode(true);
    setSelectedShelf(shelf);
    
    // Load countries for the form
    try {
      const data = await masterService.getCountries();
      setFormCountries(data);
      
      // Get hub details to populate cascading selects
      const allHubs = await masterService.getHubs();
      const hub = allHubs.find(h => h.id === shelf.hub_id);
      
      if (hub) {
        const allLocations = await masterService.getLocations();
        const location = allLocations.find(l => l.id === hub.location_id);
        
        if (location) {
          // Set country and load locations
          const countryFiltered = allLocations.filter(loc => loc.country_id === location.country_id);
          setFormLocations(countryFiltered);
          
          // Load hubs for location
          const hubFiltered = allHubs.filter(h => h.location_id === location.id);
          setFormHubs(hubFiltered);
          
          setFormData({
            shelf_code: shelf.shelf_code,
            shelf_name: shelf.shelf_name || '',
            country_id: location.country_id.toString(),
            location_id: location.id.toString(),
            hub_id: shelf.hub_id.toString(),
            aisle: shelf.aisle || '',
            section: shelf.section || '',
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load data for edit:', error);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (shelf: Shelf) => {
    if (!confirm(`Are you sure you want to delete shelf "${shelf.shelf_code}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await masterService.deleteShelf(shelf.id);
      loadShelves();
    } catch (error: any) {
      alert(error.message || 'Failed to delete shelf');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const hubIdToSet = selectedHubId?.toString() || '';
    console.log('Resetting form. selectedHubId:', selectedHubId, 'Setting hub_id to:', hubIdToSet);
    setEditMode(false);
    setSelectedShelf(null);
    setFormData({
      shelf_code: '',
      shelf_name: '',
      country_id: '',
      location_id: '',
      hub_id: hubIdToSet,
      aisle: '',
      section: '',
    });
    setFormLocations([]);
    setFormHubs([]);
  };

  const openCreateModal = async () => {
    console.log('Opening create modal. isAdmin:', isAdmin, 'userHubId:', userHubId, 'selectedHubId:', selectedHubId);
    resetForm();
    
    if (isAdmin) {
      // Admin: Load countries for the form
      try {
        const data = await masterService.getCountries();
        setFormCountries(data);
      } catch (error: any) {
        console.error('Failed to load countries:', error);
      }
    } else if (userHubId) {
      // Non-admin: Pre-populate their hub (resetForm should have already set it, but double-check)
      console.log('Setting form hub_id to:', userHubId);
      setFormData(prev => {
        const newData = { ...prev, hub_id: userHubId.toString() };
        console.log('Form data after setting hub:', newData);
        return newData;
      });
    }
    
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <ComponentCard title="Shelf Management" right={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/load')}>
            <UIIcon name="arrowLeft" className="h-4 w-4 mr-2" />
            Back to Load
          </Button>
          <Button tone="primary" onClick={openCreateModal}>
            <UIIcon name="plus" className="h-4 w-4 mr-2" />
            Add Shelf
          </Button>
        </div>
      }>
        {/* Filters - Only for Admin */}
        {isAdmin ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Country</Label>
                <Select
                  options={countries.map(c => ({ value: c.id.toString(), label: c.country_name }))}
                  value={selectedCountryId?.toString() || ''}
                  onChange={(v) => setSelectedCountryId(v ? Number(v) : null)}
                  placeholder="Select Country"
                  searchable
                />
              </div>
              <div>
                <Label>Location</Label>
                <Select
                  options={locations.map(l => ({ value: l.id.toString(), label: l.location_name }))}
                  value={selectedLocationId?.toString() || ''}
                  onChange={(v) => setSelectedLocationId(v ? Number(v) : null)}
                  placeholder={selectedCountryId ? "Select Location" : "Select country first"}
                  searchable
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Hub</Label>
                <Select
                  options={hubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))}
                  value={selectedHubId?.toString() || ''}
                  onChange={(v) => setSelectedHubId(v ? Number(v) : null)}
                  placeholder={selectedLocationId ? "Select Hub" : "Select location first"}
                  searchable
                  disabled={!selectedLocationId}
                />
              </div>
            </div>
          </div>
        ) : (
          // Non-admin: Show their assigned hub info
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UIIcon name="hub" className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Your Hub</div>
                <div className="text-lg font-bold text-gray-900">
                  {hubs.find(h => h.id === userHubId)?.hub_name || 'Loading...'}
                </div>
                <div className="text-sm text-gray-600">
                  {hubs.find(h => h.id === userHubId)?.hub_code || ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shelf List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : !selectedHubId ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <UIIcon name="master" className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-gray-500">
              {isAdmin ? 'Please select a hub to view shelves' : 'Loading your hub information...'}
            </p>
          </div>
        ) : shelves.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <UIIcon name="master" className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-gray-500">No shelves found in this hub</p>
            <Button className="mt-4" tone="primary" onClick={openCreateModal}>
              Add Your First Shelf
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {shelves.map(shelf => (
              <div key={shelf.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UIIcon name="master" className="h-6 w-6 text-green-600" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shelf.status)}`}>
                    {shelf.status}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Shelf Code</div>
                    <div className="font-bold text-lg text-gray-900">{shelf.shelf_code}</div>
                  </div>
                  
                  {shelf.shelf_name && (
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="font-medium">{shelf.shelf_name}</div>
                    </div>
                  )}
                  
                  {shelf.aisle && (
                    <div>
                      <div className="text-xs text-gray-500">Aisle</div>
                      <div className="font-medium">{shelf.aisle}</div>
                    </div>
                  )}
                  
                  {shelf.section && (
                    <div>
                      <div className="text-xs text-gray-500">Section</div>
                      <div className="font-medium">{shelf.section}</div>
                    </div>
                  )}
                  
                  {shelf.capacity && (
                    <div>
                      <div className="text-xs text-gray-500">Capacity</div>
                      <div className="font-medium">{shelf.capacity} units</div>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t mt-3">
                    <div className="text-xs text-gray-400">
                      Created: {new Date(shelf.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(shelf)}
                      className="flex-1"
                    >
                      <UIIcon name="edit" className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(shelf)}
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      <UIIcon name="delete" className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMode ? "Edit Shelf" : "Add New Shelf"}
      >
        <div className="space-y-4">
          <div>
            <Label>Shelf Code *</Label>
            <input
              type="text"
              value={formData.shelf_code}
              onChange={(e) => setFormData({ ...formData, shelf_code: e.target.value })}
              placeholder="e.g., SH-A-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <Label>Shelf Name</Label>
            <input
              type="text"
              value={formData.shelf_name}
              onChange={(e) => setFormData({ ...formData, shelf_name: e.target.value })}
              placeholder="e.g., Warehouse A - Section 1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {isAdmin ? (
            // Admin: Show full country/location/hub selection
            <>
              <div>
                <Label>Country *</Label>
                <Select
                  options={formCountries.map(c => ({ value: c.id.toString(), label: c.country_name }))}
                  value={formData.country_id}
                  onChange={handleFormCountryChange}
                  placeholder="Select Country"
                  searchable
                />
              </div>

              <div>
                <Label>Location *</Label>
                <Select
                  options={formLocations.map(l => ({ value: l.id.toString(), label: l.location_name }))}
                  value={formData.location_id}
                  onChange={handleFormLocationChange}
                  placeholder={formData.country_id ? "Select Location" : "Select country first"}
                  searchable
                  disabled={!formData.country_id}
                />
              </div>

              <div>
                <Label>Hub *</Label>
                <Select
                  options={formHubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))}
                  value={formData.hub_id}
                  onChange={(v) => setFormData({ ...formData, hub_id: v })}
                  placeholder={formData.location_id ? "Select Hub" : "Select location first"}
                  searchable
                  disabled={!formData.location_id}
                />
              </div>
            </>
          ) : (
            // Non-admin: Show their assigned hub (read-only)
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Label>Your Hub</Label>
              <div className="font-medium text-gray-900 mt-1">
                {hubs.find(h => h.id === userHubId)?.hub_name || 'Loading...'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {hubs.find(h => h.id === userHubId)?.hub_code || ''}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Aisle</Label>
              <input
                type="text"
                value={formData.aisle}
                onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                placeholder="e.g., A, B, C"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <Label>Section</Label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g., 1, 2, 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button tone="primary" onClick={handleCreate} loading={loading} className="flex-1">
              {editMode ? 'Update Shelf' : 'Create Shelf'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Shelves;
