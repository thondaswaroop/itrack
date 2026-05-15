# iTrack API Documentation

## Overview
Complete REST API for iTrack Logistics Management System supporting Air, Ocean, and Ground shipments across multiple countries and hubs.

---

## Database Setup

### 1. Create Database
```sql
CREATE DATABASE pmgs_itrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Import Schema
```bash
mysql -u pmgs_itrack -p pmgs_itrack < api_db/db/db.sql
```

### 3. Default Admin Credentials
- **Email:** admin@itrack.com
- **Password:** password
- **Role:** super_admin

---

## API Configuration

### Update Database Credentials
Edit `api_db/api/config.php`:
```php
$DB_HOST = "localhost";
$DB_NAME = "pmgs_itrack";
$DB_USER = "your_username";
$DB_PASS = "your_password";
```

### API Endpoint
```
https://yourdomain.com/api_db/api/api.php
```

---

## Authentication

All API requests accept a `user_id` parameter for authentication. In production, implement JWT tokens.

### Login
**Endpoint:** `?action=login`  
**Method:** POST

**Request:**
```json
{
  "action": "login",
  "email": "admin@itrack.com",
  "password": "password"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@itrack.com",
    "full_name": "Super Admin",
    "role": "super_admin",
    "status": "active"
  },
  "data": {}
}
```

### Register
**Endpoint:** `?action=register`  
**Method:** POST

**Request:**
```json
{
  "action": "register",
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Roles:** `super_admin`, `vendor`, `associate`, `customer`

---

## Master Data APIs

### Countries

#### Get All Countries
```json
{
  "action": "getCountries",
  "status": "active"  // or "all"
}
```

#### Create Country (Super Admin Only)
```json
{
  "action": "createCountry",
  "user_id": 1,
  "country_code": "US",
  "country_name": "United States",
  "currency_code": "USD",
  "phone_code": "+1"
}
```

#### Update Country
```json
{
  "action": "updateCountry",
  "user_id": 1,
  "id": 1,
  "country_name": "United States of America",
  "status": "active"
}
```

### Vendors

#### Get All Vendors
```json
{
  "action": "getVendors",
  "user_id": 1,
  "status": "active"
}
```

#### Create Vendor
```json
{
  "action": "createVendor",
  "user_id": 1,
  "vendor_name": "Express Logistics Ltd",
  "vendor_code": "EXP001",
  "email": "contact@express.com",
  "phone": "+1234567890",
  "country_id": 1
}
```

### Hubs

#### Get All Hubs
```json
{
  "action": "getHubs",
  "status": "active",
  "country_id": 1,  // optional filter
  "vendor_id": 1    // optional filter
}
```

#### Create Hub
```json
{
  "action": "createHub",
  "user_id": 1,
  "hub_name": "New York Distribution Center",
  "hub_code": "NYC-DC01",
  "country_id": 1,
  "vendor_id": 1,
  "address": "123 Industrial Park",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "contact_person": "John Manager",
  "contact_phone": "+1234567890",
  "hub_type": "all"  // origin, transit, destination, all
}
```

### Locations

#### Get All Locations
```json
{
  "action": "getLocations",
  "status": "active"
}
```

#### Create Location
```json
{
  "action": "createLocation",
  "user_id": 1,
  "location_name": "Downtown Pickup Point",
  "location_code": "DT-PP01",
  "country_id": 1,
  "hub_id": 1
}
```

### Fleet Managers (Associates)

#### Get Fleet Managers
```json
{
  "action": "getFleetManagers",
  "user_id": 1,
  "hub_id": 1  // optional
}
```

#### Create Fleet Manager
```json
{
  "action": "createFleetManager",
  "user_id": 1,
  "user_id": 5,  // User with 'associate' role
  "hub_id": 1,
  "employee_code": "EMP001",
  "designation": "Warehouse Supervisor"
}
```

---

## Warehouse Management

### Shelves

#### Get Shelves
```json
{
  "action": "getShelves",
  "hub_id": 1
}
```

#### Create Shelf
```json
{
  "action": "createShelf",
  "user_id": 1,
  "hub_id": 1,
  "shelf_code": "A-01",
  "shelf_name": "Aisle A Shelf 1",
  "aisle": "A"
}
```

### Containers

#### Get Containers
```json
{
  "action": "getContainers",
  "hub_id": 1,
  "status": "empty"  // empty, in_use, dispatched, in_transit
}
```

#### Create Container
```json
{
  "action": "createContainer",
  "user_id": 1,
  "container_code": "CNT-001",
  "container_type": "medium",  // small, medium, large, pallet, custom
  "hub_id": 1
}
```

---

## Shipment Lifecycle

### STEP 1: Receiving (New Shipment)

**This is the first step where the customer brings a package to the hub.**

```json
{
  "action": "createShipment",
  "user_id": 2,
  "origin_hub_id": 1,
  "destination_hub_id": 2,
  "transport_mode": "AIR",
  
  "shipper_name": "John Sender",
  "shipper_phone": "+1234567890",
  "shipper_email": "sender@example.com",
  "shipper_address": "123 Main St",
  "shipper_city": "New York",
  "shipper_country": "USA",
  "shipper_postal_code": "10001",
  
  "consignee_name": "Jane Receiver",
  "consignee_phone": "+9876543210",
  "consignee_email": "receiver@example.com",
  "consignee_address": "456 Oak Ave",
  "consignee_city": "Los Angeles",
  "consignee_country": "USA",
  "consignee_postal_code": "90001",
  
  "weight": 5.5,
  "description": "Electronics - Laptop",
  
  "items": [
    {
      "item_name": "Laptop",
      "quantity": 1,
      "unit_value": 1200
    },
    {
      "item_name": "Charger",
      "quantity": 1,
      "unit_value": 50
    }
  ]
}
```

**Response:**
```json
{
  "status": true,
  "message": "Shipment created successfully",
  "shipment": {
    "id": 1,
    "tracking_number": "ITK20260112ABC12345",
    "wr_number": "WR20260112XYZ123",
    "current_status": "RECEIVED",
    ...
  },
  "package": {
    "id": 1,
    "package_code": "ITK20260112ABC12345-P01",
    "weight": 5.5,
    ...
  }
}
```

### STEP 2: Consolidation

**Assign package to container and warehouse shelf.**

```json
{
  "action": "consolidatePackage",
  "user_id": 2,
  "package_id": 1,
  "container_id": 5,
  "shelf_id": 3
}
```

**Response:**
```json
{
  "status": true,
  "message": "Package consolidated successfully"
}
```

### Track Shipment

#### By Tracking Number
```json
{
  "action": "trackShipment",
  "tracking_number": "ITK20260112ABC12345"
}
```

#### By WR Number
```json
{
  "action": "trackShipment",
  "wr_number": "WR20260112XYZ123"
}
```

**Response:**
```json
{
  "status": true,
  "shipment": {
    "id": 1,
    "tracking_number": "ITK20260112ABC12345",
    "current_status": "CONSOLIDATED",
    "origin_hub_name": "New York DC",
    "destination_hub_name": "LA Distribution",
    ...
  },
  "packages": [
    {
      "id": 1,
      "package_code": "ITK20260112ABC12345-P01",
      "container_code": "CNT-001",
      "shelf_code": "A-01",
      ...
    }
  ],
  "tracking_history": [
    {
      "status": "RECEIVED",
      "hub_name": "New York DC",
      "description": "Package received at origin hub",
      "timestamp": "2026-01-12 10:30:00",
      "updated_by": "John Associate"
    },
    {
      "status": "CONSOLIDATED",
      "hub_name": "New York DC",
      "description": "Package consolidated in container",
      "timestamp": "2026-01-12 11:15:00",
      "updated_by": "John Associate"
    }
  ]
}
```

### Scan Package

**Real-time scanning for operations.**

```json
{
  "action": "scanPackage",
  "user_id": 2,
  "code": "ITK20260112ABC12345"  // Can be tracking number, WR number, or package code
}
```

**Response:**
```json
{
  "status": true,
  "shipment": { ... },
  "packages": [ ... ],
  "scanned_package": { ... }
}
```

---

## Dashboard & Reports

### Get Dashboard Statistics

```json
{
  "action": "getDashboardStats",
  "user_id": 1,
  "hub_id": 1  // optional, filter by hub
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "total_shipments": 150,
    "today_shipments": 12,
    "by_status": [
      { "current_status": "RECEIVED", "count": 25 },
      { "current_status": "CONSOLIDATED", "count": 40 },
      { "current_status": "IN_TRANSIT", "count": 50 },
      { "current_status": "DELIVERED", "count": 35 }
    ]
  }
}
```

### Get Recent Shipments

```json
{
  "action": "getRecentShipments",
  "user_id": 1,
  "hub_id": 1,  // optional
  "limit": 10
}
```

---

## Notifications

### Get Notifications

```json
{
  "action": "getNotifications",
  "user_id": 1,
  "unread_only": true  // optional
}
```

### Mark Notification as Read

```json
{
  "action": "markNotificationRead",
  "user_id": 1,
  "notification_id": 5
}
```

---

## Shipment Status Flow

The system follows this exact workflow:

1. **RECEIVED** - Package received at origin hub (Step 1)
2. **CONSOLIDATED** - Package assigned to container and shelf (Step 2)
3. **DISPATCHED** - Container dispatched from origin
4. **IN_TRANSIT** - Package in transit
5. **ARRIVED** - Package arrived at destination hub
6. **READY_FOR_PICKUP** - Ready for customer pickup
7. **OUT_FOR_DELIVERY** - Out for delivery (optional)
8. **DELIVERED** - Successfully delivered
9. **RETURNED** - Returned to sender
10. **CANCELLED** - Shipment cancelled

---

## Transport Modes

- **AIR** - Air freight
- **OCEAN** - Sea freight
- **GROUND** - Road/truck transport

---

## User Roles & Permissions

### Super Admin
- Full system access
- Manage countries, vendors, hubs, locations
- View all reports and analytics

### Vendor
- Manage assigned hubs
- Add/manage associates
- View hub-specific data and reports
- Historical data access even after hub switch

### Associate
- Day-to-day operations
- Receiving packages
- Consolidation
- Scanning and updates
- Hub-specific access

### Customer
- Create shipment requests (mobile app)
- Track packages
- View shipment history

---

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "status": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Server Error

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@itrack.com",
    "password": "password"
  }'

