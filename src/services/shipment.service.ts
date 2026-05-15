// Shipment Service
import { apiRequest } from './api';

// ==================== PARTIES ====================

export interface Party {
  id: number;
  party_type: 'customer' | 'shipper' | 'consignee' | 'both';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  company_name?: string;
  tax_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreatePartyRequest {
  party_type?: 'customer' | 'shipper' | 'consignee' | 'both';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  company_name?: string;
  tax_id?: string;
}

export interface CreateShipmentRequest {
  wr_number?: string;
  tracking_number?: string;
  origin_hub_id: number;
  destination_hub_id: number;
  transport_mode: 'AIR' | 'OCEAN' | 'GROUND';
  service_type?: 'express' | 'standard' | 'economy';
  payment_type?: 'prepaid' | 'collect' | 'third_party' | 'partial_payment';
  total_amount?: number;
  paid_amount?: number;
  
  // Can use party IDs or inline data
  shipper_id?: number;
  consignee_id?: number;
  
  // Shipper details (if not using shipper_id)
  shipper_name?: string;
  shipper_phone?: string;
  shipper_email?: string;
  shipper_address?: string;
  shipper_city?: string;
  shipper_country?: string;
  shipper_postal_code?: string;
  
  // Consignee details (if not using consignee_id)
  consignee_name?: string;
  consignee_phone?: string;
  consignee_email?: string;
  consignee_address?: string;
  consignee_city?: string;
  consignee_country?: string;
  consignee_postal_code?: string;
  
  // Package details array
  packages: Array<{
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    description: string;
    declared_value?: number;
    quantity?: number;
  }>;
  
  total_amount?: number;
  currency?: string;
  notes?: string;
  special_instructions?: string;
}

export interface Shipment {
  id: number;
  tracking_number: string;
  wr_number: string;
  customer_id?: number;
  origin_hub_id: number;
  destination_hub_id: number;
  current_hub_id?: number;
  origin_hub_name?: string;
  origin_hub_code?: string;
  destination_hub_name?: string;
  destination_hub_code?: string;
  current_hub_name?: string;
  transport_mode: string;
  service_type: string;
  payment_type: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  
  shipper_name: string;
  shipper_phone: string;
  shipper_email?: string;
  shipper_address: string;
  shipper_city?: string;
  shipper_country?: string;
  shipper_postal_code?: string;
  
  consignee_name: string;
  consignee_phone: string;
  consignee_email?: string;
  consignee_address: string;
  consignee_city?: string;
  consignee_country?: string;
  consignee_postal_code?: string;
  
  current_status: string;
  
  received_at?: string;
  consolidated_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  expected_delivery_date?: string;
  
  created_at: string;
  updated_at: string;
  notes?: string;
  special_instructions?: string;
  tracking_events?: Array<{ status: string; timestamp: string; location_name?: string }>;
}

export interface Package {
  id: number;
  shipment_id: number;
  package_code: string;
  container_id?: number;
  shelf_id?: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  volumetric_weight?: number;
  description: string;
  declared_value?: number;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  container_code?: string;
  shelf_code?: string;
}

export interface TrackingEvent {
  id: number;
  shipment_id: number;
  package_id?: number;
  status: string;
  location_hub_id?: number;
  location_name?: string;
  description: string;
  timestamp: string;
  updated_by_user_id?: number;
  hub_name?: string;
  hub_code?: string;
  updated_by?: string;
}

export interface TrackingResponse {
  shipment: Shipment & {
    origin_hub_name?: string;
    origin_hub_code?: string;
    destination_hub_name?: string;
    destination_hub_code?: string;
    current_hub_name?: string;
  };
  packages: Package[];
  tracking_history: TrackingEvent[];
}

export interface ConsolidatePackageRequest {
  package_id: number;
  container_id: number;
  shelf_id?: number;
}

export interface ScanPackageResponse {
  shipment: Shipment;
  packages: Package[];
  scanned_package?: Package;
}

class ShipmentService {
  // ==================== PARTIES ====================
  
