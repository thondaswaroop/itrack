// Shipment status constants and stage definitions

export type ShipmentStatus = 
  | 'RECEIVED' 
  | 'CONSOLIDATED'
  | 'READY_TO_SHIP' 
  | 'DISPATCHED'
  | 'SHIPPED' 
  | 'IN_TRANSIT' 
  | 'ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export interface ShipmentStage {
  key: ShipmentStatus;
  label: string;
  description: string;
  displayStage: 'RECEIVED' | 'CONSOLIDATION' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED';
}

export const SHIPMENT_STAGES: ShipmentStage[] = [
  {
    key: 'RECEIVED',
    label: 'Received',
    description: 'Package received',
    displayStage: 'RECEIVED'
  },
  {
    key: 'CONSOLIDATED',
    label: 'Consolidation',
    description: 'In consolidation',
    displayStage: 'CONSOLIDATION'
  },
  {
    key: 'READY_TO_SHIP',
    label: 'Ready to Ship',
    description: 'Ready for dispatch (Air/Ocean)',
    displayStage: 'CONSOLIDATION'
  },
  {
    key: 'DISPATCHED',
    label: 'Dispatched from Hub',
    description: 'Shipment dispatched from origin hub',
    displayStage: 'SHIPPED'
  },
  {
    key: 'SHIPPED',
    label: 'Dispatched from Hub',
    description: 'Shipment dispatched from origin hub',
    displayStage: 'SHIPPED'
  },
  {
    key: 'IN_TRANSIT',
    label: 'In Transit',
    description: 'Shipment in transit to destination',
    displayStage: 'IN_TRANSIT'
  },
  {
    key: 'ARRIVED',
    label: 'Arrived at Destination',
    description: 'Arrived at destination hub',
    displayStage: 'DELIVERED'
  },
  {
    key: 'READY_FOR_PICKUP',
    label: 'Ready for Pickup',
    description: 'Available for customer pickup',
    displayStage: 'DELIVERED'
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'Package out for final delivery',
    displayStage: 'DELIVERED'
  },
  {
    key: 'COLLECTED',
    label: 'Collected by Customer',
    description: 'Package collected from hub',
    displayStage: 'DELIVERED'
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    description: 'Successfully delivered to consignee',
    displayStage: 'DELIVERED'
  },
  {
    key: 'RETURNED',
    label: 'Returned',
    description: 'Package returned to sender',
    displayStage: 'DELIVERED'
  },
  {
    key: 'CANCELLED',
    label: 'Cancelled',
    description: 'Shipment cancelled',
    displayStage: 'DELIVERED'
  }
];

// Display stages for UI (simplified 5-stage view)
export const DISPLAY_STAGES = [
  { key: 'RECEIVED', label: 'Received', icon: '📦' },
  { key: 'CONSOLIDATION', label: 'Consolidation', icon: '📋' },
  { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: '✈️' },
  { key: 'DELIVERED', label: 'Delivered', icon: '✅' }
];

export const getStageIndex = (status: ShipmentStatus): number => {
  return SHIPMENT_STAGES.findIndex(stage => stage.key === status);
};

export const getDisplayStage = (status: ShipmentStatus): string => {
  const stage = SHIPMENT_STAGES.find(s => s.key === status);
  return stage?.displayStage || 'RECEIVED';
};

export const getDisplayStageIndex = (status: ShipmentStatus): number => {
  const displayStage = getDisplayStage(status);
  return DISPLAY_STAGES.findIndex(s => s.key === displayStage);
};

export const getCompletedStages = (status: ShipmentStatus): ShipmentStatus[] => {
  const currentIndex = getStageIndex(status);
  return SHIPMENT_STAGES.slice(0, currentIndex).map(stage => stage.key);
};

export const getActiveStage = (status: ShipmentStatus): ShipmentStatus => {
  return status;
};

export const getRemainingStages = (status: ShipmentStatus): ShipmentStatus[] => {
  const currentIndex = getStageIndex(status);
  return SHIPMENT_STAGES.slice(currentIndex + 1).map(stage => stage.key);
};
