<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php'; // provides $mysqli and db_* helpers

// -------------------- Response helpers --------------------
function respond(array $payload, int $httpStatus = 200): void {
    http_response_code($httpStatus);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function badRequest(string $msg = 'Bad Request'): void { respond(['status' => false, 'error' => $msg], 400); }
function unauthorized(string $msg = 'Unauthorized'): void { respond(['status' => false, 'error' => $msg], 401); }
function notFound(string $msg = 'Not Found'): void { respond(['status' => false, 'error' => $msg], 404); }
function conflict(string $msg = 'Conflict'): void { respond(['status' => false, 'error' => $msg], 409); }
function serverError(string $msg = 'Server Error'): void { respond(['status' => false, 'error' => $msg], 500); }

// -------------------- Auth helpers --------------------
function generateTrackingNumber(string $prefix = 'ITK'): string {
    return $prefix . date('Ymd') . strtoupper(substr(uniqid(), -8));
}

function generateWRNumber(string $prefix = 'WR'): string {
    return $prefix . date('Ymd') . strtoupper(substr(uniqid(), -6));
}

function getCurrentUserId(array $input = []): ?int {
    // Simple auth - in production use JWT or session
    // Check authentication from headers, NOT from request body user_id
    $userId = $_SERVER['HTTP_X_USER_ID'] ?? $_REQUEST['auth_user_id'] ?? $_SERVER['HTTP_USER_ID'] ?? $_SESSION['user_id'] ?? null;
    return $userId ? (int)$userId : null;
}

function requireAuth(array $input = []): int {
    $userId = getCurrentUserId($input);
    if (!$userId) {
        unauthorized('Authentication required');
    }
    return $userId;
}

function getUserRole(int $userId): ?string {
    $user = db_fetch_one("SELECT role FROM users WHERE id = ?", [$userId]);
    return $user['role'] ?? null;
}

function getUserHubId(int $userId): ?int {
    // First check fleet_managers table (associates/fleet managers)
    $fm = db_fetch_one("SELECT hub_id FROM fleet_managers WHERE user_id = ? AND status = 'active'", [$userId]);
    if ($fm && $fm['hub_id']) {
        error_log("getUserHubId - Found hub_id {$fm['hub_id']} in fleet_managers for user {$userId}");
        return (int)$fm['hub_id'];
    }
    
    // Then check vendors table
    $vendor = db_fetch_one("SELECT v.hub_id FROM vendors v WHERE v.user_id = ? AND v.status = 'active'", [$userId]);
    if ($vendor && $vendor['hub_id']) {
        error_log("getUserHubId - Found hub_id {$vendor['hub_id']} in vendors for user {$userId}");
        return (int)$vendor['hub_id'];
    }
    
    error_log("getUserHubId - No hub found for user {$userId} in fleet_managers or vendors tables");
    return null;
}

function requireRole(array $allowedRoles, array $input = []): array {
    $userId = requireAuth($input);
    $role = getUserRole($userId);
    if (!$role || !in_array($role, $allowedRoles)) {
        unauthorized('Insufficient permissions');
    }
    return ['user_id' => $userId, 'role' => $role];
}

$input = getInput();
$action = $input['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(204); 
    exit; 
}

try {
    switch ($action) {

        // ==================== AUTHENTICATION ====================
        
        case 'login': {
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            
            if (!$username || !$password) {
                badRequest('Username and password required');
            }
            
            $user = db_fetch_one("SELECT * FROM users WHERE username = ? AND status = 'active'", [$username]);
            
            if (!$user || !password_verify($password, $user['password'])) {
                unauthorized('Invalid credentials');
            }
            
            // Update last login
            db_execute("UPDATE users SET last_login = NOW() WHERE id = ?", [$user['id']]);
            
            // Remove password from response
            unset($user['password']);
            
            // Get additional info based on role
            $additionalData = [];
            if ($user['role'] === 'vendor') {
                $vendor = db_fetch_one("SELECT * FROM vendors WHERE user_id = ?", [$user['id']]);
                $additionalData['vendor'] = $vendor;
                
                // Get vendor's hubs
                $hubs = db_fetch_all("SELECT * FROM hubs WHERE vendor_id = ? AND status = 'active'", [$vendor['id'] ?? 0]);
                $additionalData['hubs'] = $hubs;
            } elseif ($user['role'] === 'associate') {
                $associate = db_fetch_one("SELECT fm.*, h.hub_name, h.hub_code FROM fleet_managers fm 
                    LEFT JOIN hubs h ON fm.hub_id = h.id WHERE fm.user_id = ?", [$user['id']]);
                $additionalData['associate'] = $associate;
            }
            
            respond([
                'status' => true, 
                'message' => 'Login successful',
                'user' => $user,
                'data' => $additionalData
            ]);
        } break;

        case 'register': {
            $username = $input['username'] ?? '';
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $fullName = $input['full_name'] ?? '';
            $phone = $input['phone'] ?? null;
            $role = $input['role'] ?? 'customer';
            
            if (!$username || !$email || !$password || !$fullName) {
                badRequest('Username, email, password, and full name required');
            }
            
            // Check if username or email exists
            $existing = db_fetch_one("SELECT id FROM users WHERE username = ? OR email = ?", [$username, $email]);
            if ($existing) {
                conflict('Username or email already registered');
            }
            
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            
            $userId = db_execute_insert(
                "INSERT INTO users (username, email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
                [$username, $email, $hashedPassword, $fullName, $phone, $role]
            );
            
            if ($userId) {
                $user = db_fetch_one("SELECT id, username, email, full_name, phone, role, status FROM users WHERE id = ?", [$userId]);
                error_log("User registered successfully: ID={$userId}, Role={$role}, Name={$fullName}, Email={$email}");
                respond(['status' => true, 'message' => 'Registration successful', 'user' => $user]);
            } else {
                serverError('Registration failed');
            }
        } break;

        case 'updateProfile': {
            $userId = requireAuth($input);
            $fullName = $input['full_name'] ?? null;
            $phone = $input['phone'] ?? null;
            
            $updates = [];
            $params = [];
            
            if ($fullName) {
                $updates[] = "full_name = ?";
                $params[] = $fullName;
            }
            if ($phone !== null) {
                $updates[] = "phone = ?";
                $params[] = $phone;
            }
            
            if (empty($updates)) {
                badRequest('No fields to update');
            }
            
            $params[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $user = db_fetch_one("SELECT id, email, full_name, phone, role FROM users WHERE id = ?", [$userId]);
                respond(['status' => true, 'message' => 'Profile updated', 'user' => $user]);
            } else {
                serverError('Update failed');
            }
        } break;

        case 'changePassword': {
            $userId = requireAuth($input);
            $currentPassword = $input['current_password'] ?? '';
            $newPassword = $input['new_password'] ?? '';
            
            if (!$currentPassword || !$newPassword) {
                badRequest('Current and new password required');
            }
            
            $user = db_fetch_one("SELECT password FROM users WHERE id = ?", [$userId]);
            if (!password_verify($currentPassword, $user['password'])) {
                unauthorized('Current password incorrect');
            }
            
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            if (db_execute("UPDATE users SET password = ? WHERE id = ?", [$hashedPassword, $userId])) {
                respond(['status' => true, 'message' => 'Password changed successfully']);
            } else {
                serverError('Password change failed');
            }
        } break;

        // ==================== DEBUG USER INFO ====================
        
        case 'debugUserInfo': {
            $userId = requireAuth($input);
            $role = getUserRole($userId);
            $hubId = getUserHubId($userId);
            
            $user = db_fetch_one("SELECT id, username, email, full_name, role, status FROM users WHERE id = ?", [$userId]);
            $fleetManager = db_fetch_one("SELECT * FROM fleet_managers WHERE user_id = ?", [$userId]);
            $vendor = db_fetch_one("SELECT * FROM vendors WHERE user_id = ?", [$userId]);
            
            respond([
                'status' => true,
                'debug' => [
                    'user' => $user,
                    'role' => $role,
                    'hub_id' => $hubId,
                    'is_super_admin' => $role === 'super_admin',
                    'fleet_manager_record' => $fleetManager,
                    'vendor_record' => $vendor
                ]
            ]);
        } break;

        // ==================== PLATFORM SETTINGS ====================
        
        case 'getPlatformSettings': {
            $settings = db_fetch_all("SELECT * FROM platform_settings ORDER BY setting_key ASC");
            respond(['status' => true, 'data' => $settings]);
        } break;

        case 'updatePlatformSetting': {
            requireRole(['super_admin'], $input);
            $key = $input['setting_key'] ?? '';
            $value = $input['setting_value'] ?? '';
            
            if (!$key) badRequest('Setting key required');
            
            $exists = db_fetch_one("SELECT id FROM platform_settings WHERE setting_key = ?", [$key]);
            
            if ($exists) {
                db_execute("UPDATE platform_settings SET setting_value = ? WHERE setting_key = ?", [$value, $key]);
            } else {
                db_execute_insert("INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?)", [$key, $value]);
            }
            
            respond(['status' => true, 'message' => 'Setting updated']);
        } break;

        // ==================== COUNTRIES MANAGEMENT ====================
        
        case 'getCountries': {
            $status = $input['status'] ?? 'active';
            $sql = $status === 'all' 
                ? "SELECT * FROM countries ORDER BY country_name ASC"
                : "SELECT * FROM countries WHERE status = ? ORDER BY country_name ASC";
            $params = $status === 'all' ? [] : [$status];
            $countries = db_fetch_all($sql, $params);
            respond(['status' => true, 'data' => $countries]);
        } break;

        case 'getCountry': {
            $id = (int)($input['id'] ?? 0);
            $country = db_fetch_one("SELECT * FROM countries WHERE id = ?", [$id]);
            if ($country) {
                respond(['status' => true, 'data' => $country]);
            } else {
                notFound('Country not found');
            }
        } break;

        case 'createCountry': {
            requireRole(['super_admin'], $input);
            $countryCode = $input['country_code'] ?? '';
            $countryName = $input['country_name'] ?? '';
            $currencyCode = $input['currency_code'] ?? null;
            $phoneCode = $input['phone_code'] ?? null;
            
            if (!$countryCode || !$countryName) {
                badRequest('Country code and name required');
            }
            
            $id = db_execute_insert(
                "INSERT INTO countries (country_code, country_name, currency_code, phone_code) VALUES (?, ?, ?, ?)",
                [$countryCode, $countryName, $currencyCode, $phoneCode]
            );
            
            if ($id) {
                $country = db_fetch_one("SELECT * FROM countries WHERE id = ?", [$id]);
                respond(['status' => true, 'message' => 'Country created', 'data' => $country]);
            } else {
                serverError('Creation failed');
            }
        } break;

        case 'updateCountry': {
            requireRole(['super_admin'], $input);
            $id = (int)($input['id'] ?? 0);
            $countryCode = $input['country_code'] ?? null;
            $countryName = $input['country_name'] ?? null;
            $currencyCode = $input['currency_code'] ?? null;
            $phoneCode = $input['phone_code'] ?? null;
            $status = $input['status'] ?? null;
            
            $updates = [];
            $params = [];
            
            if ($countryCode) { $updates[] = "country_code = ?"; $params[] = $countryCode; }
            if ($countryName) { $updates[] = "country_name = ?"; $params[] = $countryName; }
            if ($currencyCode !== null) { $updates[] = "currency_code = ?"; $params[] = $currencyCode; }
            if ($phoneCode !== null) { $updates[] = "phone_code = ?"; $params[] = $phoneCode; }
            if ($status) { $updates[] = "status = ?"; $params[] = $status; }
            
            if (empty($updates)) badRequest('No fields to update');
            
            $params[] = $id;
            $sql = "UPDATE countries SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $country = db_fetch_one("SELECT * FROM countries WHERE id = ?", [$id]);
                respond(['status' => true, 'message' => 'Country updated', 'data' => $country]);
            } else {
                serverError('Update failed');
            }
        } break;

        case 'deleteCountry': {
            requireRole(['super_admin'], $input);
            $id = (int)($input['id'] ?? 0);
            // Soft delete by setting status to inactive
            if (db_execute("UPDATE countries SET status = 'inactive' WHERE id = ?", [$id])) {
                respond(['status' => true, 'message' => 'Country deleted']);
            } else {
                serverError('Delete failed');
            }
        } break;

        // ==================== VENDORS MANAGEMENT ====================
        
        case 'getVendors': {
            requireRole(['super_admin', 'vendor'], $input);
            $status = $input['status'] ?? 'active';
            $hubId = $input['hub_id'] ?? null;
            
            $sql = "SELECT v.*, h.hub_name, h.hub_code, u.email as user_email FROM vendors v 
                    LEFT JOIN hubs h ON v.hub_id = h.id 
                    LEFT JOIN users u ON v.user_id = u.id WHERE 1=1";
            $params = [];
            
            if ($status !== 'all') {
                $sql .= " AND v.status = ?";
                $params[] = $status;
            }
            if ($hubId) {
                $sql .= " AND v.hub_id = ?";
                $params[] = $hubId;
            }
            
            $vendors = db_fetch_all($sql . " ORDER BY v.vendor_name ASC", $params);
            respond(['status' => true, 'data' => $vendors]);
        } break;

        case 'getVendor': {
            $id = (int)($input['id'] ?? 0);
            $vendor = db_fetch_one("SELECT v.*, h.hub_name, h.hub_code FROM vendors v 
                LEFT JOIN hubs h ON v.hub_id = h.id WHERE v.id = ?", [$id]);
            
            if ($vendor) {
                respond(['status' => true, 'data' => $vendor]);
            } else {
                notFound('Vendor not found');
            }
        } break;

        case 'createVendor': {
            requireRole(['super_admin'], $input);
            $vendorName = $input['vendor_name'] ?? '';
            $vendorCode = $input['vendor_code'] ?? '';
            $email = $input['email'] ?? null;
            $phone = $input['phone'] ?? null;
            $address = $input['address'] ?? null;
            $hubId = (int)($input['hub_id'] ?? 0);
            
            if (!$vendorName || !$vendorCode || !$hubId) {
                badRequest('Vendor name, code, and hub are required');
            }
            
            $id = db_execute_insert(
                "INSERT INTO vendors (vendor_name, vendor_code, email, phone, address, hub_id) VALUES (?, ?, ?, ?, ?, ?)",
                [$vendorName, $vendorCode, $email, $phone, $address, $hubId]
            );
            
            if ($id) {
                $vendor = db_fetch_one("SELECT * FROM vendors WHERE id = ?", [$id]);
                respond(['status' => true, 'message' => 'Vendor created', 'data' => $vendor]);
            } else {
                serverError('Creation failed');
            }
        } break;

        case 'updateVendor': {
            requireRole(['super_admin'], $input);
            $id = (int)($input['id'] ?? 0);
            
            $updates = [];
            $params = [];
            
            $fields = ['vendor_name', 'vendor_code', 'email', 'phone', 'address', 'hub_id', 'status'];
            foreach ($fields as $field) {
                if (isset($input[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($updates)) badRequest('No fields to update');
            
            $params[] = $id;
            $sql = "UPDATE vendors SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $vendor = db_fetch_one("SELECT * FROM vendors WHERE id = ?", [$id]);
                respond(['status' => true, 'message' => 'Vendor updated', 'data' => $vendor]);
            } else {
                serverError('Update failed');
            }
        } break;

        // ==================== HUBS MANAGEMENT ====================
        
        case 'getHubs': {
            $status = $input['status'] ?? 'active';
            $locationId = $input['location_id'] ?? null;
            
            $sql = "SELECT h.*, l.location_name, l.location_code FROM hubs h 
                    LEFT JOIN locations l ON h.location_id = l.id WHERE 1=1";
            $params = [];
            
            if ($status !== 'all') {
                $sql .= " AND h.status = ?";
                $params[] = $status;
            }
            if ($locationId) {
                $sql .= " AND h.location_id = ?";
                $params[] = $locationId;
            }
            
            $hubs = db_fetch_all($sql . " ORDER BY h.hub_name ASC", $params);
            respond(['status' => true, 'data' => $hubs]);
        } break;

        case 'getHub': {
            $id = (int)($input['id'] ?? 0);
            $hub = db_fetch_one("SELECT h.*, l.location_name, l.location_code FROM hubs h 
                LEFT JOIN locations l ON h.location_id = l.id WHERE h.id = ?", [$id]);
            
            if ($hub) {
                respond(['status' => true, 'data' => $hub]);
            } else {
                notFound('Hub not found');
            }
        } break;

        case 'createHub': {
            requireRole(['super_admin'], $input);
            $hubName = $input['hub_name'] ?? '';
            $hubCode = $input['hub_code'] ?? '';
            $locationId = (int)($input['location_id'] ?? 0);
            $address = $input['address'] ?? null;
            $city = $input['city'] ?? null;
            $state = $input['state'] ?? null;
            $postalCode = $input['postal_code'] ?? null;
            $contactPerson = $input['contact_person'] ?? null;
            $contactPhone = $input['contact_phone'] ?? null;
            $contactEmail = $input['contact_email'] ?? null;
            $hubType = $input['hub_type'] ?? 'all';
            
            if (!$hubName || !$hubCode || !$locationId) {
                badRequest('Hub name, code, and location are required');
            }
            
            $id = db_execute_insert(
                "INSERT INTO hubs (hub_name, hub_code, location_id, address, city, state, postal_code, contact_person, contact_phone, contact_email, hub_type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$hubName, $hubCode, $locationId, $address, $city, $state, $postalCode, $contactPerson, $contactPhone, $contactEmail, $hubType]
            );
            
            if ($id) {
                $hub = db_fetch_one("SELECT * FROM hubs WHERE id = ?", [$id]);
                respond(['status' => true, 'message' => 'Hub created', 'data' => $hub]);
            } else {
                serverError('Creation failed');
            }
        } break;

        case 'updateHub': {
            requireRole(['super_admin', 'vendor'], $input);
            $id = (int)($input['id'] ?? 0);
            
            $updates = [];
            $params = [];
            
            $fields = ['hub_name', 'hub_code', 'location_id', 'address', 'city', 'state', 'postal_code', 
                       'contact_person', 'contact_phone', 'contact_email', 'hub_type', 'status'];
            foreach ($fields as $field) {
                if (isset($input[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($updates)) badRequest('No fields to update');
            
            $params[] = $id;
            $sql = "UPDATE hubs SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $hub = db_fetch_one("SELECT * FROM hubs WHERE id = ?", [$id]);
                respond(['status' => true, 'message' => 'Hub updated', 'data' => $hub]);
            } else {
                serverError('Update failed');
            }
        } break;

        // ==================== LOCATIONS MANAGEMENT ====================
        
        case 'getLocations': {
            $status = $input['status'] ?? 'active';
            $sql = "SELECT l.*, c.country_name, c.country_code FROM locations l 
                    LEFT JOIN countries c ON l.country_id = c.id";
            
            if ($status !== 'all') {
                $sql .= " WHERE l.status = ?";
                $locations = db_fetch_all($sql . " ORDER BY l.location_name ASC", [$status]);
            } else {
                $locations = db_fetch_all($sql . " ORDER BY l.location_name ASC");
            }
            
            respond(['status' => true, 'data' => $locations]);
        } break;

        case 'createLocation': {
            requireRole(['super_admin'], $input);
            $locationName = $input['location_name'] ?? '';
            $locationCode = $input['location_code'] ?? '';
            $countryId = (int)($input['country_id'] ?? 0);
            
            if (!$locationName || !$locationCode || !$countryId) {
                badRequest('Location name, code, and country are required');
            }
            
            $id = db_execute_insert(
                "INSERT INTO locations (location_name, location_code, country_id, address, city, state, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    $locationName, 
                    $locationCode, 
                    $countryId,
                    $input['address'] ?? null,
                    $input['city'] ?? null,
                    $input['state'] ?? null,
                    $input['postal_code'] ?? null
                ]
            );
            
            if ($id) {
                respond(['status' => true, 'message' => 'Location created', 'id' => $id]);
            } else {
                serverError('Creation failed');
            }
        } break;

        // ==================== FLEET MANAGERS (Associates) ====================
        
        case 'getFleetManagers': {
            requireRole(['super_admin', 'vendor'], $input);
            $vendorId = $input['vendor_id'] ?? null;
            $hubId = $input['hub_id'] ?? null;
            
            $sql = "SELECT fm.*, u.email, u.username, u.full_name, u.phone, u.status as user_status, 
                    v.vendor_name, v.vendor_code, h.hub_name, h.hub_code
                    FROM fleet_managers fm 
                    JOIN users u ON fm.user_id = u.id 
                    JOIN vendors v ON fm.vendor_id = v.id
                    LEFT JOIN hubs h ON fm.hub_id = h.id WHERE 1=1";
            $params = [];
            
            if ($vendorId) {
                $sql .= " AND fm.vendor_id = ?";
                $params[] = $vendorId;
            }
            if ($hubId) {
                $sql .= " AND fm.hub_id = ?";
                $params[] = $hubId;
            }
            
            $managers = db_fetch_all($sql . " ORDER BY u.full_name ASC", $params);
            respond(['status' => true, 'data' => $managers]);
        } break;

        case 'createFleetManager': {
            // Check if the current user has permission to create fleet managers
            $authInfo = requireRole(['super_admin', 'vendor'], $input);
            $currentUserId = $authInfo['user_id'];
            
            // Get the target user ID for the fleet manager being created
            $userId = (int)($input['user_id'] ?? 0);
            $vendorId = (int)($input['vendor_id'] ?? 0);
            $employeeCode = $input['employee_code'] ?? null;
            $designation = $input['designation'] ?? null;
            $department = $input['department'] ?? null;
            
            error_log("CreateFleetManager called by user_id={$currentUserId} for target user_id={$userId}, vendor_id={$vendorId}");
            
            if (!$userId || !$vendorId) {
                badRequest('User and vendor are required');
            }
            
            // Check if target user exists and has associate role
            $user = db_fetch_one("SELECT id, role, full_name, email FROM users WHERE id = ?", [$userId]);
            if (!$user) {
                badRequest("User with ID {$userId} not found");
            }
            
            error_log("Found target user: ID={$user['id']}, Role={$user['role']}, Name={$user['full_name']}, Email={$user['email']}");
            
            if ($user['role'] !== 'associate') {
                badRequest("User '{$user['full_name']}' ({$user['email']}) has role '{$user['role']}' but must have 'associate' role");
            }
            
            // Automatically fetch hub_id from vendor (vendor must have a hub)
            $vendor = db_fetch_one("SELECT id, vendor_name, hub_id FROM vendors WHERE id = ? AND status = 'active'", [$vendorId]);
            if (!$vendor) {
                badRequest("Vendor with ID {$vendorId} not found or inactive");
            }
            
            if (!$vendor['hub_id']) {
                badRequest("Vendor '{$vendor['vendor_name']}' is not assigned to any hub. Please assign a hub to the vendor first.");
            }
            
            $hubId = (int)$vendor['hub_id'];
            error_log("Automatically linking associate to hub_id={$hubId} from vendor '{$vendor['vendor_name']}'");
            
            // Check if this user already has a fleet_managers record
            $existing = db_fetch_one("SELECT id FROM fleet_managers WHERE user_id = ?", [$userId]);
            if ($existing) {
                badRequest("User '{$user['full_name']}' is already registered as an associate");
            }
            
            $id = db_execute_insert(
                "INSERT INTO fleet_managers (user_id, vendor_id, hub_id, employee_code, designation, department) VALUES (?, ?, ?, ?, ?, ?)",
                [$userId, $vendorId, $hubId, $employeeCode, $designation, $department]
            );
            
            if ($id) {
                $fleetManager = db_fetch_one("SELECT fm.*, h.hub_name, h.hub_code, v.vendor_name 
                    FROM fleet_managers fm
                    LEFT JOIN hubs h ON fm.hub_id = h.id
                    LEFT JOIN vendors v ON fm.vendor_id = v.id
                    WHERE fm.id = ?", [$id]);
                respond([
                    'status' => true, 
                    'message' => "Associate created and automatically linked to hub '{$fleetManager['hub_name']}'", 
                    'data' => $fleetManager
                ]);
            } else {
                serverError('Creation failed');
            }
        } break;

        case 'updateUserByAdmin': {
            requireRole(['super_admin', 'vendor'], $input);
            $targetUserId = (int)($input['user_id'] ?? 0);
            $username = $input['username'] ?? null;
            $email = $input['email'] ?? null;
            $fullName = $input['full_name'] ?? null;
            $phone = $input['phone'] ?? null;
            $password = $input['password'] ?? null;
            
            if (!$targetUserId) {
                badRequest('User ID required');
            }
            
            $updates = [];
            $params = [];
            
            if ($username !== null) {
                // Check if username is already taken by another user
                $existing = db_fetch_one("SELECT id FROM users WHERE username = ? AND id != ?", [$username, $targetUserId]);
                if ($existing) {
                    badRequest('Username already taken');
                }
                $updates[] = "username = ?";
                $params[] = $username;
            }
            if ($email !== null) {
                // Check if email is already taken by another user
                $existing = db_fetch_one("SELECT id FROM users WHERE email = ? AND id != ?", [$email, $targetUserId]);
                if ($existing) {
                    badRequest('Email already taken');
                }
                $updates[] = "email = ?";
                $params[] = $email;
            }
            if ($fullName !== null) {
                $updates[] = "full_name = ?";
                $params[] = $fullName;
            }
            if ($phone !== null) {
                $updates[] = "phone = ?";
                $params[] = $phone;
            }
            if ($password !== null && $password !== '') {
                // Hash the new password
                $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
                $updates[] = "password = ?";
                $params[] = $hashedPassword;
            }
            
            if (empty($updates)) {
                badRequest('No fields to update');
            }
            
            $params[] = $targetUserId;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $user = db_fetch_one("SELECT id, username, email, full_name, phone, role FROM users WHERE id = ?", [$targetUserId]);
                respond(['status' => true, 'message' => 'User updated successfully', 'user' => $user]);
            } else {
                serverError('Update failed');
            }
        } break;

        case 'updateFleetManager': {
            requireRole(['super_admin', 'vendor'], $input);
            $id = (int)($input['id'] ?? 0);
            $vendorId = isset($input['vendor_id']) ? (int)$input['vendor_id'] : null;
            $employeeCode = $input['employee_code'] ?? null;
            $designation = $input['designation'] ?? null;
            $department = $input['department'] ?? null;
            
            if (!$id) {
                badRequest('Fleet manager ID required');
            }
            
            // Get current fleet manager record
            $currentFM = db_fetch_one("SELECT * FROM fleet_managers WHERE id = ?", [$id]);
            if (!$currentFM) {
                badRequest('Fleet manager not found');
            }
            
            $updates = [];
            $params = [];
            
            // If vendor is being changed, automatically update hub_id from the new vendor
            if ($vendorId !== null) {
                $vendor = db_fetch_one("SELECT id, vendor_name, hub_id FROM vendors WHERE id = ? AND status = 'active'", [$vendorId]);
                if (!$vendor) {
                    badRequest("Vendor with ID {$vendorId} not found or inactive");
                }
                
                if (!$vendor['hub_id']) {
                    badRequest("Vendor '{$vendor['vendor_name']}' is not assigned to any hub. Cannot link associate to this vendor.");
                }
                
                $updates[] = "vendor_id = ?";
                $params[] = $vendorId;
                
                // Automatically update hub_id from vendor
                $updates[] = "hub_id = ?";
                $params[] = (int)$vendor['hub_id'];
                
                error_log("Updating fleet manager {$id}: vendor_id={$vendorId}, hub_id={$vendor['hub_id']} (from vendor '{$vendor['vendor_name']}')");
            }
            
            if ($employeeCode !== null) { $updates[] = "employee_code = ?"; $params[] = $employeeCode; }
            if ($designation !== null) { $updates[] = "designation = ?"; $params[] = $designation; }
            if ($department !== null) { $updates[] = "department = ?"; $params[] = $department; }
            
            if (empty($updates)) {
                badRequest('No fields to update');
            }
            
            $params[] = $id;
            $sql = "UPDATE fleet_managers SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $fleetManager = db_fetch_one("SELECT fm.*, h.hub_name, h.hub_code, v.vendor_name 
                    FROM fleet_managers fm
                    LEFT JOIN hubs h ON fm.hub_id = h.id
                    LEFT JOIN vendors v ON fm.vendor_id = v.id
                    WHERE fm.id = ?", [$id]);
                respond([
                    'status' => true, 
                    'message' => 'Fleet manager updated', 
                    'data' => $fleetManager
                ]);
            } else {
                serverError('Update failed');
            }
        } break;

        // ==================== WAREHOUSE MANAGEMENT ====================
        
        case 'getShelves': {
            $userId = requireAuth($input);
            $role = getUserRole($userId);
            
            // For non-admin users, automatically filter by their hub
            $hubId = isset($input['hub_id']) && $input['hub_id'] !== '' ? (int)$input['hub_id'] : null;
            if ($role !== 'super_admin' && !$hubId) {
                $hubId = getUserHubId($userId);
            }
            
            error_log("getShelves - User ID: {$userId}, Role: {$role}, Hub ID from input: " . ($input['hub_id'] ?? 'NULL') . ", Final Hub ID: " . ($hubId ?? 'NULL'));
            
            if ($hubId !== null && $hubId > 0) {
                $shelves = db_fetch_all(
                    "SELECT s.*, h.hub_name, h.hub_code FROM warehouse_shelves s 
                     LEFT JOIN hubs h ON s.hub_id = h.id 
                     WHERE s.hub_id = ? ORDER BY s.created_at DESC, s.shelf_code ASC", 
                    [$hubId]
                );
                error_log("getShelves - Found " . count($shelves) . " shelves for hub {$hubId}");
                if (count($shelves) > 0) {
                    $shelfCodes = array_map(function($s) { return $s['shelf_code']; }, $shelves);
                    error_log("getShelves - Shelf codes: " . implode(', ', $shelfCodes));
                }
            } else {
                $shelves = db_fetch_all(
                    "SELECT s.*, h.hub_name, h.hub_code FROM warehouse_shelves s 
                     LEFT JOIN hubs h ON s.hub_id = h.id 
                     ORDER BY s.created_at DESC, s.shelf_code ASC"
                );
                error_log("getShelves - Found " . count($shelves) . " shelves (no hub filter)");
            }
            
            respond(['status' => true, 'data' => $shelves]);
        } break;

        case 'createShelf': {
            $userId = requireAuth($input);
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $hubId = (int)($input['hub_id'] ?? 0);
            $shelfCode = $input['shelf_code'] ?? '';
            $shelfName = $input['shelf_name'] ?? null;
            $aisle = $input['aisle'] ?? null;
            $section = $input['section'] ?? null;
            $capacity = (int)($input['capacity'] ?? 0);
            $status = $input['status'] ?? 'active';
            
            error_log("createShelf - User ID: {$userId}, Hub ID: {$hubId}, Shelf Code: {$shelfCode}, Shelf Name: " . ($shelfName ?: 'NULL'));
            
            if (!$hubId || !$shelfCode) {
                error_log("createShelf - Validation failed: Hub ID or Shelf Code missing");
                badRequest('Hub and shelf code required');
            }
            
            // Check for duplicate shelf code in the same hub
            $existing = db_fetch_one(
                "SELECT id FROM warehouse_shelves WHERE hub_id = ? AND shelf_code = ?",
                [$hubId, $shelfCode]
            );
            if ($existing) {
                error_log("createShelf - Duplicate shelf code found in hub {$hubId}");
                conflict('Shelf with this code already exists in this hub');
            }
            
            error_log("createShelf - Inserting new shelf into database");
            $id = db_execute_insert(
                "INSERT INTO warehouse_shelves (hub_id, shelf_code, shelf_name, aisle, section, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$hubId, $shelfCode, $shelfName, $aisle, $section, $capacity ?: null, $status]
            );
            
            if ($id) {
                error_log("createShelf - Shelf created successfully with ID: {$id}");
                // Return shelf with hub info (same format as getShelves)
                $shelf = db_fetch_one(
                    "SELECT s.*, h.hub_name, h.hub_code FROM warehouse_shelves s 
                     LEFT JOIN hubs h ON s.hub_id = h.id 
                     WHERE s.id = ?", 
                    [$id]
                );
                error_log("createShelf - Returning shelf data: " . json_encode($shelf));
                respond(['status' => true, 'message' => 'Shelf created', 'data' => $shelf, 'id' => $id]);
            } else {
                error_log("createShelf - Database insert failed");
                serverError('Creation failed');
            }
        } break;

        case 'updateShelf': {
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $id = (int)($input['id'] ?? $input['shelf_id'] ?? 0);
            
            if (!$id) {
                badRequest('Shelf ID required');
            }
            
            // Check if shelf exists
            $existing = db_fetch_one("SELECT * FROM warehouse_shelves WHERE id = ?", [$id]);
            if (!$existing) {
                notFound('Shelf not found');
            }
            
            $updates = [];
            $params = [];
            
            // Update shelf code
            if (isset($input['shelf_code'])) {
                $shelfCode = $input['shelf_code'];
                // Check for duplicate if changing code
                if ($shelfCode !== $existing['shelf_code']) {
                    $duplicate = db_fetch_one(
                        "SELECT id FROM warehouse_shelves WHERE hub_id = ? AND shelf_code = ? AND id != ?",
                        [$existing['hub_id'], $shelfCode, $id]
                    );
                    if ($duplicate) {
                        conflict('Shelf with this code already exists in this hub');
                    }
                }
                $updates[] = "shelf_code = ?";
                $params[] = $shelfCode;
            }
            
            // Update other fields
            if (isset($input['shelf_name'])) {
                $updates[] = "shelf_name = ?";
                $params[] = $input['shelf_name'] ?: null;
            }
            if (isset($input['aisle'])) {
                $updates[] = "aisle = ?";
                $params[] = $input['aisle'] ?: null;
            }
            if (isset($input['section'])) {
                $updates[] = "section = ?";
                $params[] = $input['section'] ?: null;
            }
            if (isset($input['capacity'])) {
                $updates[] = "capacity = ?";
                $params[] = $input['capacity'] ? (int)$input['capacity'] : null;
            }
            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
            }
            
            if (empty($updates)) {
                badRequest('No fields to update');
            }
            
            $params[] = $id;
            $sql = "UPDATE warehouse_shelves SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $shelf = db_fetch_one(
                    "SELECT s.*, h.hub_name, h.hub_code FROM warehouse_shelves s 
                     LEFT JOIN hubs h ON s.hub_id = h.id 
                     WHERE s.id = ?", 
                    [$id]
                );
                respond(['status' => true, 'message' => 'Shelf updated', 'data' => $shelf]);
            } else {
                serverError('Update failed');
            }
        } break;

        case 'deleteShelf': {
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $id = (int)($input['id'] ?? $input['shelf_id'] ?? 0);
            
            if (!$id) {
                badRequest('Shelf ID required');
            }
            
            // Check if shelf exists
            $existing = db_fetch_one("SELECT * FROM warehouse_shelves WHERE id = ?", [$id]);
            if (!$existing) {
                notFound('Shelf not found');
            }
            
            // Check if shelf has containers
            $hasContainers = db_fetch_one("SELECT COUNT(*) as count FROM containers WHERE shelf_id = ?", [$id]);
            if ($hasContainers && $hasContainers['count'] > 0) {
                conflict('Cannot delete shelf that has containers assigned. Please reassign or delete containers first.');
            }
            
            // Soft delete by setting status to inactive
            if (db_execute("UPDATE warehouse_shelves SET status = 'inactive' WHERE id = ?", [$id])) {
                respond(['status' => true, 'message' => 'Shelf deleted successfully']);
            } else {
                serverError('Delete failed');
            }
        } break;

        case 'getContainers': {
            $userId = requireAuth($input);
            $role = getUserRole($userId);
            
            // For non-admin users, automatically filter by their hub
            $hubId = isset($input['hub_id']) && $input['hub_id'] !== '' ? (int)$input['hub_id'] : null;
            if ($role !== 'super_admin' && !$hubId) {
                $hubId = getUserHubId($userId);
            }
            
            $status = $input['status'] ?? null;
            
            $sql = "SELECT c.*, h.hub_name, h.hub_code, s.shelf_code FROM containers c 
                    LEFT JOIN hubs h ON c.hub_id = h.id 
                    LEFT JOIN warehouse_shelves s ON c.shelf_id = s.id WHERE 1=1";
            $params = [];
            
            if ($hubId !== null && $hubId > 0) {
                $sql .= " AND c.hub_id = ?";
                $params[] = $hubId;
            }
            if ($status) {
                $sql .= " AND c.current_status = ?";
                $params[] = $status;
            }
            
            $containers = db_fetch_all($sql . " ORDER BY c.created_at DESC, c.container_code ASC", $params);
            respond(['status' => true, 'data' => $containers]);
        } break;

        case 'createContainer': {
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $containerCode = $input['container_code'] ?? '';
            $containerType = $input['container_type'] ?? 'medium';
            $hubId = (int)($input['hub_id'] ?? 0);
            $shelfId = isset($input['shelf_id']) && $input['shelf_id'] !== '' ? (int)$input['shelf_id'] : null;
            $currentStatus = $input['current_status'] ?? 'empty';
            $capacityWeight = isset($input['capacity_weight']) && $input['capacity_weight'] !== '' ? (float)$input['capacity_weight'] : null;
            $capacityVolume = isset($input['capacity_volume']) && $input['capacity_volume'] !== '' ? (float)$input['capacity_volume'] : null;
            
            if (!$containerCode || !$hubId) {
                badRequest('Container code and hub required');
            }
            
            // Check for duplicate container code
            $existing = db_fetch_one(
                "SELECT id FROM containers WHERE container_code = ?",
                [$containerCode]
            );
            if ($existing) {
                conflict('Container with this code already exists');
            }
            
            $id = db_execute_insert(
                "INSERT INTO containers (container_code, container_type, hub_id, shelf_id, current_status, capacity_weight, capacity_volume) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    $containerCode, 
                    $containerType, 
                    $hubId, 
                    $shelfId, 
                    $currentStatus,
                    $capacityWeight,
                    $capacityVolume
                ]
            );
            
            if ($id) {
                $container = db_fetch_one(
                    "SELECT c.*, h.hub_name, s.shelf_code FROM containers c 
                     LEFT JOIN hubs h ON c.hub_id = h.id 
                     LEFT JOIN warehouse_shelves s ON c.shelf_id = s.id 
                     WHERE c.id = ?", 
                    [$id]
                );
                respond(['status' => true, 'message' => 'Container created', 'data' => $container, 'id' => $id]);
            } else {
                serverError('Creation failed');
            }
        } break;

        case 'updateContainer': {
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $id = (int)($input['id'] ?? $input['container_id'] ?? 0);
            
            if (!$id) {
                badRequest('Container ID required');
            }
            
            // Check if container exists
            $existing = db_fetch_one("SELECT * FROM containers WHERE id = ?", [$id]);
            if (!$existing) {
                notFound('Container not found');
            }
            
            $updates = [];
            $params = [];
            
            // Update container code
            if (isset($input['container_code'])) {
                $containerCode = $input['container_code'];
                // Check for duplicate if changing code
                if ($containerCode !== $existing['container_code']) {
                    $duplicate = db_fetch_one(
                        "SELECT id FROM containers WHERE container_code = ? AND id != ?",
                        [$containerCode, $id]
                    );
                    if ($duplicate) {
                        conflict('Container with this code already exists');
                    }
                }
                $updates[] = "container_code = ?";
                $params[] = $containerCode;
            }
            
            // Update container type
            if (isset($input['container_type'])) {
                $updates[] = "container_type = ?";
                $params[] = $input['container_type'];
            }
            
            // Update hub (when moving container)
            if (isset($input['hub_id'])) {
                $updates[] = "hub_id = ?";
                $params[] = (int)$input['hub_id'];
            }
            
            // Update shelf assignment
            if (isset($input['shelf_id'])) {
                $shelfId = isset($input['shelf_id']) && $input['shelf_id'] !== '' ? (int)$input['shelf_id'] : null;
                if ($shelfId !== null && $shelfId > 0) {
                    $updates[] = "shelf_id = ?";
                    $params[] = $shelfId;
                } else {
                    $updates[] = "shelf_id = NULL";
                }
            }
            
            // Update current status
            if (isset($input['current_status'])) {
                $updates[] = "current_status = ?";
                $params[] = $input['current_status'];
                
                // If setting to empty, also clear packages from this container
                if ($input['current_status'] === 'empty') {
                    db_execute("UPDATE packages SET container_id = NULL WHERE container_id = ?", [$id]);
                }
            }
            
            // Update capacity fields
            if (isset($input['capacity_weight'])) {
                $updates[] = "capacity_weight = ?";
                $params[] = $input['capacity_weight'] !== '' ? (float)$input['capacity_weight'] : null;
            }
            if (isset($input['capacity_volume'])) {
                $updates[] = "capacity_volume = ?";
                $params[] = $input['capacity_volume'] !== '' ? (float)$input['capacity_volume'] : null;
            }
            
            if (empty($updates)) {
                badRequest('No fields to update');
            }
            
            $params[] = $id;
            $sql = "UPDATE containers SET " . implode(', ', $updates) . " WHERE id = ?";
            
            if (db_execute($sql, $params)) {
                $container = db_fetch_one(
                    "SELECT c.*, h.hub_name, h.hub_code, s.shelf_code FROM containers c 
                     LEFT JOIN hubs h ON c.hub_id = h.id 
                     LEFT JOIN warehouse_shelves s ON c.shelf_id = s.id 
                     WHERE c.id = ?", 
                    [$id]
                );
                respond(['status' => true, 'message' => 'Container updated', 'data' => $container]);
            } else {
                serverError('Update failed');
            }
        } break;

        case 'deleteContainer': {
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $id = (int)($input['id'] ?? $input['container_id'] ?? 0);
            
            if (!$id) {
                badRequest('Container ID required');
            }
            
            // Check if container exists
            $existing = db_fetch_one("SELECT * FROM containers WHERE id = ?", [$id]);
            if (!$existing) {
                notFound('Container not found');
            }
            
            // Check if container has packages
            $hasPackages = db_fetch_one("SELECT COUNT(*) as count FROM packages WHERE container_id = ?", [$id]);
            if ($hasPackages && $hasPackages['count'] > 0) {
                conflict('Cannot delete container that has packages. Please remove packages first.');
            }
            
            // Hard delete since containers don't have a status field for soft delete
            if (db_execute("DELETE FROM containers WHERE id = ?", [$id])) {
                respond(['status' => true, 'message' => 'Container deleted successfully']);
            } else {
                serverError('Delete failed');
            }
        } break;

        case 'markContainerFull': {
            requireRole(['super_admin', 'vendor', 'associate'], $input);
            $containerId = (int)($input['container_id'] ?? 0);
            
            if (!$containerId) {
                badRequest('Container ID required');
            }
            
            // Check if container exists
            $container = db_fetch_one("SELECT * FROM containers WHERE id = ?", [$containerId]);
            if (!$container) {
                notFound('Container not found');
            }
            
            // Check if container is in_use
            if ($container['current_status'] !== 'in_use') {
                badRequest('Only containers in use can be marked as full');
            }
            
            // Mark container as full
            if (db_execute("UPDATE containers SET current_status = 'full' WHERE id = ?", [$containerId])) {
                $updatedContainer = db_fetch_one(
                    "SELECT c.*, h.hub_name, s.shelf_code 
                     FROM containers c 
                     LEFT JOIN hubs h ON c.hub_id = h.id 
                     LEFT JOIN warehouse_shelves s ON c.shelf_id = s.id 
                     WHERE c.id = ?", 
                    [$containerId]
                );
                respond(['status' => true, 'message' => 'Container marked as full', 'data' => $updatedContainer]);
            } else {
                serverError('Failed to update container status');
            }
        } break;

        // ==================== SHIPMENT LIFECYCLE - STEP 2: CONSOLIDATION ====================
        
        case 'consolidatePackage': {
            $userId = requireAuth($input);
            $packageId = (int)($input['package_id'] ?? 0);
            $containerId = (int)($input['container_id'] ?? 0);
            $shelfId = (int)($input['shelf_id'] ?? 0);
            
            if (!$packageId || !$containerId) {
                badRequest('Package and container required');
            }
            
            // Get user's hub
            $userHubId = getUserHubId($userId);
            if (!$userHubId) {
                badRequest('User is not assigned to any hub. Cannot perform consolidation.');
            }
            
            error_log("consolidatePackage - User ID: {$userId}, User Hub: {$userHubId}, Package ID: {$packageId}, Container ID: {$containerId}");
            
            // Get package and shipment with hub information
            $package = db_fetch_one("SELECT * FROM packages WHERE id = ?", [$packageId]);
            if (!$package) {
                notFound('Package not found');
            }
            
            $shipment = db_fetch_one(
                "SELECT s.*, oh.hub_name as origin_hub_name, ch.hub_name as current_hub_name 
                 FROM shipments s
                 LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                 LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                 WHERE s.id = ?", 
                [$package['shipment_id']]
            );
            
            if (!$shipment) {
                notFound('Shipment not found');
            }
            
            // CRITICAL VALIDATION 1: Package must be at user's current hub
            if ($shipment['current_hub_id'] != $userHubId) {
                error_log("consolidatePackage - VALIDATION FAILED: Shipment is at hub {$shipment['current_hub_id']} ({$shipment['current_hub_name']}), but user is at hub {$userHubId}");
                badRequest("Cannot consolidate this package. This shipment is currently at '{$shipment['current_hub_name']}' hub, but you are assigned to a different hub. Packages can only be consolidated at the hub where they are currently located.");
            }
            
            // Get container with its hub
            $container = db_fetch_one(
                "SELECT c.*, h.hub_name as container_hub_name 
                 FROM containers c
                 LEFT JOIN hubs h ON c.hub_id = h.id
                 WHERE c.id = ?", 
                [$containerId]
            );
            
            if (!$container) {
                notFound('Container not found');
            }
            
            // CRITICAL VALIDATION 2: Container must belong to the same hub as the shipment
            if ($container['hub_id'] != $shipment['current_hub_id']) {
                error_log("consolidatePackage - VALIDATION FAILED: Container belongs to hub {$container['hub_id']} ({$container['container_hub_name']}), but shipment is at hub {$shipment['current_hub_id']} ({$shipment['current_hub_name']})");
                badRequest("Cannot use this container. The container belongs to '{$container['container_hub_name']}' hub, but this package is at '{$shipment['current_hub_name']}' hub. You can only use containers from the same hub.");
            }
            
            // CRITICAL VALIDATION 3: If shelf is provided, it must belong to the same hub
            if ($shelfId) {
                $shelf = db_fetch_one(
                    "SELECT ws.*, h.hub_name as shelf_hub_name 
                     FROM warehouse_shelves ws
                     LEFT JOIN hubs h ON ws.hub_id = h.id
                     WHERE ws.id = ?", 
                    [$shelfId]
                );
                
                if (!$shelf) {
                    notFound('Shelf not found');
                }
                
                if ($shelf['hub_id'] != $shipment['current_hub_id']) {
                    error_log("consolidatePackage - VALIDATION FAILED: Shelf belongs to hub {$shelf['hub_id']} ({$shelf['shelf_hub_name']}), but shipment is at hub {$shipment['current_hub_id']} ({$shipment['current_hub_name']})");
                    badRequest("Cannot use this shelf. The shelf belongs to '{$shelf['shelf_hub_name']}' hub, but this package is at '{$shipment['current_hub_name']}' hub. You can only use shelves from the same hub.");
                }
            }
            
            error_log("consolidatePackage - All validations passed. Updating package {$packageId} to container {$containerId}");
            
            // Update package and status to CONSOLIDATED
            db_execute(
                "UPDATE packages SET container_id = ?, shelf_id = ?, status = 'CONSOLIDATED' WHERE id = ?",
                [$containerId, $shelfId ?: null, $packageId]
            );
            
            // Update shipment status to CONSOLIDATED
            db_execute(
                "UPDATE shipments SET current_status = 'CONSOLIDATED', consolidated_at = NOW() WHERE id = ?",
                [$shipment['id']]
            );
            
            // Update container status
            db_execute(
                "UPDATE containers SET current_status = 'in_use', shelf_id = ? WHERE id = ?",
                [$shelfId ?: null, $containerId]
            );
            
            // Add tracking
            db_execute_insert(
                "INSERT INTO shipment_tracking (shipment_id, package_id, status, location_hub_id, description, updated_by_user_id) 
                 VALUES (?, ?, 'CONSOLIDATED', ?, ?, ?)",
                [$shipment['id'], $packageId, $shipment['current_hub_id'], "Package consolidated in container {$container['container_code']} at {$shipment['current_hub_name']} hub", $userId]
            );
            
            respond([
                'status' => true, 
                'message' => "Package consolidated successfully at {$shipment['current_hub_name']} hub"
            ]);
        } break;

        case 'getPackagesByContainer': {
            $containerId = (int)($input['container_id'] ?? 0);
            
            if (!$containerId) {
                badRequest('Container ID required');
            }
            
            // Get all packages in this container
            $packages = db_fetch_all(
                "SELECT p.*, s.tracking_number, s.wr_number 
                 FROM packages p
                 LEFT JOIN shipments s ON p.shipment_id = s.id
                 WHERE p.container_id = ?
                 ORDER BY p.created_at DESC",
                [$containerId]
            );
            
            respond(['status' => true, 'data' => $packages]);
        } break;

        // ==================== TRACKING & SCANNING ====================
        
        case 'trackShipment': {
            $trackingNumber = $input['tracking_number'] ?? '';
            $wrNumber = $input['wr_number'] ?? '';
            
            if (!$trackingNumber && !$wrNumber) {
                badRequest('Tracking number or WR number required');
            }
            
            $sql = "SELECT s.*, 
                    oh.hub_name as origin_hub_name, oh.hub_code as origin_hub_code,
                    dh.hub_name as destination_hub_name, dh.hub_code as destination_hub_code,
                    ch.hub_name as current_hub_name
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE ";
            
            if ($trackingNumber) {
                $sql .= "s.tracking_number = ?";
                $params = [$trackingNumber];
            } else {
                $sql .= "s.wr_number = ?";
                $params = [$wrNumber];
            }
            
            $shipment = db_fetch_one($sql, $params);
            
            if (!$shipment) {
                notFound('Shipment not found');
            }
            
            // Get packages
            $packages = db_fetch_all(
                "SELECT p.*, c.container_code, s.shelf_code FROM packages p
                 LEFT JOIN containers c ON p.container_id = c.id
                 LEFT JOIN warehouse_shelves s ON p.shelf_id = s.id
                 WHERE p.shipment_id = ?",
                [$shipment['id']]
            );
            
            // Get tracking history
            $tracking = db_fetch_all(
                "SELECT st.*, h.hub_name, h.hub_code, u.full_name as updated_by 
                 FROM shipment_tracking st
                 LEFT JOIN hubs h ON st.location_hub_id = h.id
                 LEFT JOIN users u ON st.updated_by_user_id = u.id
                 WHERE st.shipment_id = ?
                 ORDER BY st.timestamp ASC",
                [$shipment['id']]
            );
            
            respond([
                'status' => true,
                'shipment' => $shipment,
                'packages' => $packages,
                'tracking_history' => $tracking
            ]);
        } break;

        case 'scanPackage': {
            $userId = requireAuth($input);
            $code = $input['code'] ?? '';
            
            if (!$code) {
                badRequest('Scan code required');
            }
            
            // Try to find package or shipment
            $package = db_fetch_one("SELECT * FROM packages WHERE package_code = ?", [$code]);
            $shipment = null;
            
            if ($package) {
                $shipment = db_fetch_one("SELECT s.*, 
                    oh.hub_name as origin_hub_name, oh.hub_code as origin_hub_code,
                    dh.hub_name as destination_hub_name, dh.hub_code as destination_hub_code,
                    ch.hub_name as current_hub_name
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE s.id = ?", [$package['shipment_id']]);
            } else {
                $shipment = db_fetch_one("SELECT s.*, 
                    oh.hub_name as origin_hub_name, oh.hub_code as origin_hub_code,
                    dh.hub_name as destination_hub_name, dh.hub_code as destination_hub_code,
                    ch.hub_name as current_hub_name
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE s.tracking_number = ? OR s.wr_number = ?", [$code, $code]);
                if ($shipment) {
                    $package = db_fetch_one("SELECT p.*, c.container_code, s.shelf_code FROM packages p
                        LEFT JOIN containers c ON p.container_id = c.id
                        LEFT JOIN warehouse_shelves s ON p.shelf_id = s.id
                        WHERE p.shipment_id = ? LIMIT 1", [$shipment['id']]);
                }
            }
            
            if (!$shipment) {
                notFound('Package/Shipment not found');
            }
            
            // Get all packages for this shipment with related data
            $allPackages = db_fetch_all("SELECT p.*, c.container_code, s.shelf_code FROM packages p
                LEFT JOIN containers c ON p.container_id = c.id
                LEFT JOIN warehouse_shelves s ON p.shelf_id = s.id
                WHERE p.shipment_id = ?", [$shipment['id']]);
            
            // Log the scan
            db_execute_insert(
                "INSERT INTO scan_logs (scan_type, scanned_code, shipment_id, package_id, hub_id, scanned_by_user_id, action_taken) 
                 VALUES ('package', ?, ?, ?, ?, ?, 'Scanned')",
                [$code, $shipment['id'], $package['id'] ?? null, $shipment['current_hub_id'], $userId]
            );
            
            respond([
                'status' => true,
                'shipment' => $shipment,
                'packages' => $allPackages,
                'scanned_package' => $package
            ]);
        } break;

        case 'scanPackageAtHub': {
            $userId = requireAuth($input);
            $code = $input['code'] ?? '';
            
            if (!$code) {
                badRequest('Scan code required');
            }
            
            // Get the scanning user's hub
            $scanningHubId = getUserHubId($userId);
            if (!$scanningHubId) {
                error_log("scanPackageAtHub - CRITICAL: User {$userId} has no hub assignment");
                
                // Provide helpful debugging info
                $user = db_fetch_one("SELECT id, username, email, full_name, role, status FROM users WHERE id = ?", [$userId]);
                $fleetManager = db_fetch_one("SELECT * FROM fleet_managers WHERE user_id = ?", [$userId]);
                $vendor = db_fetch_one("SELECT * FROM vendors WHERE user_id = ?", [$userId]);
                
                error_log("scanPackageAtHub - User Info: " . json_encode($user));
                error_log("scanPackageAtHub - Fleet Manager Record: " . ($fleetManager ? json_encode($fleetManager) : "NULL"));
                error_log("scanPackageAtHub - Vendor Record: " . ($vendor ? json_encode($vendor) : "NULL"));
                
                badRequest('Your account is not assigned to any hub. Please contact your administrator to link your account to a hub in the fleet_managers or vendors table.');
            }
            
            error_log("scanPackageAtHub - User ID: {$userId}, Scanning Hub: {$scanningHubId}, Code: {$code}");
            
            // Try to find package or shipment
            $package = db_fetch_one("SELECT * FROM packages WHERE package_code = ?", [$code]);
            $shipment = null;
            
            if ($package) {
                $shipment = db_fetch_one("SELECT s.*, 
                    oh.hub_name as origin_hub_name, oh.hub_code as origin_hub_code,
                    dh.hub_name as destination_hub_name, dh.hub_code as destination_hub_code,
                    ch.hub_name as current_hub_name
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE s.id = ?", [$package['shipment_id']]);
            } else {
                $shipment = db_fetch_one("SELECT s.*, 
                    oh.hub_name as origin_hub_name, oh.hub_code as origin_hub_code,
                    dh.hub_name as destination_hub_name, dh.hub_code as destination_hub_code,
                    ch.hub_name as current_hub_name
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE s.tracking_number = ? OR s.wr_number = ?", [$code, $code]);
                if ($shipment) {
                    $package = db_fetch_one("SELECT p.*, c.container_code, s.shelf_code FROM packages p
                        LEFT JOIN containers c ON p.container_id = c.id
                        LEFT JOIN warehouse_shelves s ON p.shelf_id = s.id
                        WHERE p.shipment_id = ? LIMIT 1", [$shipment['id']]);
                }
            }
            
            if (!$shipment) {
                notFound('Package/Shipment not found');
            }
            
            error_log("scanPackageAtHub - Shipment found: ID {$shipment['id']}, Status: {$shipment['current_status']}, Current Hub: " . ($shipment['current_hub_id'] ?? 'NULL'));
            
            // Get the scanning hub info
            $scanningHub = db_fetch_one("SELECT hub_name FROM hubs WHERE id = ?", [$scanningHubId]);
            
            // Determine status based on scanning location
            $newStatus = $shipment['current_status'];
            $statusField = '';
            $description = "Package scanned at {$scanningHub['hub_name']}";
            
            // VALIDATION: Check if package can be scanned at this location
            if ($scanningHubId != $shipment['current_hub_id']) {
                // Trying to scan at a different hub - need to validate workflow
                
                // Check if package has been consolidated (assigned to container/shelf)
                if (!$package['container_id'] && $shipment['current_status'] != 'DISPATCHED' && $shipment['current_status'] != 'IN_TRANSIT') {
                    error_log("scanPackageAtHub - ERROR: Package not consolidated yet");
                    badRequest('Package must be loaded into a container and shelf before it can be dispatched or moved. Please use Load Management to consolidate this package first.');
                }
                
                // Check if package has been dispatched (if scanning at transit or destination)
                if ($scanningHubId == $shipment['destination_hub_id']) {
                    // Scanning at destination hub - must be DISPATCHED or IN_TRANSIT
                    if ($shipment['current_status'] != 'DISPATCHED' && $shipment['current_status'] != 'IN_TRANSIT') {
                        error_log("scanPackageAtHub - ERROR: Package not dispatched yet, current status: {$shipment['current_status']}");
                        badRequest("Package cannot arrive at destination until it has been dispatched from origin hub. Current status: {$shipment['current_status']}. Please dispatch the package from the origin hub first.");
                    }
                    // Package arrived at destination hub - Ready for customer pickup
                    $newStatus = 'READY_FOR_PICKUP';
                    $statusField = 'delivered_at';
                    $description = "Package arrived at destination hub and ready for pickup: {$scanningHub['hub_name']}";
                } else if ($scanningHubId == $shipment['origin_hub_id'] && $shipment['current_status'] == 'CONSOLIDATED') {
                    // Package being dispatched from origin hub
                    $newStatus = 'DISPATCHED';
                    $statusField = 'dispatched_at';
                    $description = "Package dispatched from {$scanningHub['hub_name']}";
                } else {
                    // Package in transit through intermediate hub
                    if ($shipment['current_status'] != 'DISPATCHED' && $shipment['current_status'] != 'IN_TRANSIT') {
                        error_log("scanPackageAtHub - ERROR: Package not dispatched yet for transit, current status: {$shipment['current_status']}");
                        badRequest("Package must be dispatched before it can be scanned at transit hubs. Current status: {$shipment['current_status']}");
                    }
                    $newStatus = 'IN_TRANSIT';
                    $description = "Package in transit through {$scanningHub['hub_name']}";
                }
                
                error_log("scanPackageAtHub - Status change: {$shipment['current_status']} -> {$newStatus}");
                
                // Update shipment status and location
                $updateSql = "UPDATE shipments SET current_status = ?, current_hub_id = ?";
                $updateParams = [$newStatus, $scanningHubId];
                
                if ($statusField) {
                    $updateSql .= ", {$statusField} = NOW()";
                }
                
                $updateParams[] = $shipment['id'];
                $updateSql .= " WHERE id = ?";
                
                db_execute($updateSql, $updateParams);
                
                // Update all packages status
                db_execute("UPDATE packages SET status = ? WHERE shipment_id = ?", [$newStatus, $shipment['id']]);
                
                // Update shipment data
                $shipment['current_status'] = $newStatus;
                $shipment['current_hub_id'] = $scanningHubId;
                $shipment['current_hub_name'] = $scanningHub['hub_name'];
            }
            
            // Get all packages for this shipment with related data
            $allPackages = db_fetch_all("SELECT p.*, c.container_code, s.shelf_code FROM packages p
                LEFT JOIN containers c ON p.container_id = c.id
                LEFT JOIN warehouse_shelves s ON p.shelf_id = s.id
                WHERE p.shipment_id = ?", [$shipment['id']]);
            
            // Log the scan
            db_execute_insert(
                "INSERT INTO scan_logs (scan_type, scanned_code, shipment_id, package_id, hub_id, scanned_by_user_id, action_taken) 
                 VALUES ('package', ?, ?, ?, ?, ?, ?)",
                [$code, $shipment['id'], $package['id'] ?? null, $scanningHubId, $userId, $description]
            );
            
            // Add tracking entry if status changed
            if ($scanningHubId != ($shipment['current_hub_id'] ?? 0)) {
                db_execute_insert(
                    "INSERT INTO shipment_tracking (shipment_id, status, location_hub_id, description, updated_by_user_id) 
                     VALUES (?, ?, ?, ?, ?)",
                    [$shipment['id'], $newStatus, $scanningHubId, $description, $userId]
                );
            }
            
            respond([
                'status' => true,
                'shipment' => $shipment,
                'packages' => $allPackages,
                'scanned_package' => $package,
                'status_updated' => ($scanningHubId != ($shipment['current_hub_id'] ?? 0)),
                'new_status' => $newStatus,
                'message' => $description
            ]);
        } break;

        // ==================== DASHBOARD & REPORTS ====================
        
        case 'getDashboardStats': {
            $userId = requireAuth($input);
            $role = getUserRole($userId);
            
            // For non-admin users, automatically filter by their hub
            $hubId = $input['hub_id'] ?? null;
            if ($role !== 'super_admin' && !$hubId) {
                $hubId = getUserHubId($userId);
                error_log("getDashboardStats - User ID: {$userId}, Role: {$role}, Hub ID: " . ($hubId ?? 'NULL'));
                
                // If non-admin user has no hub, return empty stats
                if (!$hubId) {
                    error_log("WARNING: Non-admin user {$userId} with role {$role} has no hub assigned");
                    respond(['status' => true, 'data' => [
                        'total_shipments' => 0,
                        'today_shipments' => 0,
                        'by_status' => []
                    ]]);
                    break;
                }
            }
            
            $stats = [];
            
            // Total shipments (filter by origin, current, or destination hub)
            $sql = "SELECT COUNT(*) as total FROM shipments";
            $params = [];
            if ($hubId) {
                $sql .= " WHERE (origin_hub_id = ? OR current_hub_id = ? OR destination_hub_id = ?)";
                $params[] = $hubId;
                $params[] = $hubId;
                $params[] = $hubId;
            }
            $result = db_fetch_one($sql, $params);
            $stats['total_shipments'] = $result['total'] ?? 0;
            
            // Shipments by status
            $statusSql = "SELECT current_status, COUNT(*) as count FROM shipments";
            if ($hubId) {
                $statusSql .= " WHERE (origin_hub_id = ? OR current_hub_id = ? OR destination_hub_id = ?)";
            }
            $statusSql .= " GROUP BY current_status";
            $statusCounts = db_fetch_all($statusSql, $params);
            $stats['by_status'] = $statusCounts;
            
            // Today's shipments
            $todaySql = "SELECT COUNT(*) as total FROM shipments WHERE DATE(created_at) = CURDATE()";
            if ($hubId) {
                $todaySql .= " AND (origin_hub_id = ? OR current_hub_id = ? OR destination_hub_id = ?)";
            }
            $todayResult = db_fetch_one($todaySql, $params);
            $stats['today_shipments'] = $todayResult['total'] ?? 0;
            
            respond(['status' => true, 'data' => $stats]);
        } break;

        case 'getRecentShipments': {
            $userId = requireAuth($input);
            $role = getUserRole($userId);
            $limit = (int)($input['limit'] ?? 10);
            
            // For non-admin users, automatically filter by their hub
            $hubId = $input['hub_id'] ?? null;
            if ($role !== 'super_admin' && !$hubId) {
                $hubId = getUserHubId($userId);
                error_log("getRecentShipments - User ID: {$userId}, Role: {$role}, Hub ID: " . ($hubId ?? 'NULL'));
                
                // If non-admin user has no hub, return empty array
                if (!$hubId) {
                    error_log("WARNING: Non-admin user {$userId} with role {$role} has no hub assigned");
                    respond(['status' => true, 'data' => []]);
                    break;
                }
            }
            
            $sql = "SELECT s.*, oh.hub_name as origin_hub, dh.hub_name as destination_hub 
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    WHERE 1=1";
            $params = [];
            
            if ($hubId) {
                $sql .= " AND (s.origin_hub_id = ? OR s.current_hub_id = ? OR s.destination_hub_id = ?)";
                $params[] = $hubId;
                $params[] = $hubId;
                $params[] = $hubId;
            }
            
            $sql .= " ORDER BY s.created_at DESC LIMIT ?";
            $params[] = $limit;
            
            $shipments = db_fetch_all($sql, $params);
            respond(['status' => true, 'data' => $shipments]);
        } break;

        // ==================== NOTIFICATIONS ====================
        
        case 'getNotifications': {
            $userId = requireAuth($input);
            $unreadOnly = $input['unread_only'] ?? false;
            
            $sql = "SELECT * FROM notifications WHERE user_id = ?";
            $params = [$userId];
            
            if ($unreadOnly) {
                $sql .= " AND is_read = 0";
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT 50";
            
            $notifications = db_fetch_all($sql, $params);
            respond(['status' => true, 'data' => $notifications]);
        } break;

        case 'markNotificationRead': {
            $userId = requireAuth($input);
            $notificationId = (int)($input['notification_id'] ?? 0);
            
            db_execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [$notificationId, $userId]);
            respond(['status' => true, 'message' => 'Notification marked as read']);
        } break;

        // ==================== PARTIES (Customers/Shippers/Consignees) ====================
        
        case 'getParties': {
            $userId = requireAuth($input);
            $userRole = getUserRole($userId);
            $search = $input['search'] ?? '';
            $type = $input['type'] ?? null; // customer, shipper, consignee, both
            
            $sql = "SELECT * FROM parties WHERE status = 'active'";
            $params = [];
            
            // Filter by hub unless user is super_admin
            if ($userRole !== 'super_admin') {
                $hubId = getUserHubId($userId);
                if ($hubId) {
                    $sql .= " AND hub_id = ?";
                    $params[] = $hubId;
                }
            }
            
            if ($search) {
                $sql .= " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if ($type) {
                $sql .= " AND (party_type = ? OR party_type = 'both')";
                $params[] = $type;
            }
            
            $sql .= " ORDER BY name ASC";
            
            $parties = db_fetch_all($sql, $params);
            respond(['status' => true, 'data' => $parties]);
        } break;

        case 'createParty': {
            $userId = requireAuth($input);
            
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $address = trim($input['address'] ?? '');
            $city = trim($input['city'] ?? '');
            $state = trim($input['state'] ?? '');
            $country = trim($input['country'] ?? '');
            $postalCode = trim($input['postal_code'] ?? '');
            $companyName = trim($input['company_name'] ?? '');
            $taxId = trim($input['tax_id'] ?? '');
            $partyType = $input['party_type'] ?? 'both';
            
            // Get user's hub_id to associate party with their hub
            $hubId = getUserHubId($userId);
            
            if (!$name) {
                badRequest('Party name is required');
            }
            
            // Check for duplicate within the same hub
            if ($hubId) {
                $existing = db_fetch_one("SELECT id FROM parties WHERE name = ? AND hub_id = ? AND status = 'active'", [$name, $hubId]);
            } else {
                $existing = db_fetch_one("SELECT id FROM parties WHERE name = ? AND status = 'active'", [$name]);
            }
            
            if ($existing) {
                conflict('Party with this name already exists in your hub');
            }
            
            $partyId = db_execute_insert(
                "INSERT INTO parties (hub_id, party_type, name, email, phone, address, city, state, country, postal_code, company_name, tax_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
                [$hubId, $partyType, $name, $email ?: null, $phone ?: null, $address ?: null, $city ?: null, $state ?: null, $country ?: null, $postalCode ?: null, $companyName ?: null, $taxId ?: null]
            );
            
            if (!$partyId) {
                serverError('Failed to create party');
            }
            
            $party = db_fetch_one("SELECT * FROM parties WHERE id = ?", [$partyId]);
            
            respond(['status' => true, 'data' => $party, 'message' => 'Party created successfully']);
        } break;

        case 'updateParty': {
            $userId = requireAuth($input);
            
            $partyId = (int)($input['party_id'] ?? 0);
            if (!$partyId) {
                badRequest('Party ID is required');
            }
            
            $existing = db_fetch_one("SELECT * FROM parties WHERE id = ?", [$partyId]);
            if (!$existing) {
                notFound('Party not found');
            }
            
            $name = trim($input['name'] ?? $existing['name']);
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $address = trim($input['address'] ?? '');
            $city = trim($input['city'] ?? '');
            $state = trim($input['state'] ?? '');
            $country = trim($input['country'] ?? '');
            $postalCode = trim($input['postal_code'] ?? '');
            $companyName = trim($input['company_name'] ?? '');
            $taxId = trim($input['tax_id'] ?? '');
            $partyType = $input['party_type'] ?? $existing['party_type'];
            
            db_execute(
                "UPDATE parties SET party_type = ?, name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, postal_code = ?, company_name = ?, tax_id = ? WHERE id = ?",
                [$partyType, $name, $email ?: null, $phone ?: null, $address ?: null, $city ?: null, $state ?: null, $country ?: null, $postalCode ?: null, $companyName ?: null, $taxId ?: null, $partyId]
            );
            
            $party = db_fetch_one("SELECT * FROM parties WHERE id = ?", [$partyId]);
            respond(['status' => true, 'data' => $party, 'message' => 'Party updated successfully']);
        } break;

        // ==================== SHIPMENTS ====================
        
        case 'createShipment': {
            $auth = requireRole(['super_admin', 'vendor', 'associate'], $input);
            $userId = $auth['user_id'];
            
            // Extract shipment data - WR Number and Tracking Number are the same
            $wrNumber = trim($input['wr_number'] ?? '');
            $trackingNumber = trim($input['tracking_number'] ?? '');
            
            // Auto-generate if not provided
            if (!$wrNumber) {
                $wrNumber = generateWRNumber();
            }
            // Use WR Number as Tracking Number if not separately provided
            if (!$trackingNumber) {
                $trackingNumber = $wrNumber;
            }
            
            // Validate uniqueness - check if WR Number OR Tracking Number already exists
            // Since they're the same value, we check both columns to ensure no duplicates
            $existingNumber = db_fetch_one(
                "SELECT id FROM shipments WHERE wr_number = ? OR tracking_number = ?", 
                [$wrNumber, $wrNumber]
            );
            if ($existingNumber) {
                conflict("WR Number / Tracking Number '{$wrNumber}' already exists. Please use a unique number.");
            }
            
            $originHubId = (int)($input['origin_hub_id'] ?? 0);
            $destHubId = (int)($input['destination_hub_id'] ?? 0);
            $transportMode = $input['transport_mode'] ?? 'GROUND';
            $paymentType = strtolower($input['payment_type'] ?? 'prepaid');
            
            // Payment amounts
            $totalAmount = (float)($input['total_amount'] ?? 0);
            $paidAmount = 0.00;
            $pendingAmount = 0.00;
            
            // Calculate paid and pending amounts based on payment type
            if ($paymentType === 'prepaid') {
                // Fully prepaid - entire amount is paid
                $paidAmount = $totalAmount;
                $pendingAmount = 0.00;
            } elseif ($paymentType === 'collect') {
                // Collect on delivery - nothing paid yet
                $paidAmount = 0.00;
                $pendingAmount = $totalAmount;
            } elseif ($paymentType === 'partial_payment') {
                // Partial payment - get the amount already collected
                $paidAmount = (float)($input['paid_amount'] ?? 0);
                $pendingAmount = $totalAmount - $paidAmount;
                
                // Validate partial payment
                if ($paidAmount < 0 || $paidAmount > $totalAmount) {
                    badRequest('Paid amount must be between 0 and total amount');
                }
            } else {
                // third_party or other - default to nothing paid
                $paidAmount = 0.00;
                $pendingAmount = $totalAmount;
            }
            
            // Shipper/Consignee - can be party IDs or inline data
            $shipperId = (int)($input['shipper_id'] ?? 0);
            $consigneeId = (int)($input['consignee_id'] ?? 0);
            
            // Shipper data (from party or inline)
            if ($shipperId) {
                $shipper = db_fetch_one("SELECT * FROM parties WHERE id = ?", [$shipperId]);
                $shipperName = $shipper['name'];
                $shipperPhone = $shipper['phone'] ?? '';
                $shipperEmail = $shipper['email'] ?? '';
                $shipperAddress = $shipper['address'] ?? '';
                $shipperCity = $shipper['city'] ?? '';
                $shipperCountry = $shipper['country'] ?? '';
                $shipperPostalCode = $shipper['postal_code'] ?? '';
            } else {
                $shipperName = $input['shipper_name'] ?? '';
                $shipperPhone = $input['shipper_phone'] ?? '';
                $shipperEmail = $input['shipper_email'] ?? '';
                $shipperAddress = $input['shipper_address'] ?? '';
                $shipperCity = $input['shipper_city'] ?? '';
                $shipperCountry = $input['shipper_country'] ?? '';
                $shipperPostalCode = $input['shipper_postal_code'] ?? '';
            }
            
            // Consignee data (from party or inline)
            if ($consigneeId) {
                $consignee = db_fetch_one("SELECT * FROM parties WHERE id = ?", [$consigneeId]);
                $consigneeName = $consignee['name'];
                $consigneePhone = $consignee['phone'] ?? '';
                $consigneeEmail = $consignee['email'] ?? '';
                $consigneeAddress = $consignee['address'] ?? '';
                $consigneeCity = $consignee['city'] ?? '';
                $consigneeCountry = $consignee['country'] ?? '';
                $consigneePostalCode = $consignee['postal_code'] ?? '';
            } else {
                $consigneeName = $input['consignee_name'] ?? '';
                $consigneePhone = $input['consignee_phone'] ?? '';
                $consigneeEmail = $input['consignee_email'] ?? '';
                $consigneeAddress = $input['consignee_address'] ?? '';
                $consigneeCity = $input['consignee_city'] ?? '';
                $consigneeCountry = $input['consignee_country'] ?? '';
                $consigneePostalCode = $input['consignee_postal_code'] ?? '';
            }
            
            // Validate required fields
            if (!$originHubId || !$destHubId) {
                badRequest('Origin and destination hubs are required');
            }
            if (!$shipperName || !$consigneeName) {
                badRequest('Shipper and consignee information required');
            }
            
            $currency = $input['currency'] ?? 'USD';
            $notes = $input['notes'] ?? '';
            $specialInstructions = $input['special_instructions'] ?? '';
            
            // Create shipment
            db_execute(
                "INSERT INTO shipments (
                    tracking_number, wr_number, origin_hub_id, destination_hub_id, current_hub_id,
                    transport_mode, payment_type, total_amount, paid_amount, pending_amount, currency,
                    shipper_name, shipper_phone, shipper_email, shipper_address, shipper_city, shipper_country, shipper_postal_code,
                    consignee_name, consignee_phone, consignee_email, consignee_address, consignee_city, consignee_country, consignee_postal_code,
                    current_status, received_at, created_by_user_id, notes, special_instructions
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    'RECEIVED', NOW(), ?, ?, ?
                )",
                [
                    $trackingNumber, $wrNumber, $originHubId, $destHubId, $originHubId,
                    $transportMode, $paymentType, $totalAmount, $paidAmount, $pendingAmount, $currency,
                    $shipperName, $shipperPhone, $shipperEmail, $shipperAddress, $shipperCity, $shipperCountry, $shipperPostalCode,
                    $consigneeName, $consigneePhone, $consigneeEmail, $consigneeAddress, $consigneeCity, $consigneeCountry, $consigneePostalCode,
                    $userId, $notes, $specialInstructions
                ]
            );
            
            $shipmentId = db_last_insert_id();
            
            // Create packages
            $packages = $input['packages'] ?? [];
            $packageIds = [];
            
            foreach ($packages as $pkg) {
                $packageCode = 'PKG-' . $trackingNumber . '-' . str_pad((string)(count($packageIds) + 1), 3, '0', STR_PAD_LEFT);
                
                $weight = (float)($pkg['weight'] ?? 0);
                $length = (float)($pkg['length'] ?? 0);
                $width = (float)($pkg['width'] ?? 0);
                $height = (float)($pkg['height'] ?? 0);
                $description = $pkg['description'] ?? '';
                $declaredValue = (float)($pkg['declared_value'] ?? 0);
                $quantity = (int)($pkg['quantity'] ?? 1);
                
                // Calculate volumetric weight (example: length * width * height / 5000 for air)
                $volumetricWeight = 0;
                if ($length && $width && $height) {
                    $volumetricWeight = ($length * $width * $height) / 5000;
                }
                
                db_execute(
                    "INSERT INTO packages (
                        shipment_id, package_code, weight, length, width, height, 
                        volumetric_weight, description, declared_value, quantity, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED')",
                    [
                        $shipmentId, $packageCode, $weight, $length, $width, $height,
                        $volumetricWeight, $description, $declaredValue, $quantity
                    ]
                );
                
                $packageIds[] = db_last_insert_id();
            }
            
            // Create initial tracking entry
            db_execute(
                "INSERT INTO shipment_tracking (shipment_id, status, location_hub_id, description, updated_by_user_id)
                 VALUES (?, 'RECEIVED', ?, 'Shipment received at origin hub', ?)",
                [$shipmentId, $originHubId, $userId]
            );
            
            // Get complete shipment data
            $shipment = db_fetch_one(
                "SELECT s.*, oh.hub_name as origin_hub, dh.hub_name as destination_hub 
                 FROM shipments s
                 LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                 LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                 WHERE s.id = ?",
                [$shipmentId]
            );
            
            $shipment['packages'] = db_fetch_all("SELECT * FROM packages WHERE shipment_id = ?", [$shipmentId]);
            
            respond([
                'status' => true,
                'data' => $shipment,
                'message' => 'Shipment created successfully',
                'tracking_number' => $trackingNumber,
                'wr_number' => $wrNumber
            ]);
        } break;

        case 'getShipments': {
            $userId = requireAuth($input);
            $role = getUserRole($userId);
            
            $search = $input['search'] ?? '';
            $status = $input['status'] ?? null;
            
            // For non-admin users, automatically filter by their hub
            $hubId = $input['hub_id'] ?? null;
            if ($role !== 'super_admin' && !$hubId) {
                $hubId = getUserHubId($userId);
                error_log("getShipments - User ID: {$userId}, Role: {$role}, Hub ID: " . ($hubId ?? 'NULL'));
                
                // If non-admin user has no hub, return empty array
                if (!$hubId) {
                    error_log("WARNING: Non-admin user {$userId} with role {$role} has no hub assigned");
                    respond(['status' => true, 'data' => []]);
                    break;
                }
            }
            
            $sql = "SELECT s.*, oh.hub_name as origin_hub, dh.hub_name as destination_hub, ch.hub_name as current_hub
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE 1=1";
            $params = [];
            
            // Hub filtering - shipments related to user's hub (origin, current, or destination)
            if ($hubId) {
                $sql .= " AND (s.origin_hub_id = ? OR s.current_hub_id = ? OR s.destination_hub_id = ?)";
                $params[] = $hubId;
                $params[] = $hubId;
                $params[] = $hubId;
            }
            
            if ($search) {
                $sql .= " AND (s.tracking_number LIKE ? OR s.wr_number LIKE ? OR s.shipper_name LIKE ? OR s.consignee_name LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if ($status) {
                $sql .= " AND s.current_status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY s.created_at DESC";
            
            $shipments = db_fetch_all($sql, $params);
            respond(['status' => true, 'data' => $shipments]);
        } break;

        case 'getShipmentDetails': {
            $userId = requireAuth($input);
            $shipmentId = (int)($input['shipment_id'] ?? 0);
            $trackingNumber = $input['tracking_number'] ?? '';
            
            if (!$shipmentId && !$trackingNumber) {
                badRequest('Shipment ID or tracking number required');
            }
            
            $sql = "SELECT s.*, oh.hub_name as origin_hub, dh.hub_name as destination_hub, ch.hub_name as current_hub
                    FROM shipments s
                    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
                    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
                    LEFT JOIN hubs ch ON s.current_hub_id = ch.id
                    WHERE ";
            $params = [];
            
            if ($shipmentId) {
                $sql .= "s.id = ?";
                $params[] = $shipmentId;
            } else {
                $sql .= "s.tracking_number = ?";
                $params[] = $trackingNumber;
            }
            
            $shipment = db_fetch_one($sql, $params);
            
            if (!$shipment) {
                notFound('Shipment not found');
            }
            
            // Get packages
            $shipment['packages'] = db_fetch_all("SELECT * FROM packages WHERE shipment_id = ?", [$shipment['id']]);
            
            // Get tracking history
            $shipment['tracking'] = db_fetch_all(
                "SELECT st.*, h.hub_name, u.full_name as updated_by 
                 FROM shipment_tracking st
                 LEFT JOIN hubs h ON st.location_hub_id = h.id
                 LEFT JOIN users u ON st.updated_by_user_id = u.id
                 WHERE st.shipment_id = ?
                 ORDER BY st.timestamp DESC",
                [$shipment['id']]
            );
            
            respond(['status' => true, 'data' => $shipment]);
        } break;

        // ==================== SHIPMENT STATUS UPDATES ====================
        
        case 'updateShipmentStatus': {
            $userId = requireAuth($input);
            $shipmentId = (int)($input['shipment_id'] ?? 0);
            $status = $input['status'] ?? '';
            $locationHubId = (int)($input['location_hub_id'] ?? 0);
            $description = $input['description'] ?? '';
            
            // Transport-specific fields
            $vehicleId = $input['vehicle_id'] ?? null;
            $flightNumber = $input['flight_number'] ?? null;
            $airline = $input['airline'] ?? null;
            $vesselName = $input['vessel_name'] ?? null;
            $vesselNumber = $input['vessel_number'] ?? null;
            $carrierName = $input['carrier_name'] ?? null;
            
            if (!$shipmentId || !$status) {
                badRequest('Shipment ID and status required');
            }
            
            // Get shipment
            $shipment = db_fetch_one("SELECT * FROM shipments WHERE id = ?", [$shipmentId]);
            if (!$shipment) {
                notFound('Shipment not found');
            }
            
            // Update shipment status
            $statusField = '';
            switch ($status) {
                case 'CONSOLIDATED':
                    $statusField = 'consolidated_at';
                    break;
                case 'READY_TO_SHIP':
                    $statusField = 'ready_to_ship_at';
                    break;
                case 'DISPATCHED':
                    $statusField = 'dispatched_at';
                    break;
                case 'DELIVERED':
                    $statusField = 'delivered_at';
                    break;
            }
            
            $updateSql = "UPDATE shipments SET current_status = ?";
            $updateParams = [$status];
            
            if ($statusField) {
                $updateSql .= ", {$statusField} = NOW()";
            }
            
            if ($locationHubId) {
                $updateSql .= ", current_hub_id = ?";
                $updateParams[] = $locationHubId;
            }
            
            // Add transport-specific fields
            if ($vehicleId !== null) {
                $updateSql .= ", vehicle_id = ?";
                $updateParams[] = $vehicleId;
            }
            if ($flightNumber !== null) {
                $updateSql .= ", flight_number = ?";
                $updateParams[] = $flightNumber;
            }
            if ($airline !== null) {
                $updateSql .= ", airline = ?";
                $updateParams[] = $airline;
            }
            if ($vesselName !== null) {
                $updateSql .= ", vessel_name = ?";
                $updateParams[] = $vesselName;
            }
            if ($vesselNumber !== null) {
                $updateSql .= ", vessel_number = ?";
                $updateParams[] = $vesselNumber;
            }
            if ($carrierName !== null) {
                $updateSql .= ", carrier_name = ?";
                $updateParams[] = $carrierName;
            }
            
            $updateParams[] = $shipmentId;
            $updateSql .= " WHERE id = ?";
            
            db_execute($updateSql, $updateParams);
            
            // Update all packages status
            db_execute("UPDATE packages SET status = ? WHERE shipment_id = ?", [$status, $shipmentId]);
            
            // If shipment is delivered or collected, free up the containers for reuse
            if (in_array($status, ['DELIVERED', 'COLLECTED'])) {
                // Get all containers used by this shipment's packages
                $containerIds = db_fetch_all(
                    "SELECT DISTINCT container_id FROM packages WHERE shipment_id = ? AND container_id IS NOT NULL",
                    [$shipmentId]
                );
                
                // Set each container back to empty status
                foreach ($containerIds as $row) {
                    if ($row['container_id']) {
                        db_execute(
                            "UPDATE containers SET current_status = 'empty' WHERE id = ?",
                            [$row['container_id']]
                        );
                    }
                }
                
                // Clear container assignment from packages
                db_execute("UPDATE packages SET container_id = NULL WHERE shipment_id = ?", [$shipmentId]);
            }
            
            // Add tracking entry
            db_execute_insert(
                "INSERT INTO shipment_tracking (shipment_id, status, location_hub_id, description, updated_by_user_id) 
                 VALUES (?, ?, ?, ?, ?)",
                [$shipmentId, $status, $locationHubId ?: null, $description ?: "Status updated to {$status}", $userId]
            );
            
            respond(['status' => true, 'message' => "Shipment status updated to {$status}"]);
        } break;

        case 'updatePackageStatus': {
            $userId = requireAuth($input);
            $packageId = (int)($input['package_id'] ?? 0);
            $status = $input['status'] ?? '';
            
            if (!$packageId || !$status) {
                badRequest('Package ID and status required');
            }
            
            // Get package
            $package = db_fetch_one("SELECT * FROM packages WHERE id = ?", [$packageId]);
            if (!$package) {
                notFound('Package not found');
            }
            
            // Update package status
            db_execute("UPDATE packages SET status = ? WHERE id = ?", [$status, $packageId]);
            
            // Update shipment status if all packages are in same status
            $shipment = db_fetch_one("SELECT * FROM shipments WHERE id = ?", [$package['shipment_id']]);
            db_execute("UPDATE shipments SET current_status = ? WHERE id = ?", [$status, $shipment['id']]);
            
            respond(['status' => true, 'message' => "Package status updated to {$status}"]);
        } break;

        // ==================== USER PREFERENCES ====================
        
        case 'getUserPreferences': {
            requireAuth();
            $userId = getUserId();
            
            // Get all preferences for the user
            $preferences = db_fetch_all("SELECT preference_key, preference_value FROM user_preferences WHERE user_id = ?", [$userId]);
            
            // Convert to key-value object
            $prefsObject = [];
            foreach ($preferences as $pref) {
                $key = $pref['preference_key'];
                $value = $pref['preference_value'];
                
                // Convert string booleans to actual booleans
                if ($value === 'true') {
                    $value = true;
                } elseif ($value === 'false') {
                    $value = false;
                }
                
                $prefsObject[$key] = $value;
            }
            
            respond(['status' => true, 'data' => $prefsObject]);
        } break;
        
        case 'updateUserPreferences': {
            requireAuth();
            $userId = getUserId();
            
            $preferences = $input['preferences'] ?? null;
            
            if (!$preferences || !is_array($preferences)) {
                badRequest('Preferences object required');
            }
            
            // Update each preference
            foreach ($preferences as $key => $value) {
                // Convert boolean to string for storage
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                }
                
                // Check if preference exists
                $exists = db_fetch_one("SELECT id FROM user_preferences WHERE user_id = ? AND preference_key = ?", [$userId, $key]);
                
                if ($exists) {
                    // Update existing
                    db_execute("UPDATE user_preferences SET preference_value = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND preference_key = ?", [$value, $userId, $key]);
                } else {
                    // Insert new
                    db_execute_insert("INSERT INTO user_preferences (user_id, preference_key, preference_value) VALUES (?, ?, ?)", [$userId, $key, $value]);
                }
            }
            
            respond(['status' => true, 'message' => 'Preferences updated successfully']);
        } break;
        
        case 'updateUserProfile': {
            requireAuth();
            $userId = getUserId();
            
            $fullName = $input['full_name'] ?? null;
            $email = $input['email'] ?? null;
            $phone = $input['phone'] ?? null;
            
            // Build update query dynamically
            $updates = [];
            $params = [];
            
            if ($fullName !== null) {
                $updates[] = "full_name = ?";
                $params[] = $fullName;
            }
            
            if ($email !== null) {
                // Check if email is already taken by another user
                $existingUser = db_fetch_one("SELECT id FROM users WHERE email = ? AND id != ?", [$email, $userId]);
                if ($existingUser) {
                    badRequest('Email already in use');
                }
                $updates[] = "email = ?";
                $params[] = $email;
            }
            
            if ($phone !== null) {
                $updates[] = "phone = ?";
                $params[] = $phone;
            }
            
            if (empty($updates)) {
                badRequest('No fields to update');
            }
            
            $params[] = $userId;
            $updateQuery = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
            db_execute($updateQuery, $params);
            
            respond(['status' => true, 'message' => 'Profile updated successfully']);
        } break;
        
        case 'changePassword': {
            requireAuth();
            $userId = getUserId();
            
            $currentPassword = $input['current_password'] ?? '';
            $newPassword = $input['new_password'] ?? '';
            
            if (!$currentPassword || !$newPassword) {
                badRequest('Current password and new password required');
            }
            
            if (strlen($newPassword) < 8) {
                badRequest('New password must be at least 8 characters long');
            }
            
            // Get current user
            $user = db_fetch_one("SELECT password FROM users WHERE id = ?", [$userId]);
            if (!$user) {
                notFound('User not found');
            }
            
            // Verify current password
            if (!password_verify($currentPassword, $user['password'])) {
                badRequest('Current password is incorrect');
            }
            
            // Hash new password and update
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            db_execute("UPDATE users SET password = ? WHERE id = ?", [$hashedPassword, $userId]);
            
            respond(['status' => true, 'message' => 'Password changed successfully']);
        } break;

        // -----------------------
        default:
            badRequest('Invalid action');
    }

} catch (Throwable $t) {
    // Log error for debugging
    error_log("API Error: " . $t->getMessage() . " in " . $t->getFile() . ":" . $t->getLine());
    error_log("Stack trace: " . $t->getTraceAsString());
    // Return detailed error for debugging (remove in production)
    serverError('Server error: ' . $t->getMessage());
}
