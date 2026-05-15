# Hub-Based Customer Filtering

## Overview
Customers/parties are now filtered based on the user's hub location. Users can only see and manage customers from their own hub, except super admins who can view all customers globally.

## What Changed

### 1. Database Migration
**File:** `api_db/db/parties_hub_migration.sql`

Adds `hub_id` column to the `parties` table:
- Links each customer/party to a specific hub
- Automatically assigns existing parties to the first hub
- Includes foreign key constraint for data integrity

**To Apply Migration:**
```bash
mysql -u your_username -p your_database < api_db/db/parties_hub_migration.sql
```

### 2. API Updates
**File:** `api_db/api/api.php`

#### getParties Endpoint
- Now filters parties by the user's hub_id
- Super admins see all parties (no filtering)
- Associates and vendors only see parties from their hub

#### createParty Endpoint
- Automatically assigns new parties to the user's hub
- Duplicate name check is now scoped to the hub (same name can exist in different hubs)

### 3. User Hub Detection
**Function:** `getUserHubId(int $userId): ?int`

Automatically determines the user's hub by checking:
1. `fleet_managers` table (for associates)
2. `vendors` table (for vendors)
3. Returns `null` if no hub association found

## How It Works

### Example Scenarios

**Associate at Hub A:**
- Creates customer "ABC Corp" → Assigned to Hub A
- Can only see customers from Hub A
- Cannot see customers from Hub B or Hub C

**Super Admin:**
- Can see all customers from all hubs
- No filtering applied

**Vendor at Hub B:**
- Creates customer "XYZ Ltd" → Assigned to Hub B
- Can only see customers from Hub B
- Cannot see customers from other hubs

## Benefits

✅ **Data Privacy** - Users only access customers relevant to their hub  
✅ **Cleaner UI** - Reduced clutter with hub-specific data  
✅ **Better Organization** - Each hub manages its own customer base  
✅ **Scalability** - Supports multi-hub operations smoothly  
✅ **Duplicate Prevention** - Same customer name can exist in different hubs  

## Migration Steps

1. **Backup your database** (always backup before migrations!)
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

2. **Run the migration**
   ```bash
   mysql -u your_username -p your_database < api_db/db/parties_hub_migration.sql
   ```

3. **Verify the changes**
   ```sql
   -- Check if hub_id column was added
   DESCRIBE parties;
   
   -- Check if existing parties have hub assignments
   SELECT id, name, hub_id FROM parties LIMIT 10;
   ```

4. **Test the filtering**
   - Log in as a user from Hub A
   - Go to Customers page
   - Verify you only see customers from Hub A
   - Try creating a new customer - should be assigned to Hub A automatically

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Remove the foreign key constraint
ALTER TABLE `parties` DROP FOREIGN KEY `fk_parties_hub`;

-- Remove the index
ALTER TABLE `parties` DROP INDEX `idx_parties_hub_id`;

-- Remove the column
ALTER TABLE `parties` DROP COLUMN `hub_id`;
```

## Notes

- Super admins continue to see all customers globally
- When a party is created, it's automatically assigned to the user's hub
- Existing parties are assigned to the first available hub during migration
- If you need to reassign parties to different hubs, update them manually:
  ```sql
  UPDATE parties SET hub_id = 2 WHERE id IN (1, 5, 10);
  ```

## Future Enhancements

- [ ] Allow super admins to transfer customers between hubs
- [ ] Add hub filter dropdown for super admins in Customers page
- [ ] Customer analytics per hub
- [ ] Hub-based customer import/export
