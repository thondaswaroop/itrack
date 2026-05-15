# Frontend Implementation Guide - Transport Mode Handling

## Overview
This document outlines all frontend changes needed to support transport mode-specific workflows (AIR, OCEAN, GROUND) with the READY_TO_SHIP status.

---

## ✅ Completed Changes

### 1. **Status Type Definition** (`src/constants/shipmentStatus.ts`)
- ✅ Added `READY_TO_SHIP` to `ShipmentStatus` type
- ✅ Added `READY_TO_SHIP` stage configuration with display stage 'CONSOLIDATION'

### 2. **Load/Scan Package Page** (`src/pages/shipments/ScanPackage.tsx`)
- ✅ Added transport-specific state fields:
  - `vehicleId` - For GROUND transport
  - `flightNumber`, `airline` - For AIR transport  
  - `vesselName`, `vesselNumber`, `carrierName` - For OCEAN transport
- ✅ Updated CONSOLIDATED step to show different controls based on transport mode:
  - **GROUND**: Shows vehicle ID input + "Dispatch Now" button
  - **AIR/OCEAN**: Shows "Mark Ready to Ship" button
- ✅ Added new READY_TO_SHIP case with mode-specific inputs:
  - **AIR**: Flight number + Airline inputs
  - **OCEAN**: Vessel name + Container number + Carrier inputs
- ✅ Updated dispatch logic to validate and send transport-specific data

### 3. **Status Display Components**
- ✅ **StatusPill** (`src/components/ui/dashboard/StatusPill.tsx`)
  - Added `READY_TO_SHIP` type
  - Added purple color scheme: `"bg-purple-500/10 text-purple-600"`

- ✅ **Arrival Page** (`src/pages/shipments/Arrival.tsx`)
  - Added `READY_TO_SHIP` case with 'info' badge color

### 4. **API Service** (`src/services/shipment.service.ts`)
- ✅ Updated `updateShipmentStatus` method signature to accept optional `transportData` parameter
- ✅ Transport data includes: vehicle_id, flight_number, airline, vessel_name, vessel_number, carrier_name

---

## 🔄 Recommended Additional Enhancements

### 1. **Create Ready-to-Ship Scanning Page** (Similar to Arrival)
**File**: `src/pages/shipments/ReadyToShip.tsx` (NEW)

**Purpose**: Bulk scanning page for AIR/OCEAN shipments to mark them as ready for dispatch

**Features**:
- Scan multiple packages that are CONSOLIDATED
- Filter by transport mode (AIR or OCEAN)
- Show consolidated packages grouped by container
- Bulk action: Mark all scanned as READY_TO_SHIP
- Display transport mode indicator for each package

**Example Implementation**:
```tsx
// src/pages/shipments/ReadyToShip.tsx
import React, { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
// ... similar to Arrival.tsx but for CONSOLIDATED → READY_TO_SHIP transition

const ReadyToShip: React.FC = () => {
  // Scan packages with status CONSOLIDATED
  // Filter by transport mode (AIR/OCEAN only)
  // Bulk mark as READY_TO_SHIP
  // Show container grouping
  
  return (
    <div className="space-y-6">
      <ComponentCard title="Ready to Ship - AIR/OCEAN Packages">
        {/* Scanning interface */}
      </ComponentCard>
    </div>
  );
};

export default ReadyToShip;
```

**Add to Navigation** (`src/navigation/index.tsx`):
```tsx
import ReadyToShip from "../pages/shipments/ReadyToShip";

// Add route
<Route path="/ready-to-ship" element={<ReadyToShip />} />
```

**Add to Menu** (`src/navigation/config/navigation.ts`):
```tsx
{
  label: "Ready to Ship",
  href: "/ready-to-ship",
  icon: "plane", // or shipping icon
  roles: [Role.ADMIN, Role.VENDOR, Role.ASSOCIATE]
}
```

---

### 2. **Display Transport Details in Receipt**
**File**: `src/pages/shipments/ShipmentReceiptPage.tsx`