  /**
   * Get parties (customers/shippers/consignees)
   */
  async getParties(search?: string, type?: string): Promise<Party[]> {
    const response = await apiRequest<{ data: Party[] }>('getParties', {
      search,
      type,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    return [];
  }

  /**
   * Create new party
   */
  async createParty(data: CreatePartyRequest): Promise<Party> {
    const response = await apiRequest<{ data: Party }>('createParty', data);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create party');
  }

  /**
   * Update existing party
   */
  async updateParty(partyId: number, data: Partial<CreatePartyRequest>): Promise<Party> {
    const response = await apiRequest<{ data: Party }>('updateParty', {
      party_id: partyId,
      ...data,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update party');
  }

  // ==================== SHIPMENTS ====================
  
  /**
   * Create new shipment (STEP 1: Receiving)
   */
  async createShipment(data: CreateShipmentRequest): Promise<{ shipment: Shipment & { packages: Package[] }; tracking_number: string; wr_number: string }> {
    const response = await apiRequest<{ 
      data: Shipment & { packages: Package[] };
      tracking_number: string;
      wr_number: string;
    }>('createShipment', data);
    
    if (response.status && response.data) {
      return {
        shipment: response.data,
        tracking_number: response.tracking_number || '',
        wr_number: response.wr_number || '',
      };
    }
    
    throw new Error(response.error || 'Failed to create shipment');
  }

  /**
   * Get shipments with optional filters
   */
  async getShipments(search?: string, status?: string, hubId?: number): Promise<Shipment[]> {
    const response = await apiRequest<{ data: Shipment[] }>('getShipments', {
      search,
      status,
      hub_id: hubId,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    return [];
  }

  /**
   * Get shipment details
   */
  async getShipmentDetails(shipmentId?: number, trackingNumber?: string): Promise<Shipment & { packages: Package[]; tracking: TrackingEvent[] }> {
    const response = await apiRequest<{ data: Shipment & { packages: Package[]; tracking: TrackingEvent[] } }>('getShipmentDetails', {
      shipment_id: shipmentId,
      tracking_number: trackingNumber,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Shipment not found');
  }

  /**
   * Consolidate package (STEP 2: Consolidation)
   */
  async consolidatePackage(data: ConsolidatePackageRequest): Promise<void> {
    const response = await apiRequest('consolidatePackage', data);
    
    if (!response.status) {
      throw new Error(response.error || 'Failed to consolidate package');
    }
  }

  /**
   * Update shipment status (STEP 3+: Movement)
   */
  async updateShipmentStatus(
    shipmentId: number, 
    status: string, 
    locationHubId?: number, 
    description?: string, 
    transportData?: {
      vehicle_id?: string;
      flight_number?: string;
      airline?: string;
      vessel_name?: string;
      vessel_number?: string;
      carrier_name?: string;
    }
  ): Promise<void> {
    const response = await apiRequest('updateShipmentStatus', {
      shipment_id: shipmentId,
      status,
      location_hub_id: locationHubId,
      description,
      ...transportData,
    });
    
    if (!response.status) {
      throw new Error(response.error || 'Failed to update shipment status');
    }
  }

  /**
   * Update package status
   */
  async updatePackageStatus(packageId: number, status: string): Promise<void> {
    const response = await apiRequest('updatePackageStatus', {
      package_id: packageId,
      status,
    });
    
    if (!response.status) {
      throw new Error(response.error || 'Failed to update package status');
    }
  }

  /**
   * Track shipment by tracking number
   */
  async trackByTrackingNumber(trackingNumber: string): Promise<TrackingResponse> {
    const response = await apiRequest<TrackingResponse>('trackShipment', {
      tracking_number: trackingNumber,
    });
    
    if (response.status && response.shipment) {
      return {
        shipment: response.shipment,
        packages: response.packages || [],
        tracking_history: response.tracking_history || [],
      };
    }
    
    throw new Error(response.error || 'Shipment not found');
  }

  /**
   * Track shipment by WR number
   */
  async trackByWRNumber(wrNumber: string): Promise<TrackingResponse> {
    const response = await apiRequest<TrackingResponse>('trackShipment', {
      wr_number: wrNumber,
    });
    
    if (response.status && response.shipment) {
      return {
        shipment: response.shipment,
        packages: response.packages || [],
        tracking_history: response.tracking_history || [],
      };
    }
    
    throw new Error(response.error || 'Shipment not found');
  }

  /**
   * Scan package/shipment
   */
  async scanPackage(code: string): Promise<ScanPackageResponse> {
    const response = await apiRequest<ScanPackageResponse>('scanPackage', {
      code,
    });
    
    if (response.status && response.shipment) {
      return {
        shipment: response.shipment,
        packages: response.packages || [],
        scanned_package: response.scanned_package,
      };
    }
    
    throw new Error(response.error || 'Package/Shipment not found');
  }

  /**
   * Scan package at hub - automatically updates location and status based on scanning hub
   */
  async scanPackageAtHub(code: string): Promise<ScanPackageResponse & { status_updated?: boolean; new_status?: string; message?: string }> {
    const response = await apiRequest<ScanPackageResponse & { status_updated?: boolean; new_status?: string; message?: string }>('scanPackageAtHub', {
      code,
    });
    
    if (response.status && response.shipment) {
      return {
        shipment: response.shipment,
        packages: response.packages || [],
        scanned_package: response.scanned_package,
        status_updated: response.status_updated,
        new_status: response.new_status,
        message: response.message,
      };
    }
    
    throw new Error(response.error || 'Package/Shipment not found');
  }

  /**
   * Get recent shipments
   */
  async getRecentShipments(hubId?: number, limit: number = 10): Promise<Shipment[]> {
    const response = await apiRequest<Shipment[]>('getRecentShipments', {
      hub_id: hubId,
      limit,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    return [];
  }

  /**
   * Get packages by container ID
   */
  async getPackagesByContainer(containerId: number): Promise<any[]> {
    const response = await apiRequest<any[]>('getPackagesByContainer', {
      container_id: containerId,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    return [];
  }
}

export const shipmentService = new ShipmentService();
