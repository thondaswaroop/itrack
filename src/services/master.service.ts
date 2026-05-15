// Master Data Service (Countries, Hubs, Vendors, Locations)
import { apiRequest, apiGet } from './api';

// ==================== COUNTRIES ====================

export interface Country {
  id: number;
  country_code: string;
  country_name: string;
  currency_code?: string;
  phone_code?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCountryRequest {
  country_code: string;
  country_name: string;
  currency_code?: string;
  phone_code?: string;
}

export interface UpdateCountryRequest extends Partial<CreateCountryRequest> {
  id: number;
  status?: 'active' | 'inactive';
}

// ==================== VENDORS ====================

export interface Vendor {
  id: number;
  vendor_name: string;
  vendor_code: string;
  email?: string;
  phone?: string;
  address?: string;
  hub_id: number;
  user_id?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  hub_name?: string;
  hub_code?: string;
  user_email?: string;
}

export interface CreateVendorRequest {
  vendor_name: string;
  vendor_code: string;
  email?: string;
  phone?: string;
  address?: string;
  hub_id: number;
}

// ==================== HUBS ====================

export interface Hub {
  id: number;
  hub_name: string;
  hub_code: string;
  location_id: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  hub_type: 'origin' | 'transit' | 'destination' | 'all';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  location_name?: string;
  location_code?: string;
}

export interface CreateHubRequest {
  hub_name: string;
  hub_code: string;
  location_id: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  hub_type?: 'origin' | 'transit' | 'destination' | 'all';
}

// ==================== LOCATIONS ====================

export interface Location {
  id: number;
  location_name: string;
  location_code: string;
  country_id: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  country_name?: string;
  country_code?: string;
}

export interface CreateLocationRequest {
  location_name: string;
  location_code: string;
  country_id: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

// ==================== FLEET MANAGERS / ASSOCIATES ====================

export interface FleetManager {
  id: number;
  user_id: number;
  vendor_id: number;
  hub_id?: number;
  employee_code?: string;
  designation?: string;
  department?: string;
  assigned_at: string;
  status: 'active' | 'inactive';
  username?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  user_status?: string;
  vendor_name?: string;
  vendor_code?: string;
  hub_name?: string;
  hub_code?: string;
}

export interface CreateFleetManagerRequest {
  user_id: number;
  vendor_id: number;
  employee_code?: string;
  designation?: string;
  department?: string;
}

export interface UpdateFleetManagerRequest {
  id: number;
  vendor_id?: number;
  employee_code?: string;
  designation?: string;
  department?: string;
}

// ==================== WAREHOUSE ====================

export interface Shelf {
  id: number;
  hub_id: number;
  shelf_code: string;
  shelf_name?: string;
  aisle?: string;
  section?: string;
  capacity?: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Container {
  id: number;
  container_code: string;
  container_type: 'small' | 'medium' | 'large' | 'pallet' | 'custom';
  hub_id: number;
  shelf_id?: number;
  current_status: 'empty' | 'in_use' | 'full' | 'dispatched' | 'in_transit';
  capacity_weight?: number;
  capacity_volume?: number;
  destination_hub_id?: number;
  transport_mode?: 'AIR' | 'OCEAN' | 'GROUND';
  dispatched_at?: string;
  created_at: string;
  updated_at: string;
  hub_name?: string;
  shelf_code?: string;
}

class MasterService {
  // ==================== COUNTRIES ====================

  async getCountries(status: 'active' | 'inactive' | 'all' = 'active'): Promise<Country[]> {
    const response = await apiGet<Country[]>('getCountries', { status });
    return response.data || [];
  }

  async getCountry(id: number): Promise<Country> {
    const response = await apiRequest<Country>('getCountry', { id });
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Country not found');
  }

  async createCountry(data: CreateCountryRequest): Promise<Country> {
    const response = await apiRequest<Country>('createCountry', data);
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create country');
  }

  async updateCountry(data: UpdateCountryRequest): Promise<Country> {
    const response = await apiRequest<Country>('updateCountry', data);
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update country');
  }

  async deleteCountry(id: number): Promise<void> {
    const response = await apiRequest('deleteCountry', { id });
    if (!response.status) {
      throw new Error(response.error || 'Failed to delete country');
    }
  }

  // ==================== VENDORS ====================

  async getVendors(status: 'active' | 'inactive' | 'all' = 'active'): Promise<Vendor[]> {
    const response = await apiRequest<Vendor[]>('getVendors', { status });
    return response.data || [];
  }

  async getVendor(id: number): Promise<Vendor> {
    const response = await apiRequest<Vendor>('getVendor', { id });
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Vendor not found');
  }

  async createVendor(data: CreateVendorRequest): Promise<Vendor> {
    const response = await apiRequest<Vendor>('createVendor', data);
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create vendor');
  }

  async updateVendor(id: number, data: Partial<CreateVendorRequest>): Promise<Vendor> {
    const response = await apiRequest<Vendor>('updateVendor', { id, ...data });
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update vendor');
  }

  // ==================== HUBS ====================

  async getHubs(filters?: { status?: string; country_id?: number; vendor_id?: number }): Promise<Hub[]> {
    const response = await apiGet<Hub[]>('getHubs', { status: 'active', ...filters });
    return response.data || [];
  }

