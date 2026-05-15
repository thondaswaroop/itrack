# Transport Mode-Specific Shipment Flow

This document explains how different transport modes (AIR, OCEAN, GROUND) are handled in the iTrack system.

## Overview

The system now supports three transport modes with different workflows:
- **GROUND**: Direct dispatch with vehicle tracking
- **AIR**: Requires "Ready to Ship" scanning before dispatch with flight details
- **OCEAN**: Requires "Ready to Ship" scanning before dispatch with vessel details

## Status Flow

### GROUND Transport
```
RECEIVED → CONSOLIDATED → DISPATCHED → IN_TRANSIT → ARRIVED → READY_FOR_PICKUP → DELIVERED
```

**Key Points:**
- Skips READY_TO_SHIP status
- Requires vehicle/truck ID during dispatch
- Can dispatch immediately after consolidation

### AIR Transport
```
RECEIVED → CONSOLIDATED → READY_TO_SHIP → DISPATCHED → IN_TRANSIT → ARRIVED → READY_FOR_PICKUP → DELIVERED
```

**Key Points:**
- Requires READY_TO_SHIP status before dispatch
- Scanning process similar to arrival (all packages must be scanned)
- Requires flight number and airline during dispatch
- READY_TO_SHIP acts as a quality check before actual shipment

### OCEAN Transport
```
RECEIVED → CONSOLIDATED → READY_TO_SHIP → DISPATCHED → IN_TRANSIT → ARRIVED → READY_FOR_PICKUP → DELIVERED
```

**Key Points:**
- Requires READY_TO_SHIP status before dispatch
- Scanning process similar to arrival (all packages must be scanned)
- Requires vessel name, container/vessel number, and carrier name during dispatch
- READY_TO_SHIP acts as a quality check before actual shipment

## Database Changes

### New Fields in `shipments` table:
- `vehicle_id` VARCHAR(100) - For GROUND transport
- `flight_number` VARCHAR(100) - For AIR transport
- `airline` VARCHAR(100) - For AIR transport
- `vessel_name` VARCHAR(100) - For OCEAN transport
- `vessel_number` VARCHAR(100) - For OCEAN transport
- `carrier_name` VARCHAR(100) - For OCEAN/AIR transport
- `ready_to_ship_at` TIMESTAMP - When marked ready for dispatch

### Updated Enum Values:
- `shipments.current_status` now includes 'READY_TO_SHIP'
- `packages.status` now includes 'READY_TO_SHIP'

## UI Changes

### Load/Scan Package Page
The consolidation step now shows different options based on transport mode:

**For GROUND:**
- Shows "Vehicle/Truck ID" input field
- Shows "Dispatch Now" button
- Directly moves to DISPATCHED status

**For AIR/OCEAN:**
- Shows "Mark Ready to Ship" button
- Moves to READY_TO_SHIP status
- Requires scanning before dispatch

### READY_TO_SHIP Status
When shipment is in READY_TO_SHIP status:

**For AIR:**
- Shows flight number input
- Shows airline name input
- "Dispatch via AIR" button

**For OCEAN:**
- Shows vessel/ship name input
- Shows container/vessel number input
- Shows shipping line/carrier input (optional)
- "Dispatch via OCEAN" button

## Migration Steps

1. **Run the migration SQL:**
   ```bash
   mysql -u username -p database_name < api_db/db/migration_transport_tracking.sql
   ```

2. **Verify database changes:**
   ```sql
   DESCRIBE shipments;
   SHOW COLUMNS FROM shipments LIKE 'current_status';
   ```

3. **Test the flow:**
   - Create test shipments for each transport mode
   - Verify GROUND can skip READY_TO_SHIP
   - Verify AIR/OCEAN require READY_TO_SHIP scanning

## API Updates

### `updateShipmentStatus` Endpoint
Now accepts additional parameters:
- `vehicle_id` - For GROUND transport
- `flight_number` - For AIR transport
- `airline` - For AIR transport
- `vessel_name` - For OCEAN transport
- `vessel_number` - For OCEAN transport
- `carrier_name` - For OCEAN transport

Example request for AIR dispatch:
```json
{
  "action": "updateShipmentStatus",
  "shipment_id": 123,
  "status": "DISPATCHED",
  "flight_number": "EK524",
  "airline": "Emirates",
  "description": "Dispatched via AIR"
}
```

Example request for GROUND dispatch:
```json
{
  "action": "updateShipmentStatus",
  "shipment_id": 124,
  "status": "DISPATCHED",
  "vehicle_id": "TRK-001",
  "description": "Dispatched via GROUND"
}
```

## Benefits

1. **Better Tracking:** Transport-specific identifiers (flight numbers, vessel names, vehicle IDs)
2. **Quality Control:** READY_TO_SHIP status for air/ocean provides verification step
3. **Flexibility:** Different workflows for different transport modes
4. **Audit Trail:** Timestamps for each status transition
5. **Reporting:** Can track performance by transport mode and carrier

## Future Enhancements

- Add arrival scanning for READY_TO_SHIP packages (bulk scanning similar to arrival)
- Add notifications when shipments reach READY_TO_SHIP status
- Add reports showing dispatch times by transport mode
- Add carrier/airline performance tracking
- Add integration with carrier APIs for automatic tracking updates