# Get Countries
curl https://yourdomain.com/api_db/api/api.php?action=getCountries&status=active

# Create Shipment
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createShipment",
    "user_id": 1,
    "origin_hub_id": 1,
    "destination_hub_id": 2,
    ...
  }'
```

### Using JavaScript (Fetch API)

```javascript
// Login
const login = async () => {
  const response = await fetch('https://yourdomain.com/api_db/api/api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'admin@itrack.com',
      password: 'password'
    })
  });
  const data = await response.json();
  console.log(data);
};

// Track Shipment
const trackShipment = async (trackingNumber) => {
  const response = await fetch('https://yourdomain.com/api_db/api/api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'trackShipment',
      tracking_number: trackingNumber
    })
  });
  const data = await response.json();
  console.log(data);
};
```

---

## Database Tables Summary

### Core Tables
- `users` - All system users
- `platform_settings` - System configuration
- `countries` - Country master data
- `vendors` - Vendor/hub owners
- `hubs` - Distribution centers
- `locations` - Pickup/delivery locations
- `fleet_managers` - Associates/staff

### Warehouse Tables
- `warehouse_shelves` - Storage shelves
- `containers` - Shipping containers

### Shipment Tables
- `shipments` - Main shipment records
- `packages` - Individual packages
- `package_items` - Items within packages
- `shipment_tracking` - Status history
- `scan_logs` - Scan audit trail

### System Tables
- `notifications` - User notifications
- `activity_logs` - System audit logs

---

## Deployment Checklist

1. ✅ Create database and user
2. ✅ Import `db.sql` schema
3. ✅ Update `config.php` with credentials
4. ✅ Upload files to server
5. ✅ Set proper file permissions (755 for directories, 644 for files)
6. ✅ Test API endpoint
7. ✅ Change default admin password
8. ✅ Configure CORS if needed
9. ✅ Set up SSL certificate (HTTPS)
10. ✅ Implement JWT authentication for production

---

## Security Notes

⚠️ **Important for Production:**

1. **Replace simple user_id authentication with JWT tokens**
2. **Use HTTPS only**
3. **Implement rate limiting**
4. **Add input validation and sanitization**
5. **Enable error logging (disable detailed error messages)**
6. **Use prepared statements (already implemented)**
7. **Regular database backups**
8. **Update passwords and secrets**

---

## Support & Contact

For issues or questions about the iTrack API, please contact your development team.

**Version:** 1.0  
**Last Updated:** January 12, 2026
