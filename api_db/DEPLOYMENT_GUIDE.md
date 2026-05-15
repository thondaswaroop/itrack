# iTrack Deployment Guide

## Server Requirements

- PHP 7.4 or higher (8.x recommended)
- MySQL 5.7 or MariaDB 10.3+
- Apache or Nginx web server
- SSL Certificate (for HTTPS)
- Minimum 512MB RAM
- 1GB disk space

---

## Step-by-Step Deployment

### 1. Database Setup

#### Create Database and User

Login to MySQL/phpMyAdmin and run:

```sql
-- Create database
CREATE DATABASE pmgs_itrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace with strong password)
CREATE USER 'pmgs_itrack'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON pmgs_itrack.* TO 'pmgs_itrack'@'localhost';
FLUSH PRIVILEGES;
```

#### Import Database Schema

**Option A: Using phpMyAdmin**
1. Login to phpMyAdmin
2. Select `pmgs_itrack` database
3. Click "Import" tab
4. Choose `api_db/db/db.sql` file
5. Click "Go"

**Option B: Using Command Line**
```bash
mysql -u pmgs_itrack -p pmgs_itrack < api_db/db/db.sql
```

**Option C: Using cPanel File Manager**
1. Upload `db.sql` to server
2. Use phpMyAdmin's Import feature
3. Select the uploaded file

---

### 2. Upload Files to Server

#### Using FTP/SFTP (FileZilla, etc.)

1. Connect to your server
2. Navigate to your web root (usually `public_html` or `www`)
3. Create project folder: `itrack`
4. Upload ALL project files maintaining folder structure:
   ```
   itrack/
   ├── api_db/
   │   ├── api/
   │   │   ├── api.php
   │   │   └── config.php
   │   └── db/
   │       └── db.sql
   ├── dist/          (Your built React app)
   ├── index.html
   └── ...
   ```

#### Using cPanel File Manager

1. Login to cPanel
2. Open File Manager
3. Navigate to `public_html`
4. Create `itrack` folder
5. Upload files as ZIP
6. Extract files

---

### 3. Configure Database Connection

Edit `api_db/api/config.php`:

```php
<?php
$DB_HOST = "localhost";           // Usually 'localhost'
$DB_NAME = "pmgs_itrack";         // Your database name
$DB_USER = "pmgs_itrack";         // Your database username
$DB_PASS = "your_password_here";  // Your database password
```

**Security Note:** Make sure this file is NOT publicly accessible via URL.

---

### 4. Set File Permissions

#### Using SSH/Terminal
```bash
# Navigate to project directory
cd /path/to/public_html/itrack

# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Ensure config.php is not executable
chmod 644 api_db/api/config.php
```

#### Using FTP Client
- Directories: 755
- Files: 644
- config.php: 644 (important!)

---

### 5. Configure Web Server

#### Apache (.htaccess)

Create `.htaccess` in your `api_db/api/` folder:

```apache
# Prevent direct access to config.php
<Files "config.php">
    Order Allow,Deny
    Deny from all
</Files>

# Enable CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Handle OPTIONS requests
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

#### Nginx Configuration

Add to your Nginx site config:

```nginx
location /api_db/api/ {
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
    
    # Handle OPTIONS
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    # PHP processing
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}

# Deny access to config.php
location ~ /config\.php$ {
    deny all;
}
```

---

### 6. SSL/HTTPS Setup

#### Using cPanel AutoSSL
1. Login to cPanel
2. Go to "SSL/TLS Status"
3. Run AutoSSL for your domain
4. Wait for certificate installation

#### Using Let's Encrypt (SSH access)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (add to crontab)
0 0 * * 0 certbot renew --quiet
```

---

### 7. Frontend Configuration

Update your React app API endpoint in the appropriate config file:

```javascript
// src/config.js or similar
const API_BASE_URL = 'https://yourdomain.com/api_db/api/api.php';

export { API_BASE_URL };
```

Build your React app:
```bash
npm run build
# or
yarn build
```

Upload the `dist` folder contents to your server's web root.

---

### 8. Test the API

#### Test 1: Direct API Access
Visit: `https://yourdomain.com/api_db/api/api.php?action=getPlatformSettings`

Expected response:
```json
{
  "status": true,
  "data": [...]
}
```

#### Test 2: Login
```bash
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@itrack.com",
    "password": "password"
  }'
```

#### Test 3: Get Countries
Visit: `https://yourdomain.com/api_db/api/api.php?action=getCountries&status=all`

---

### 9. Security Hardening

#### Change Default Admin Password

```bash
curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@itrack.com",
    "password": "password"
  }'
# Note the user_id from response

curl -X POST https://yourdomain.com/api_db/api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "changePassword",
    "user_id": 1,
    "current_password": "password",
    "new_password": "YourNewSecurePassword123!"
  }'
```

