// Container Management Page - CRUD for Containers
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComponentCard from '../../components/common/ComponentCard';
import { Button, Select, Modal } from '../../components';
import Label from '../../components/form/Label';
import UIIcon from '../../utils/uiIcon';
import { masterService, type Container, type Hub, type Shelf, type Country, type Location } from '../../services';
import { getUser } from '../../utils/auth';
import { Role } from '../../constants/common';

const Containers: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const isAdmin = currentUser?.roleId === Role.ADMIN;
  const userHubId = currentUser?.hubId ? Number(currentUser.hubId) : null;
  
  const [containers, setContainers] = useState<Container[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);

  // Form-specific state
  const [formCountries, setFormCountries] = useState<Country[]>([]);
  const [formLocations, setFormLocations] = useState<Location[]>([]);
  const [formHubs, setFormHubs] = useState<Hub[]>([]);
  const [formShelves, setFormShelves] = useState<Shelf[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    container_code: '',
    container_type: 'medium' as 'small' | 'medium' | 'large' | 'pallet' | 'custom',
    country_id: '',
    location_id: '',
    hub_id: '',
    shelf_id: '',
  });

  useEffect(() => {
    console.log('Containers page mounted. isAdmin:', isAdmin, 'userHubId:', userHubId);
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
      console.log('selectedHubId changed to:', selectedHubId, '- loading containers and shelves...');
      loadContainers();
      loadShelvesForHub(selectedHubId);
    } else {
      console.log('selectedHubId is null, not loading containers');
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

  const loadContainers = async () => {
    console.log('Loading containers for hub:', selectedHubId || 'all hubs');
    setLoading(true);
    try {
      // Pass null/undefined to get all containers when no hub is selected
      const data = await masterService.getContainers(selectedHubId === null ? undefined : selectedHubId);
      console.log('Containers received:', data.length, 'containers');
      setContainers(data);
    } catch (error: any) {
      console.error('Failed to load containers:', error);
      alert('Failed to load containers: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadShelvesForHub = async (hubId: number) => {
    try {
      const data = await masterService.getShelvesByHub(hubId);
      setFormShelves(data);
    } catch (error: any) {
      console.error('Failed to load shelves:', error);
    }
  };

  const loadFormShelves = async (hubId: number) => {
    try {
      const data = await masterService.getShelvesByHub(hubId);
      setFormShelves(data);
    } catch (error: any) {
      console.error('Failed to load form shelves:', error);
    }
  };

  const handleFormCountryChange = async (countryId: string) => {
    setFormData({ ...formData, country_id: countryId, location_id: '', hub_id: '', shelf_id: '' });
    setFormLocations([]);
    setFormHubs([]);
    setFormShelves([]);
    
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
    setFormData({ ...formData, location_id: locationId, hub_id: '', shelf_id: '' });
    setFormHubs([]);
    setFormShelves([]);
    
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

  const handleFormHubChange = (hubId: string) => {
    setFormData({ ...formData, hub_id: hubId, shelf_id: '' });
    setFormShelves([]);
    if (hubId) {
      loadFormShelves(Number(hubId));
    }
  };

  const handleCreate = async () => {
    if (!formData.container_code || !formData.hub_id || !formData.shelf_id) {
      alert('Please fill in all required fields (Container Code, Hub, and Shelf)');
      return;
    }

    setLoading(true);
    try {
      if (editMode && selectedContainer) {
        await masterService.updateContainer(
          selectedContainer.id,
          formData.container_code,
          formData.container_type,
          Number(formData.hub_id),
          Number(formData.shelf_id)
        );
      } else {
        await masterService.createContainer(
          Number(formData.hub_id),
          formData.container_code,
          formData.container_type,
          Number(formData.shelf_id)
        );
      }
      setShowModal(false);
      resetForm();
      loadContainers();
    } catch (error: any) {
      alert(error.message || `Failed to ${editMode ? 'update' : 'create'} container`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (container: Container) => {
    setEditMode(true);
    setSelectedContainer(container);
    
    // Load countries for the form
    try {
      const data = await masterService.getCountries();
      setFormCountries(data);
      
      // Get hub details to populate cascading selects
      const allHubs = await masterService.getHubs();
      const hub = allHubs.find(h => h.id === container.hub_id);
      
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
          
          // Load shelves for hub
          const allShelves = await masterService.getShelvesByHub(container.hub_id);
          setFormShelves(allShelves);
          
          setFormData({
            container_code: container.container_code,
            container_type: container.container_type,
            country_id: location.country_id.toString(),
            location_id: location.id.toString(),
            hub_id: container.hub_id.toString(),
            shelf_id: container.shelf_id?.toString() || '',
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load data for edit:', error);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (container: Container) => {
    if (!confirm(`Are you sure you want to delete container "${container.container_code}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await masterService.deleteContainer(container.id);
      loadContainers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete container');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {    setEditMode(false);
    setSelectedContainer(null);    setFormData({
      container_code: '',
      container_type: 'medium',
      country_id: '',
      location_id: '',
      hub_id: '',
      shelf_id: '',
    });
    setFormLocations([]);
    setFormHubs([]);
    setFormShelves([]);
  };

  const openCreateModal = async () => {
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
      // Non-admin: Pre-populate their hub and load shelves
      setFormData(prev => ({ ...prev, hub_id: userHubId.toString() }));
      loadFormShelves(userHubId);
    }
    
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty':
        return 'bg-gray-100 text-gray-700';
      case 'in_use':
        return 'bg-blue-100 text-blue-700';
      case 'full':
        return 'bg-green-100 text-green-700';
      case 'dispatched':
        return 'bg-orange-100 text-orange-700';
      case 'in_transit':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <ComponentCard title="Container Management" right={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/load')}>
            <UIIcon name="arrowLeft" className="h-4 w-4 mr-2" />
            Back to Load
          </Button>
          <Button tone="primary" onClick={openCreateModal}>
            <UIIcon name="plus" className="h-4 w-4 mr-2" />
            Add Container
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
                  options={[
                    { value: '', label: 'All Countries' },
                    ...countries.map(c => ({ value: c.id.toString(), label: c.country_name }))
                  ]}
                  value={selectedCountryId?.toString() || ''}
                  onChange={(v) => setSelectedCountryId(v ? Number(v) : null)}
                  placeholder="Select Country"
                  searchable
                />
              </div>
              <div>
                <Label>Location</Label>
                <Select
                  options={[
                    { value: '', label: selectedCountryId ? 'All Locations' : 'Select country first' },
                    ...locations.map(l => ({ value: l.id.toString(), label: l.location_name }))
                  ]}
                  value={selectedLocationId?.toString() || ''}
                  onChange={(v) => setSelectedLocationId(v ? Number(v) : null)}
                  placeholder="Select Location"
                  searchable
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Hub</Label>
                <Select
                  options={[
                    { value: '', label: selectedLocationId ? 'All Hubs' : 'Select location first' },
                    ...hubs.map(h => ({ value: h.id.toString(), label: h.hub_name }))
                  ]}
                  value={selectedHubId?.toString() || ''}
                  onChange={(v) => setSelectedHubId(v ? Number(v) : null)}
                  placeholder="Select Hub"
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

        {/* Container List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : containers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <UIIcon name="vehicle" className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-gray-500">No containers found</p>
            <Button className="mt-4" tone="primary" onClick={openCreateModal}>
              Add Your First Container
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {containers.map(container => (
              <div key={container.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UIIcon name="vehicle" className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(container.current_status)}`}>
                    {container.current_status}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Container Code</div>
                    <div className="font-bold text-lg text-gray-900">{container.container_code}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="font-medium capitalize">{container.container_type}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500">Hub</div>
                    <div className="font-medium">{container.hub_name || 'N/A'}</div>
                  </div>
                  
                  {container.shelf_code && (
                    <div>
                      <div className="text-xs text-gray-500">Shelf</div>
                      <div className="font-medium">{container.shelf_code}</div>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t mt-3">
                    <div className="text-xs text-gray-400">
                      Created: {new Date(container.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(container)}
                      className="flex-1"
                    >
                      <UIIcon name="edit" className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(container)}
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
        title={editMode ? "Edit Container" : "Add New Container"}
      >
        <div className="space-y-4">
          <div>
            <Label>Container Code *</Label>
            <input
              type="text"
              value={formData.container_code}
              onChange={(e) => setFormData({ ...formData, container_code: e.target.value })}
              placeholder="e.g., CNT-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <Label>Container Type *</Label>
            <Select
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
                { value: 'pallet', label: 'Pallet' },
                { value: 'custom', label: 'Custom' },
              ]}
              value={formData.container_type}
              onChange={(v) => setFormData({ ...formData, container_type: v as any })}
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
                  onChange={handleFormHubChange}
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

          <div>
            <Label>Assign to Shelf *</Label>
            <Select
              options={formShelves.map(s => ({ value: s.id.toString(), label: s.shelf_code }))}
              value={formData.shelf_id}
              onChange={(v) => setFormData({ ...formData, shelf_id: v })}
              placeholder={formData.hub_id ? (formShelves.length > 0 ? "Select Shelf" : "No shelves available - create one first") : "Select a hub first"}
              searchable
              disabled={!formData.hub_id || formShelves.length === 0}
            />
            {formData.hub_id && formShelves.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">No shelves found. Please create a shelf first.</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button tone="primary" onClick={handleCreate} loading={loading} className="flex-1">
              {editMode ? 'Update Container' : 'Create Container'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Containers;
