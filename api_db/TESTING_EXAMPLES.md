# iTrack API Testing Examples

This file contains practical examples for testing all API endpoints.

## Setup

Replace `https://yourdomain.com` with your actual domain.

```javascript
const API_URL = 'https://yourdomain.com/api_db/api/api.php';
```

---

## 1. Authentication Flow

### Register New User
```javascript
const registerUser = async () => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      email: 'john@example.com',
      password: 'SecurePass123!',
      full_name: 'John Doe',
      phone: '+1234567890',
      role: 'customer'
    })
  });
  const data = await response.json();
  console.log('Register Response:', data);
};
```

### Login
```javascript
const login = async () => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'admin@itrack.com',
      password: 'password'
    })
  });
  const data = await response.json();
  console.log('Login Response:', data);
  
  // Save user_id for subsequent requests
  if (data.status) {
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userRole', data.user.role);
  }
  return data;
};
```

---

## 2. Master Data Setup Flow

### Step 1: Create Countries
```javascript
const setupCountries = async (userId) => {
  const countries = [
    { code: 'US', name: 'United States', currency: 'USD', phone: '+1' },
    { code: 'IN', name: 'India', currency: 'INR', phone: '+91' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', phone: '+44' }
  ];
  
  for (const country of countries) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createCountry',
        user_id: userId,
        country_code: country.code,
        country_name: country.name,
        currency_code: country.currency,
        phone_code: country.phone
      })
    });
    console.log('Country created:', await response.json());
  }
};
```

### Step 2: Create Vendor
```javascript
const createVendor = async (userId) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createVendor',
      user_id: userId,
      vendor_name: 'Express Logistics Inc',
      vendor_code: 'EXP001',
      email: 'contact@expresslog.com',
      phone: '+1-555-0100',
      address: '123 Logistics Way, New York, NY 10001',
      country_id: 1
    })
  });
  const data = await response.json();
  console.log('Vendor created:', data);
  return data.data?.id; // Return vendor ID
};
```

### Step 3: Create Hubs
```javascript
const createHubs = async (userId, vendorId) => {
  const hubs = [
    {
      name: 'New York Distribution Center',
      code: 'NYC-DC01',
      city: 'New York',
      state: 'NY',
      type: 'all'
    },
    {
      name: 'Los Angeles Hub',
      code: 'LA-HUB01',
      city: 'Los Angeles',
      state: 'CA',
      type: 'all'
    }
  ];
  
  const createdHubs = [];
  for (const hub of hubs) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createHub',
        user_id: userId,
        hub_name: hub.name,
        hub_code: hub.code,
        country_id: 1, // USA
        vendor_id: vendorId,
        city: hub.city,
        state: hub.state,
        contact_person: 'Hub Manager',
        contact_phone: '+1-555-0100',
        hub_type: hub.type
      })
    });
    const data = await response.json();
    console.log('Hub created:', data);
    createdHubs.push(data.data);
  }
  return createdHubs;
};
```

---

## 3. Warehouse Setup Flow

### Create Shelves
```javascript
const createShelves = async (userId, hubId) => {
  const aisles = ['A', 'B', 'C', 'D'];
  const shelvesPerAisle = 10;
  
  const shelves = [];
  for (const aisle of aisles) {
    for (let i = 1; i <= shelvesPerAisle; i++) {
      const shelfCode = `${aisle}-${String(i).padStart(2, '0')}`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createShelf',
          user_id: userId,
          hub_id: hubId,
          shelf_code: shelfCode,
          shelf_name: `Aisle ${aisle} Shelf ${i}`,
          aisle: aisle
        })
      });
      const data = await response.json();
      shelves.push(data.data);
    }
  }
  console.log(`Created ${shelves.length} shelves`);
  return shelves;
};
```

### Create Containers
```javascript
const createContainers = async (userId, hubId) => {
  const containers = [];
  for (let i = 1; i <= 50; i++) {
    const containerCode = `CNT-${String(i).padStart(4, '0')}`;
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createContainer',
        user_id: userId,
        container_code: containerCode,
        container_type: i % 3 === 0 ? 'large' : i % 2 === 0 ? 'medium' : 'small',
        hub_id: hubId
      })
    });
    const data = await response.json();
    containers.push(data);
  }
  console.log(`Created ${containers.length} containers`);
  return containers;
};
```

---

## 4. Complete Shipment Flow