#### Update config.php Permissions
```bash
chmod 400 api_db/api/config.php
```

#### Enable Error Logging

Edit `api_db/api/api.php` - the error logging is already in place:
```php
catch (Throwable $t) {
    error_log("API Error: " . $t->getMessage());
    serverError('Server error');
}
```

Check your PHP error log:
- cPanel: `~/public_html/error_log`
- Linux: `/var/log/apache2/error.log` or `/var/log/nginx/error.log`

---

### 10. Performance Optimization

#### Enable PHP OPcache

Add to `php.ini` or create `.user.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

#### Enable Gzip Compression

Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

#### Database Optimization

```sql
-- Add indexes for better performance (already in schema)
-- Run OPTIMIZE periodically
OPTIMIZE TABLE shipments;
OPTIMIZE TABLE packages;
OPTIMIZE TABLE shipment_tracking;
```

---

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution:**
- Verify database credentials in `config.php`
- Check if database exists: `SHOW DATABASES;`
- Verify user permissions: `SHOW GRANTS FOR 'pmgs_itrack'@'localhost';`
- Check if MySQL is running

### Issue: "CORS policy error"
**Solution:**
- Verify CORS headers in `api.php` (already included)
- Add `.htaccess` rules (see Step 5)
- Clear browser cache
- Check browser console for specific error

### Issue: "500 Internal Server Error"
**Solution:**
- Check PHP error logs
- Verify PHP version (7.4+)
- Check file permissions
- Enable display_errors temporarily (only for debugging):
  ```php
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  ```

### Issue: "Cannot write to session"
**Solution:**
```bash
# Create sessions directory
mkdir -p /path/to/sessions
chmod 1733 /path/to/sessions
```

### Issue: "File upload errors"
**Solution:**
Edit `php.ini` or `.user.ini`:
```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Review new shipments

### Weekly Tasks
- [ ] Database backup
- [ ] Review user activity logs
- [ ] Check system performance

### Monthly Tasks
- [ ] Update PHP/MySQL if needed
- [ ] Review and archive old logs
- [ ] Security audit
- [ ] Optimize database tables

---

## Backup Strategy

### Automated Database Backup

Create backup script `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/username/backups"
DB_NAME="pmgs_itrack"
DB_USER="pmgs_itrack"
DB_PASS="your_password"

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/itrack_$DATE.sql
gzip $BACKUP_DIR/itrack_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "itrack_*.sql.gz" -mtime +30 -delete
```

Set up cron job:
```bash
crontab -e
# Add this line (daily at 2 AM):
0 2 * * * /path/to/backup.sh
```

### Manual Backup (cPanel)
1. Login to cPanel
2. Go to "Backup Wizard"
3. Choose "Backup"
4. Select "Full Backup" or "MySQL Database"
5. Download backup file

---

## API Endpoints Quick Reference

```
Authentication:
POST  /api.php?action=login
POST  /api.php?action=register

Countries:
GET   /api.php?action=getCountries
POST  /api.php?action=createCountry

Vendors:
GET   /api.php?action=getVendors
POST  /api.php?action=createVendor

Hubs:
GET   /api.php?action=getHubs
POST  /api.php?action=createHub

Shipments:
POST  /api.php?action=createShipment
POST  /api.php?action=trackShipment
POST  /api.php?action=consolidatePackage

Dashboard:
GET   /api.php?action=getDashboardStats
GET   /api.php?action=getRecentShipments
```

---

## Environment Variables (Recommended)

For better security, use environment variables:

**Create `.env` file:**
```env
DB_HOST=localhost
DB_NAME=pmgs_itrack
DB_USER=pmgs_itrack
DB_PASS=your_secure_password
```

**Update config.php:**
```php
<?php
// Load .env file
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

$DB_HOST = $_ENV['DB_HOST'] ?? 'localhost';
$DB_NAME = $_ENV['DB_NAME'] ?? 'pmgs_itrack';
$DB_USER = $_ENV['DB_USER'] ?? 'pmgs_itrack';
$DB_PASS = $_ENV['DB_PASS'] ?? '';
```

**Important:** Add `.env` to `.gitignore`!

---

## Support Contacts

- **Development Team:** [Your contact]
- **Server Support:** [Hosting provider]
- **Emergency Contact:** [Phone/Email]

---

## Deployment Checklist

Before going live:

- [ ] Database created and imported
- [ ] config.php updated with correct credentials
- [ ] Files uploaded to server
- [ ] File permissions set correctly
- [ ] SSL certificate installed and working
- [ ] API endpoints tested
- [ ] Default admin password changed
- [ ] Frontend connected to API
- [ ] CORS configured properly
- [ ] Error logging enabled
- [ ] Backup system configured
- [ ] Documentation reviewed
- [ ] Team trained on system usage

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Server Details:** _________________  

---

Good luck with your deployment! 🚀
