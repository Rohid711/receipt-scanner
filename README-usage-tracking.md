# Receipt Scanner Usage Tracking

This document explains how the Receipt Scanner usage tracking feature works and how to set it up.

## Overview

The Receipt Scanner feature has usage limits based on the user's subscription plan:
- **Starter Plan**: 100 scans per month
- **Pro Plan**: Unlimited scans

When a user reaches their monthly limit, they will be prevented from using the Receipt Scanner and will see a message encouraging them to upgrade their plan.

## Database Setup

1. Run the SQL migration script in `migrations/receipt_scanner_usage.sql` to create the necessary table and functions in your Supabase database:

```bash
# Connect to your Supabase database and run the migration
psql -h your-supabase-host -d postgres -U postgres -f migrations/receipt_scanner_usage.sql
```

Or you can copy and paste the SQL code into the Supabase SQL Editor.

## How It Works

1. The `receipt_scanner_usage` table tracks how many times each user has used the Receipt Scanner in the current month.
2. Each time a user scans a receipt, the count is incremented.
3. On the first day of each month, the usage count is automatically reset.
4. The system checks the user's plan and corresponding limit before allowing them to use the feature.

## API Endpoints

### Check Usage

`GET /api/receipt-scanner-usage`

Returns the user's current usage data:
- `currentUsage`: Number of scans used this month
- `limit`: Maximum number of scans allowed for the user's plan
- `remaining`: Number of scans remaining
- `canUseFeature`: Boolean indicating if the user can use the feature

### Increment Usage

`POST /api/receipt-scanner-usage`

Increments the user's usage count by 1 and returns the updated usage data.
If the user has reached their limit, it returns an error with status code 403.

## Implementation Details

1. The `SubscriptionContext` provides methods to check and update feature usage.
2. The `ReceiptScanner` component checks usage limits before processing receipts.
3. Usage is tracked per user per month and stored in the database.
4. The system automatically resets usage counts on the first day of each month.

## Testing

To test the feature:
1. Create users with different subscription plans
2. Scan receipts until reaching the limit
3. Verify that users are prevented from scanning more receipts
4. Verify that upgrading the plan increases the limit
5. Verify that the usage count resets on the first day of the month

## Troubleshooting

If you encounter issues with usage tracking:

1. Check the browser console for error messages
2. Verify that the `receipt_scanner_usage` table exists in your database
3. Check that the user has the correct subscription plan in their profile
4. Verify that the API endpoints are working correctly 