**Add transport tracking section**:
```tsx
// After transportMode display, add:
{(vehicleId || flightNumber || vesselName) && (
  <div className="border border-gray-300 p-3 print:p-2 mb-4 print:mb-3">
    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b print:mb-1">
      Transport Details
    </h3>
    <div className="grid grid-cols-2 gap-3 text-sm print:text-xs">
      {vehicleId && (
        <div>
          <p className="text-xs text-gray-500 print:text-[10px]">Vehicle ID</p>
          <p className="font-semibold text-gray-900">{vehicleId}</p>
        </div>
      )}
      {flightNumber && (
        <>
          <div>
            <p className="text-xs text-gray-500 print:text-[10px]">Flight Number</p>
            <p className="font-semibold text-gray-900">{flightNumber}</p>
          </div>
          {airline && (
            <div>
              <p className="text-xs text-gray-500 print:text-[10px]">Airline</p>
              <p className="font-semibold text-gray-900">{airline}</p>
            </div>
          )}
        </>
      )}
      {vesselName && (
        <>
          <div>
            <p className="text-xs text-gray-500 print:text-[10px]">Vessel Name</p>
            <p className="font-semibold text-gray-900">{vesselName}</p>
          </div>
          {vesselNumber && (
            <div>
              <p className="text-xs text-gray-500 print:text-[10px]">Container Number</p>
              <p className="font-semibold text-gray-900">{vesselNumber}</p>
            </div>
          )}
          {carrierName && (
            <div>
              <p className="text-xs text-gray-500 print:text-[10px]">Carrier</p>
              <p className="font-semibold text-gray-900">{carrierName}</p>
            </div>
          )}
        </>
      )}
    </div>
  </div>
)}
```

**Update ReceiptData interface**:
```tsx
interface ReceiptData {
  // ... existing fields
  vehicleId?: string;
  flightNumber?: string;
  airline?: string;
  vesselName?: string;
  vesselNumber?: string;
  carrierName?: string;
}
```

---

### 3. **Dashboard Enhancements**
**File**: `src/pages/dashboard/Home.tsx`

**Add READY_TO_SHIP metrics**:
```tsx
// Add to dashboard stats
<div className="bg-purple-50 rounded-lg p-4">
  <div className="text-2xl font-bold text-purple-900">
    {stats.readyToShip}
  </div>
  <div className="text-sm text-purple-600">Ready to Ship (Air/Ocean)</div>
</div>
```

**Add transport mode breakdown**:
```tsx
<ComponentCard title="Shipments by Transport Mode">
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Icon name="truck" className="h-4 w-4" />
        Ground
      </span>
      <span className="font-semibold">{stats.ground}</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Icon name="plane" className="h-4 w-4" />
        Air
      </span>
      <span className="font-semibold">{stats.air}</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Icon name="ship" className="h-4 w-4" />
        Ocean
      </span>
      <span className="font-semibold">{stats.ocean}</span>
    </div>
  </div>
</ComponentCard>
```

---

### 4. **Shipment Details/Tracking Page**
**File**: Create `src/pages/shipments/ShipmentDetails.tsx` (if not exists)

**Show complete shipment timeline with transport details**:
```tsx
<div className="space-y-4">
  {/* Status Timeline */}
  <div className="border-l-2 border-gray-300 pl-4 space-y-4">
    {/* READY_TO_SHIP Event */}
    {shipment.ready_to_ship_at && (
      <div className="relative">
        <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-white"></div>
        <div className="text-sm font-semibold">Ready to Ship</div>
        <div className="text-xs text-gray-500">
          {new Date(shipment.ready_to_ship_at).toLocaleString()}
        </div>
      </div>
    )}
    
    {/* DISPATCHED Event - with transport details */}
    {shipment.dispatched_at && (
      <div className="relative">
        <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
        <div className="text-sm font-semibold">Dispatched</div>
        <div className="text-xs text-gray-500">
          {new Date(shipment.dispatched_at).toLocaleString()}
        </div>
        {/* Transport details */}
        {shipment.vehicle_id && (
          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
            🚚 Vehicle: <span className="font-mono">{shipment.vehicle_id}</span>
          </div>
        )}
        {shipment.flight_number && (
          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
            ✈️ Flight: <span className="font-mono">{shipment.flight_number}</span> - {shipment.airline}
          </div>
        )}
        {shipment.vessel_name && (
          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
            🚢 Vessel: <span className="font-mono">{shipment.vessel_name}</span>
            {shipment.vessel_number && (
              <div>Container: {shipment.vessel_number}</div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
</div>
```

---

### 5. **API Response Types**
**File**: `src/services/shipment.service.ts`

**Update shipment type interfaces**:
```typescript
export interface Shipment {
  id: number;
  tracking_number: string;
  wr_number: string;
  current_status: ShipmentStatus;
  transport_mode: 'AIR' | 'OCEAN' | 'GROUND';
  
  // Transport tracking fields
  vehicle_id?: string;
  flight_number?: string;
  airline?: string;
  vessel_name?: string;
  vessel_number?: string;
  carrier_name?: string;
  
  // Timestamps
  ready_to_ship_at?: string;
  dispatched_at?: string;
  // ... other fields
}
```

