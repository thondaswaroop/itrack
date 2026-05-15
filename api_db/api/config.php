<?php
declare(strict_types=1);

// config.php — mysqli connection and DB helper functions

// --- Timezone Configuration ---
// Set application timezone - change this to your preferred timezone
// Examples: 'UTC', 'Asia/Dubai', 'America/New_York', 'Asia/Kolkata'
date_default_timezone_set('Asia/Dubai');

// --- Database connection details ---
$DB_HOST = "localhost";
$DB_NAME = "pmgs_itrack";
$DB_USER = "pmgs_itrack";
$DB_PASS = "pmgs@2016";

$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => false, 'error' => 'DB connection failed']);
    exit;
}
$mysqli->set_charset('utf8mb4');

/**
 * Build a types string for mysqli bind_param from PHP values.
 * i = integer, d = double, s = string
 */
function mysqli_build_types(array $params): string {
    $types = '';
    foreach ($params as $p) {
        if (is_int($p)) $types .= 'i';
        elseif (is_float($p)) $types .= 'd';
        else $types .= 's';
    }
    return $types;
}

/**
 * Bind parameters by reference for mysqli_stmt::bind_param
 */
function mysqli_bind_params_ref(mysqli_stmt $stmt, string $types, array $params): bool {
    if ($types === '') return true; // no params to bind
    $refs = [];
    $refs[] = & $types;
    foreach ($params as $i => $v) {
        $refs[] = & $params[$i];
    }
    return call_user_func_array([$stmt, 'bind_param'], $refs);
}

/**
 * Prepare and return mysqli_stmt (caller should execute/get_result/close)
 */
function db_prepare(string $sql): ?mysqli_stmt {
    global $mysqli;
    $stmt = $mysqli->prepare($sql);
    return $stmt ?: null;
}

/**
 * Fetch a single associative row (or null) from prepared statement
 * $types may be '' if no params
 */
function db_fetch_one(string $sql, array $params = []): ?array {
    global $mysqli;
    $stmt = db_prepare($sql);
    if (!$stmt) return null;
    $types = mysqli_build_types($params);
    if ($types !== '') {
        if (!mysqli_bind_params_ref($stmt, $types, $params)) { $stmt->close(); return null; }
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();
    return $row ?: null;
}

/**
 * Fetch all rows as array
 */
function db_fetch_all(string $sql, array $params = []): array {
    $stmt = db_prepare($sql);
    if (!$stmt) return [];
    $types = mysqli_build_types($params);
    if ($types !== '') {
        if (!mysqli_bind_params_ref($stmt, $types, $params)) { $stmt->close(); return []; }
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();
    return $rows ?: [];
}

/**
 * Execute insert statement and return inserted id (or false)
 */
function db_execute_insert(string $sql, array $params = []) {
    global $mysqli;
    $stmt = db_prepare($sql);
    if (!$stmt) return false;
    $types = mysqli_build_types($params);
    if ($types !== '') {
        if (!mysqli_bind_params_ref($stmt, $types, $params)) { $stmt->close(); return false; }
    }
    $ok = $stmt->execute();
    if (!$ok) { $stmt->close(); return false; }
    $insert_id = $mysqli->insert_id;
    $stmt->close();
    return $insert_id;
}

/**
 * Execute generic statement (UPDATE/DELETE). Returns true on success.
 */
function db_execute(string $sql, array $params = []): bool {
    $stmt = db_prepare($sql);
    if (!$stmt) return false;
    $types = mysqli_build_types($params);
    if ($types !== '') {
        if (!mysqli_bind_params_ref($stmt, $types, $params)) { $stmt->close(); return false; }
    }
    $ok = $stmt->execute();
    $stmt->close();
    return (bool)$ok;
}

/**
 * Get last inserted ID from mysqli
 */
function db_last_insert_id(): int {
    global $mysqli;
    return (int)$mysqli->insert_id;
}

/**
 * Parse input from JSON request body or form data
 */
function getInput(): array {
    $raw = file_get_contents('php://input');
    $contentType = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
    $data = [];
    
    if (stripos($contentType, 'application/json') !== false) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }
    
    // Merge with $_REQUEST for GET/POST params
    foreach ($_REQUEST as $k => $v) {
        if (!array_key_exists($k, $data)) {
            $data[$k] = $v;
        }
    }
    
    return $data;
}