  async getHub(id: number): Promise<Hub> {
    const response = await apiRequest<Hub>('getHub', { id });
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Hub not found');
  }

  async createHub(data: CreateHubRequest): Promise<Hub> {
    const response = await apiRequest<Hub>('createHub', data);
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create hub');
  }

  async updateHub(id: number, data: Partial<CreateHubRequest>): Promise<Hub> {
    const response = await apiRequest<Hub>('updateHub', { id, ...data });
    if (response.status && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update hub');
  }

  // ==================== LOCATIONS ====================

  async getLocations(status: 'active' | 'inactive' | 'all' = 'active'): Promise<Location[]> {
    const response = await apiGet<Location[]>('getLocations', { status });
    return response.data || [];
  }

  async createLocation(data: CreateLocationRequest): Promise<{ id: number }> {
    const response = await apiRequest<{ id: number }>('createLocation', data);
    if (response.status) {
      return { id: response.id || 0 };
    }
    throw new Error(response.error || 'Failed to create location');
  }

  // ==================== FLEET MANAGERS ====================

  async getFleetManagers(hubId?: number): Promise<FleetManager[]> {
    const response = await apiRequest<FleetManager[]>('getFleetManagers', { hub_id: hubId });
    return response.data || [];
  }

  async createFleetManager(data: CreateFleetManagerRequest): Promise<{ id: number }> {
    const response = await apiRequest<{ id: number }>('createFleetManager', data);
    if (response.status) {
      return { id: response.id || 0 };
    }
    throw new Error(response.error || 'Failed to create fleet manager');
  }

  async updateFleetManager(data: UpdateFleetManagerRequest): Promise<void> {
    const response = await apiRequest('updateFleetManager', data);
    if (!response.status) {
      throw new Error(response.error || 'Failed to update fleet manager');
    }
  }

  // ==================== WAREHOUSE ====================

  async getShelves(hubId: number): Promise<Shelf[]> {
    const response = await apiGet<Shelf[]>('getShelves', { hub_id: hubId });
    return response.data || [];
  }

  async getShelvesByHub(hubId: number): Promise<Shelf[]> {
    return this.getShelves(hubId);
  }

  async createShelf(hubId: number, shelfCode: string, shelfName?: string, aisle?: string, section?: string): Promise<{ id: number }> {
    const response = await apiRequest<{ id: number }>('createShelf', {
      hub_id: hubId,
      shelf_code: shelfCode,
      shelf_name: shelfName,
      aisle,
      section,
    });
    if (response.status) {
      return { id: response.id || 0 };
    }
    throw new Error(response.error || 'Failed to create shelf');
  }

  async updateShelf(shelfId: number, shelfCode: string, shelfName?: string, aisle?: string, section?: string): Promise<void> {
    const response = await apiRequest('updateShelf', {
      id: shelfId,
      shelf_code: shelfCode,
      shelf_name: shelfName,
      aisle,
      section,
    });
    if (!response.status) {
      throw new Error(response.error || 'Failed to update shelf');
    }
  }

  async deleteShelf(shelfId: number): Promise<void> {
    const response = await apiRequest('deleteShelf', {
      id: shelfId,
    });
    if (!response.status) {
      throw new Error(response.error || 'Failed to delete shelf');
    }
  }

  async getContainers(hubId?: number, status?: string): Promise<Container[]> {
    const params: Record<string, any> = {};
    if (hubId !== undefined && hubId !== null) {
      params.hub_id = hubId;
    }
    if (status) {
      params.status = status;
    }
    const response = await apiGet<Container[]>('getContainers', params);
    return response.data || [];
  }

  async getContainersByHub(hubId: number): Promise<Container[]> {
    return this.getContainers(hubId);
  }

  async createContainer(hubId: number, containerCode: string, containerType: string = 'medium', shelfId?: number): Promise<{ id: number }> {
    const response = await apiRequest<{ id: number }>('createContainer', {
      hub_id: hubId,
      container_code: containerCode,
      container_type: containerType,
      shelf_id: shelfId,
    });
    if (response.status) {
      return { id: response.id || 0 };
    }
    throw new Error(response.error || 'Failed to create container');
  }

  async updateContainer(containerId: number, containerCode: string, containerType: string, hubId: number, shelfId?: number): Promise<void> {
    const response = await apiRequest('updateContainer', {
      id: containerId,
      container_code: containerCode,
      container_type: containerType,
      hub_id: hubId,
      shelf_id: shelfId,
    });
    if (!response.status) {
      throw new Error(response.error || 'Failed to update container');
    }
  }

  async deleteContainer(containerId: number): Promise<void> {
    const response = await apiRequest('deleteContainer', {
      id: containerId,
    });
    if (!response.status) {
      throw new Error(response.error || 'Failed to delete container');
    }
  }

  async markContainerFull(containerId: number): Promise<Container> {
    const response = await apiRequest<Container>('markContainerFull', {
      container_id: containerId,
    });
    if (!response.status || !response.data) {
      throw new Error(response.error || 'Failed to mark container as full');
    }
    return response.data;
  }
}

export const masterService = new MasterService();