### STEP 1: Create Shipment (Receiving)
```javascript
const receiveShipment = async (userId, originHubId, destinationHubId) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createShipment',
      user_id: userId,
      
      // Route
      origin_hub_id: originHubId,
      destination_hub_id: destinationHubId,
      transport_mode: 'AIR',
      
      // Shipper (Sender)
      shipper_name: 'ABC Electronics Corp',
      shipper_phone: '+1-555-1234',
      shipper_email: 'shipping@abcelectronics.com',
      shipper_address: '789 Tech Street',
      shipper_city: 'New York',
      shipper_country: 'United States',
      shipper_postal_code: '10001',
      
      // Consignee (Receiver)
      consignee_name: 'John Smith',
      consignee_phone: '+1-555-5678',
      consignee_email: 'john.smith@email.com',
      consignee_address: '456 Main Street, Apt 5B',
      consignee_city: 'Los Angeles',
      consignee_country: 'United States',
      consignee_postal_code: '90001',
      
      // Package
      weight: 3.5,
      description: 'Laptop Computer - Dell XPS 15',
      
      // Items in package
      items: [
        {
          item_name: 'Dell XPS 15 Laptop',
          quantity: 1,
          unit_value: 1299.99
        },
        {
          item_name: 'Laptop Charger',
          quantity: 1,
          unit_value: 49.99
        },
        {
          item_name: 'Laptop Bag',
          quantity: 1,
          unit_value: 39.99
        }
      ]
    })
  });
  
  const data = await response.json();
  console.log('Shipment Created:', data);
  
  if (data.status) {
    console.log('Tracking Number:', data.shipment.tracking_number);
    console.log('WR Number:', data.shipment.wr_number);
    console.log('Package Code:', data.package.package_code);
  }
  
  return data;
};
```

### STEP 2: Consolidate Package
```javascript
const consolidateShipment = async (userId, packageId, containerId, shelfId) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'consolidatePackage',
      user_id: userId,
      package_id: packageId,
      container_id: containerId,
      shelf_id: shelfId
    })
  });
  
  const data = await response.json();
  console.log('Package Consolidated:', data);
  return data;
};
```

### Track Shipment
```javascript
const trackByNumber = async (trackingNumber) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'trackShipment',
      tracking_number: trackingNumber
    })
  });
  
  const data = await response.json();
  console.log('Tracking Info:', data);
  
  if (data.status) {
    console.log('Current Status:', data.shipment.current_status);
    console.log('Tracking History:');
    data.tracking_history.forEach(event => {
      console.log(`  ${event.timestamp}: ${event.status} at ${event.hub_name}`);
      console.log(`    ${event.description}`);
    });
  }
  
  return data;
};
```

### Scan Package
```javascript
const scanPackageCode = async (userId, code) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'scanPackage',
      user_id: userId,
      code: code // Can be tracking number, WR number, or package code
    })
  });
  
  const data = await response.json();
  console.log('Scan Result:', data);
  
  if (data.status) {
    console.log('Shipment Status:', data.shipment.current_status);
    console.log('Number of Packages:', data.packages.length);
  }
  
  return data;
};
```

---

## 5. Dashboard & Reporting

### Get Dashboard Stats
```javascript
const getDashboard = async (userId, hubId = null) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'getDashboardStats',
      user_id: userId,
      hub_id: hubId // Optional: filter by specific hub
    })
  });
  
  const data = await response.json();
  console.log('Dashboard Stats:', data);
  
  if (data.status) {
    console.log('Total Shipments:', data.data.total_shipments);
    console.log('Today\'s Shipments:', data.data.today_shipments);
    console.log('\nShipments by Status:');
    data.data.by_status.forEach(status => {
      console.log(`  ${status.current_status}: ${status.count}`);
    });
  }
  
  return data;
};
```

### Get Recent Shipments
```javascript
const getRecentShipments = async (userId, limit = 10) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'getRecentShipments',
      user_id: userId,
      limit: limit
    })
  });
  
  const data = await response.json();
  console.log('Recent Shipments:', data);
  return data;
};
```

---

## 6. Complete Test Sequence