---

### 6. **Validation Helpers**
**File**: `src/utils/shipmentValidation.ts` (NEW)

```typescript
export const requiresReadyToShip = (transportMode: string): boolean => {
  return transportMode === 'AIR' || transportMode === 'OCEAN';
};

export const getTransportIcon = (transportMode: string): string => {
  switch (transportMode) {
    case 'AIR': return '✈️';
    case 'OCEAN': return '🚢';
    case 'GROUND': return '🚚';
    default: return '📦';
  }
};

export const getRequiredTransportFields = (transportMode: string): string[] => {
  switch (transportMode) {
    case 'AIR': return ['flight_number', 'airline'];
    case 'OCEAN': return ['vessel_name', 'vessel_number'];
    case 'GROUND': return ['vehicle_id'];
    default: return [];
  }
};
```

---

### 7. **Notification/Alert Updates**
**File**: Various files using status updates

**Update success messages to be transport-aware**:
```typescript
// In ScanPackage.tsx after successful dispatch
const successMessage = shipmentData.transport_mode === 'GROUND'
  ? `Package dispatched via Ground (Vehicle: ${vehicleId})`
  : shipmentData.transport_mode === 'AIR'
  ? `Package dispatched via Air (Flight: ${flightNumber})`
  : `Package dispatched via Ocean (Vessel: ${vesselName})`;
  
alert(`✓ ${successMessage}`);
```

---

## 🎨 UI/UX Improvements

### Status Badge Icons
Add transport mode icons to status displays:
```tsx
const getStatusIcon = (status: string, transportMode?: string) => {
  if (status === 'READY_TO_SHIP') {
    return transportMode === 'AIR' ? '✈️' : transportMode === 'OCEAN' ? '🚢' : '📦';
  }
  if (status === 'DISPATCHED') {
    return transportMode === 'GROUND' ? '🚚' : transportMode === 'AIR' ? '✈️' : '🚢';
  }
  // ... other statuses
};
```

### Loading States
Add skeleton loaders when fetching container packages:
```tsx
{loadingContainerPackages && (
  <div className="space-y-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
    ))}
  </div>
)}
```

### Empty States
Improve empty state for READY_TO_SHIP scanning:
```tsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">✈️🚢</div>
  <h3 className="text-lg font-medium mb-2">Ready to Ship Scanner</h3>
  <p className="text-gray-500 mb-6">
    Scan consolidated AIR/OCEAN packages to mark them ready for dispatch
  </p>
</div>
```

---

## 📊 Reporting Enhancements

### Add transport mode reports:
1. **Dispatch Performance by Transport Mode**
2. **Average Ready-to-Ship Duration** (CONSOLIDATED → DISPATCHED time for AIR/OCEAN)
3. **Carrier Performance** (for AIR/OCEAN)
4. **Vehicle Utilization** (for GROUND)

---

## ✅ Testing Checklist

- [ ] GROUND shipments can dispatch directly from CONSOLIDATED
- [ ] AIR shipments require READY_TO_SHIP before dispatch
- [ ] OCEAN shipments require READY_TO_SHIP before dispatch
- [ ] Flight details are required for AIR dispatch
- [ ] Vessel details are required for OCEAN dispatch
- [ ] Vehicle ID is required for GROUND dispatch
- [ ] Status badges show correct colors for READY_TO_SHIP
- [ ] Container package list loads when container selected
- [ ] Transport details appear in receipts and tracking
- [ ] Arrival scanning works for all statuses including READY_TO_SHIP

---

## 🚀 Deployment Steps

1. ✅ Run database migration (already created)
2. ✅ Update type definitions (completed)
3. ✅ Update ScanPackage page (completed)
4. ✅ Update status display components (completed)
5. ⏳ Create ReadyToShip bulk scanning page (optional)
6. ⏳ Add transport details to receipts (optional)
7. ⏳ Update dashboard metrics (optional)
8. Test complete flow for each transport mode

---

## 📝 Summary

**Completed Frontend Changes:**
- ✅ Core type definitions with READY_TO_SHIP
- ✅ ScanPackage page with transport-specific inputs
- ✅ Status badge components updated
- ✅ API service method updated with transport data support

**Recommended Next Steps:**
1. Create dedicated ReadyToShip scanning page for bulk operations
2. Add transport detail display to receipts and tracking pages
3. Enhance dashboard with transport mode breakdown
4. Add comprehensive shipment detail timeline view

The system now has **full backend and core frontend support** for transport mode-specific workflows. Additional enhancements listed above will improve UX and operational efficiency but are not critical for basic functionality.
