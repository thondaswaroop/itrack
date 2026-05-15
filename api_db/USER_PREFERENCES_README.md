# User Preferences & Settings System

## Overview
Complete backend and frontend integration for user preferences, settings, and notifications.

## Database Setup

### 1. Run the Migration
Execute the SQL migration to create the `user_preferences` table:

```bash
mysql -u your_username -p your_database < api_db/db/user_preferences_migration.sql
```

Or run the SQL directly in phpMyAdmin or your MySQL client.

### 2. Table Structure
The `user_preferences` table stores key-value pairs for each user:

```sql
CREATE TABLE `user_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `preference_key` varchar(100) NOT NULL,
  `preference_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_preference_unique` (`user_id`, `preference_key`)
)
```

## API Endpoints

### 1. Get User Preferences
**Endpoint:** `getUserPreferences`  
**Auth Required:** Yes  
**Method:** POST

**Request:**
```json
{
  "action": "getUserPreferences"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "email_notifications": true,
    "sms_notifications": false,
    "shipment_updates": true,
    "delivery_alerts": true,
    "system_alerts": true,
    "language": "en",
    "timezone": "UTC",
    "date_format": "MM/DD/YYYY",
    "currency": "USD",
    "theme": "system"
  }
}
```

### 2. Update User Preferences
**Endpoint:** `updateUserPreferences`  
**Auth Required:** Yes  
**Method:** POST

**Request:**
```json
{
  "action": "updateUserPreferences",
  "preferences": {
    "email_notifications": false,
    "theme": "dark",
    "language": "es"
  }
}
```

**Response:**
```json
{
  "status": true,
  "message": "Preferences updated successfully"
}
```

### 3. Update User Profile
**Endpoint:** `updateUserProfile`  
**Auth Required:** Yes  
**Method:** POST

**Request:**
```json
{
  "action": "updateUserProfile",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Profile updated successfully"
}
```

### 4. Change Password
**Endpoint:** `changePassword`  
**Auth Required:** Yes  
**Method:** POST

**Request:**
```json
{
  "action": "changePassword",
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Password changed successfully"
}
```

## Frontend Integration

### Service Usage

```typescript
import { settingsService } from '../services';

// Load preferences
const prefs = await settingsService.getUserPreferences();

// Update preferences
await settingsService.updateUserPreferences({
  email_notifications: true,
  theme: 'dark'
});

// Update profile
await settingsService.updateUserProfile({
  full_name: 'John Doe',
  email: 'john@example.com'
});

// Change password
await settingsService.changePassword({
  current_password: 'old',
  new_password: 'new'
});
```

## Preference Keys

### Notification Settings
- `email_notifications` (boolean) - Enable email notifications
- `sms_notifications` (boolean) - Enable SMS notifications
- `shipment_updates` (boolean) - Shipment status update alerts
- `delivery_alerts` (boolean) - Delivery notification alerts
- `system_alerts` (boolean) - System-wide notifications

### System Preferences
- `language` (string) - User interface language (en, es, fr, de, zh)
- `timezone` (string) - User timezone (UTC, America/New_York, etc)
- `date_format` (string) - Date display format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- `currency` (string) - Currency preference (USD, EUR, GBP, AED, INR)
- `theme` (string) - UI theme (light, dark, system)

## Default Values

When a user is created or a preference key doesn't exist, the following defaults are used:

- `email_notifications`: true
- `sms_notifications`: false
- `shipment_updates`: true
- `delivery_alerts`: true
- `system_alerts`: true
- `language`: "en"
- `timezone`: "UTC"
- `date_format`: "MM/DD/YYYY"
- `currency`: "USD"
- `theme`: "system"

## Features

✅ User profile management (name, email, phone)  
✅ Password change with current password verification  
✅ Notification preferences (email, SMS, shipment updates, etc.)  
✅ System preferences (language, timezone, date format, currency, theme)  
✅ Preference persistence across sessions  
✅ Real-time updates without page reload  
✅ Validation and error handling  
✅ Loading states and user feedback  

## Security

- All endpoints require authentication
- Passwords are hashed using PHP's `password_hash()` with bcrypt
- Current password verification required for password changes
- Email uniqueness validation
- SQL injection protection via prepared statements
- User can only access their own preferences

## Testing

### 1. Test Profile Update
```bash
curl -X POST http://your-api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateUserProfile",
    "full_name": "Test User",
    "email": "test@example.com"
  }'
```

### 2. Test Preferences Update
```bash
curl -X POST http://your-api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateUserPreferences",
    "preferences": {
      "email_notifications": false,
      "theme": "dark"
    }
  }'
```

### 3. Test Password Change
```bash
curl -X POST http://your-api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "changePassword",
    "current_password": "old",
    "new_password": "newpass123"
  }'
```

## Future Enhancements

- [ ] 2FA (Two-Factor Authentication) integration
- [ ] Session management and active sessions view
- [ ] Login history tracking
- [ ] Email verification for email changes
- [ ] Export/import user preferences
- [ ] Preference presets/profiles
- [ ] Admin panel for managing user preferences