```javascript
// Run this complete test sequence
const runCompleteTest = async () => {
  console.log('===== iTrack API Complete Test =====\n');
  
  // 1. Login
  console.log('1. Logging in...');
  const loginResult = await login();
  const userId = loginResult.user.id;
  console.log('✓ Logged in as:', loginResult.user.email, '\n');
  
  // 2. Get Countries (should already exist from SQL)
  console.log('2. Getting countries...');
  const countriesResponse = await fetch(`${API_URL}?action=getCountries&status=all`);
  const countries = await countriesResponse.json();
  console.log('✓ Found', countries.data.length, 'countries\n');
  
  // 3. Create Vendor
  console.log('3. Creating vendor...');
  const vendorId = await createVendor(userId);
  console.log('✓ Vendor created with ID:', vendorId, '\n');
  
  // 4. Create Hubs
  console.log('4. Creating hubs...');
  const hubs = await createHubs(userId, vendorId);
  console.log('✓ Created', hubs.length, 'hubs\n');
  
  // 5. Create Warehouse Infrastructure
  console.log('5. Creating warehouse shelves...');
  await createShelves(userId, hubs[0].id);
  console.log('✓ Shelves created\n');
  
  console.log('6. Creating containers...');
  await createContainers(userId, hubs[0].id);
  console.log('✓ Containers created\n');
  
  // 7. Create a Shipment
  console.log('7. Creating new shipment...');
  const shipment = await receiveShipment(userId, hubs[0].id, hubs[1].id);
  console.log('✓ Shipment created:', shipment.shipment.tracking_number, '\n');
  
  // 8. Get containers for consolidation
  console.log('8. Getting available containers...');
  const containersResponse = await fetch(`${API_URL}?action=getContainers&hub_id=${hubs[0].id}&status=empty`);
  const containers = await containersResponse.json();
  
  // Get shelves
  const shelvesResponse = await fetch(`${API_URL}?action=getShelves&hub_id=${hubs[0].id}`);
  const shelves = await shelvesResponse.json();
  
  // 9. Consolidate Package
  if (containers.data.length > 0 && shelves.data.length > 0) {
    console.log('9. Consolidating package...');
    await consolidateShipment(
      userId,
      shipment.package.id,
      containers.data[0].id,
      shelves.data[0].id
    );
    console.log('✓ Package consolidated\n');
  }
  
  // 10. Track the Shipment
  console.log('10. Tracking shipment...');
  await trackByNumber(shipment.shipment.tracking_number);
  console.log('✓ Tracking info retrieved\n');
  
  // 11. Scan Package
  console.log('11. Scanning package...');
  await scanPackageCode(userId, shipment.package.package_code);
  console.log('✓ Package scanned\n');
  
  // 12. Get Dashboard
  console.log('12. Getting dashboard stats...');
  await getDashboard(userId, hubs[0].id);
  console.log('✓ Dashboard loaded\n');
  
  console.log('===== All Tests Completed Successfully! =====');
};

// Run the test
runCompleteTest().catch(error => {
  console.error('Test failed:', error);
});
```

---

## 7. CURL Examples for Command Line Testing

### Login
```bash
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@itrack.com",
    "password": "password"
  }'
```

### Get Countries
```bash
curl "https://yourdomain.com/api_db/api/api.php?action=getCountries&status=all"
```

### Create Shipment
```bash
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createShipment",
    "user_id": 1,
    "origin_hub_id": 1,
    "destination_hub_id": 2,
    "transport_mode": "AIR",
    "shipper_name": "Test Sender",
    "shipper_phone": "+1234567890",
    "shipper_address": "123 Test St",
    "consignee_name": "Test Receiver",
    "consignee_phone": "+0987654321",
    "consignee_address": "456 Test Ave",
    "weight": 5.5,
    "description": "Test Package"
  }'
```

### Track Shipment
```bash
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "trackShipment",
    "tracking_number": "ITK20260112ABC12345"
  }'
```

---

## 8. Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "iTrack API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"action\": \"login\",\n  \"email\": \"admin@itrack.com\",\n  \"password\": \"password\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api.php",
          "host": ["{{base_url}}"],
          "path": ["api.php"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://yourdomain.com/api_db/api"
    }
  ]
}
```

---

## Quick Testing Checklist

- [ ] Test login with default credentials
- [ ] Create a country
- [ ] Create a vendor
- [ ] Create a hub
- [ ] Create warehouse shelves
- [ ] Create containers
- [ ] Create a new shipment (receiving)
- [ ] Consolidate the package
- [ ] Track the shipment
- [ ] Scan the package
- [ ] Get dashboard statistics
- [ ] Change admin password

---

**Happy Testing! 🚀**
